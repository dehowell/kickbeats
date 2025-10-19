use crate::engine::midi::{MidiEngine, MidiEvent, MidiEventType};
use crate::models::Pattern;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

/// Manages continuous looping playback of a MIDI pattern
pub struct MidiPlaybackLoop {
    /// Whether playback is currently running
    is_playing: Arc<AtomicBool>,
    /// Handle to playback thread
    thread_handle: Option<thread::JoinHandle<()>>,
}

impl MidiPlaybackLoop {
    /// Create a new playback loop
    pub fn new() -> Self {
        Self {
            is_playing: Arc::new(AtomicBool::new(false)),
            thread_handle: None,
        }
    }

    /// Start playing a pattern in a loop
    pub fn start(
        &mut self,
        pattern: Pattern,
        tempo_bpm: u16,
        include_click: bool,
    ) -> Result<(), String> {
        if self.is_playing.load(Ordering::SeqCst) {
            return Err("Playback already running".to_string());
        }

        // Create MIDI engine and connect
        let mut midi_engine = MidiEngine::new();

        // Try to connect to first available MIDI port
        let ports =
            MidiEngine::list_ports().map_err(|e| format!("Failed to list MIDI ports: {}", e))?;

        if ports.is_empty() {
            return Err("No MIDI output ports available".to_string());
        }

        midi_engine
            .connect(&ports[0])
            .map_err(|e| format!("Failed to connect to MIDI port: {}", e))?;

        // Generate MIDI events
        let count_in_events = midi_engine.generate_count_in_events(tempo_bpm);
        let pattern_events = midi_engine.pattern_to_midi_events(&pattern, tempo_bpm, include_click);
        let count_in_duration = midi_engine.count_in_duration(tempo_bpm);
        let pattern_duration = midi_engine.pattern_duration(&pattern, tempo_bpm);

        // Set playing flag
        self.is_playing.store(true, Ordering::SeqCst);
        let is_playing = Arc::clone(&self.is_playing);

        // Spawn playback thread
        let handle = thread::spawn(move || {
            // Set thread priority for real-time performance
            #[cfg(target_os = "macos")]
            {
                let _ = audio_thread_priority::promote_current_thread_to_real_time(512, 44100);
            }

            let start_time = Instant::now();

            // Play count-in events once
            for event in &count_in_events {
                let event_time = start_time + Duration::from_secs_f64(event.time_offset);
                let now = Instant::now();

                // Sleep until event time
                if event_time > now {
                    let sleep_duration = event_time - now;
                    thread::sleep(sleep_duration);
                }

                // Send MIDI event
                let result = match event.event_type {
                    MidiEventType::NoteOn => {
                        midi_engine.send_note_on(event.note, event.velocity)
                    }
                    MidiEventType::NoteOff => midi_engine.send_note_off(event.note),
                };

                if let Err(e) = result {
                    eprintln!("MIDI error: {}", e);
                    is_playing.store(false, Ordering::SeqCst);
                    break;
                }

                // Check if should stop
                if !is_playing.load(Ordering::SeqCst) {
                    break;
                }
            }

            // Now loop the pattern
            let pattern_start_time = start_time + Duration::from_secs_f64(count_in_duration);
            let mut loop_count = 0u64;

            // Timing drift detection
            const DRIFT_THRESHOLD_MS: f64 = 10.0;
            let mut max_drift_ms: f64 = 0.0;

            while is_playing.load(Ordering::SeqCst) {
                let expected_loop_start =
                    pattern_start_time + Duration::from_secs_f64(loop_count as f64 * pattern_duration);
                let actual_loop_start = Instant::now();

                // Calculate drift
                let drift = if actual_loop_start > expected_loop_start {
                    actual_loop_start.duration_since(expected_loop_start).as_secs_f64() * 1000.0
                } else {
                    0.0
                };

                // Track maximum drift
                if drift > max_drift_ms {
                    max_drift_ms = drift;
                    if drift > DRIFT_THRESHOLD_MS {
                        eprintln!(
                            "Warning: Timing drift detected: {:.2}ms (threshold: {:.0}ms) at loop #{}",
                            drift, DRIFT_THRESHOLD_MS, loop_count
                        );
                    }
                }

                let loop_start = expected_loop_start;
                let now = Instant::now();

                // Skip if we're already past this loop (catch-up scenario)
                if now > loop_start + Duration::from_secs_f64(pattern_duration) {
                    loop_count += 1;
                    continue;
                }

                // Play all events for this loop
                for event in &pattern_events {
                    let event_time = loop_start + Duration::from_secs_f64(event.time_offset);
                    let now = Instant::now();

                    // Sleep until event time
                    if event_time > now {
                        let sleep_duration = event_time - now;
                        thread::sleep(sleep_duration);
                    }

                    // Send MIDI event
                    let result = match event.event_type {
                        MidiEventType::NoteOn => {
                            midi_engine.send_note_on(event.note, event.velocity)
                        }
                        MidiEventType::NoteOff => midi_engine.send_note_off(event.note),
                    };

                    if let Err(e) = result {
                        eprintln!("MIDI error: {}", e);
                        is_playing.store(false, Ordering::SeqCst);
                        break;
                    }

                    // Check if should stop
                    if !is_playing.load(Ordering::SeqCst) {
                        break;
                    }
                }

                loop_count += 1;
            }

            // Send note-off for all notes on exit
            let _ = midi_engine.send_note_off(crate::engine::midi::KICK_NOTE);
            let _ = midi_engine.send_note_off(crate::engine::midi::CLICK_NOTE);
        });

        self.thread_handle = Some(handle);

        Ok(())
    }

    /// Stop playback
    pub fn stop(&mut self) {
        self.is_playing.store(false, Ordering::SeqCst);

        // Wait for thread to finish
        if let Some(handle) = self.thread_handle.take() {
            let _ = handle.join();
        }
    }

    /// Check if playback is currently running
    pub fn is_playing(&self) -> bool {
        self.is_playing.load(Ordering::SeqCst)
    }
}

impl Drop for MidiPlaybackLoop {
    fn drop(&mut self) {
        self.stop();
    }
}

impl Default for MidiPlaybackLoop {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ComplexityLevel, TimeSignature};

    #[test]
    fn test_playback_loop_creation() {
        let loop_player = MidiPlaybackLoop::new();
        assert!(!loop_player.is_playing());
    }

    #[test]
    fn test_playback_stop() {
        let mut loop_player = MidiPlaybackLoop::new();

        // Create a simple pattern
        let steps = vec![
            true, false, false, false, true, false, false, false, false, false, false, false,
            false, false, false, false,
        ];
        let pattern = Pattern::new(steps, TimeSignature::four_four(), ComplexityLevel::Simple);

        // Note: This test will fail if no MIDI device is available
        // In a real test environment, we'd use a mock MIDI device
        let result = loop_player.start(pattern, 120, false);

        if result.is_ok() {
            assert!(loop_player.is_playing());
            loop_player.stop();
            // Give thread time to finish
            thread::sleep(Duration::from_millis(100));
            assert!(!loop_player.is_playing());
        }
    }
}

use crate::models::{BeatGrid, Pattern};
use midir::{MidiOutput, MidiOutputConnection};
use std::error::Error;
use std::fmt;

/// MIDI note number for kick drum sound (C1 in General MIDI percussion map)
pub const KICK_NOTE: u8 = 36;

/// MIDI note number for click/rimshot sound (C#1 in General MIDI percussion map)
pub const CLICK_NOTE: u8 = 37;

/// Default MIDI velocity for kick drum hits (0-127 range)
pub const KICK_VELOCITY: u8 = 100;

/// Default MIDI velocity for click track hits (0-127 range)
pub const CLICK_VELOCITY: u8 = 80;

/// MIDI channel for percussion (Channel 10, zero-indexed as 9)
pub const MIDI_CHANNEL: u8 = 9;

/// Custom error type for MIDI operations with platform-specific guidance
#[derive(Debug)]
pub struct MidiError {
    pub message: String,
    pub platform_hint: Option<String>,
}

impl MidiError {
    pub fn new(message: impl Into<String>) -> Self {
        let message = message.into();
        let platform_hint = Self::get_platform_hint(&message);
        Self {
            message,
            platform_hint,
        }
    }

    fn get_platform_hint(error_msg: &str) -> Option<String> {
        // Detect platform and provide specific guidance
        #[cfg(target_os = "macos")]
        {
            if error_msg.contains("no ports") || error_msg.contains("not found") {
                return Some(
                    "macOS MIDI Setup:\n\
                     1. Open 'Audio MIDI Setup' application (in /Applications/Utilities/)\n\
                     2. Go to Window → Show MIDI Studio\n\
                     3. Enable 'IAC Driver' for virtual MIDI ports\n\
                     4. Or connect a physical MIDI device\n\
                     5. If using virtual instrument (e.g., Logic, GarageBand), launch it first"
                        .to_string(),
                );
            }
        }

        #[cfg(target_os = "linux")]
        {
            if error_msg.contains("no ports") || error_msg.contains("not found") {
                return Some(
                    "Linux ALSA Setup:\n\
                     1. Install ALSA utilities: sudo apt-get install alsa-utils\n\
                     2. Check ALSA devices: aconnect -l\n\
                     3. Create virtual MIDI port: sudo modprobe snd-virmidi\n\
                     4. Or use software synth: timidity -iA (install via: sudo apt-get install timidity)\n\
                     5. Check permissions: user should be in 'audio' group"
                        .to_string(),
                );
            }
        }

        #[cfg(target_os = "windows")]
        {
            if error_msg.contains("no ports") || error_msg.contains("not found") {
                return Some(
                    "Windows MIDI Setup:\n\
                     1. Install a virtual MIDI driver (e.g., loopMIDI from Tobias Erichsen)\n\
                     2. Download from: https://www.tobias-erichsen.de/software/loopmidi.html\n\
                     3. Create a virtual port in loopMIDI\n\
                     4. Or connect a physical MIDI device\n\
                     5. Check Device Manager for MIDI device status"
                        .to_string(),
                );
            }
        }

        None
    }
}

impl fmt::Display for MidiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)?;
        if let Some(hint) = &self.platform_hint {
            write!(f, "\n\n{}", hint)?;
        }
        Ok(())
    }
}

impl Error for MidiError {}

/// Represents a scheduled MIDI event
#[derive(Debug, Clone, Copy)]
pub struct MidiEvent {
    /// Time offset from start of pattern in seconds
    pub time_offset: f64,
    /// MIDI note number
    pub note: u8,
    /// Note velocity (0-127)
    pub velocity: u8,
    /// Event type
    pub event_type: MidiEventType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MidiEventType {
    NoteOn,
    NoteOff,
}

/// Manages MIDI output and playback
///
/// # Examples
///
/// ```no_run
/// use kickbeats::engine::midi::MidiEngine;
///
/// let mut engine = MidiEngine::new();
/// let ports = MidiEngine::list_ports()?;
/// engine.connect(&ports[0])?;
/// engine.send_note_on(36, 100)?;  // Play kick drum
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
pub struct MidiEngine {
    /// Active MIDI output connection
    connection: Option<MidiOutputConnection>,
    /// MIDI channel to use (0-15)
    channel: u8,
}

impl MidiEngine {
    /// Create a new MIDI engine (unconnected)
    pub fn new() -> Self {
        Self {
            connection: None,
            channel: MIDI_CHANNEL,
        }
    }

    /// Connect to a MIDI output port by name
    pub fn connect(&mut self, port_name: &str) -> Result<(), Box<dyn Error>> {
        let midi_out = MidiOutput::new("Kickbeats")?;

        // Find port by name
        let ports = midi_out.ports();
        let port = ports
            .iter()
            .find(|p| {
                midi_out
                    .port_name(p)
                    .map(|name| name.contains(port_name))
                    .unwrap_or(false)
            })
            .ok_or_else(|| format!("MIDI port '{}' not found", port_name))?;

        // Connect to port
        let connection = midi_out.connect(port, "kickbeats-output")?;
        self.connection = Some(connection);

        Ok(())
    }

    /// List available MIDI output ports with enhanced error reporting
    pub fn list_ports() -> Result<Vec<String>, Box<dyn Error>> {
        let midi_out = MidiOutput::new("Kickbeats").map_err(|e| {
            MidiError::new(format!("Failed to initialize MIDI system: {}", e))
        })?;

        let ports = midi_out.ports();

        if ports.is_empty() {
            return Err(Box::new(MidiError::new(
                "No MIDI output ports found on this system"
            )));
        }

        let port_names: Vec<String> = ports
            .iter()
            .filter_map(|p| midi_out.port_name(p).ok())
            .collect();

        Ok(port_names)
    }

    /// Send a note-on message
    pub fn send_note_on(&mut self, note: u8, velocity: u8) -> Result<(), Box<dyn Error>> {
        if let Some(conn) = &mut self.connection {
            let msg = [0x90 | self.channel, note, velocity];
            conn.send(&msg)?;
            Ok(())
        } else {
            Err("MIDI engine not connected".into())
        }
    }

    /// Send a note-off message
    pub fn send_note_off(&mut self, note: u8) -> Result<(), Box<dyn Error>> {
        if let Some(conn) = &mut self.connection {
            let msg = [0x80 | self.channel, note, 0];
            conn.send(&msg)?;
            Ok(())
        } else {
            Err("MIDI engine not connected".into())
        }
    }

    /// Generate count-in click events (4 beats)
    pub fn generate_count_in_events(&self, tempo_bpm: u16) -> Vec<MidiEvent> {
        let mut events = Vec::new();
        let seconds_per_beat = 60.0 / tempo_bpm as f64;
        let count_in_beats = 4;

        for beat in 0..count_in_beats {
            let time_offset = beat as f64 * seconds_per_beat;

            // Note on
            events.push(MidiEvent {
                time_offset,
                note: CLICK_NOTE,
                velocity: CLICK_VELOCITY,
                event_type: MidiEventType::NoteOn,
            });

            // Note off (50ms later)
            events.push(MidiEvent {
                time_offset: time_offset + 0.05,
                note: CLICK_NOTE,
                velocity: 0,
                event_type: MidiEventType::NoteOff,
            });
        }

        events
    }

    /// Convert a pattern to a sequence of MIDI events (without count-in)
    pub fn pattern_to_midi_events(
        &self,
        pattern: &Pattern,
        tempo_bpm: u16,
        include_click: bool,
    ) -> Vec<MidiEvent> {
        let mut events = Vec::new();

        // Create beat grid for timing calculations
        let grid = BeatGrid::new(
            pattern.time_signature,
            pattern.subdivision,
            pattern.num_measures,
            vec![],
        );

        let seconds_per_position = grid.seconds_per_position(tempo_bpm);

        // Generate click track events (on every beat)
        if include_click {
            for beat_idx in grid.beat_positions() {
                let time_offset = beat_idx as f64 * seconds_per_position;

                // Note on
                events.push(MidiEvent {
                    time_offset,
                    note: CLICK_NOTE,
                    velocity: CLICK_VELOCITY,
                    event_type: MidiEventType::NoteOn,
                });

                // Note off (50ms later)
                events.push(MidiEvent {
                    time_offset: time_offset + 0.05,
                    note: CLICK_NOTE,
                    velocity: 0,
                    event_type: MidiEventType::NoteOff,
                });
            }
        }

        // Generate kick drum events
        for (i, &has_kick) in pattern.steps.iter().enumerate() {
            if has_kick {
                let time_offset = i as f64 * seconds_per_position;

                // Note on
                events.push(MidiEvent {
                    time_offset,
                    note: KICK_NOTE,
                    velocity: KICK_VELOCITY,
                    event_type: MidiEventType::NoteOn,
                });

                // Note off (100ms later)
                events.push(MidiEvent {
                    time_offset: time_offset + 0.1,
                    note: KICK_NOTE,
                    velocity: 0,
                    event_type: MidiEventType::NoteOff,
                });
            }
        }

        // Sort events by time
        events.sort_by(|a, b| a.time_offset.partial_cmp(&b.time_offset).unwrap());

        events
    }

    /// Get the duration of the count-in in seconds
    pub fn count_in_duration(&self, tempo_bpm: u16) -> f64 {
        4.0 * (60.0 / tempo_bpm as f64)
    }

    /// Get the duration of one pattern loop in seconds (without count-in)
    pub fn pattern_duration(&self, pattern: &Pattern, tempo_bpm: u16) -> f64 {
        let grid = BeatGrid::new(
            pattern.time_signature,
            pattern.subdivision,
            pattern.num_measures,
            vec![],
        );

        grid.total_positions() as f64 * grid.seconds_per_position(tempo_bpm)
    }
}

impl Default for MidiEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ComplexityLevel, TimeSignature};

    #[test]
    fn test_pattern_to_midi_events() {
        let engine = MidiEngine::new();

        let steps = vec![
            true, false, false, false, // Beat 1
            true, false, false, false, // Beat 2
            false, false, false, false, // Beat 3
            false, false, false, false, // Beat 4
        ];

        let pattern = Pattern::new(steps, TimeSignature::four_four(), ComplexityLevel::Simple);

        let events = engine.pattern_to_midi_events(&pattern, 120, true);

        // Should have kick events (2 kicks * 2 events = 4) + click events (4 beats * 2 = 8)
        assert!(events.len() >= 4); // At least kicks
        assert!(events.iter().any(|e| e.note == KICK_NOTE));
        assert!(events.iter().any(|e| e.note == CLICK_NOTE));
    }

    #[test]
    fn test_pattern_duration() {
        let engine = MidiEngine::new();

        let steps = vec![false; 16];
        let pattern = Pattern::new(steps, TimeSignature::four_four(), ComplexityLevel::Simple);

        let duration = engine.pattern_duration(&pattern, 120);

        // At 120 BPM, one measure of 4/4 should be 2 seconds
        assert!((duration - 2.0).abs() < 0.01);
    }
}

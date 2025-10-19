use crate::models::{BeatGrid, Pattern};
use midir::{MidiOutput, MidiOutputConnection};
use std::error::Error;

/// MIDI note numbers
pub const KICK_NOTE: u8 = 36; // C1 - GM standard kick drum
pub const CLICK_NOTE: u8 = 37; // C#1 - GM standard side stick (for click)

/// MIDI velocity values
pub const KICK_VELOCITY: u8 = 100;
pub const CLICK_VELOCITY: u8 = 80;

/// MIDI channel (0-indexed, channel 10 = percussion)
pub const MIDI_CHANNEL: u8 = 9; // Channel 10 (0-indexed as 9)

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

    /// List available MIDI output ports
    pub fn list_ports() -> Result<Vec<String>, Box<dyn Error>> {
        let midi_out = MidiOutput::new("Kickbeats")?;
        let ports = midi_out.ports();

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

    /// Convert a pattern to a sequence of MIDI events
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

    /// Get the duration of one pattern loop in seconds
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

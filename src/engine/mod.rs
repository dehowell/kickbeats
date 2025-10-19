// Engine module
// MIDI playback engine and timing/synchronization

pub mod midi;
pub mod playback;

pub use midi::{MidiEngine, MidiEvent, MidiEventType, CLICK_NOTE, KICK_NOTE};
pub use playback::MidiPlaybackLoop;

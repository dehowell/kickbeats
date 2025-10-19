/// Playback state of the practice session
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlaybackState {
    /// No playback, initial state
    Stopped,
    /// Active MIDI output
    Playing,
}

impl Default for PlaybackState {
    fn default() -> Self {
        PlaybackState::Stopped
    }
}

use super::complexity::ComplexityLevel;
use super::pattern::Pattern;
use super::playback_state::PlaybackState;
use super::time_signature::TimeSignature;
use std::collections::VecDeque;
use std::time::SystemTime;
use uuid::Uuid;

/// Represents a single user interaction with the tool
#[derive(Debug)]
pub struct PracticeSession {
    /// Unique session identifier
    pub session_id: Uuid,
    /// Currently playing/displayed pattern
    pub current_pattern: Option<Pattern>,
    /// Last N patterns generated (max 20 for uniqueness checking)
    pub pattern_history: VecDeque<Pattern>,
    /// Playback tempo in beats per minute (40-300)
    pub tempo_bpm: u16,
    /// Pattern complexity setting
    pub complexity_level: ComplexityLevel,
    /// Time signature for pattern generation
    pub time_signature: TimeSignature,
    /// Current playback status
    pub playback_state: PlaybackState,
    /// Whether current pattern has been shown
    pub pattern_revealed: bool,
    /// Total patterns created this session
    pub patterns_generated: u32,
    /// When session began
    pub session_start: SystemTime,
    /// Most recent user interaction
    pub last_activity: SystemTime,
}

impl PracticeSession {
    /// Create a new practice session
    pub fn new(
        tempo_bpm: u16,
        complexity_level: ComplexityLevel,
        time_signature: TimeSignature,
    ) -> Self {
        Self {
            session_id: Uuid::new_v4(),
            current_pattern: None,
            pattern_history: VecDeque::with_capacity(20),
            tempo_bpm,
            complexity_level,
            time_signature,
            playback_state: PlaybackState::Stopped,
            pattern_revealed: false,
            patterns_generated: 0,
            session_start: SystemTime::now(),
            last_activity: SystemTime::now(),
        }
    }

    /// Add a pattern to history, evicting oldest if at capacity
    pub fn add_to_history(&mut self, pattern: Pattern) {
        if self.pattern_history.len() >= 20 {
            self.pattern_history.pop_front();
        }
        self.pattern_history.push_back(pattern);
    }

    /// Update last activity timestamp
    pub fn update_activity(&mut self) {
        self.last_activity = SystemTime::now();
    }
}

impl Default for PracticeSession {
    fn default() -> Self {
        Self::new(120, ComplexityLevel::Medium, TimeSignature::four_four())
    }
}

/// Pattern complexity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComplexityLevel {
    /// Simple patterns: 2-4 kicks, mostly on-beats, low syncopation
    Simple,
    /// Medium patterns: 4-6 kicks, balanced, moderate syncopation
    Medium,
    /// Complex patterns: 6-8 kicks, off-beats emphasized, high syncopation
    Complex,
}

impl Default for ComplexityLevel {
    fn default() -> Self {
        ComplexityLevel::Medium
    }
}

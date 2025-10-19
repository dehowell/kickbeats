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

impl ComplexityLevel {
    /// Parse complexity from string (for CLI args)
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "simple" => Some(ComplexityLevel::Simple),
            "medium" => Some(ComplexityLevel::Medium),
            "complex" => Some(ComplexityLevel::Complex),
            _ => None,
        }
    }
}

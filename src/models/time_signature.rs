/// Musical time signature representation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TimeSignature {
    /// Beats per measure (e.g., 4 in 4/4 time)
    pub numerator: u8,
    /// Note value per beat (e.g., 4 = quarter note)
    pub denominator: u8,
}

impl TimeSignature {
    /// Create a new time signature
    pub fn new(numerator: u8, denominator: u8) -> Self {
        Self {
            numerator,
            denominator,
        }
    }

    /// Create standard 4/4 time signature
    pub fn four_four() -> Self {
        Self::new(4, 4)
    }
}

impl Default for TimeSignature {
    fn default() -> Self {
        Self::four_four()
    }
}

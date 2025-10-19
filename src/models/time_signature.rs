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

    /// Create standard 3/4 time signature (waltz time)
    pub fn three_four() -> Self {
        Self::new(3, 4)
    }

    /// Create standard 6/8 time signature (compound duple)
    pub fn six_eight() -> Self {
        Self::new(6, 8)
    }

    /// Create standard 2/4 time signature (march time)
    pub fn two_four() -> Self {
        Self::new(2, 4)
    }

    /// Create 5/4 time signature
    pub fn five_four() -> Self {
        Self::new(5, 4)
    }

    /// Create 7/8 time signature
    pub fn seven_eight() -> Self {
        Self::new(7, 8)
    }
}

impl Default for TimeSignature {
    fn default() -> Self {
        Self::four_four()
    }
}

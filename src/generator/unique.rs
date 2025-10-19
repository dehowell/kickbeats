use crate::models::Pattern;
use std::collections::VecDeque;

/// Check if a pattern is sufficiently unique compared to history
///
/// Uses Hamming distance (number of differing positions) to measure uniqueness.
/// A pattern is considered unique if it differs from all patterns in history
/// by at least `min_distance` positions.
pub fn is_pattern_unique(
    pattern: &Pattern,
    history: &VecDeque<Pattern>,
    min_distance: u32,
) -> bool {
    // Empty history means pattern is automatically unique
    if history.is_empty() {
        return true;
    }

    // Check against all patterns in history
    for prev_pattern in history {
        let distance = pattern.hamming_distance(prev_pattern);
        if distance < min_distance {
            return false; // Too similar to this pattern
        }
    }

    true // Sufficiently different from all patterns in history
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ComplexityLevel, TimeSignature};

    #[test]
    fn test_is_pattern_unique_empty_history() {
        let pattern = Pattern::new(
            vec![
                true, false, false, false,
                true, false, false, false,
                true, false, false, false,
                true, false, false, false,
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let history = VecDeque::new();

        assert!(is_pattern_unique(&pattern, &history, 3));
    }

    #[test]
    fn test_is_pattern_unique_sufficient_distance() {
        let pattern1 = Pattern::new(
            vec![
                true, false, false, false, // Beat 1
                true, false, false, false, // Beat 2
                false, false, false, false, // Beat 3
                false, false, false, false, // Beat 4
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let pattern2 = Pattern::new(
            vec![
                true, false, false, false, // Beat 1
                false, false, false, false, // Beat 2
                true, false, false, false, // Beat 3
                true, false, false, false, // Beat 4
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let mut history = VecDeque::new();
        history.push_back(pattern1);

        // Hamming distance is 3 (positions 4, 8, 12 differ)
        assert!(is_pattern_unique(&pattern2, &history, 3));
    }

    #[test]
    fn test_is_pattern_unique_insufficient_distance() {
        let pattern1 = Pattern::new(
            vec![
                true, false, false, false, // Beat 1
                true, false, false, false, // Beat 2
                false, false, false, false, // Beat 3
                false, false, false, false, // Beat 4
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let pattern2 = Pattern::new(
            vec![
                true, false, false, false, // Beat 1
                true, false, false, false, // Beat 2
                true, false, false, false, // Beat 3 - only difference
                false, false, false, false, // Beat 4
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let mut history = VecDeque::new();
        history.push_back(pattern1);

        // Hamming distance is only 1 (position 8 differs)
        assert!(!is_pattern_unique(&pattern2, &history, 3));
    }

    #[test]
    fn test_is_pattern_unique_multiple_history() {
        let pattern1 = Pattern::new(
            vec![
                true, false, false, false, true, false, false, false, false, false, false, false,
                false, false, false, false,
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let pattern2 = Pattern::new(
            vec![
                true, false, false, false, false, false, false, false, true, false, false, false,
                true, false, false, false,
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
        );

        let pattern3 = Pattern::new(
            vec![
                true, false, false, false, false, false, true, false, false, false, false, false,
                false, false, true, false,
            ],
            TimeSignature::four_four(),
            ComplexityLevel::Medium,
        );

        let mut history = VecDeque::new();
        history.push_back(pattern1);
        history.push_back(pattern2);

        // Pattern3 should be unique compared to both
        assert!(is_pattern_unique(&pattern3, &history, 3));
    }
}

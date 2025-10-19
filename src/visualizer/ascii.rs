use crate::models::Pattern;

/// Convert a pattern to ASCII art visualization
///
/// Example output for a 4/4 pattern with kicks on positions 0, 4, 10, 14:
/// ```
/// |1 e + a |2 e + a |3 e + a |4 e + a |
/// |X . . . |X . . . |. . X . |. . . X |
/// ```
pub fn pattern_to_ascii(pattern: &Pattern) -> String {
    let mut output = String::new();

    // Header line with beat labels
    output.push_str("|");
    for beat in 1..=pattern.time_signature.numerator {
        output.push_str(&format!("{} e + a |", beat));
    }
    output.push('\n');

    // Pattern line with X for kick, . for rest
    output.push_str("|");
    for (i, &has_kick) in pattern.steps.iter().enumerate() {
        let symbol = if has_kick { "X" } else { "." };
        output.push_str(symbol);

        // Add spacing after each position
        if (i + 1) % 4 == 0 {
            output.push_str(" |"); // End of beat
        } else {
            output.push(' '); // Space between positions
        }
    }
    output.push('\n');

    output
}

/// Format a pattern with additional metadata
pub fn format_pattern_with_metadata(pattern: &Pattern, tempo_bpm: u16) -> String {
    let mut output = String::new();

    // Pattern info
    output.push_str(&format!(
        "Pattern: {} | Tempo: {} BPM | Complexity: {:?}\n",
        pattern.id, tempo_bpm, pattern.complexity_level
    ));

    output.push_str(&format!(
        "Time: {}/{} | Density: {:.1}%\n\n",
        pattern.time_signature.numerator,
        pattern.time_signature.denominator,
        pattern.density() * 100.0
    ));

    // ASCII visualization
    output.push_str(&pattern_to_ascii(pattern));

    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ComplexityLevel, TimeSignature};

    #[test]
    fn test_pattern_to_ascii_basic() {
        let steps = vec![
            true, false, false, false, // Beat 1: X on downbeat
            true, false, false, false, // Beat 2: X on beat 2
            false, false, true, false, // Beat 3: X on "+"
            false, false, false, true, // Beat 4: X on "a"
        ];

        let pattern = Pattern::new(steps, TimeSignature::four_four(), ComplexityLevel::Medium);
        let ascii = pattern_to_ascii(&pattern);

        // Should contain header
        assert!(ascii.contains("|1 e + a |2 e + a |3 e + a |4 e + a |"));

        // Should contain pattern line with X and .
        assert!(ascii.contains("X . . . |"));
        assert!(ascii.contains("|X . . . |"));
    }

    #[test]
    fn test_format_pattern_with_metadata() {
        let steps = vec![
            true, false, false, false, true, false, false, false, false, false, true, false,
            false, false, false, true,
        ];

        let pattern = Pattern::new(steps, TimeSignature::four_four(), ComplexityLevel::Simple);
        let formatted = format_pattern_with_metadata(&pattern, 120);

        // Should contain metadata
        assert!(formatted.contains("Tempo: 120 BPM"));
        assert!(formatted.contains("Complexity: Simple"));
        assert!(formatted.contains("Time: 4/4"));
        assert!(formatted.contains("Density:"));

        // Should contain ASCII visualization
        assert!(formatted.contains("|1 e + a |"));
    }
}

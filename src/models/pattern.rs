use super::complexity::ComplexityLevel;
use super::time_signature::TimeSignature;
use std::time::SystemTime;
use uuid::Uuid;

/// Represents a rhythmic sequence of kick drum hits and rests
#[derive(Debug, Clone)]
pub struct Pattern {
    /// Unique identifier
    pub id: Uuid,
    /// Binary array representing 16th note positions (true = kick, false = rest)
    pub steps: Vec<bool>,
    /// Musical time signature
    pub time_signature: TimeSignature,
    /// Rhythmic resolution (16 = sixteenth notes)
    pub subdivision: u8,
    /// Number of measures in pattern
    pub num_measures: u8,
    /// Generation complexity level
    pub complexity_level: ComplexityLevel,
    /// When pattern was generated
    pub created_at: SystemTime,
}

impl Pattern {
    /// Create a new pattern
    pub fn new(
        steps: Vec<bool>,
        time_signature: TimeSignature,
        complexity_level: ComplexityLevel,
    ) -> Self {
        let num_measures = 1; // Single measure for now
        let subdivision = 16; // 16th notes

        Self {
            id: Uuid::new_v4(),
            steps,
            time_signature,
            subdivision,
            num_measures,
            complexity_level,
            created_at: SystemTime::now(),
        }
    }

    /// Get indices where kicks occur (steps[i] == true)
    pub fn note_positions(&self) -> Vec<usize> {
        self.steps
            .iter()
            .enumerate()
            .filter_map(|(i, &has_kick)| if has_kick { Some(i) } else { None })
            .collect()
    }

    /// Calculate ratio of kicks to total positions (0.0-1.0)
    pub fn density(&self) -> f32 {
        let kicks = self.steps.iter().filter(|&&s| s).count();
        kicks as f32 / self.steps.len() as f32
    }

    /// Calculate Hamming distance to another pattern (number of differing positions)
    pub fn hamming_distance(&self, other: &Pattern) -> u32 {
        self.steps
            .iter()
            .zip(other.steps.iter())
            .filter(|(a, b)| a != b)
            .count() as u32
    }

    /// Validate pattern according to requirements
    pub fn validate_steps(&self) -> Result<(), String> {
        // 1. At least one kick must be present
        if !self.steps.iter().any(|&s| s) {
            return Err("Pattern must have at least one kick".to_string());
        }

        // 2. Mandatory kick on first position (beat 1)
        if !self.steps[0] {
            return Err("Pattern must have kick on beat 1 (position 0)".to_string());
        }

        // 3. Density check: 0.125 (2 kicks) to 0.5 (8 kicks) per measure
        let density = self.density();
        if density < 0.125 || density > 0.5 {
            return Err(format!(
                "Pattern density {:.3} out of range [0.125, 0.5]",
                density
            ));
        }

        // 4. No more than 2 consecutive kicks
        let mut consecutive = 0;
        for &has_kick in &self.steps {
            if has_kick {
                consecutive += 1;
                if consecutive > 2 {
                    return Err("Pattern must not have more than 2 consecutive kicks".to_string());
                }
            } else {
                consecutive = 0;
            }
        }

        // 5. At least one rest of 2+ positions required
        let mut has_long_rest = false;
        let mut rest_count = 0;
        for &has_kick in &self.steps {
            if !has_kick {
                rest_count += 1;
                if rest_count >= 2 {
                    has_long_rest = true;
                }
            } else {
                rest_count = 0;
            }
        }
        if !has_long_rest {
            return Err("Pattern must have at least one rest of 2+ positions".to_string());
        }

        // 6. Maximum 8 consecutive rests
        rest_count = 0;
        for &has_kick in &self.steps {
            if !has_kick {
                rest_count += 1;
                if rest_count > 8 {
                    return Err("Pattern must not have more than 8 consecutive rests".to_string());
                }
            } else {
                rest_count = 0;
            }
        }

        Ok(())
    }
}

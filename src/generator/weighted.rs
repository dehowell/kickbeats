use crate::models::{BeatGrid, ComplexityLevel, Pattern, TimeSignature};
use rand::distributions::{Distribution, WeightedIndex};
use rand::{thread_rng, Rng};
use std::collections::VecDeque;

/// Generates rhythmic patterns using weighted probability
pub struct WeightedGenerator {
    /// Random number generator
    rng: rand::rngs::ThreadRng,
}

impl WeightedGenerator {
    /// Create a new weighted generator
    pub fn new() -> Self {
        Self {
            rng: thread_rng(),
        }
    }

    /// Generate base metrical weights for 4/4 time signature
    /// Returns weights for 16 positions (one measure of sixteenth notes)
    pub fn base_weights_4_4() -> Vec<f32> {
        vec![
            1.0, // Beat 1 (downbeat) - strongest
            0.2, 0.3, 0.2, // Remaining 16ths of beat 1
            0.4, // Beat 2 - medium strong
            0.2, 0.3, 0.2, // Remaining 16ths of beat 2
            0.7, // Beat 3 - strong
            0.2, 0.3, 0.2, // Remaining 16ths of beat 3
            0.4, // Beat 4 - medium strong
            0.2, 0.3, 0.2, // Remaining 16ths of beat 4
        ]
    }

    /// Adjust weights based on complexity level
    fn adjust_weights_for_complexity(
        &self,
        base_weights: &[f32],
        complexity: ComplexityLevel,
    ) -> Vec<f32> {
        match complexity {
            ComplexityLevel::Simple => {
                // Favor on-beat positions (0, 4, 8, 12)
                base_weights
                    .iter()
                    .enumerate()
                    .map(|(i, &w)| {
                        if i % 4 == 0 {
                            w * 2.0 // Double weight for on-beats
                        } else {
                            w * 0.5 // Reduce off-beats
                        }
                    })
                    .collect()
            }
            ComplexityLevel::Medium => {
                // Use base weights as-is
                base_weights.to_vec()
            }
            ComplexityLevel::Complex => {
                // Increase off-beat weights for syncopation
                base_weights
                    .iter()
                    .enumerate()
                    .map(|(i, &w)| {
                        if i % 4 == 0 {
                            w // Keep on-beats same
                        } else {
                            w * 1.5 // Increase off-beats
                        }
                    })
                    .collect()
            }
        }
    }

    /// Get target number of kicks for complexity level
    fn target_kicks_for_complexity(&self, complexity: ComplexityLevel) -> (usize, usize) {
        match complexity {
            ComplexityLevel::Simple => (2, 4),   // 2-4 kicks
            ComplexityLevel::Medium => (4, 6),   // 4-6 kicks
            ComplexityLevel::Complex => (6, 8),  // 6-8 kicks
        }
    }

    /// Generate a pattern using weighted probabilities
    pub fn generate(
        &mut self,
        time_signature: TimeSignature,
        complexity: ComplexityLevel,
        history: &VecDeque<Pattern>,
    ) -> Result<Pattern, String> {
        // Only support 4/4 for now
        if time_signature.numerator != 4 || time_signature.denominator != 4 {
            return Err("Only 4/4 time signature is currently supported".to_string());
        }

        let base_weights = Self::base_weights_4_4();
        let adjusted_weights = self.adjust_weights_for_complexity(&base_weights, complexity);
        let (min_kicks, max_kicks) = self.target_kicks_for_complexity(complexity);

        // Try up to 1000 times to generate a valid, unique pattern
        for _ in 0..1000 {
            let mut steps = vec![false; 16];

            // Position 0 (downbeat) is always true per FR-002
            steps[0] = true;

            // Generate remaining positions using weighted sampling
            let dist = WeightedIndex::new(&adjusted_weights)
                .map_err(|e| format!("Failed to create weighted distribution: {}", e))?;

            // Target number of total kicks
            let target_kicks = min_kicks + (self.rng.gen::<usize>() % (max_kicks - min_kicks + 1));

            // Generate kicks (already have 1 from position 0)
            let mut attempts = 0;
            while steps.iter().filter(|&&s| s).count() < target_kicks && attempts < 100 {
                let idx = dist.sample(&mut self.rng);
                steps[idx] = true;
                attempts += 1;
            }

            // Create candidate pattern
            let pattern = Pattern::new(steps, time_signature, complexity);

            // Validate pattern
            if let Err(_) = pattern.validate_steps() {
                continue; // Try again
            }

            // Check uniqueness against history (Hamming distance >= 3)
            let is_unique = history.iter().all(|prev| pattern.hamming_distance(prev) >= 3);

            if is_unique {
                return Ok(pattern);
            }
        }

        Err("Failed to generate valid unique pattern after 1000 attempts".to_string())
    }
}

impl Default for WeightedGenerator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_weights_4_4() {
        let weights = WeightedGenerator::base_weights_4_4();
        assert_eq!(weights.len(), 16);
        assert_eq!(weights[0], 1.0); // Downbeat strongest
        assert_eq!(weights[8], 0.7); // Beat 3
    }

    #[test]
    fn test_generate_simple_pattern() {
        let mut gen = WeightedGenerator::new();
        let result = gen.generate(
            TimeSignature::four_four(),
            ComplexityLevel::Simple,
            &VecDeque::new(),
        );
        assert!(result.is_ok());
        let pattern = result.unwrap();
        assert!(pattern.steps[0]); // Downbeat must be true
        assert!(pattern.validate_steps().is_ok());
    }
}

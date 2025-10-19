use super::time_signature::TimeSignature;

/// Represents the underlying rhythmic framework
#[derive(Debug, Clone)]
pub struct BeatGrid {
    /// Beats per measure and note value
    pub time_signature: TimeSignature,
    /// Smallest rhythmic unit (16 = sixteenth notes)
    pub subdivision: u8,
    /// Number of measures in grid
    pub num_measures: u8,
}

impl BeatGrid {
    /// Create a new beat grid
    pub fn new(
        time_signature: TimeSignature,
        subdivision: u8,
        num_measures: u8,
    ) -> Self {
        Self {
            time_signature,
            subdivision,
            num_measures,
        }
    }

    /// Total number of grid positions
    pub fn total_positions(&self) -> usize {
        // subdivision is relative to quarter notes (16 = sixteenth notes)
        // For time signatures with different denominators, we need to adjust
        // Example: 6/8 means 6 eighth notes, each eighth = 2 sixteenths, so 6 * 2 = 12
        // Formula: (subdivision / 4) gives sixteenths per quarter note (e.g., 16/4 = 4)
        //          multiply by numerator and divide by (denominator/4) to adjust for beat value
        let sixteenths_per_quarter = self.subdivision as usize / 4;
        let quarters_per_measure = (self.time_signature.numerator as usize * 4) / self.time_signature.denominator as usize;
        sixteenths_per_quarter * quarters_per_measure * self.num_measures as usize
    }

    /// Get indices of on-beat positions (0, 4, 8, 12 in 4/4 sixteenths)
    pub fn beat_positions(&self) -> Vec<usize> {
        let positions_per_beat = self.subdivision as usize / 4;
        (0..self.time_signature.numerator as usize)
            .map(|beat| beat * positions_per_beat)
            .collect()
    }

    /// Get metrical strength of a position (1.0 = downbeat, 0.0 = weakest)
    /// Uses time-signature-specific metrical hierarchy
    pub fn position_strength(&self, idx: usize) -> f32 {
        let positions_per_beat = self.subdivision as usize / 4;

        // Position 0 (downbeat) is always strongest
        if idx == 0 {
            return 1.0;
        }

        // Check if this is an on-beat position
        if idx.is_multiple_of(positions_per_beat) {
            let beat_num = idx / positions_per_beat;
            return self.beat_strength(beat_num);
        }

        // Off-beat positions are weakest
        0.2
    }

    /// Get the metrical strength of a specific beat number based on time signature
    /// This allows different time signatures to have different metrical hierarchies
    fn beat_strength(&self, beat_num: usize) -> f32 {
        match (self.time_signature.numerator, self.time_signature.denominator) {
            // 4/4 time: strong-weak-medium-weak pattern
            (4, 4) => match beat_num {
                0 => 1.0,   // Downbeat (already handled above, but for completeness)
                2 => 0.7,   // Beat 3 is secondary strong
                _ => 0.4,   // Beats 2 and 4 are weak
            },
            // 3/4 time: strong-weak-weak pattern
            (3, 4) => match beat_num {
                0 => 1.0,   // Downbeat
                _ => 0.4,   // All other beats are weak
            },
            // 6/8 time: strong-weak-weak-medium-weak-weak pattern (compound duple)
            (6, 8) => match beat_num {
                0 => 1.0,   // Primary downbeat
                3 => 0.6,   // Secondary accent on beat 4
                _ => 0.3,   // Other beats weak
            },
            // 2/4 time: strong-weak pattern
            (2, 4) => match beat_num {
                0 => 1.0,   // Downbeat
                _ => 0.4,   // Beat 2 is weak
            },
            // 5/4 time: strong-weak-medium-weak-weak (3+2 or 2+3 grouping)
            (5, 4) => match beat_num {
                0 => 1.0,   // Downbeat
                2 => 0.6,   // Secondary accent at beat 3
                _ => 0.3,   // Other beats weak
            },
            // 7/8 time: Common groupings like 2+2+3
            (7, 8) => match beat_num {
                0 => 1.0,   // Downbeat
                2 => 0.6,   // Secondary accent
                4 => 0.5,   // Tertiary accent
                _ => 0.3,   // Other beats weak
            },
            // Default pattern for unhandled time signatures
            _ => match beat_num {
                0 => 1.0,
                n if n == (self.time_signature.numerator as usize / 2) => 0.6,
                _ => 0.4,
            }
        }
    }

    /// Duration of one grid position at given tempo
    pub fn seconds_per_position(&self, tempo_bpm: u16) -> f64 {
        // Quarter note duration in seconds
        let quarter_note_seconds = 60.0 / tempo_bpm as f64;

        // Each subdivision unit relative to quarter note
        let subdivisions_per_quarter = self.subdivision as f64 / 4.0;

        quarter_note_seconds / subdivisions_per_quarter
    }
}

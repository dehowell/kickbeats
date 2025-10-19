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
    /// Probability weights for each grid position
    pub position_weights: Vec<f32>,
}

impl BeatGrid {
    /// Create a new beat grid
    pub fn new(
        time_signature: TimeSignature,
        subdivision: u8,
        num_measures: u8,
        position_weights: Vec<f32>,
    ) -> Self {
        Self {
            time_signature,
            subdivision,
            num_measures,
            position_weights,
        }
    }

    /// Total number of grid positions
    pub fn total_positions(&self) -> usize {
        (self.subdivision as usize)
            * (self.time_signature.numerator as usize)
            * (self.num_measures as usize)
            / 4 // subdivision is per quarter note
    }

    /// Get indices of on-beat positions (0, 4, 8, 12 in 4/4 sixteenths)
    pub fn beat_positions(&self) -> Vec<usize> {
        let positions_per_beat = self.subdivision as usize / 4;
        (0..self.time_signature.numerator as usize)
            .map(|beat| beat * positions_per_beat)
            .collect()
    }

    /// Get metrical strength of a position (1.0 = downbeat, 0.0 = weakest)
    pub fn position_strength(&self, idx: usize) -> f32 {
        let positions_per_beat = self.subdivision as usize / 4;

        // Position 0 (downbeat) is strongest
        if idx == 0 {
            return 1.0;
        }

        // On-beat positions (every quarter note)
        if idx % positions_per_beat == 0 {
            // Beat 3 is stronger than beats 2 and 4
            let beat_num = idx / positions_per_beat;
            if beat_num == 2 {
                return 0.7; // Beat 3 (0-indexed as 2)
            }
            return 0.4; // Beats 2 and 4
        }

        // Off-beat positions
        0.2
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

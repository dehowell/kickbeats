// Generator module
// Random pattern generation with complexity controls

pub mod unique;
pub mod weighted;

pub use unique::is_pattern_unique;
pub use weighted::WeightedGenerator;

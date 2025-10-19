mod cli;
mod engine;
mod generator;
mod models;
mod visualizer;

use cli::CommandLoop;
use generator::WeightedGenerator;
use models::{ComplexityLevel, PracticeSession, TimeSignature};
use std::collections::VecDeque;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

fn main() {
    // Set up Ctrl-C handler
    let running = Arc::new(AtomicBool::new(true));
    let r = Arc::clone(&running);

    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
    })
    .expect("Error setting Ctrl-C handler");

    // Run the application
    if let Err(e) = run() {
        eprintln!("\nError: {}", e);
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    // Parse command-line arguments (basic for MVP)
    let tempo_bpm = 120;
    let complexity = ComplexityLevel::Medium;
    let time_signature = TimeSignature::four_four();

    // Create practice session
    let mut session = PracticeSession::new(tempo_bpm, complexity, time_signature);

    // Generate first pattern
    let mut generator = WeightedGenerator::new();
    let pattern = generator.generate(time_signature, complexity, &VecDeque::new())?;

    // Set as current pattern and add to history
    session.patterns_generated = 1;
    session.add_to_history(pattern.clone());
    session.current_pattern = Some(pattern);

    // Create command loop and run
    let mut cmd_loop = CommandLoop::new(session);
    cmd_loop.run()?;

    Ok(())
}

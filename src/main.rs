mod cli;
mod engine;
mod generator;
mod models;
mod visualizer;

use clap::Parser;
use cli::CommandLoop;
use generator::WeightedGenerator;
use models::{ComplexityLevel, PracticeSession, TimeSignature};
use std::collections::VecDeque;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Kickbeats - Rhythm Practice Tool
///
/// A command-line tool to help musicians practice identifying rhythmic patterns by ear.
#[derive(Parser, Debug)]
#[command(name = "kickbeats")]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Tempo in beats per minute (40-300)
    #[arg(short, long, default_value_t = 120, value_parser = clap::value_parser!(u16).range(40..=300))]
    tempo: u16,

    /// Complexity level: simple, medium, or complex
    #[arg(short, long, default_value = "medium", value_parser = parse_complexity)]
    complexity: ComplexityLevel,

    /// Time signature (e.g., 4/4, 3/4, 6/8, 5/4, 7/8)
    #[arg(long, default_value = "4/4", value_parser = parse_time_signature)]
    time_signature: TimeSignature,
}

/// Parse complexity level from string
fn parse_complexity(s: &str) -> Result<ComplexityLevel, String> {
    match s.to_lowercase().as_str() {
        "simple" | "s" | "1" => Ok(ComplexityLevel::Simple),
        "medium" | "m" | "2" => Ok(ComplexityLevel::Medium),
        "complex" | "c" | "3" => Ok(ComplexityLevel::Complex),
        _ => Err(format!(
            "Invalid complexity '{}'. Use: simple, medium, or complex",
            s
        )),
    }
}

/// Parse time signature from string (e.g., "4/4", "3/4", "6/8")
fn parse_time_signature(s: &str) -> Result<TimeSignature, String> {
    let parts: Vec<&str> = s.split('/').collect();
    if parts.len() != 2 {
        return Err(format!(
            "Invalid time signature '{}'. Format should be numerator/denominator (e.g., 4/4, 3/4, 6/8)",
            s
        ));
    }

    let numerator = parts[0].parse::<u8>().map_err(|_| {
        format!(
            "Invalid numerator '{}' in time signature. Must be a positive number",
            parts[0]
        )
    })?;

    let denominator = parts[1].parse::<u8>().map_err(|_| {
        format!(
            "Invalid denominator '{}' in time signature. Must be a positive number",
            parts[1]
        )
    })?;

    // Validate denominator is a power of 2 (common in music)
    if ![1, 2, 4, 8, 16].contains(&denominator) {
        return Err(format!(
            "Denominator {} is not standard. Use 1, 2, 4, 8, or 16",
            denominator
        ));
    }

    if numerator == 0 {
        return Err("Numerator must be at least 1".to_string());
    }

    Ok(TimeSignature::new(numerator, denominator))
}

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
    // Parse command-line arguments
    let args = Args::parse();

    let tempo_bpm = args.tempo;
    let complexity = args.complexity;
    let time_signature = args.time_signature;

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

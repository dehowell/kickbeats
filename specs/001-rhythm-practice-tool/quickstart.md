# Quickstart Guide: Rhythm Practice Tool

**Feature**: 001-rhythm-practice-tool
**Audience**: Developers implementing this feature
**Date**: 2025-10-18

## Overview

This guide provides a step-by-step walkthrough for implementing the rhythm practice tool, from project setup to running the first working version. Follow these phases in order to build incrementally and test continuously.

---

## Prerequisites

### System Requirements

- **OS**: macOS 10.13+, Linux (ALSA support), or Windows 10+
- **Rust**: 1.75 or later
- **MIDI Device**: Built-in (CoreMIDI on macOS) or external MIDI device/virtual port
- **Terminal**: Any modern terminal with keyboard input support

### Development Tools

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version  # Should be 1.75+
cargo --version

# Optional: Install MIDI testing tools
# macOS: No additional tools needed (CoreMIDI built-in)
# Linux: sudo apt-get install alsa-utils
# Windows: Install a virtual MIDI driver like loopMIDI
```

### Knowledge Prerequisites

- Basic Rust programming (ownership, structs, enums)
- Understanding of MIDI concepts (notes, velocity, timing)
- Familiarity with terminal I/O
- Basic music theory (beats, time signatures) - helpful but not required

---

## Phase 0: Project Setup (30 minutes)

### Step 1: Initialize Cargo Project

```bash
# From repository root
cargo init --name kickbeats

# Verify structure
ls
# Expected: src/, Cargo.toml, ...
```

### Step 2: Add Dependencies

Edit `Cargo.toml`:

```toml
[package]
name = "kickbeats"
version = "0.1.0"
edition = "2021"

[dependencies]
# MIDI I/O
midir = "0.9"
wmidi = "4.0"

# Terminal UI
crossterm = "0.27"
ratatui = "0.24"

# Async runtime (for UI coordination)
tokio = { version = "1.35", features = ["rt", "sync", "macros"] }

# Real-time thread priority
audio_thread_priority = "0.3"

# Utilities
uuid = { version = "1.6", features = ["v4"] }
rand = "0.8"

[dev-dependencies]
# Testing
assert_approx_eq = "1.1"
```

### Step 3: Verify Dependencies

```bash
cargo build
# Should complete successfully, downloading all dependencies
```

### Step 4: Create Module Structure

```bash
# Create directory structure
mkdir -p src/models
mkdir -p src/engine
mkdir -p src/generator
mkdir -p src/visualizer
mkdir -p src/cli
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/timing
```

Create module files:

```bash
touch src/models/mod.rs
touch src/models/pattern.rs
touch src/models/session.rs
touch src/models/beat_grid.rs

touch src/engine/mod.rs
touch src/engine/midi.rs
touch src/engine/timing.rs

touch src/generator/mod.rs
touch src/generator/weighted.rs

touch src/visualizer/mod.rs
touch src/visualizer/ascii.rs

touch src/cli/mod.rs
touch src/cli/commands.rs
```

Update `src/main.rs`:

```rust
mod models;
mod engine;
mod generator;
mod visualizer;
mod cli;

fn main() {
    println!("Kickbeats - Rhythm Practice Tool");
    println!("Project structure initialized successfully!");
}
```

Verify:

```bash
cargo run
# Expected: "Kickbeats - Rhythm Practice Tool"
#           "Project structure initialized successfully!"
```

---

## Phase 1: Core Data Models (1-2 hours)

### Step 1: Implement Pattern Model

Edit `src/models/pattern.rs`:

```rust
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq)]
pub struct Pattern {
    pub id: Uuid,
    pub steps: Vec<bool>,
    pub time_signature: TimeSignature,
    pub subdivision: u8,
    pub num_measures: u8,
    pub complexity_level: ComplexityLevel,
    pub created_at: std::time::SystemTime,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TimeSignature {
    pub numerator: u8,
    pub denominator: u8,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ComplexityLevel {
    Simple,
    Medium,
    Complex,
}

impl Pattern {
    pub fn new(
        steps: Vec<bool>,
        time_signature: TimeSignature,
        complexity_level: ComplexityLevel,
    ) -> Self {
        let num_measures = 1; // For now, single measure
        let subdivision = 16;  // 16th notes

        Self {
            id: Uuid::new_v4(),
            steps,
            time_signature,
            subdivision,
            num_measures,
            complexity_level,
            created_at: std::time::SystemTime::now(),
        }
    }

    pub fn note_positions(&self) -> Vec<usize> {
        self.steps
            .iter()
            .enumerate()
            .filter_map(|(i, &has_kick)| if has_kick { Some(i) } else { None })
            .collect()
    }

    pub fn density(&self) -> f32 {
        let kicks = self.steps.iter().filter(|&&s| s).count();
        kicks as f32 / self.steps.len() as f32
    }

    pub fn hamming_distance(&self, other: &Pattern) -> u32 {
        self.steps
            .iter()
            .zip(other.steps.iter())
            .filter(|(a, b)| a != b)
            .count() as u32
    }
}

// Tests
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_creation() {
        let steps = vec![true, false, false, false, true, false, false, false,
                         true, false, false, false, true, false, false, false];
        let pattern = Pattern::new(
            steps,
            TimeSignature { numerator: 4, denominator: 4 },
            ComplexityLevel::Simple,
        );

        assert_eq!(pattern.steps.len(), 16);
        assert_eq!(pattern.note_positions(), vec![0, 4, 8, 12]);
        assert_eq!(pattern.density(), 0.25);
    }

    #[test]
    fn test_hamming_distance() {
        let pattern1 = Pattern::new(
            vec![true; 16],
            TimeSignature { numerator: 4, denominator: 4 },
            ComplexityLevel::Medium,
        );

        let pattern2 = Pattern::new(
            vec![false; 16],
            TimeSignature { numerator: 4, denominator: 4 },
            ComplexityLevel::Medium,
        );

        assert_eq!(pattern1.hamming_distance(&pattern2), 16);
    }
}
```

Update `src/models/mod.rs`:

```rust
pub mod pattern;
pub use pattern::{Pattern, TimeSignature, ComplexityLevel};
```

**Test**:
```bash
cargo test
# Expected: 2 tests pass
```

### Step 2: Implement Remaining Models

Follow similar pattern for `session.rs` and `beat_grid.rs` (see data-model.md for full specifications).

For quickstart, you can stub these initially:

```rust
// src/models/session.rs
use super::pattern::*;
use std::collections::VecDeque;

pub struct PracticeSession {
    pub current_pattern: Option<Pattern>,
    pub pattern_history: VecDeque<Pattern>,
    pub tempo_bpm: u16,
    pub complexity_level: ComplexityLevel,
    // ... other fields
}

impl PracticeSession {
    pub fn new(tempo_bpm: u16, complexity_level: ComplexityLevel) -> Self {
        Self {
            current_pattern: None,
            pattern_history: VecDeque::with_capacity(20),
            tempo_bpm,
            complexity_level,
        }
    }
}
```

---

## Phase 2: Pattern Generation (2-3 hours)

### Step 1: Implement Weighted Probability Generator

Edit `src/generator/weighted.rs`:

```rust
use crate::models::{Pattern, TimeSignature, ComplexityLevel};
use rand::Rng;

pub struct WeightedGenerator {
    position_weights: Vec<f32>,
    time_signature: TimeSignature,
}

impl WeightedGenerator {
    pub fn new(
        time_signature: TimeSignature,
        complexity_level: ComplexityLevel,
    ) -> Self {
        let base_weights = Self::base_weights_4_4(); // 16 weights for 4/4
        let adjusted_weights = Self::adjust_for_complexity(base_weights, complexity_level);

        Self {
            position_weights: adjusted_weights,
            time_signature,
        }
    }

    fn base_weights_4_4() -> Vec<f32> {
        vec![
            // Beat 1 (strong)
            1.0, 0.2, 0.3, 0.2,
            // Beat 2 (weak)
            0.4, 0.15, 0.2, 0.15,
            // Beat 3 (strong)
            0.7, 0.2, 0.3, 0.2,
            // Beat 4 (weak + anticipation)
            0.3, 0.15, 0.25, 0.3,
        ]
    }

    fn adjust_for_complexity(weights: Vec<f32>, level: ComplexityLevel) -> Vec<f32> {
        let modifiers = match level {
            ComplexityLevel::Simple => vec![1.5, 0.5, 0.7, 0.5], // Favor on-beats
            ComplexityLevel::Medium => vec![1.0, 0.8, 1.0, 0.8], // Balanced
            ComplexityLevel::Complex => vec![0.8, 1.2, 1.3, 1.5], // Favor syncopation
        };

        weights
            .iter()
            .enumerate()
            .map(|(i, &w)| w * modifiers[i % 4])
            .collect()
    }

    pub fn generate(&self) -> Pattern {
        let mut rng = rand::thread_rng();
        let mut steps = vec![false; 16];

        // Mandatory: kick on beat 1
        steps[0] = true;

        // Generate remaining positions
        for i in 1..16 {
            steps[i] = rng.gen::<f32>() < self.position_weights[i];
        }

        // TODO: Add validation (density, consecutive notes, etc.)

        Pattern::new(steps, self.time_signature, ComplexityLevel::Medium)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generator_creates_pattern() {
        let generator = WeightedGenerator::new(
            TimeSignature { numerator: 4, denominator: 4 },
            ComplexityLevel::Medium,
        );

        let pattern = generator.generate();

        assert_eq!(pattern.steps.len(), 16);
        assert!(pattern.steps[0], "First position must be kick");
    }

    #[test]
    fn test_generates_different_patterns() {
        let generator = WeightedGenerator::new(
            TimeSignature { numerator: 4, denominator: 4 },
            ComplexityLevel::Medium,
        );

        let pattern1 = generator.generate();
        let pattern2 = generator.generate();

        // Very unlikely to be identical
        assert_ne!(pattern1.steps, pattern2.steps);
    }
}
```

**Test**:
```bash
cargo test
# All tests should pass
```

---

## Phase 3: MIDI Playback (3-4 hours)

### Step 1: Basic MIDI Output

Edit `src/engine/midi.rs`:

```rust
use midir::{MidiOutput, MidiOutputConnection};
use wmidi::{MidiMessage, Note, Velocity};

pub struct MidiEngine {
    connection: Option<MidiOutputConnection>,
}

impl MidiEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let midi_out = MidiOutput::new("Kickbeats")?;
        let ports = midi_out.ports();

        if ports.is_empty() {
            return Err("No MIDI output port available".into());
        }

        // Connect to first available port
        let connection = midi_out.connect(&ports[0], "kickbeats-output")?;

        Ok(Self {
            connection: Some(connection),
        })
    }

    pub fn send_note_on(&mut self, note: u8, velocity: u8) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(conn) = &mut self.connection {
            let msg = MidiMessage::NoteOn(
                wmidi::Channel::Ch1,
                Note::from_u8_lossy(note),
                Velocity::from_u8_lossy(velocity),
            );
            conn.send(&msg.bytes())?;
        }
        Ok(())
    }

    pub fn send_note_off(&mut self, note: u8) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(conn) = &mut self.connection {
            let msg = MidiMessage::NoteOff(
                wmidi::Channel::Ch1,
                Note::from_u8_lossy(note),
                Velocity::from_u8_lossy(0),
            );
            conn.send(&msg.bytes())?;
        }
        Ok(())
    }
}
```

### Step 2: Test MIDI Output

Create `examples/test_midi.rs`:

```rust
use kickbeats::engine::midi::MidiEngine;
use std::thread;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing MIDI output...");

    let mut engine = MidiEngine::new()?;

    println!("Playing test kick drum...");
    engine.send_note_on(36, 100)?; // MIDI note 36 = kick drum
    thread::sleep(Duration::from_millis(100));
    engine.send_note_off(36)?;

    thread::sleep(Duration::from_secs(1));

    println!("Playing test click...");
    engine.send_note_on(37, 80)?; // MIDI note 37 = side stick/click
    thread::sleep(Duration::from_millis(50));
    engine.send_note_off(37)?;

    println!("MIDI test complete!");
    Ok(())
}
```

**Test**:
```bash
cargo run --example test_midi
# Expected: Should hear two MIDI notes (kick, then click)
```

---

## Phase 4: ASCII Visualization (1 hour)

Edit `src/visualizer/ascii.rs`:

```rust
use crate::models::Pattern;

pub fn pattern_to_ascii(pattern: &Pattern) -> String {
    let mut output = String::new();

    // Header
    output.push_str("Beat:    1       2       3       4\n");
    output.push_str("        ---- | ---- | ---- | ----\n");
    output.push_str("Kick:   ");

    // Steps
    for (i, &has_kick) in pattern.steps.iter().enumerate() {
        let symbol = if has_kick { 'X' } else { '-' };
        output.push(symbol);

        // Add separators
        if (i + 1) % 4 == 0 && i < 15 {
            output.push_str(" | ");
        }
    }

    output.push('\n');
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Pattern, TimeSignature, ComplexityLevel};

    #[test]
    fn test_ascii_visualization() {
        let steps = vec![true, false, false, false,
                         true, false, false, false,
                         true, false, false, false,
                         true, false, false, false];

        let pattern = Pattern::new(
            steps,
            TimeSignature { numerator: 4, denominator: 4 },
            ComplexityLevel::Simple,
        );

        let ascii = pattern_to_ascii(&pattern);

        assert!(ascii.contains("X--- | X--- | X--- | X---"));
    }
}
```

**Test**:
```bash
cargo test
```

---

## Phase 5: CLI Integration (2-3 hours)

### Step 1: Implement Command Loop

Edit `src/cli/commands.rs`:

```rust
use crossterm::{
    event::{self, Event, KeyCode},
    terminal::{self, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use std::io::{stdout, Write};

pub struct CommandLoop {
    should_quit: bool,
}

impl CommandLoop {
    pub fn new() -> Self {
        Self { should_quit: false }
    }

    pub fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Setup
        terminal::enable_raw_mode()?;
        stdout().execute(EnterAlternateScreen)?;

        self.print_welcome();

        // Main loop
        while !self.should_quit {
            if event::poll(std::time::Duration::from_millis(100))? {
                if let Event::Key(key_event) = event::read()? {
                    self.handle_key(key_event.code)?;
                }
            }
        }

        // Cleanup
        terminal::disable_raw_mode()?;
        stdout().execute(LeaveAlternateScreen)?;

        Ok(())
    }

    fn handle_key(&mut self, code: KeyCode) -> Result<(), Box<dyn std::error::Error>> {
        match code {
            KeyCode::Char('q') => {
                self.should_quit = true;
                println!("\nGoodbye!");
            }
            KeyCode::Char('r') => {
                println!("\n[Reveal command - not yet implemented]");
            }
            KeyCode::Char('n') => {
                println!("\n[New pattern command - not yet implemented]");
            }
            _ => {}
        }
        Ok(())
    }

    fn print_welcome(&self) {
        println!("Kickbeats - Rhythm Practice Tool v0.1.0");
        println!("========================================\n");
        println!("Commands:");
        println!("  [r] Reveal pattern");
        println!("  [n] New pattern");
        println!("  [q] Quit\n");
        println!("Press any command key...");
    }
}
```

### Step 2: Wire into Main

Edit `src/main.rs`:

```rust
mod models;
mod engine;
mod generator;
mod visualizer;
mod cli;

use cli::commands::CommandLoop;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut command_loop = CommandLoop::new();
    command_loop.run()?;
    Ok(())
}
```

**Test**:
```bash
cargo run
# Expected: Interactive terminal interface, press 'q' to quit
```

---

## Phase 6: Full Integration (2-3 hours)

Now connect all pieces: generate pattern → play via MIDI → reveal ASCII on command.

See implementation plan (plan.md) and tasks.md for detailed integration steps.

---

## Testing Strategy

### Unit Tests

```bash
# Run all unit tests
cargo test

# Run specific module tests
cargo test models::
cargo test generator::
cargo test visualizer::
```

### Integration Tests

```bash
# Test pattern generation + MIDI conversion
cargo test --test integration_test
```

### Manual Testing Checklist

- [ ] MIDI device connects successfully on launch
- [ ] Pattern plays in seamless loop (no gaps)
- [ ] Click track synchronizes with kick pattern
- [ ] Reveal command shows correct ASCII visualization
- [ ] New pattern command generates different patterns
- [ ] Tempo change applies immediately
- [ ] Complexity change affects next generated pattern
- [ ] Quit command exits cleanly

---

## Troubleshooting

### MIDI Device Not Found

**macOS**:
- CoreMIDI is built-in, no setup needed
- Check System Preferences → Security & Privacy → Microphone/Input Monitoring

**Linux**:
```bash
# Check ALSA devices
aconnect -l

# Install if needed
sudo apt-get install alsa-utils
```

**Windows**:
- Install a virtual MIDI driver like loopMIDI
- Restart application after driver installation

### Timing Issues / Jitter

- Ensure running in Release mode for production: `cargo run --release`
- Check CPU load (high load can cause timing jitter)
- Verify no other audio applications are competing for resources

### Terminal Input Not Working

- Ensure terminal supports raw mode (most modern terminals do)
- Try a different terminal emulator (e.g., iTerm2, Alacritty, Windows Terminal)

---

## Next Steps

After completing this quickstart:

1. Review [data-model.md](./data-model.md) for full entity specifications
2. Review [cli-interface.md](./contracts/cli-interface.md) for complete CLI contract
3. Implement advanced features (tempo change, complexity adjustment)
4. Add comprehensive tests (see testing strategy in plan.md)
5. Optimize timing precision (measure actual loop accuracy)

---

## Quick Reference Commands

```bash
# Build project
cargo build

# Run in debug mode
cargo run

# Run in release mode (better performance)
cargo run --release

# Run tests
cargo test

# Run specific example
cargo run --example test_midi

# Check code
cargo check

# Format code
cargo fmt

# Lint code
cargo clippy
```

---

**Document Status**: Complete
**Estimated Implementation Time**: 15-20 hours for full MVP

use crate::engine::MidiPlaybackLoop;
use crate::generator::WeightedGenerator;
use crate::models::{ComplexityLevel, PracticeSession};
use crate::visualizer::format_pattern_with_metadata;
use crossterm::{
    event::{self, Event, KeyCode, KeyEvent},
    terminal::{disable_raw_mode, enable_raw_mode},
};
use std::io::{self, Write};
use std::time::Duration;

/// Manages the command-line interface and user input
pub struct CommandLoop {
    /// Current practice session
    session: PracticeSession,
    /// MIDI playback engine
    playback: MidiPlaybackLoop,
    /// Pattern generator
    generator: WeightedGenerator,
}

impl CommandLoop {
    /// Create a new command loop
    pub fn new(session: PracticeSession) -> Self {
        Self {
            session,
            playback: MidiPlaybackLoop::new(),
            generator: WeightedGenerator::new(),
        }
    }

    /// Display welcome message and instructions
    pub fn print_welcome(&self) {
        println!("\n╔═══════════════════════════════════════════════════════════╗");
        println!("║           Kickbeats - Rhythm Practice Tool               ║");
        println!("╚═══════════════════════════════════════════════════════════╝\n");

        println!("Session Settings:");
        println!(
            "  Tempo: {} BPM",
            self.session.tempo_bpm
        );
        println!(
            "  Complexity: {:?}",
            self.session.complexity_level
        );
        println!(
            "  Time Signature: {}/{}",
            self.session.time_signature.numerator, self.session.time_signature.denominator
        );

        println!("\nCommands:");
        println!("  [r] Reveal pattern    - Display the current rhythm as ASCII art");
        println!("  [n] New pattern       - Generate and play a new rhythm");
        println!("  [t] Tempo             - Change playback tempo");
        println!("  [c] Complexity        - Change pattern complexity");
        println!("  [q] Quit              - Stop playback and exit\n");

        println!("Pattern is now playing with click track...");
        println!("Listen carefully and try to identify the rhythm.\n");
    }

    /// Start the command loop with the current pattern
    pub fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Display welcome message
        self.print_welcome();

        // Ensure we have a pattern
        if self.session.current_pattern.is_none() {
            return Err("No pattern available to play".into());
        }

        // Start playback
        let pattern = self.session.current_pattern.as_ref().unwrap().clone();
        self.playback
            .start(pattern, self.session.tempo_bpm, true)
            .map_err(|e| format!("Failed to start playback: {}", e))?;

        // Enable raw mode for single-key input
        enable_raw_mode()?;

        let result = self.input_loop();

        // Always disable raw mode on exit
        disable_raw_mode()?;

        result
    }

    /// Main input loop
    fn input_loop(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        loop {
            // Poll for key events with timeout
            if event::poll(Duration::from_millis(100))? {
                if let Event::Key(key_event) = event::read()? {
                    // Handle the key
                    let should_quit = self.handle_key(key_event)?;
                    if should_quit {
                        break;
                    }
                }
            }
        }

        Ok(())
    }

    /// Handle a key press
    fn handle_key(&mut self, key: KeyEvent) -> Result<bool, Box<dyn std::error::Error>> {
        match key.code {
            KeyCode::Char('r') | KeyCode::Char('R') => {
                self.handle_reveal()?;
                Ok(false)
            }
            KeyCode::Char('n') | KeyCode::Char('N') => {
                self.handle_new_pattern()?;
                Ok(false)
            }
            KeyCode::Char('t') | KeyCode::Char('T') => {
                self.handle_tempo_change()?;
                Ok(false)
            }
            KeyCode::Char('c') | KeyCode::Char('C') => {
                self.handle_complexity_change()?;
                Ok(false)
            }
            KeyCode::Char('q') | KeyCode::Char('Q') => {
                self.handle_quit()?;
                Ok(true)
            }
            _ => {
                // Ignore other keys
                Ok(false)
            }
        }
    }

    /// Handle reveal command ('r')
    fn handle_reveal(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Temporarily disable raw mode to print output
        disable_raw_mode()?;

        if let Some(pattern) = &self.session.current_pattern {
            println!("\n═══════════════════════════════════════════════════════════");
            println!("                     PATTERN REVEALED");
            println!("═══════════════════════════════════════════════════════════\n");

            let formatted = format_pattern_with_metadata(pattern, self.session.tempo_bpm);
            println!("{}", formatted);

            println!("═══════════════════════════════════════════════════════════\n");

            self.session.pattern_revealed = true;
            self.session.update_activity();

            println!("Pattern will continue playing. Press [q] to quit.\n");
        } else {
            println!("\nNo pattern available to reveal.\n");
        }

        // Re-enable raw mode
        enable_raw_mode()?;

        Ok(())
    }

    /// Handle new pattern command ('n')
    fn handle_new_pattern(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Stop current playback
        self.playback.stop();

        // Temporarily disable raw mode for output
        disable_raw_mode()?;

        println!("\n⏹  Generating new pattern...");

        // Generate new unique pattern
        let result = self.generator.generate_unique(
            self.session.time_signature,
            self.session.complexity_level,
            &self.session.pattern_history,
        );

        match result {
            Ok((pattern, constraint_used)) => {
                // Increment counter
                self.session.patterns_generated += 1;

                // Add to history
                self.session.add_to_history(pattern.clone());

                // Set as current pattern
                self.session.current_pattern = Some(pattern.clone());

                // Reset revealed flag
                self.session.pattern_revealed = false;

                // Update activity
                self.session.update_activity();

                // Display pattern number
                println!(
                    "✓ Pattern #{} generated this session",
                    self.session.patterns_generated
                );

                // Warn if uniqueness constraint was relaxed
                if constraint_used < 3 {
                    println!(
                        "⚠  Could not generate sufficiently unique pattern after 10 attempts"
                    );
                    println!("   (Relaxed uniqueness constraint to distance >= {})", constraint_used);
                }

                // Re-enable raw mode
                enable_raw_mode()?;

                // Start playback with new pattern
                self.playback
                    .start(pattern, self.session.tempo_bpm, true)
                    .map_err(|e| format!("Failed to start playback: {}", e))?;

                println!("\n▶  New pattern is now playing. Press [r] to reveal.\n");
            }
            Err(e) => {
                println!("✗ Failed to generate new pattern: {}", e);
                println!("  Current pattern will continue playing.\n");

                // Re-enable raw mode
                enable_raw_mode()?;

                // Restart playback with current pattern if it exists
                if let Some(pattern) = &self.session.current_pattern {
                    self.playback
                        .start(pattern.clone(), self.session.tempo_bpm, true)
                        .map_err(|e| format!("Failed to restart playback: {}", e))?;
                }
            }
        }

        Ok(())
    }

    /// Handle tempo change command ('t')
    fn handle_tempo_change(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Stop current playback
        self.playback.stop();

        // Disable raw mode for input
        disable_raw_mode()?;

        println!("\n🎵 Tempo Change");
        println!("Current tempo: {} BPM", self.session.tempo_bpm);
        print!("Enter new tempo (40-300 BPM, or press Enter to cancel): ");
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;

        let input = input.trim();

        // Empty input cancels
        if input.is_empty() {
            println!("✗ Tempo change cancelled.\n");
            enable_raw_mode()?;

            // Restart playback with current tempo
            if let Some(pattern) = &self.session.current_pattern {
                self.playback
                    .start(pattern.clone(), self.session.tempo_bpm, true)
                    .map_err(|e| format!("Failed to restart playback: {}", e))?;
            }

            return Ok(());
        }

        // Parse and validate tempo
        match input.parse::<u16>() {
            Ok(tempo) if tempo >= 40 && tempo <= 300 => {
                // Update session tempo
                self.session.tempo_bpm = tempo;
                self.session.update_activity();

                println!("✓ Tempo changed to {} BPM", tempo);
                println!("  Playback speed will update immediately.\n");

                // Re-enable raw mode
                enable_raw_mode()?;

                // Restart playback with new tempo
                if let Some(pattern) = &self.session.current_pattern {
                    self.playback
                        .start(pattern.clone(), self.session.tempo_bpm, true)
                        .map_err(|e| format!("Failed to restart playback: {}", e))?;
                }
            }
            Ok(tempo) => {
                println!("✗ Tempo {} is out of range (40-300 BPM)", tempo);
                println!("  Keeping current tempo of {} BPM\n", self.session.tempo_bpm);

                enable_raw_mode()?;

                // Restart playback with current tempo
                if let Some(pattern) = &self.session.current_pattern {
                    self.playback
                        .start(pattern.clone(), self.session.tempo_bpm, true)
                        .map_err(|e| format!("Failed to restart playback: {}", e))?;
                }
            }
            Err(_) => {
                println!("✗ Invalid input '{}'. Please enter a number.", input);
                println!("  Keeping current tempo of {} BPM\n", self.session.tempo_bpm);

                enable_raw_mode()?;

                // Restart playback with current tempo
                if let Some(pattern) = &self.session.current_pattern {
                    self.playback
                        .start(pattern.clone(), self.session.tempo_bpm, true)
                        .map_err(|e| format!("Failed to restart playback: {}", e))?;
                }
            }
        }

        Ok(())
    }

    /// Handle complexity change command ('c')
    fn handle_complexity_change(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Disable raw mode for output
        disable_raw_mode()?;

        println!("\n🎛  Complexity Change");
        println!("Current complexity: {:?}", self.session.complexity_level);
        println!("\nSelect new complexity:");
        println!("  [1] Simple   - 2-4 kicks, mostly on-beats");
        println!("  [2] Medium   - 4-6 kicks, balanced");
        println!("  [3] Complex  - 6-8 kicks, high syncopation");
        println!("\nPress 1, 2, 3, or any other key to cancel");

        // Re-enable raw mode for single-key input
        enable_raw_mode()?;

        // Wait for single key press with timeout (10 seconds)
        let mut attempts = 0;
        let max_attempts = 3;

        loop {
            if event::poll(Duration::from_secs(10))? {
                if let Event::Key(key_event) = event::read()? {
                    match key_event.code {
                        KeyCode::Char('1') => {
                            self.session.complexity_level = ComplexityLevel::Simple;
                            self.session.update_activity();

                            disable_raw_mode()?;
                            println!("\n✓ Complexity changed to Simple");
                            println!("  New patterns will have 2-4 kicks, mostly on-beats");
                            println!("  Press [n] to generate a new pattern with this complexity.\n");
                            enable_raw_mode()?;
                            break;
                        }
                        KeyCode::Char('2') => {
                            self.session.complexity_level = ComplexityLevel::Medium;
                            self.session.update_activity();

                            disable_raw_mode()?;
                            println!("\n✓ Complexity changed to Medium");
                            println!("  New patterns will have 4-6 kicks with balanced rhythm");
                            println!("  Press [n] to generate a new pattern with this complexity.\n");
                            enable_raw_mode()?;
                            break;
                        }
                        KeyCode::Char('3') => {
                            self.session.complexity_level = ComplexityLevel::Complex;
                            self.session.update_activity();

                            disable_raw_mode()?;
                            println!("\n✓ Complexity changed to Complex");
                            println!("  New patterns will have 6-8 kicks with high syncopation");
                            println!("  Press [n] to generate a new pattern with this complexity.\n");
                            enable_raw_mode()?;
                            break;
                        }
                        _ => {
                            disable_raw_mode()?;
                            println!("\n✗ Complexity change cancelled.\n");
                            enable_raw_mode()?;
                            break;
                        }
                    }
                }
            } else {
                // Timeout - check attempts
                attempts += 1;
                if attempts >= max_attempts {
                    disable_raw_mode()?;
                    println!("\n✗ Complexity change timed out after {} attempts.\n", max_attempts);
                    enable_raw_mode()?;
                    break;
                }
            }
        }

        Ok(())
    }

    /// Handle quit command ('q')
    fn handle_quit(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Stop playback
        self.playback.stop();

        // Temporarily disable raw mode for output
        disable_raw_mode()?;

        // Display session summary
        println!("\n═══════════════════════════════════════════════════════════");
        println!("                     SESSION SUMMARY");
        println!("═══════════════════════════════════════════════════════════\n");

        println!("Session ID: {}", self.session.session_id);
        println!("Patterns generated: {}", self.session.patterns_generated);

        if let Ok(duration) = self.session.last_activity.duration_since(self.session.session_start)
        {
            let minutes = duration.as_secs() / 60;
            let seconds = duration.as_secs() % 60;
            println!("Practice duration: {}m {}s", minutes, seconds);
        }

        println!("\n═══════════════════════════════════════════════════════════");
        println!("Thanks for practicing! Keep working on your rhythm skills.");
        println!("═══════════════════════════════════════════════════════════\n");

        Ok(())
    }
}

impl Drop for CommandLoop {
    fn drop(&mut self) {
        // Ensure raw mode is disabled
        let _ = disable_raw_mode();
        // Ensure playback is stopped
        self.playback.stop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{ComplexityLevel, Pattern, TimeSignature};

    #[test]
    fn test_command_loop_creation() {
        let session = PracticeSession::new(120, ComplexityLevel::Medium, TimeSignature::four_four());
        let cmd_loop = CommandLoop::new(session);

        assert!(!cmd_loop.playback.is_playing());
    }

    #[test]
    fn test_welcome_message() {
        let session = PracticeSession::new(120, ComplexityLevel::Medium, TimeSignature::four_four());
        let cmd_loop = CommandLoop::new(session);

        // Just verify it doesn't crash
        cmd_loop.print_welcome();
    }
}

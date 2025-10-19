use kickbeats::engine::midi::MidiEngine;
use std::thread;
use std::time::Duration;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing MIDI output...");
    println!("Listing available MIDI ports:\n");

    // List available ports
    match MidiEngine::list_ports() {
        Ok(ports) => {
            if ports.is_empty() {
                println!("No MIDI output ports found!");
                println!("Please set up a MIDI device or virtual MIDI port.");
                return Ok(());
            }

            for (i, port) in ports.iter().enumerate() {
                println!("  [{}] {}", i, port);
            }
            println!();
        }
        Err(e) => {
            eprintln!("Error listing MIDI ports: {}", e);
            return Err(e);
        }
    }

    // Try to connect and play test notes
    let mut engine = MidiEngine::new();

    // Get first available port
    let ports = MidiEngine::list_ports()?;
    if ports.is_empty() {
        return Err("No MIDI output ports available".into());
    }

    println!("Connecting to: {}", ports[0]);
    engine.connect(&ports[0])?;

    println!("Playing test kick drum...");
    engine.send_note_on(36, 100)?; // MIDI note 36 = kick drum
    thread::sleep(Duration::from_millis(100));
    engine.send_note_off(36)?;

    thread::sleep(Duration::from_secs(1));

    println!("Playing test click...");
    engine.send_note_on(37, 80)?; // MIDI note 37 = side stick/click
    thread::sleep(Duration::from_millis(50));
    engine.send_note_off(37)?;

    println!("\nMIDI test complete!");
    println!("If you heard two sounds (kick, then click), MIDI is working correctly.");

    Ok(())
}

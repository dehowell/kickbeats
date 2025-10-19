# Kickbeats - Rhythm Practice Tool

A command-line tool for musicians to practice identifying kick drum patterns by ear. Generate random rhythmic patterns, listen to them with a click track, and reveal the notation when you're ready to check your work.

## Features

- **Random Pattern Generation**: Creates musically sensible kick drum patterns using weighted probability
- **Precise MIDI Playback**: Sub-10ms timing accuracy with seamless looping
- **Interactive CLI**: Non-blocking terminal interface with single-key commands
- **Complexity Levels**: Simple, Medium, and Complex patterns with different syncopation
- **Click Track**: Optional metronome to help identify beats
- **ASCII Visualization**: See the pattern notation after transcribing by ear
- **Adjustable Settings**: Change tempo and complexity during practice sessions
- **Pattern Variety**: 95%+ uniqueness guarantee within session history

## Installation

### Prerequisites

- **Rust 1.75 or later**: [Install Rust](https://rustup.rs/)
- **MIDI Output Device**: Built-in (CoreMIDI on macOS) or external/virtual MIDI device

### Platform-Specific Setup

<details>
<summary><b>macOS</b></summary>

No additional setup required! macOS includes CoreMIDI support.

For virtual MIDI ports:
1. Open **Audio MIDI Setup** (in `/Applications/Utilities/`)
2. Go to **Window → Show MIDI Studio**
3. Double-click **IAC Driver**
4. Check "Device is online"

</details>

<details>
<summary><b>Linux</b></summary>

Install ALSA utilities:
```bash
sudo apt-get install alsa-utils
```

Check available MIDI devices:
```bash
aconnect -l
```

Create a virtual MIDI port:
```bash
sudo modprobe snd-virmidi
```

Or use a software synthesizer:
```bash
# Install timidity
sudo apt-get install timidity

# Run as ALSA sequencer
timidity -iA
```

Add your user to the audio group:
```bash
sudo usermod -a -G audio $USER
```

</details>

<details>
<summary><b>Windows</b></summary>

Install a virtual MIDI driver:

1. Download [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) by Tobias Erichsen
2. Install and create a virtual port
3. Optionally connect to a software synthesizer like [VirtualMIDISynth](https://coolsoft.altervista.org/en/virtualmidisynth)

</details>

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/kickbeats.git
cd kickbeats

# Build the project
cargo build --release

# Run the application
cargo run --release
```

## Usage

### Quick Start

```bash
# Start with default settings (120 BPM, Medium complexity)
cargo run --release

# Or specify settings via command-line arguments
cargo run --release -- --tempo 140 --complexity complex
```

### Command-Line Options

```
kickbeats [OPTIONS]

Options:
  -t, --tempo <BPM>           Tempo in beats per minute (40-300) [default: 120]
  -c, --complexity <LEVEL>    Complexity level: simple, medium, or complex [default: medium]
      --time-signature <SIG>  Time signature (currently only 4/4 supported) [default: 4/4]
  -h, --help                  Print help information
  -V, --version               Print version information
```

### Interactive Commands

Once the tool is running, you can use these single-key commands:

| Key | Command | Description |
|-----|---------|-------------|
| `r` | **Reveal** | Display the current pattern as ASCII art |
| `n` | **New** | Generate and play a new random pattern |
| `t` | **Tempo** | Adjust playback tempo (40-300 BPM) |
| `c` | **Complexity** | Change pattern complexity level |
| `q` | **Quit** | Stop playback and exit |

### Practice Workflow

1. **Launch** the tool with your preferred settings
2. **Listen** to the pattern playing on loop with the click track
3. **Transcribe** the rhythm mentally or on paper
4. **Reveal** (`r` key) to see the ASCII notation and check your work
5. **Generate** new patterns (`n` key) to continue practicing

## Pattern Notation

Patterns are displayed in ASCII format showing kick drum positions:

```
Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--- | X--X | --X- | X-X-
```

- `X` = Kick drum hit
- `-` = Rest (silence)
- `|` = Beat separator
- Each beat is divided into 4 sixteenth notes

## Complexity Levels

### Simple
- 2-4 kicks per measure
- Mostly on-beat positions
- Low syncopation
- Good for beginners

### Medium (Default)
- 4-6 kicks per measure
- Balanced on-beat and off-beat
- Moderate syncopation
- Standard difficulty

### Complex
- 6-8 kicks per measure
- Emphasis on off-beats
- High syncopation
- Advanced patterns

## Technical Details

### Timing Accuracy

Kickbeats is built with Rust for sub-millisecond timing precision:
- **Loop accuracy**: <10ms drift target
- **Real-time thread**: Dedicated MIDI playback with priority scheduling
- **Drift detection**: Automatic monitoring and warnings

### Pattern Generation

Patterns are generated using **weighted probability** based on metrical hierarchy:
- Downbeats (beat 1) are most likely
- Strong beats (beat 3 in 4/4) are moderately likely
- Weak beats and off-beats are less likely
- Complexity adjusts these weights for different feels

### Uniqueness Guarantee

The tool ensures variety in generated patterns:
- Tracks last 20 patterns in session history
- Minimum Hamming distance of 3 between patterns
- Achieves 95%+ uniqueness in practice
- Automatic retry with relaxed constraints if needed

## Examples

### Test MIDI Output

Verify your MIDI setup is working:

```bash
cargo run --example test_midi
```

You should hear two sounds (kick drum, then click).

### Practice Session Examples

```bash
# Slow tempo for beginners
cargo run --release -- --tempo 80 --complexity simple

# Fast tempo for advanced practice
cargo run --release -- --tempo 180 --complexity complex

# Standard rock tempo
cargo run --release -- --tempo 120 --complexity medium
```

## Troubleshooting

### No MIDI Devices Found

**Error**: `No MIDI output ports found on this system`

- **macOS**: Enable IAC Driver in Audio MIDI Setup
- **Linux**: Install ALSA utils and check `aconnect -l`
- **Windows**: Install loopMIDI or similar virtual MIDI driver

### Terminal Not Interactive

**Error**: `Terminal does not support raw mode`

Try a different terminal emulator:
- **macOS**: Terminal.app, iTerm2
- **Linux**: GNOME Terminal, Alacritty
- **Windows**: Windows Terminal, ConEmu

### Timing Drift Warnings

If you see drift warnings > 10ms:
- Run in release mode: `cargo run --release`
- Close other CPU-intensive applications
- Check for system load/background processes
- Consider using a dedicated audio interface

## Development

### Running Tests

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test module
cargo test models::pattern
```

### Code Quality

```bash
# Format code
cargo fmt

# Lint code
cargo clippy

# Check without building
cargo check
```

### Project Structure

```
src/
├── models/          # Pattern, Session, BeatGrid entities
├── engine/          # MIDI playback and timing
├── generator/       # Pattern generation algorithms
├── visualizer/      # ASCII art rendering
├── cli/             # Command-line interface
├── lib.rs           # Library exports
└── main.rs          # Entry point

tests/
├── unit/            # Component tests
├── integration/     # End-to-end tests
└── timing/          # Timing accuracy tests
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `cargo fmt` and `cargo clippy`
5. Submit a pull request

## License

[MIT License](LICENSE) - see LICENSE file for details

## Acknowledgments

- Built with [midir](https://github.com/Boddlnagg/midir) for cross-platform MIDI
- Terminal UI powered by [crossterm](https://github.com/crossterm-rs/crossterm)
- Inspired by traditional ear training exercises

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/kickbeats/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/kickbeats/discussions)

---

**Made with Rust for precise, reliable rhythm practice.**

# kickbeats Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-19

## Active Technologies
- Rust 1.75+ (chosen for sub-millisecond timing precision and deterministic performance) + midir 0.9+ (MIDI I/O), wmidi 4.0+ (message parsing), crossterm 0.27+ (terminal control), ratatui 0.24+ (TUI framework), audio_thread_priority 0.3+ (real-time threads) (001-rhythm-practice-tool)
- TypeScript 5.x, targeting ES2020+ + None (vanilla JS) - Web Audio API (browser native), Service Worker API (browser native) (002-web-audio-app)
- IndexedDB for session history and settings persistence (offline storage) (002-web-audio-app)

## Project Structure
```
src/
tests/
```

## Commands
cargo test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] cargo clippy

## Code Style
Rust 1.75+ (chosen for sub-millisecond timing precision and deterministic performance): Follow standard conventions

## Recent Changes
- 002-web-audio-app: Added TypeScript 5.x, targeting ES2020+ + None (vanilla JS) - Web Audio API (browser native), Service Worker API (browser native)
- 001-rhythm-practice-tool: Added Rust 1.75+ (chosen for sub-millisecond timing precision and deterministic performance) + midir 0.9+ (MIDI I/O), wmidi 4.0+ (message parsing), crossterm 0.27+ (terminal control), ratatui 0.24+ (TUI framework), audio_thread_priority 0.3+ (real-time threads)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

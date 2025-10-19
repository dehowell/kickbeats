# Implementation Plan: Rhythm Practice Tool

**Branch**: `001-rhythm-practice-tool` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rhythm-practice-tool/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A command-line tool for musicians to practice identifying kick drum patterns by ear. The tool generates random rhythmic patterns, plays them continuously via MIDI with a click track, and reveals ASCII visualizations on demand. Core focus is on precise timing (sub-10ms loop accuracy), seamless MIDI playback, and interactive terminal experience.

## Technical Context

**Language/Version**: Rust 1.75+ (chosen for sub-millisecond timing precision and deterministic performance)
**Primary Dependencies**: midir 0.9+ (MIDI I/O), wmidi 4.0+ (message parsing), crossterm 0.27+ (terminal control), ratatui 0.24+ (TUI framework), audio_thread_priority 0.3+ (real-time threads)
**Storage**: N/A (stateless tool, patterns generated in-memory)
**Testing**: cargo test (Rust standard), specialized timing tests with timestamp capture, mock MIDI backend for CI
**Target Platform**: Cross-platform CLI (macOS via CoreMIDI, Linux via ALSA, Windows via WinMM)
**Project Type**: Single CLI application
**Performance Goals**: <10ms timing accuracy for seamless looping, <2 second pattern reveal latency, support for 40-300 BPM range, sub-1ms jitter target
**Constraints**: Real-time MIDI playback with precise synchronization, non-blocking terminal input during playback, graceful MIDI device error handling, no allocations in real-time thread
**Scale/Scope**: Single-user CLI tool, ~5-10 commands (start, reveal, new pattern, adjust settings, quit), patterns up to 4 measures

**Research**: See [research.md](./research.md) for detailed technology selection rationale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Status** (before Phase 0): ✅ PASS (No constitution defined yet - this is the first feature)

**Post-Design Status** (after Phase 1): ✅ PASS

**Analysis**: The constitution file (`.specify/memory/constitution.md`) contains only template placeholders. As this is the inaugural feature for the project, there are no established principles to validate against. The design decisions made during Phases 0-1 serve as the foundation for future architectural principles.

**Design Decisions Made**:
1. **Single CLI Application**: Chosen for simplicity and focus on core functionality
2. **Modular Architecture**: Separated concerns (models, engine, generator, visualizer, cli) for testability
3. **Real-Time Constraints**: Dedicated MIDI thread with lock-free communication, no allocations in RT path
4. **Cross-Platform Focus**: Using platform-agnostic libraries (midir, crossterm)
5. **In-Memory Operation**: No persistence layer, stateless tool design

**Recommended Constitution Principles** (to be ratified after implementation):
- **I. Modularity**: Components organized by concern (models, services, interfaces)
- **II. Real-Time Safety**: MIDI thread must be allocation-free, lock-free, and deterministic
- **III. Cross-Platform First**: All dependencies must support macOS, Linux, Windows
- **IV. Test-First Development**: Unit tests for all components, specialized timing tests for accuracy validation
- **V. Simplicity**: Prefer straightforward solutions over complex abstractions unless timing demands it

**Validation**: No violations - design aligns with implicit best practices for real-time audio CLI tools

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── models/          # Pattern, PracticeSession, BeatGrid entities
├── engine/          # MIDI playback engine, timing/synchronization
├── generator/       # Random pattern generation with complexity controls
├── visualizer/      # ASCII art rendering for pattern display
├── cli/             # Command-line interface and user input handling
└── main.rs          # Entry point

tests/
├── unit/            # Individual component tests (generator, visualizer)
├── integration/     # MIDI playback + pattern generation integration
└── timing/          # Specialized tests for loop accuracy and sync
```

**Structure Decision**: Single project structure selected. This is a standalone CLI tool with no API/frontend separation needed. All components are tightly coupled around real-time MIDI playback and can be organized as a single cohesive application. The structure separates concerns by functionality (pattern generation, MIDI engine, visualization, CLI) while maintaining simplicity appropriate for a focused tool.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

N/A - No constitution violations (no constitution established yet)


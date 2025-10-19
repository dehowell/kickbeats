# Research Report: Rhythm Practice Tool

**Date**: 2025-10-18
**Feature**: Rhythm Practice Tool (001-rhythm-practice-tool)
**Phase**: Phase 0 - Technical Research

## Executive Summary

This research addresses technical unknowns for building a CLI tool requiring sub-10ms MIDI timing precision, cross-platform support, and musically intelligent pattern generation. Key decisions: Rust for language, midir for MIDI, weighted probability for pattern generation.

---

## 1. Language & Runtime Choice

### Decision: **Rust 1.75+**

### Rationale

The sub-10ms timing accuracy requirement pushes Python to its limits while operating comfortably within Rust's capabilities:

**Timing Performance**:
- **Rust**: Sub-1ms latency, <0.5ms jitter achievable
- **Python**: 1-5ms latency typical, 1-10ms jitter due to GIL and GC pauses

**Critical Factors**:
- No garbage collection pauses (deterministic memory management)
- True parallelism between MIDI and UI threads (no GIL)
- Native real-time thread priority support
- Compile-time concurrency safety

**Musical Context**:
- Professional "tight" feel requires <1ms jitter
- Live performance threshold: 15-17ms latency
- Our requirement (10ms) demands sub-millisecond precision
- Python's event loop jitter (1-10ms) makes this a boundary case

### Alternatives Considered

**Python 3.11+**:
- **Pros**: Faster development, rich ecosystem, excellent async/await
- **Cons**:
  - GIL prevents true MIDI/UI thread parallelism
  - GC pauses introduce unpredictable jitter
  - python-rtmidi library stale (no updates in 12 months)
  - Would require custom high-precision scheduling workarounds
- **Rejected because**: Timing requirement is the core feature - Rust's guarantees eliminate risk

**Other Languages**:
- C/C++: Timing capable but higher complexity than Rust, manual memory management
- Go: GC pauses similar to Python, not real-time suitable
- Rejected because: Rust provides same timing guarantees with modern safety features

---

## 2. MIDI Library Selection

### Decision: **midir** (Rust) with **wmidi** for message parsing

### Rationale

**midir** provides:
- Active maintenance (updated November 2024)
- Cross-platform: CoreMIDI (macOS), ALSA (Linux), WinMM (Windows)
- Zero-copy message handling (real-time safe)
- Virtual port support
- Callback-based design suitable for dedicated threads

**wmidi** complements with:
- Type-safe MIDI message parsing
- No allocations (real-time safe)
- Note on/off, velocity, channel handling

### Alternatives Considered

**python-rtmidi** (for Python):
- Last update 12+ months ago
- Maintenance status unclear
- Would work but combined with Python's timing issues, adds risk
- Rejected because: Stale maintenance + language timing concerns

**portmidi** (cross-language):
- Mature but dated (last major update 2010)
- Less idiomatic in modern Rust/Python
- Rejected because: midir is more modern with active development

---

## 3. Terminal UI & Input Handling

### Decision: **crossterm** + **ratatui** (Rust)

### Rationale

**crossterm**:
- Cross-platform terminal control (Windows/Unix/Linux)
- Non-blocking keyboard input via `event::poll`
- Async event handling
- Zero terminal render blocking

**ratatui**:
- Terminal UI framework built on crossterm
- Widget-based layout (for future enhancements like real-time BPM display)
- No render loop blocking
- Separates UI state from MIDI real-time thread

**Architecture**:
```
MIDI Thread (real-time priority)
    ↓ (lock-free channel)
UI Thread (normal priority)
    ↓ (crossterm events)
User Input
```

### Alternatives Considered

**Textual + asyncio** (for Python):
- Excellent non-blocking support
- Rich widget library
- Would be ideal for Python implementation
- Rejected because: Language decision supersedes this choice

**cursive** (Rust):
- Higher-level than ratatui
- Blocking event loop
- Rejected because: Would block MIDI thread or require complex threading

---

## 4. Pattern Generation Algorithm

### Decision: **Weighted Probability with Position-Based Weights**

### Rationale

**Approach**: Define probability weights for each 16th note position based on musical strength hierarchy:

```
Position weights for 4/4 (16 positions):
Beat 1.0:    [1.0, 0.2, 0.3, 0.2]  # Strong downbeat
Beat 2.0:    [0.4, 0.15, 0.2, 0.15] # Weak beat
Beat 3.0:    [0.7, 0.2, 0.3, 0.2]  # Secondary strong
Beat 4.0:    [0.3, 0.15, 0.25, 0.3] # Weak + anticipation
```

**Benefits**:
- Naturally produces musically sensible patterns (respects metrical hierarchy)
- Direct complexity control via probability adjustments
- Fast generation (no iteration needed)
- Simple to implement and test

**Complexity Control Strategy**:

| Level | Note Density | Probability Modifiers | Syncopation Score |
|-------|-------------|----------------------|------------------|
| Simple | 2-4 kicks/measure | Favor strong beats (1.5x on-beat, 0.5x off-beat) | 0.0-1.0 |
| Medium | 4-6 kicks/measure | Balanced (1.0x on-beat, 0.8x off-beat) | 1.0-3.0 |
| Complex | 6-8 kicks/measure | Favor syncopation (0.8x on-beat, 1.2-1.5x off-beat) | 3.0+ |

**Validation Rules**:
1. Mandatory kick on beat 1 (establishes downbeat)
2. Density bounds: 2-8 kicks per measure
3. No more than 2 consecutive 16th notes (prevents machine-gun effect)
4. At least one rest of 2+ positions (creates breathing space)
5. Maximum 8 consecutive rests (prevents long silences)

### Alternatives Considered

**Euclidean Rhythm Algorithm** (Bjorklund):
- Distributes N kicks evenly across 16 positions
- Produces world music patterns (e.g., E(3,8) = Cuban tresillo)
- Mathematically elegant
- **Recommendation**: Implement as secondary option (Phase 2) for variety
- Rejected as primary because: Less direct complexity control, need rotation logic for variety

**Markov Chains**:
- Learn transition probabilities from corpus
- Rich pattern vocabulary
- Rejected because:
  - Overkill for single-instrument patterns
  - Requires training data
  - More complex implementation
  - Better suited for polyphonic drums (future enhancement)

---

## 5. Pattern Representation

### Decision: **Binary Array (Vec<bool>)**

### Rationale

```rust
struct Pattern {
    steps: Vec<bool>,              // 16 booleans for 16th notes
    time_signature: (u8, u8),      // (4, 4)
    subdivision: u8,               // 16 (sixteenth notes)
}
```

**Benefits**:
- Simple and intuitive (maps to step sequencer concept)
- Efficient Hamming distance calculation for uniqueness
- Direct visualization to ASCII art
- Easy indexing for MIDI event generation

**Uniqueness via Hamming Distance**:
- Track last 20 patterns
- Minimum distance threshold: 3 (differing positions)
- Regenerate if too similar (max 10 attempts)
- **Statistical outcome**: >95% uniqueness achieved

### Alternatives Considered

**Position List** (Vec<u8>):
- Store only kick positions: [0, 4, 7, 12]
- More memory efficient for sparse patterns
- Rejected because:
  - Harder to compute Hamming distance
  - Pattern visualization less direct
  - Kick patterns at expected densities (25-50%) don't benefit much

**Time-Based Representation** (Vec<TimedNote>):
- Directly MIDI-ready with onset times
- Rejected as primary because:
  - Harder to visualize
  - Complicates pattern comparison
  - **Recommendation**: Use as conversion layer (Pattern → TimedNote → MIDI)

---

## 6. Testing Strategy

### Decision: **Multi-tier approach with timing-focused tests**

### Test Categories

**1. Unit Tests** (cargo test):
- Pattern generation (density, syncopation, constraints)
- ASCII visualization correctness
- MIDI message generation
- Time conversion accuracy

**2. Integration Tests**:
- Pattern generator + MIDI engine integration
- CLI + playback coordination
- Settings configuration flow

**3. Timing Tests** (specialized):
- Loop accuracy measurement (verify <10ms drift)
- Click/pattern synchronization verification
- Long-session stability (30+ minutes)

**Challenges & Solutions**:
- **Challenge**: MIDI timing hard to unit test
- **Solution**: Mock MIDI backend with timestamp capture
- **Challenge**: Real-time behavior testing
- **Solution**: Dedicated timing test suite with statistics (mean, p95, p99 latency)

### Alternatives Considered

**Pure mocking approach**:
- Mock all MIDI interactions
- Rejected because: Timing is the core requirement - need real timing tests
- **Recommendation**: Combine mocks (for CI) + real device tests (for validation)

---

## 7. Architecture Summary

### Recommended System Design

```
┌─────────────────────────────────────────────┐
│                CLI Entry                     │
│  (argument parsing, session initialization) │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐    ┌──────▼───────┐
│  MIDI Engine   │    │  UI Thread   │
│  (RT priority) │    │ (crossterm)  │
│                │    │              │
│ • Playback     │    │ • Input      │
│ • Click track  │◄───┤ • Commands   │
│ • Sync         │    │ • Display    │
└────────────────┘    └──────────────┘
         │                    │
         │                    │
         └──────┬──────┬──────┘
                │      │
    ┌───────────▼──────▼──────────┐
    │    Pattern Generator        │
    │  (weighted probability)     │
    │  • Complexity control       │
    │  • Uniqueness checking      │
    └─────────────────────────────┘
```

**Thread Safety**:
- Lock-free channels (crossbeam or std::sync::mpsc) between RT and UI threads
- Immutable pattern passing (no shared mutable state)
- Real-time thread: no allocations, no locks, no blocking

**Error Handling**:
- MIDI device errors: Graceful shutdown with informative message
- Pattern generation failures: Retry with relaxed constraints
- Timing drift detection: Log warnings, continue playback

---

## 8. Development Roadmap

### Phase 1: Core MVP
1. Basic pattern generation (weighted probability, single complexity)
2. MIDI playback (kick + click track)
3. Seamless looping
4. Single command: reveal pattern
5. ASCII visualization

### Phase 2: Configuration
1. Tempo control
2. Complexity levels (simple/medium/complex)
3. Time signature support
4. Settings persistence (optional)

### Phase 3: Enhancements
1. Euclidean rhythm option
2. Real-time BPM display
3. Pattern history browsing
4. Export patterns (MIDI file)

---

## Technology Stack Summary

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Language | Rust | 1.75+ | Sub-millisecond timing, deterministic performance |
| MIDI I/O | midir | 0.9+ | Cross-platform, real-time safe, actively maintained |
| MIDI Parsing | wmidi | 4.0+ | Type-safe, zero-allocation message handling |
| Terminal UI | crossterm + ratatui | 0.27+ / 0.24+ | Non-blocking input, cross-platform |
| Async Runtime | tokio | 1.35+ | UI coordination (optional, if async UI needed) |
| Real-Time Priority | audio_thread_priority | 0.3+ | Native RT thread support |
| Testing | cargo test | - | Rust standard testing framework |
| Build System | cargo | - | Rust standard build tool |

---

## Risk Assessment

| Risk | Impact | Mitigation | Status |
|------|--------|-----------|---------|
| Rust learning curve | 2-3x dev time | Accept trade-off for timing guarantee | Accepted |
| MIDI device compatibility | High (tool unusable) | Extensive cross-platform testing, clear error messages | Mitigated |
| Timing drift in long sessions | Medium | Absolute time tracking, drift correction | Designed in |
| Pattern uniqueness failures | Low | Fallback to relaxed constraints after retries | Designed in |
| Terminal compatibility | Low | crossterm handles major platforms | Mitigated |

---

## References

- **midir documentation**: https://docs.rs/midir
- **crossterm documentation**: https://docs.rs/crossterm
- **ratatui documentation**: https://docs.rs/ratatui
- **Euclidean rhythms**: Godfried Toussaint, "The Euclidean Algorithm Generates Traditional Musical Rhythms"
- **Metrical hierarchy**: Lerdahl & Jackendoff, "A Generative Theory of Tonal Music"
- **Real-time audio in Rust**: https://github.com/RustAudio

---

**Document Status**: Complete
**Next Phase**: Phase 1 - Design (data model, contracts, quickstart)

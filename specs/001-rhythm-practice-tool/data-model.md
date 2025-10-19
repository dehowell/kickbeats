# Data Model: Rhythm Practice Tool

**Feature**: 001-rhythm-practice-tool
**Date**: 2025-10-18
**Phase**: Phase 1 - Design

## Overview

This document defines the core data structures for the rhythm practice tool. The model focuses on three primary entities: Pattern (rhythmic sequences), PracticeSession (user interaction state), and BeatGrid (timing framework). All structures are designed for in-memory operation with no persistence required.

---

## Core Entities

### 1. Pattern

Represents a rhythmic sequence of kick drum hits and rests within one or more measures.

**Fields**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Unique identifier for the pattern | Auto-generated |
| `steps` | Vec<bool> | Binary array representing 16th note positions (true = kick, false = rest) | Length = 16 × num_measures |
| `time_signature` | TimeSignature | Musical time signature | Default: (4, 4) |
| `subdivision` | u8 | Rhythmic resolution (16 = sixteenth notes) | Must be 4, 8, or 16 |
| `num_measures` | u8 | Number of measures in pattern | 1-4 |
| `complexity_level` | ComplexityLevel | Generation complexity (Simple/Medium/Complex) | Enum |
| `created_at` | Timestamp | When pattern was generated | Auto-generated |

**Derived Properties** (computed, not stored):

| Property | Return Type | Description |
|----------|-------------|-------------|
| `note_positions()` | Vec<usize> | Indices where steps[i] == true |
| `density()` | f32 | Ratio of kicks to total positions (0.0-1.0) |
| `syncopation_score()` | f32 | Weighted measure of off-beat emphasis |
| `hamming_distance(other)` | u32 | Count of differing positions vs another pattern |

**Validation Rules**:

1. At least one kick must be present (no empty patterns)
2. Kick on first position (beat 1) is mandatory
3. Density must be within range: 0.125 (2 kicks) to 0.5 (8 kicks) per measure
4. No more than 2 consecutive kicks (prevents machine-gun effect)
5. At least one rest of 2+ positions required
6. Maximum 8 consecutive rests allowed

**State Transitions**: Immutable after creation (functional pattern generation)

**Example**:
```rust
Pattern {
    id: "550e8400-e29b-41d4-a716-446655440000",
    steps: [true, false, false, false, true, false, false, false,
            true, false, false, false, true, false, false, false],
    time_signature: TimeSignature { numerator: 4, denominator: 4 },
    subdivision: 16,
    num_measures: 1,
    complexity_level: ComplexityLevel::Simple,
    created_at: 2025-10-18T10:30:00Z
}
// Represents: Kick on beats 1, 2, 3, 4 (four-on-the-floor)
```

---

### 2. PracticeSession

Represents a single user interaction with the tool, maintaining current pattern, playback state, and user settings.

**Fields**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `session_id` | UUID | Unique session identifier | Auto-generated |
| `current_pattern` | Option<Pattern> | Currently playing/displayed pattern | None before first generation |
| `pattern_history` | VecDeque<Pattern> | Last N patterns generated | Max size: 20 (for uniqueness checking) |
| `tempo_bpm` | u16 | Playback tempo in beats per minute | 40-300 BPM |
| `complexity_level` | ComplexityLevel | Pattern complexity setting | Default: Medium |
| `time_signature` | TimeSignature | Time signature for pattern generation | Default: (4, 4) |
| `playback_state` | PlaybackState | Current playback status | Enum: Stopped/Playing/Paused |
| `pattern_revealed` | bool | Whether current pattern has been shown | Reset on new pattern |
| `patterns_generated` | u32 | Total patterns created this session | Statistics |
| `session_start` | Timestamp | When session began | Auto-generated |
| `last_activity` | Timestamp | Most recent user interaction | Updated on commands |

**State Transitions**:

```
Session Created (Stopped)
    ↓ (start playback)
Playing (pattern_revealed = false)
    ↓ (user requests reveal)
Playing (pattern_revealed = true)
    ↓ (user requests new pattern)
Playing (pattern_revealed = false, new current_pattern)
    ↓ (user exits)
Stopped (session ends)
```

**Validation Rules**:

1. `tempo_bpm` must be in range 40-300
2. `pattern_history` never exceeds 20 entries (oldest evicted)
3. `current_pattern` must exist before playback can start
4. `pattern_revealed` cannot be true if `current_pattern` is None

**Example**:
```rust
PracticeSession {
    session_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    current_pattern: Some(Pattern { ... }),
    pattern_history: VecDeque::from([Pattern { ... }, Pattern { ... }]),
    tempo_bpm: 120,
    complexity_level: ComplexityLevel::Medium,
    time_signature: TimeSignature { numerator: 4, denominator: 4 },
    playback_state: PlaybackState::Playing,
    pattern_revealed: false,
    patterns_generated: 3,
    session_start: 2025-10-18T10:25:00Z,
    last_activity: 2025-10-18T10:30:15Z
}
```

---

### 3. BeatGrid

Represents the underlying rhythmic framework for pattern generation and timing calculations.

**Fields**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `time_signature` | TimeSignature | Beats per measure and note value | Denominator: 4, 8, or 16 |
| `subdivision` | u8 | Smallest rhythmic unit (16 = sixteenth notes) | 4, 8, or 16 |
| `num_measures` | u8 | Number of measures in grid | 1-4 |
| `position_weights` | Vec<f32> | Probability weights for each grid position | Length = subdivision × numerator × num_measures |

**Derived Properties**:

| Property | Return Type | Description |
|----------|-------------|-------------|
| `total_positions()` | usize | Total number of grid positions (e.g., 16 for 1 measure of 16th notes in 4/4) |
| `beat_positions()` | Vec<usize> | Indices of on-beat positions (0, 4, 8, 12 in 4/4 sixteenths) |
| `position_strength(idx)` | f32 | Metrical strength of position (1.0 = downbeat, 0.0 = weakest) |
| `seconds_per_position(bpm)` | f64 | Duration of one grid position at given tempo |

**Validation Rules**:

1. `position_weights` length must equal `total_positions()`
2. All weights must be in range 0.0-1.0
3. At least one weight must be > 0.0 (otherwise no kicks possible)

**Example**:
```rust
BeatGrid {
    time_signature: TimeSignature { numerator: 4, denominator: 4 },
    subdivision: 16,
    num_measures: 1,
    position_weights: [
        // Beat 1 (downbeat - strongest)
        1.0, 0.2, 0.3, 0.2,
        // Beat 2 (weak)
        0.4, 0.15, 0.2, 0.15,
        // Beat 3 (strong)
        0.7, 0.2, 0.3, 0.2,
        // Beat 4 (weak, but anticipation up at position 15)
        0.3, 0.15, 0.25, 0.3
    ]
}
// total_positions() → 16
// beat_positions() → [0, 4, 8, 12]
// position_strength(0) → 1.0 (downbeat)
// position_strength(14) → 0.25
// seconds_per_position(120) → 0.125 (1/8 second per 16th note at 120 BPM)
```

---

## Supporting Types

### TimeSignature

```rust
struct TimeSignature {
    numerator: u8,    // Beats per measure (e.g., 4)
    denominator: u8,  // Note value per beat (e.g., 4 = quarter note)
}
```

**Common Values**:
- 4/4 (common time)
- 3/4 (waltz time)
- 6/8 (compound duple)

### ComplexityLevel

```rust
enum ComplexityLevel {
    Simple,   // 2-4 kicks, mostly on-beats, low syncopation
    Medium,   // 4-6 kicks, balanced, moderate syncopation
    Complex,  // 6-8 kicks, off-beats emphasized, high syncopation
}
```

### PlaybackState

```rust
enum PlaybackState {
    Stopped,  // No playback, initial state
    Playing,  // Active MIDI output
    Paused,   // Playback suspended (future enhancement)
}
```

---

## Relationships

```
PracticeSession (1) ────has────> (0..1) Pattern [current]
                  │
                  └────has────> (0..20) Pattern [history]
                  │
                  └────uses───> (1) BeatGrid [for generation]

Pattern (1) ────uses────> (1) TimeSignature
        │
        └────has────> (1) ComplexityLevel

BeatGrid (1) ────uses────> (1) TimeSignature
```

**Cardinality Notes**:
- One session has zero or one current pattern (Option<Pattern>)
- One session maintains up to 20 historical patterns
- Each pattern and beat grid references one time signature (may be same instance)
- BeatGrid is derived from session settings, not stored separately

---

## MIDI Event Mapping

The Pattern entity maps to MIDI events via conversion:

### TimedNote (Intermediate Representation)

```rust
struct TimedNote {
    onset_time: f64,   // Time in seconds from start of pattern
    duration: f64,     // Note length in seconds (typically ~0.1 for kick)
    velocity: u8,      // MIDI velocity (60-127, typically 100 for kick)
    note: u8,          // MIDI note number (36 = kick drum, 37 = click)
}
```

### Pattern → MIDI Conversion

```rust
fn pattern_to_midi_events(pattern: &Pattern, tempo_bpm: u16) -> Vec<TimedNote> {
    let seconds_per_position = 60.0 / (tempo_bpm as f64 * 4.0); // 16th note duration

    let mut events = Vec::new();

    // Generate kick events
    for (i, &has_kick) in pattern.steps.iter().enumerate() {
        if has_kick {
            events.push(TimedNote {
                onset_time: i as f64 * seconds_per_position,
                duration: 0.1,
                velocity: 100,
                note: 36, // MIDI note for kick drum
            });
        }
    }

    // Generate click track events (every quarter note)
    let clicks_per_measure = pattern.time_signature.numerator;
    for beat in 0..clicks_per_measure {
        events.push(TimedNote {
            onset_time: beat as f64 * 4.0 * seconds_per_position,
            duration: 0.05,
            velocity: 80,
            note: 37, // MIDI note for click/rimshot
        });
    }

    events.sort_by(|a, b| a.onset_time.partial_cmp(&b.onset_time).unwrap());
    events
}
```

---

## ASCII Visualization Mapping

Pattern converts to ASCII representation:

### Visualization Rules

- Each beat displayed as a group of characters
- Kick represented as `X`, rest as `-` or `.`
- Subdivisions shown within each beat
- Beat numbers displayed above pattern

### Example Visualization

**Pattern**: `[T,F,F,F, T,F,F,F, T,F,F,F, T,F,F,F]` (four-on-the-floor)

```
Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--- | X--- | X--- | X---
```

**Pattern**: `[T,F,F,T, F,F,T,F, T,F,F,F, T,F,T,F]` (syncopated)

```
Beat:    1       2       3       4
        ---- | ---- | ---- | ----
Kick:   X--X | --X- | X--- | X-X-
```

---

## Uniqueness Checking Algorithm

**Purpose**: Ensure 95% of generated patterns are unique within recent history

**Method**: Hamming Distance Comparison

```rust
impl Pattern {
    fn hamming_distance(&self, other: &Pattern) -> u32 {
        self.steps.iter()
            .zip(other.steps.iter())
            .filter(|(a, b)| a != b)
            .count() as u32
    }
}

fn is_pattern_unique(
    new_pattern: &Pattern,
    history: &VecDeque<Pattern>,
    min_distance: u32
) -> bool {
    history.iter().all(|old_pattern| {
        new_pattern.hamming_distance(old_pattern) >= min_distance
    })
}
```

**Parameters**:
- `min_distance`: 3 (require at least 3 differing positions)
- `history` size: 20 patterns
- Retry limit: 10 attempts before relaxing constraint

**Statistical Outcome**: >95% uniqueness achieved with these parameters

---

## Data Flow

### Pattern Generation Flow

```
User Settings (tempo, complexity, time_signature)
    ↓
BeatGrid Generation (position weights based on settings)
    ↓
Weighted Random Generation (apply weights to each position)
    ↓
Validation (density, consecutive notes, mandatory downbeat)
    ↓
Uniqueness Check (Hamming distance vs history)
    ↓ (pass)
New Pattern Created
    ↓
Add to session.pattern_history
    ↓
Set as session.current_pattern
```

### Playback Flow

```
session.current_pattern
    ↓
pattern_to_midi_events(pattern, session.tempo_bpm)
    ↓
Vec<TimedNote>
    ↓
MIDI Engine (schedule and play events)
    ↓
Loop back to start (seamless looping)
```

### Visualization Flow

```
session.current_pattern (when revealed)
    ↓
pattern_to_ascii(&pattern)
    ↓
ASCII String
    ↓
Display to terminal (via ratatui/crossterm)
```

---

## Invariants

Critical properties that must always hold:

1. **Pattern Validity**: Every Pattern in existence passes all validation rules
2. **History Bound**: `session.pattern_history.len() ≤ 20`
3. **Playback Consistency**: If `playback_state == Playing`, then `current_pattern.is_some()`
4. **Tempo Range**: `40 ≤ session.tempo_bpm ≤ 300`
5. **Position Count**: `pattern.steps.len() == beat_grid.total_positions()`
6. **Time Signature Match**: Pattern's time signature matches session's during generation
7. **Uniqueness**: Within any 20-pattern window, ≥95% have Hamming distance ≥ 3 from each other

---

## Performance Considerations

- **Pattern Generation**: O(n) where n = number of positions (typically 16-64), target <1ms
- **Hamming Distance**: O(n) comparison, maximum 20 comparisons, target <1ms total
- **MIDI Conversion**: O(k) where k = number of kicks (typically 2-8), target <1ms
- **ASCII Visualization**: O(n) rendering, target <10ms (non-real-time thread)

All operations are designed for in-memory execution with no I/O, ensuring deterministic performance.

---

**Document Status**: Complete
**Next Artifact**: contracts/ (CLI command interface specifications)

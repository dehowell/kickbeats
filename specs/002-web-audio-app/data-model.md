# Data Model: Web-Based Rhythm Practice Application

**Feature**: 002-web-audio-app
**Date**: 2025-10-23
**Based on**: Rust CLI implementation (`src/models/`)

## Overview

This document defines the TypeScript data model for the web application, ported from the existing Rust CLI implementation. All types maintain semantic parity with the Rust models to ensure consistent behavior.

## Core Entities

### Pattern

Represents a rhythmic sequence of kick drum hits and rests.

**TypeScript Definition**:
```typescript
interface Pattern {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Binary array representing 16th note positions (true = kick, false = rest) */
  steps: boolean[];

  /** Musical time signature */
  timeSignature: TimeSignature;

  /** Rhythmic resolution (16 = sixteenth notes) */
  subdivision: number;

  /** Number of measures in pattern (default: 1) */
  numMeasures: number;

  /** Generation complexity level */
  complexityLevel: ComplexityLevel;
}
```

**Derived Properties** (computed, not stored):
- `notePositions(): number[]` - Indices where kicks occur
- `density(): number` - Ratio of kicks to total positions (0.0-1.0)
- `hammingDistance(other: Pattern): number` - Number of differing positions with another pattern

**Validation Rules**:
1. At least one kick must be present
2. Mandatory kick on first position (beat 1, index 0)
3. Density between 0.125 (2 kicks) and 0.5 (8 kicks) per measure
4. No more than 2 consecutive kicks
5. At least one rest of 2+ positions required
6. Maximum 8 consecutive rests

**Example** (four-on-the-floor in 4/4):
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  steps: [
    true, false, false, false,  // Beat 1
    true, false, false, false,  // Beat 2
    true, false, false, false,  // Beat 3
    true, false, false, false,  // Beat 4
  ],
  timeSignature: { numerator: 4, denominator: 4 },
  subdivision: 16,
  numMeasures: 1,
  complexityLevel: "simple"
}
```

---

### BeatGrid

Represents the underlying rhythmic framework for pattern generation and metrical hierarchy.

**TypeScript Definition**:
```typescript
interface BeatGrid {
  /** Musical time signature */
  timeSignature: TimeSignature;

  /** Smallest rhythmic unit (16 = sixteenth notes) */
  subdivision: number;

  /** Number of measures in grid */
  numMeasures: number;
}
```

**Methods** (not stored, computed):
- `totalPositions(): number` - Total number of grid positions
- `beatPositions(): number[]` - Indices of on-beat positions (e.g., [0, 4, 8, 12] in 4/4)
- `positionStrength(idx: number): number` - Metrical strength 0.0-1.0 for weighted generation
- `secondsPerPosition(tempoBpm: number): number` - Duration of one position at given tempo

**Metrical Hierarchy**:

Metrical strength values for pattern generation weights:

| Time Sig | Beat Pattern | Strength Values |
|----------|--------------|-----------------|
| 4/4      | Strong-Weak-Medium-Weak | 1.0, 0.4, 0.7, 0.4 |
| 3/4      | Strong-Weak-Weak | 1.0, 0.4, 0.4 |
| 6/8      | Strong-Weak-Weak-Medium-Weak-Weak | 1.0, 0.3, 0.3, 0.6, 0.3, 0.3 |
| 5/4      | Strong-Weak-Medium-Weak-Weak | 1.0, 0.3, 0.6, 0.3, 0.3 |
| 2/4      | Strong-Weak | 1.0, 0.4 |
| 7/8      | Complex (2+2+3) | 1.0, 0.3, 0.6, 0.3, 0.5, 0.3, 0.3 |

Off-beat positions (between beats) have strength 0.2.

---

### TimeSignature

Musical time signature representation.

**TypeScript Definition**:
```typescript
interface TimeSignature {
  /** Beats per measure (e.g., 4 in 4/4 time) */
  numerator: number;

  /** Note value per beat (e.g., 4 = quarter note) */
  denominator: number;
}
```

**Common Values**:
```typescript
const TIME_SIGNATURES = {
  fourFour: { numerator: 4, denominator: 4 },
  threeFour: { numerator: 3, denominator: 4 },
  sixEight: { numerator: 6, denominator: 8 },
  twoFour: { numerator: 2, denominator: 4 },
  fiveFour: { numerator: 5, denominator: 4 },
  sevenEight: { numerator: 7, denominator: 8 }
};
```

---

### ComplexityLevel

Pattern complexity enum affecting generation parameters.

**TypeScript Definition**:
```typescript
type ComplexityLevel = 'simple' | 'medium' | 'complex';
```

**Characteristics**:
- **Simple**: 2-4 kicks per measure, mostly on-beats, low syncopation
- **Medium**: 4-6 kicks per measure, balanced on/off-beats, moderate syncopation
- **Complex**: 6-8 kicks per measure, off-beats emphasized, high syncopation

Complexity affects probability weights during pattern generation (not stored in model, used by generator).

---

### PracticeSession

Represents a user's practice session with state and history.

**TypeScript Definition**:
```typescript
interface PracticeSession {
  /** Unique session identifier (UUID v4) */
  sessionId: string;

  /** Currently playing/displayed pattern */
  currentPattern: Pattern | null;

  /** Last N patterns generated (max 20 for uniqueness checking) */
  patternHistory: Pattern[];

  /** Playback tempo in beats per minute (40-300) */
  tempoBpm: number;

  /** Pattern complexity setting */
  complexityLevel: ComplexityLevel;

  /** Time signature for pattern generation */
  timeSignature: TimeSignature;

  /** Whether current pattern notation has been shown */
  patternRevealed: boolean;

  /** Total patterns created this session */
  patternsGenerated: number;

  /** When session began (ISO 8601 timestamp) */
  sessionStart: string;

  /** Most recent user interaction (ISO 8601 timestamp) */
  lastActivity: string;
}
```

**Business Rules**:
- Pattern history limited to 20 most recent patterns
- Oldest patterns evicted when capacity reached
- History used for uniqueness checking (minimum Hamming distance of 3)

**Default Values**:
```typescript
{
  tempoBpm: 120,
  complexityLevel: 'medium',
  timeSignature: { numerator: 4, denominator: 4 },
  patternRevealed: false,
  patternsGenerated: 0
}
```

---

## Web-Specific Entities

These entities are specific to the web application and don't exist in the Rust CLI.

### PlaybackState

Manages audio playback state and timing.

**TypeScript Definition**:
```typescript
interface PlaybackState {
  /** Is audio currently playing? */
  isPlaying: boolean;

  /** Current position in pattern (0 to pattern.steps.length - 1) */
  currentPosition: number;

  /** Audio context state ('suspended' | 'running' | 'closed') */
  audioContextState: AudioContextState;

  /** Next scheduled audio event time (in AudioContext time) */
  nextNoteTime: number;

  /** Scheduler look-ahead time in seconds (typically 0.1) */
  scheduleAheadTime: number;
}
```

---

### AppSettings

User preferences persisted in IndexedDB.

**TypeScript Definition**:
```typescript
interface AppSettings {
  /** User-set default tempo */
  defaultTempo: number;

  /** User-set default complexity */
  defaultComplexity: ComplexityLevel;

  /** User-set default time signature */
  defaultTimeSignature: TimeSignature;

  /** Auto-reveal pattern after N loops (0 = never) */
  autoRevealAfterLoops: number;

  /** Click track volume (0.0-1.0) */
  clickVolume: number;

  /** Kick volume (0.0-1.0) */
  kickVolume: number;
}
```

**Default Values**:
```typescript
{
  defaultTempo: 120,
  defaultComplexity: 'medium',
  defaultTimeSignature: { numerator: 4, denominator: 4 },
  autoRevealAfterLoops: 0,
  clickVolume: 0.5,
  kickVolume: 0.7
}
```

---

## IndexedDB Schema

### Object Stores

#### 1. `sessions` Store

**Key Path**: `sessionId`

**Indexes**:
- `sessionStart` - Sort by start time
- `lastActivity` - Find stale sessions

**Purpose**: Persist practice sessions for history and analytics

---

#### 2. `settings` Store

**Key Path**: `id` (singleton with id = "user-settings")

**Purpose**: Store user preferences across sessions

---

#### 3. `patterns` Store (optional)

**Key Path**: `id`

**Indexes**:
- `sessionId` - Find patterns by session
- `complexityLevel` - Query by complexity

**Purpose**: Store generated patterns for analysis (optional feature)

---

## Type Guards and Validation

### Type Guards

```typescript
function isPattern(obj: any): obj is Pattern {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    Array.isArray(obj.steps) &&
    obj.steps.every((s: any) => typeof s === 'boolean') &&
    isTimeSignature(obj.timeSignature) &&
    typeof obj.subdivision === 'number' &&
    typeof obj.numMeasures === 'number' &&
    isComplexityLevel(obj.complexityLevel)
  );
}

function isTimeSignature(obj: any): obj is TimeSignature {
  return (
    typeof obj === 'object' &&
    typeof obj.numerator === 'number' &&
    typeof obj.denominator === 'number' &&
    obj.numerator > 0 &&
    obj.denominator > 0
  );
}

function isComplexityLevel(val: any): val is ComplexityLevel {
  return val === 'simple' || val === 'medium' || val === 'complex';
}
```

---

## Serialization Notes

### Pattern Serialization

When storing patterns in IndexedDB or sending over network (if needed):

```typescript
// Patterns are already JSON-serializable
const json = JSON.stringify(pattern);
const restored = JSON.parse(json) as Pattern;
```

### Timestamp Handling

- Store timestamps as ISO 8601 strings for IndexedDB compatibility
- Convert to `Date` objects in application code as needed

```typescript
const session: PracticeSession = {
  // ...
  sessionStart: new Date().toISOString(),
  lastActivity: new Date().toISOString()
};
```

---

## Migration from Rust

### Key Differences

1. **IDs**: Rust uses `uuid::Uuid` type, TypeScript uses string (UUID v4 format)
2. **Timestamps**: Rust uses `SystemTime`, TypeScript uses ISO 8601 strings
3. **Collections**: Rust `VecDeque` → TypeScript `Array` (manage capacity manually)
4. **Enums**: Rust enums → TypeScript string literal union types
5. **Option types**: Rust `Option<T>` → TypeScript `T | null`

### Behavior Parity

All validation rules, business logic, and algorithms must match the Rust implementation exactly. Use generated test fixtures from Rust CLI to verify correctness.

---

## Summary

The data model maintains strict parity with the Rust CLI implementation while adapting to TypeScript idioms. Key entities (Pattern, BeatGrid, Session) are direct ports, while web-specific entities (PlaybackState, AppSettings) add necessary functionality for the browser environment. IndexedDB provides offline persistence matching the in-memory state management of the CLI.

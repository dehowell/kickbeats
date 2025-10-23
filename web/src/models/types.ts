/**
 * Shared Type Definitions
 * Core types used across the application
 */

/**
 * Musical time signature
 */
export interface TimeSignature {
  /** Beats per measure (e.g., 4 in 4/4 time) */
  numerator: number;
  /** Note value per beat (e.g., 4 = quarter note) */
  denominator: number;
}

/**
 * Pattern complexity levels
 */
export type ComplexityLevel = 'simple' | 'medium' | 'complex';

/**
 * Rhythmic pattern of kick drum hits and rests
 */
export interface Pattern {
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

/**
 * Beat grid for metrical hierarchy
 */
export interface BeatGrid {
  /** Musical time signature */
  timeSignature: TimeSignature;
  /** Smallest rhythmic unit (16 = sixteenth notes) */
  subdivision: number;
  /** Number of measures in grid */
  numMeasures: number;
}

/**
 * Practice session state
 */
export interface PracticeSession {
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

/**
 * Application settings
 */
export interface AppSettings {
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

/**
 * Playback state
 */
export interface PlaybackState {
  /** Is audio currently playing? */
  isPlaying: boolean;
  /** Current position in pattern (0 to pattern.steps.length - 1) */
  currentPosition: number;
  /** Audio context state */
  audioContextState: AudioContextState;
  /** Next scheduled audio event time (in AudioContext time) */
  nextNoteTime: number;
  /** Current tempo in BPM */
  currentTempo: number;
}

/**
 * Audio context state
 */
export type AudioContextState = 'suspended' | 'running' | 'closed' | 'interrupted';

/**
 * Common time signatures
 */
export const TIME_SIGNATURES = {
  fourFour: { numerator: 4, denominator: 4 } as TimeSignature,
  threeFour: { numerator: 3, denominator: 4 } as TimeSignature,
  sixEight: { numerator: 6, denominator: 8 } as TimeSignature,
  twoFour: { numerator: 2, denominator: 4 } as TimeSignature,
  fiveFour: { numerator: 5, denominator: 4 } as TimeSignature
} as const;

/**
 * Tempo constraints
 */
export const TEMPO_CONSTRAINTS = {
  MIN: 40,
  MAX: 300,
  DEFAULT: 80
} as const;

/**
 * Pattern constraints
 */
export const PATTERN_CONSTRAINTS = {
  MIN_DENSITY: 0.125, // 2 kicks minimum
  MAX_DENSITY: 0.5, // 8 kicks maximum
  MAX_CONSECUTIVE_KICKS: 2,
  MIN_LONG_REST: 2,
  MAX_CONSECUTIVE_RESTS: 8,
  MAX_HISTORY_SIZE: 20,
  MIN_HAMMING_DISTANCE: 3
} as const;

/**
 * Default application settings
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultTempo: TEMPO_CONSTRAINTS.DEFAULT,
  defaultComplexity: 'medium',
  defaultTimeSignature: TIME_SIGNATURES.fourFour,
  autoRevealAfterLoops: 0,
  clickVolume: 0.5,
  kickVolume: 0.7
} as const;

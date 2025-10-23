/**
 * Audio Engine Contract
 *
 * Defines the interface for the Web Audio API integration layer.
 * Responsible for audio synthesis, scheduling, and playback control.
 */

import { Pattern, TimeSignature } from './types';

/**
 * Main audio engine interface
 */
export interface IAudioEngine {
  /**
   * Initialize the audio context (must be called after user gesture)
   * @returns Promise that resolves when audio context is ready
   * @throws Error if Web Audio API is not supported
   */
  initialize(): Promise<void>;

  /**
   * Start playing the current pattern
   * @param pattern - Pattern to play
   * @param tempoBpm - Playback tempo in BPM (40-300)
   * @throws Error if not initialized or pattern is invalid
   */
  play(pattern: Pattern, tempoBpm: number): void;

  /**
   * Pause playback
   */
  pause(): void;

  /**
   * Resume playback from beginning of pattern
   */
  resume(): void;

  /**
   * Stop playback and reset to beginning
   */
  stop(): void;

  /**
   * Change tempo while playing (seamless transition)
   * @param tempoBpm - New tempo in BPM (40-300)
   */
  setTempo(tempoBpm: number): void;

  /**
   * Set click track volume
   * @param volume - Volume level (0.0-1.0)
   */
  setClickVolume(volume: number): void;

  /**
   * Set kick drum volume
   * @param volume - Volume level (0.0-1.0)
   */
  setKickVolume(volume: number): void;

  /**
   * Get current playback state
   */
  getState(): PlaybackState;

  /**
   * Subscribe to playback position updates
   * @param callback - Called on each beat/position change
   * @returns Unsubscribe function
   */
  onPositionChange(callback: (position: number) => void): () => void;

  /**
   * Cleanup resources (stop playback, close audio context)
   */
  dispose(): void;
}

/**
 * Audio scheduling interface (internal to audio engine)
 */
export interface IAudioScheduler {
  /**
   * Schedule audio events with look-ahead timing
   * @param pattern - Pattern to schedule
   * @param tempoBpm - Tempo in BPM
   * @param startTime - AudioContext time to start from
   */
  schedulePattern(pattern: Pattern, tempoBpm: number, startTime: number): void;

  /**
   * Cancel all scheduled events
   */
  cancelScheduled(): void;

  /**
   * Get next note time
   */
  getNextNoteTime(): number;
}

/**
 * Sound synthesis interface
 */
export interface ISoundSynthesis {
  /**
   * Create kick drum sound
   * @param audioContext - Web Audio API context
   * @param time - When to play (in AudioContext time)
   * @param volume - Volume level (0.0-1.0)
   */
  playKick(audioContext: AudioContext, time: number, volume: number): void;

  /**
   * Create click/metronome sound
   * @param audioContext - Web Audio API context
   * @param time - When to play (in AudioContext time)
   * @param volume - Volume level (0.0-1.0)
   * @param emphasis - Is this an emphasized beat? (affects pitch/volume)
   */
  playClick(
    audioContext: AudioContext,
    time: number,
    volume: number,
    emphasis: boolean
  ): void;

  /**
   * Pre-render sounds into AudioBuffers for efficient playback
   * @param audioContext - Web Audio API context
   */
  precacheSounds(audioContext: AudioContext): Promise<void>;
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
  audioContextState: 'suspended' | 'running' | 'closed';

  /** Next scheduled audio event time (in AudioContext time) */
  nextNoteTime: number;

  /** Current tempo in BPM */
  currentTempo: number;
}

/**
 * Audio engine configuration
 */
export interface AudioEngineConfig {
  /** Look-ahead scheduling time in seconds (default: 0.1) */
  scheduleAheadTime?: number;

  /** Scheduler interval in milliseconds (default: 25) */
  scheduleInterval?: number;

  /** Default click volume (0.0-1.0, default: 0.5) */
  defaultClickVolume?: number;

  /** Default kick volume (0.0-1.0, default: 0.7) */
  defaultKickVolume?: number;
}

/**
 * Audio engine events
 */
export type AudioEngineEvent =
  | { type: 'initialized' }
  | { type: 'playing'; pattern: Pattern; tempo: number }
  | { type: 'paused' }
  | { type: 'stopped' }
  | { type: 'position-changed'; position: number }
  | { type: 'loop-completed'; loopCount: number }
  | { type: 'error'; error: Error };

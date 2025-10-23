/**
 * Audio Engine
 * Main audio playback controller using Web Audio API
 */

import { Pattern } from '../models/Pattern';
import { AudioScheduler } from './AudioScheduler';
import { PlaybackState, TEMPO_CONSTRAINTS } from '../models/types';

export class AudioEngine {
  private audioContext: AudioContext | null;
  private scheduler: AudioScheduler | null;
  private currentPattern: Pattern | null;
  private currentTempo: number;
  private isPlaying: boolean;
  // Volume controls reserved for User Story 4 (Tempo and Complexity Adjustment)
  // private clickVolume: number;
  // private kickVolume: number;

  constructor() {
    this.audioContext = null;
    this.scheduler = null;
    this.currentPattern = null;
    this.currentTempo = TEMPO_CONSTRAINTS.DEFAULT;
    this.isPlaying = false;
    // Volume defaults reserved for User Story 4
    // this.clickVolume = 0.5;
    // this.kickVolume = 0.7;
  }

  /**
   * Initialize audio context (must be called after user gesture)
   */
  async initialize(): Promise<void> {
    if (this.audioContext) return;

    try {
      // Try standard AudioContext first
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported in this browser');
      }

      this.audioContext = new AudioContextClass();
      this.scheduler = new AudioScheduler(this.audioContext);

      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Verify audio context is running
      if (this.audioContext.state !== 'running') {
        console.warn('Audio context state:', this.audioContext.state);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize Web Audio API: ${errorMessage}. Please ensure your browser supports Web Audio and that audio is not blocked by browser settings.`);
    }
  }

  /**
   * Start playing a pattern
   */
  play(pattern: Pattern, tempoBpm: number): void {
    if (!this.audioContext || !this.scheduler) {
      throw new Error('Audio engine not initialized');
    }

    // Stop current playback if running
    if (this.isPlaying) {
      this.scheduler.stop();
    }

    // Resume audio context if needed
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.currentPattern = pattern;
    this.currentTempo = tempoBpm;
    this.isPlaying = true;

    this.scheduler.start(pattern, tempoBpm);
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.scheduler) return;

    this.scheduler.stop();
    this.isPlaying = false;
  }

  /**
   * Resume playback (starts from beginning)
   */
  resume(): void {
    if (!this.currentPattern) return;
    this.play(this.currentPattern, this.currentTempo);
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    this.pause();
    this.currentPattern = null;
  }

  /**
   * Change tempo while playing (seamless transition)
   */
  setTempo(tempoBpm: number): void {
    this.currentTempo = tempoBpm;

    if (this.isPlaying && this.currentPattern) {
      // Restart with new tempo
      this.scheduler?.stop();
      this.scheduler?.start(this.currentPattern, tempoBpm);
    }
  }

  /**
   * Set click track volume
   * Reserved for User Story 4 (Tempo and Complexity Adjustment)
   */
  setClickVolume(_volume: number): void {
    // TODO: Implement in User Story 4
    // this.clickVolume = Math.max(0, Math.min(1, volume));
    // Volume changes will apply to newly scheduled sounds
  }

  /**
   * Set kick drum volume
   * Reserved for User Story 4 (Tempo and Complexity Adjustment)
   */
  setKickVolume(_volume: number): void {
    // TODO: Implement in User Story 4
    // this.kickVolume = Math.max(0, Math.min(1, volume));
    // Volume changes will apply to newly scheduled sounds
  }

  /**
   * Get current playback state
   */
  getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentPosition: 0, // TODO: Get from scheduler
      audioContextState: this.audioContext?.state || 'suspended',
      nextNoteTime: this.scheduler?.getNextNoteTime() || 0,
      currentTempo: this.currentTempo
    };
  }

  /**
   * Subscribe to playback position updates
   */
  onPositionChange(callback: (position: number) => void): () => void {
    if (this.scheduler) {
      this.scheduler.onPosition(callback);
    }

    // Return unsubscribe function
    return () => {
      if (this.scheduler) {
        this.scheduler.onPosition(() => {}); // Clear callback
      }
    };
  }

  /**
   * Check if audio is initialized
   */
  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.scheduler = null;
  }
}

/**
 * Audio Scheduler
 * Implements look-ahead scheduling for precise audio timing
 */

import { Pattern } from '../models/Pattern';
import { BeatGrid } from '../models/BeatGrid';
import { SoundSynthesis } from './SoundSynthesis';

export class AudioScheduler {
  private audioContext: AudioContext;
  private soundSynthesis: SoundSynthesis;
  private scheduleAheadTime: number; // How far ahead to schedule (seconds)
  private scheduleInterval: number; // How often to check scheduling (ms)
  private timerID: number | null;
  private currentNote: number; // Which note is currently being played
  private nextNoteTime: number; // When the next note is due
  private isRunning: boolean;
  private isCountingIn: boolean; // Whether we're in the count-in phase
  private countInNote: number; // Current position in count-in measure

  // Callback for position updates
  private onPositionCallback: ((position: number) => void) | null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.soundSynthesis = new SoundSynthesis();
    this.scheduleAheadTime = 0.1; // 100ms look-ahead
    this.scheduleInterval = 25; // Check every 25ms
    this.timerID = null;
    this.currentNote = 0;
    this.nextNoteTime = 0.0;
    this.isRunning = false;
    this.isCountingIn = false;
    this.countInNote = 0;
    this.onPositionCallback = null;
  }

  /**
   * Start scheduling audio events for a pattern
   */
  start(pattern: Pattern, tempoBpm: number): void {
    if (this.isRunning) return;

    this.currentNote = 0;
    this.countInNote = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.isRunning = true;
    this.isCountingIn = true; // Start with count-in

    this.scheduleLoop(pattern, tempoBpm);
  }

  /**
   * Stop scheduling
   */
  stop(): void {
    this.isRunning = false;
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  /**
   * Set position change callback
   */
  onPosition(callback: (position: number) => void): void {
    this.onPositionCallback = callback;
  }

  /**
   * Get next note time
   */
  getNextNoteTime(): number {
    return this.nextNoteTime;
  }

  /**
   * Main scheduling loop
   */
  private scheduleLoop(pattern: Pattern, tempoBpm: number): void {
    if (!this.isRunning) return;

    // Schedule all notes that need to be played in the next look-ahead window
    while (
      this.nextNoteTime <
      this.audioContext.currentTime + this.scheduleAheadTime
    ) {
      this.scheduleNote(pattern, tempoBpm, this.nextNoteTime);
      this.advanceNote(pattern, tempoBpm);
    }

    // Check again soon
    this.timerID = window.setTimeout(
      () => this.scheduleLoop(pattern, tempoBpm),
      this.scheduleInterval
    );
  }

  /**
   * Schedule a single note
   */
  private scheduleNote(pattern: Pattern, _tempoBpm: number, time: number): void {
    const beatGrid = new BeatGrid(pattern.timeSignature);

    if (this.isCountingIn) {
      // During count-in, only play clicks on beat positions
      const beatPositions = beatGrid.beatPositions();
      const isOnBeat = beatPositions.includes(this.countInNote);
      const isDownbeat = this.countInNote === 0;

      if (isOnBeat) {
        this.soundSynthesis.playClick(
          this.audioContext,
          time,
          0.5,
          isDownbeat // Emphasize downbeat
        );
      }
    } else {
      // During normal playback
      const beatPositions = beatGrid.beatPositions();
      const isOnBeat = beatPositions.includes(this.currentNote);
      const isDownbeat = this.currentNote === 0;

      if (isOnBeat) {
        this.soundSynthesis.playClick(
          this.audioContext,
          time,
          0.5,
          isDownbeat // Emphasize downbeat
        );
      }

      // Play kick if this position has one
      if (pattern.steps[this.currentNote]) {
        this.soundSynthesis.playKick(this.audioContext, time, 0.7);
      }

      // Notify position change
      if (this.onPositionCallback) {
        this.onPositionCallback(this.currentNote);
      }
    }
  }

  /**
   * Advance to next note
   */
  private advanceNote(pattern: Pattern, tempoBpm: number): void {
    const beatGrid = new BeatGrid(pattern.timeSignature);
    const secondsPerPosition = beatGrid.secondsPerPosition(tempoBpm);

    // Advance time
    this.nextNoteTime += secondsPerPosition;

    if (this.isCountingIn) {
      // Advance count-in position
      this.countInNote++;

      // Check if count-in measure is complete
      if (this.countInNote >= pattern.steps.length) {
        this.isCountingIn = false;
        this.countInNote = 0;
        this.currentNote = 0;
      }
    } else {
      // Advance note position during normal playback
      this.currentNote++;

      // Loop back to start when pattern completes
      if (this.currentNote >= pattern.steps.length) {
        this.currentNote = 0;
      }
    }
  }
}

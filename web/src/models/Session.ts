/**
 * Practice Session Model
 * Represents a user's practice session with state and history
 */

import { Pattern } from './Pattern';
import {
  PracticeSession as IPracticeSession,
  TimeSignature,
  ComplexityLevel,
  PATTERN_CONSTRAINTS,
  TEMPO_CONSTRAINTS,
  TIME_SIGNATURES
} from './types';

export class PracticeSession implements IPracticeSession {
  public readonly sessionId: string;
  public currentPattern: Pattern | null;
  public patternHistory: Pattern[];
  public tempoBpm: number;
  public complexityLevel: ComplexityLevel;
  public timeSignature: TimeSignature;
  public patternRevealed: boolean;
  public patternsGenerated: number;
  public readonly sessionStart: string;
  public lastActivity: string;

  constructor(
    tempoBpm: number = TEMPO_CONSTRAINTS.DEFAULT,
    complexityLevel: ComplexityLevel = 'medium',
    timeSignature: TimeSignature = TIME_SIGNATURES.fourFour
  ) {
    this.sessionId = crypto.randomUUID();
    this.currentPattern = null;
    this.patternHistory = [];
    this.tempoBpm = tempoBpm;
    this.complexityLevel = complexityLevel;
    this.timeSignature = { ...timeSignature };
    this.patternRevealed = false;
    this.patternsGenerated = 0;
    this.sessionStart = new Date().toISOString();
    this.lastActivity = this.sessionStart;
  }

  /**
   * Add a pattern to history, evicting oldest if at capacity
   */
  addToHistory(pattern: Pattern): void {
    if (this.patternHistory.length >= PATTERN_CONSTRAINTS.MAX_HISTORY_SIZE) {
      this.patternHistory.shift(); // Remove oldest
    }
    this.patternHistory.push(pattern);
    this.patternsGenerated++;
    this.updateActivity();
  }

  /**
   * Set current pattern
   */
  setCurrentPattern(pattern: Pattern): void {
    this.currentPattern = pattern;
    this.patternRevealed = false;
    this.addToHistory(pattern);
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = new Date().toISOString();
  }

  /**
   * Convert session to JSON for storage
   */
  toJSON(): IPracticeSession {
    return {
      sessionId: this.sessionId,
      currentPattern: this.currentPattern ? this.currentPattern.toJSON() : null,
      patternHistory: this.patternHistory.map(p => p.toJSON()),
      tempoBpm: this.tempoBpm,
      complexityLevel: this.complexityLevel,
      timeSignature: this.timeSignature,
      patternRevealed: this.patternRevealed,
      patternsGenerated: this.patternsGenerated,
      sessionStart: this.sessionStart,
      lastActivity: this.lastActivity
    };
  }

  /**
   * Create session from JSON
   */
  static fromJSON(json: IPracticeSession): PracticeSession {
    const session = new PracticeSession(
      json.tempoBpm,
      json.complexityLevel,
      json.timeSignature
    );

    // Override generated values with stored values
    (session as any).sessionId = json.sessionId;
    (session as any).sessionStart = json.sessionStart;
    session.currentPattern = json.currentPattern ? Pattern.fromJSON(json.currentPattern) : null;
    session.patternHistory = json.patternHistory.map(p => Pattern.fromJSON(p));
    session.patternRevealed = json.patternRevealed;
    session.patternsGenerated = json.patternsGenerated;
    session.lastActivity = json.lastActivity;

    return session;
  }
}

/**
 * BeatGrid Model
 * Represents the underlying rhythmic framework for pattern generation
 */

import { BeatGrid as IBeatGrid, TimeSignature } from './types';

export class BeatGrid implements IBeatGrid {
  public readonly timeSignature: TimeSignature;
  public readonly subdivision: number;
  public readonly numMeasures: number;

  constructor(timeSignature: TimeSignature, subdivision: number = 16, numMeasures: number = 1) {
    this.timeSignature = { ...timeSignature };
    this.subdivision = subdivision;
    this.numMeasures = numMeasures;
  }

  /**
   * Total number of grid positions
   */
  totalPositions(): number {
    // subdivision is relative to quarter notes (16 = sixteenth notes)
    // For time signatures with different denominators, we need to adjust
    const sixteenthsPerQuarter = this.subdivision / 4;
    const quartersPerMeasure =
      (this.timeSignature.numerator * 4) / this.timeSignature.denominator;
    return sixteenthsPerQuarter * quartersPerMeasure * this.numMeasures;
  }

  /**
   * Get number of compound beats per measure (for compound meters like 6/8)
   */
  private getCompoundBeats(): number {
    const { numerator, denominator } = this.timeSignature;

    // 6/8 is compound duple (2 beats)
    if (numerator === 6 && denominator === 8) {
      return 2;
    }

    // For simple meters, use the numerator as-is
    return numerator;
  }

  /**
   * Get indices of on-beat positions (0, 4, 8, 12 in 4/4 sixteenths)
   */
  beatPositions(): number[] {
    const totalPos = this.totalPositions();
    const compoundBeats = this.getCompoundBeats();
    const positionsPerBeat = totalPos / compoundBeats;

    const positions: number[] = [];
    for (let beat = 0; beat < compoundBeats; beat++) {
      positions.push(Math.round(beat * positionsPerBeat));
    }
    return positions;
  }

  /**
   * Get metrical strength of a position (1.0 = downbeat, 0.0 = weakest)
   * Uses time-signature-specific metrical hierarchy
   */
  positionStrength(idx: number): number {
    const totalPos = this.totalPositions();
    const compoundBeats = this.getCompoundBeats();
    const positionsPerBeat = totalPos / compoundBeats;

    // Position 0 (downbeat) is always strongest
    if (idx === 0) {
      return 1.0;
    }

    // Check if this is an on-beat position (using compound beat grouping)
    if (idx % positionsPerBeat === 0) {
      const beatNum = Math.floor(idx / positionsPerBeat);
      return this.beatStrength(beatNum);
    }

    // Off-beat positions are weakest
    return 0.2;
  }

  /**
   * Get the metrical strength of a specific beat number based on time signature
   */
  private beatStrength(beatNum: number): number {
    const { numerator, denominator } = this.timeSignature;

    switch (`${numerator}/${denominator}`) {
      // 4/4 time: strong-weak-medium-weak pattern
      case '4/4':
        switch (beatNum) {
          case 0:
            return 1.0; // Downbeat
          case 2:
            return 0.7; // Beat 3 is secondary strong
          default:
            return 0.4; // Beats 2 and 4 are weak
        }

      // 3/4 time: strong-weak-weak pattern
      case '3/4':
        return beatNum === 0 ? 1.0 : 0.4;

      // 6/8 time: compound duple (2 compound beats)
      case '6/8':
        switch (beatNum) {
          case 0:
            return 1.0; // Primary downbeat (beat 1)
          case 1:
            return 0.6; // Secondary accent (beat 2)
          default:
            return 0.3; // Should not reach here in 6/8
        }

      // 2/4 time: strong-weak pattern
      case '2/4':
        return beatNum === 0 ? 1.0 : 0.4;

      // 5/4 time: strong-weak-medium-weak-weak (3+2 or 2+3 grouping)
      case '5/4':
        switch (beatNum) {
          case 0:
            return 1.0; // Downbeat
          case 2:
            return 0.6; // Secondary accent at beat 3
          default:
            return 0.3; // Other beats weak
        }

      // Default pattern for unhandled time signatures
      default:
        if (beatNum === 0) return 1.0;
        if (beatNum === Math.floor(numerator / 2)) return 0.6;
        return 0.4;
    }
  }

  /**
   * Duration of one grid position at given tempo
   */
  secondsPerPosition(tempoBpm: number): number {
    // Quarter note duration in seconds
    const quarterNoteSeconds = 60.0 / tempoBpm;

    // Each subdivision unit relative to quarter note
    const subdivisionsPerQuarter = this.subdivision / 4.0;

    return quarterNoteSeconds / subdivisionsPerQuarter;
  }
}

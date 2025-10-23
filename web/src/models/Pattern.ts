/**
 * Pattern Model
 * Represents a rhythmic sequence of kick drum hits and rests
 */

import { Pattern as IPattern, TimeSignature, ComplexityLevel, PATTERN_CONSTRAINTS } from './types';

export class Pattern implements IPattern {
  public readonly id: string;
  public readonly steps: boolean[];
  public readonly timeSignature: TimeSignature;
  public readonly subdivision: number;
  public readonly numMeasures: number;
  public readonly complexityLevel: ComplexityLevel;

  constructor(
    steps: boolean[],
    timeSignature: TimeSignature,
    complexityLevel: ComplexityLevel,
    id?: string
  ) {
    this.id = id || crypto.randomUUID();
    this.steps = [...steps]; // Clone array
    this.timeSignature = { ...timeSignature };
    this.subdivision = 16; // 16th notes
    this.numMeasures = 1; // Single measure for now
    this.complexityLevel = complexityLevel;
  }

  /**
   * Get indices where kicks occur (steps[i] == true)
   */
  notePositions(): number[] {
    return this.steps
      .map((hasKick, index) => hasKick ? index : -1)
      .filter(index => index !== -1);
  }

  /**
   * Calculate ratio of kicks to total positions (0.0-1.0)
   */
  density(): number {
    const kicks = this.steps.filter(s => s).length;
    return kicks / this.steps.length;
  }

  /**
   * Calculate Hamming distance to another pattern (number of differing positions)
   */
  hammingDistance(other: Pattern): number {
    if (this.steps.length !== other.steps.length) {
      throw new Error('Cannot calculate Hamming distance for patterns of different lengths');
    }

    let distance = 0;
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i] !== other.steps[i]) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Validate pattern according to requirements
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. At least one kick must be present
    if (!this.steps.some(s => s)) {
      errors.push('Pattern must have at least one kick');
    }

    // 2. Mandatory kick on first position (beat 1)
    if (!this.steps[0]) {
      errors.push('Pattern must have kick on beat 1 (position 0)');
    }

    // 3. Density check: 0.125 (2 kicks) to 0.5 (8 kicks) per measure
    const density = this.density();
    if (density < PATTERN_CONSTRAINTS.MIN_DENSITY || density > PATTERN_CONSTRAINTS.MAX_DENSITY) {
      errors.push(
        `Pattern density ${density.toFixed(3)} out of range [${PATTERN_CONSTRAINTS.MIN_DENSITY}, ${PATTERN_CONSTRAINTS.MAX_DENSITY}]`
      );
    }

    // 4. No more than 2 consecutive kicks
    let consecutive = 0;
    for (const hasKick of this.steps) {
      if (hasKick) {
        consecutive++;
        if (consecutive > PATTERN_CONSTRAINTS.MAX_CONSECUTIVE_KICKS) {
          errors.push('Pattern must not have more than 2 consecutive kicks');
          break;
        }
      } else {
        consecutive = 0;
      }
    }

    // 5. At least one rest of 2+ positions required
    let hasLongRest = false;
    let restCount = 0;
    for (const hasKick of this.steps) {
      if (!hasKick) {
        restCount++;
        if (restCount >= PATTERN_CONSTRAINTS.MIN_LONG_REST) {
          hasLongRest = true;
        }
      } else {
        restCount = 0;
      }
    }
    if (!hasLongRest) {
      errors.push('Pattern must have at least one rest of 2+ positions');
    }

    // 6. Maximum 8 consecutive rests
    restCount = 0;
    for (const hasKick of this.steps) {
      if (!hasKick) {
        restCount++;
        if (restCount > PATTERN_CONSTRAINTS.MAX_CONSECUTIVE_RESTS) {
          errors.push('Pattern must not have more than 8 consecutive rests');
          break;
        }
      } else {
        restCount = 0;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert pattern to JSON (for storage/serialization)
   */
  toJSON(): IPattern {
    return {
      id: this.id,
      steps: this.steps,
      timeSignature: this.timeSignature,
      subdivision: this.subdivision,
      numMeasures: this.numMeasures,
      complexityLevel: this.complexityLevel
    };
  }

  /**
   * Create pattern from JSON
   */
  static fromJSON(json: IPattern): Pattern {
    return new Pattern(
      json.steps,
      json.timeSignature,
      json.complexityLevel,
      json.id
    );
  }
}

/**
 * Pattern Generator Contract
 *
 * Defines the interface for rhythm pattern generation.
 * Port of Rust generator logic with identical behavior.
 */

import { Pattern, ComplexityLevel, TimeSignature, BeatGrid } from './types';

/**
 * Pattern generator interface
 */
export interface IPatternGenerator {
  /**
   * Generate a new random pattern
   * @param complexity - Desired complexity level
   * @param timeSignature - Time signature for pattern
   * @param history - Recent patterns for uniqueness checking
   * @returns Generated pattern
   * @throws Error if generation fails after max retries
   */
  generate(
    complexity: ComplexityLevel,
    timeSignature: TimeSignature,
    history?: Pattern[]
  ): Pattern;

  /**
   * Generate pattern with seed for reproducible results (testing)
   * @param complexity - Desired complexity level
   * @param timeSignature - Time signature for pattern
   * @param seed - Random seed value
   * @returns Generated pattern
   */
  generateWithSeed(
    complexity: ComplexityLevel,
    timeSignature: TimeSignature,
    seed: number
  ): Pattern;

  /**
   * Validate pattern against all constraints
   * @param pattern - Pattern to validate
   * @returns Validation result with errors if any
   */
  validatePattern(pattern: Pattern): ValidationResult;
}

/**
 * Weight calculator for metrical hierarchy
 */
export interface IWeightCalculator {
  /**
   * Calculate probability weights for each position
   * @param beatGrid - Beat grid defining metrical structure
   * @param complexity - Complexity level affecting weights
   * @returns Array of weights (0.0-1.0) for each position
   */
  calculateWeights(beatGrid: BeatGrid, complexity: ComplexityLevel): number[];

  /**
   * Get target kick count range for complexity level
   * @param complexity - Complexity level
   * @param totalPositions - Total positions in pattern
   * @returns [min, max] kick count
   */
  getTargetKickRange(
    complexity: ComplexityLevel,
    totalPositions: number
  ): [number, number];
}

/**
 * Pattern validation result
 */
export interface ValidationResult {
  /** Is pattern valid? */
  valid: boolean;

  /** Validation errors (empty if valid) */
  errors: ValidationError[];
}

/**
 * Validation error detail
 */
export interface ValidationError {
  /** Error type/code */
  code: ValidationErrorCode;

  /** Human-readable error message */
  message: string;

  /** Related position indices (if applicable) */
  positions?: number[];
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'NO_KICKS' // Pattern has no kicks
  | 'NO_DOWNBEAT_KICK' // Missing kick on beat 1 (position 0)
  | 'DENSITY_TOO_LOW' // Density < 0.125
  | 'DENSITY_TOO_HIGH' // Density > 0.5
  | 'TOO_MANY_CONSECUTIVE_KICKS' // More than 2 consecutive kicks
  | 'NO_LONG_REST' // Missing rest of 2+ positions
  | 'TOO_MANY_CONSECUTIVE_RESTS'; // More than 8 consecutive rests

/**
 * Generation configuration
 */
export interface GeneratorConfig {
  /** Maximum attempts to generate unique pattern (default: 50) */
  maxRetries?: number;

  /** Minimum Hamming distance from history (default: 3) */
  minHammingDistance?: number;

  /** Maximum pattern history size (default: 20) */
  historySize?: number;

  /** Enable strict validation (default: true) */
  strictValidation?: boolean;
}

/**
 * Complexity parameters
 */
export interface ComplexityParameters {
  /** Target kick count range [min, max] */
  targetKickRange: [number, number];

  /** Weight multiplier for on-beat positions (1.0 = normal) */
  onBeatWeightMultiplier: number;

  /** Weight multiplier for off-beat positions (1.0 = normal) */
  offBeatWeightMultiplier: number;

  /** Base probability floor (0.0-1.0) */
  baseProbability: number;
}

/**
 * Get default complexity parameters
 */
export function getComplexityParameters(
  complexity: ComplexityLevel,
  totalPositions: number
): ComplexityParameters {
  switch (complexity) {
    case 'simple':
      return {
        targetKickRange: [2, 4],
        onBeatWeightMultiplier: 1.5,
        offBeatWeightMultiplier: 0.5,
        baseProbability: 0.1
      };

    case 'medium':
      return {
        targetKickRange: [4, 6],
        onBeatWeightMultiplier: 1.0,
        offBeatWeightMultiplier: 1.0,
        baseProbability: 0.2
      };

    case 'complex':
      return {
        targetKickRange: [6, 8],
        onBeatWeightMultiplier: 0.7,
        offBeatWeightMultiplier: 1.3,
        baseProbability: 0.3
      };
  }
}

/**
 * Pattern generation algorithm overview:
 *
 * 1. Create BeatGrid from time signature
 * 2. Calculate metrical weights for each position
 * 3. Apply complexity modifiers to weights
 * 4. Randomly place kicks based on weighted probabilities
 * 5. Ensure position 0 (beat 1) always has kick
 * 6. Validate against all constraints
 * 7. Check uniqueness against history (Hamming distance ≥ 3)
 * 8. Retry if validation or uniqueness fails (max 50 attempts)
 * 9. Relax constraints if max attempts reached
 */

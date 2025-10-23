/**
 * Pattern Generator
 * Generates random kick drum patterns with weighted probability
 */

import { Pattern } from '../models/Pattern';
import { BeatGrid } from '../models/BeatGrid';
import { TimeSignature, ComplexityLevel, PATTERN_CONSTRAINTS } from '../models/types';
import { WeightCalculator } from './WeightCalculator';

export class PatternGenerator {
  private weightCalculator: WeightCalculator;
  private maxRetries: number;

  constructor(maxRetries: number = 50) {
    this.weightCalculator = new WeightCalculator();
    this.maxRetries = maxRetries;
  }

  /**
   * Generate a new random pattern
   */
  generate(
    complexity: ComplexityLevel,
    timeSignature: TimeSignature,
    history: Pattern[] = []
  ): Pattern {
    const beatGrid = new BeatGrid(timeSignature);
    const totalPositions = beatGrid.totalPositions();
    const weights = this.weightCalculator.calculateWeights(beatGrid, complexity);
    const [minKicks, maxKicks] = this.getTargetKickRange(complexity, totalPositions);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const steps = this.generateSteps(weights, totalPositions, minKicks, maxKicks);

      // Ensure position 0 always has a kick
      steps[0] = true;

      const pattern = new Pattern(steps, timeSignature, complexity);
      const validation = pattern.validate();

      // Also validate kick count is within complexity range
      const kickCount = steps.filter(s => s).length;
      if (!validation.valid || kickCount < minKicks || kickCount > maxKicks) {
        continue; // Try again
      }

      // Check uniqueness against history
      if (this.isUnique(pattern, history)) {
        return pattern;
      }
    }

    // If we couldn't generate a unique valid pattern, relax constraints
    // Generate a simple valid pattern
    const fallbackSteps = this.generateFallbackPattern(totalPositions, complexity);
    return new Pattern(fallbackSteps, timeSignature, complexity);
  }

  /**
   * Generate pattern steps based on weighted probabilities
   * Uses a target kick count to control complexity
   */
  private generateSteps(weights: number[], totalPositions: number, minKicks: number, maxKicks: number): boolean[] {
    const steps: boolean[] = new Array(totalPositions).fill(false);
    const targetKicks = Math.floor(minKicks + Math.random() * (maxKicks - minKicks + 1));

    // Create weighted position indices (position, weight)
    const weightedPositions: [number, number][] = weights.map((weight, index) => [index, weight]);

    // Sort by weight (descending) to prefer stronger beats
    weightedPositions.sort((a, b) => b[1] - a[1]);

    // Place kicks according to target count, weighted by position strength
    let kicksPlaced = 0;
    for (const [position, weight] of weightedPositions) {
      if (kicksPlaced >= targetKicks) break;

      // Use weight as probability, but adjusted to hit target
      const probability = weight * (targetKicks / totalPositions) * 2; // Scale up probability
      if (Math.random() < probability) {
        steps[position] = true;
        kicksPlaced++;
      }
    }

    // If we haven't placed enough kicks, place on strongest positions
    if (kicksPlaced < minKicks) {
      for (const [position] of weightedPositions) {
        if (kicksPlaced >= minKicks) break;
        if (!steps[position]) {
          steps[position] = true;
          kicksPlaced++;
        }
      }
    }

    return steps;
  }

  /**
   * Check if pattern is unique compared to history
   */
  private isUnique(pattern: Pattern, history: Pattern[]): boolean {
    if (history.length === 0) return true;

    for (const historyPattern of history) {
      // Skip patterns with different lengths (different time signatures)
      if (pattern.steps.length !== historyPattern.steps.length) {
        continue;
      }

      const distance = pattern.hammingDistance(historyPattern);
      if (distance < PATTERN_CONSTRAINTS.MIN_HAMMING_DISTANCE) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate a fallback pattern when generation fails
   */
  private generateFallbackPattern(totalPositions: number, complexity: ComplexityLevel): boolean[] {
    const steps: boolean[] = new Array(totalPositions).fill(false);

    // Simple fallback: kicks on downbeats based on complexity
    const [minKicks, maxKicks] = this.getTargetKickRange(complexity, totalPositions);
    const targetKicks = Math.floor((minKicks + maxKicks) / 2);

    // Place kicks on strong beats
    const positionsPerBeat = 4; // 16th notes per quarter
    let kicksPlaced = 0;

    // Always place kick on position 0
    steps[0] = true;
    kicksPlaced++;

    // Place remaining kicks on strong positions
    for (let pos = positionsPerBeat; pos < totalPositions && kicksPlaced < targetKicks; pos += positionsPerBeat) {
      steps[pos] = true;
      kicksPlaced++;
    }

    return steps;
  }

  /**
   * Get target kick count range for complexity level
   */
  private getTargetKickRange(complexity: ComplexityLevel, _totalPositions: number): [number, number] {
    switch (complexity) {
      case 'simple':
        return [2, 4];
      case 'medium':
        return [4, 6];
      case 'complex':
        return [6, 8];
    }
  }
}

/**
 * Weight Calculator
 * Calculates probability weights for pattern generation based on metrical hierarchy
 */

import { BeatGrid } from '../models/BeatGrid';
import { ComplexityLevel } from '../models/types';

interface ComplexityParameters {
  onBeatWeightMultiplier: number;
  offBeatWeightMultiplier: number;
  baseProbability: number;
}

export class WeightCalculator {
  /**
   * Calculate probability weights for each position
   */
  calculateWeights(beatGrid: BeatGrid, complexity: ComplexityLevel): number[] {
    const totalPositions = beatGrid.totalPositions();
    const params = this.getComplexityParameters(complexity);
    const weights: number[] = [];

    for (let i = 0; i < totalPositions; i++) {
      const metricalStrength = beatGrid.positionStrength(i);
      const isOnBeat = this.isOnBeat(i, beatGrid);

      // Calculate base weight from metrical strength
      let weight = metricalStrength;

      // Apply complexity multipliers
      if (isOnBeat) {
        weight *= params.onBeatWeightMultiplier;
      } else {
        weight *= params.offBeatWeightMultiplier;
      }

      // Add base probability to ensure some randomness
      weight += params.baseProbability;

      // Clamp to [0, 1]
      weight = Math.max(0, Math.min(1, weight));

      weights.push(weight);
    }

    return weights;
  }

  /**
   * Check if position is on a beat
   */
  private isOnBeat(position: number, beatGrid: BeatGrid): boolean {
    const positionsPerBeat = beatGrid.subdivision / 4;
    return position % positionsPerBeat === 0;
  }

  /**
   * Get complexity parameters
   */
  private getComplexityParameters(complexity: ComplexityLevel): ComplexityParameters {
    switch (complexity) {
      case 'simple':
        return {
          onBeatWeightMultiplier: 1.5,
          offBeatWeightMultiplier: 0.5,
          baseProbability: 0.1
        };

      case 'medium':
        return {
          onBeatWeightMultiplier: 1.0,
          offBeatWeightMultiplier: 1.0,
          baseProbability: 0.2
        };

      case 'complex':
        return {
          onBeatWeightMultiplier: 0.7,
          offBeatWeightMultiplier: 1.3,
          baseProbability: 0.3
        };
    }
  }
}

/**
 * Pattern Notation Component
 * Displays rhythmic pattern in ASCII-style notation
 */

import { Pattern } from '../../models/Pattern';
import { BeatGrid } from '../../models/BeatGrid';

export class PatternNotation {
  private element: HTMLElement;
  private pattern: Pattern | null;
  private isVisible: boolean;

  constructor(container: HTMLElement) {
    this.pattern = null;
    this.isVisible = false;
    this.element = this.createElement();
    container.appendChild(this.element);
  }

  /**
   * Create notation container element
   */
  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'pattern-notation';
    container.setAttribute('data-testid', 'pattern-notation');
    container.style.display = 'none'; // Hidden by default
    return container;
  }

  /**
   * Set the pattern to display
   */
  setPattern(pattern: Pattern): void {
    this.pattern = pattern;
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Show the notation
   */
  show(): void {
    this.isVisible = true;
    this.element.style.display = 'block';
    this.render();
  }

  /**
   * Hide the notation
   */
  hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Render the notation
   */
  private render(): void {
    if (!this.pattern) {
      this.element.innerHTML = '<div class="notation-empty">No pattern loaded</div>';
      return;
    }

    const beatGrid = new BeatGrid(this.pattern.timeSignature, this.pattern.subdivision, this.pattern.numMeasures);
    const notation = this.generateNotation(this.pattern, beatGrid);

    this.element.innerHTML = `
      <div class="notation-header">
        <div class="notation-label">Pattern:</div>
        <div class="notation-info">
          ${this.pattern.timeSignature.numerator}/${this.pattern.timeSignature.denominator} |
          ${this.pattern.complexityLevel} |
          ${this.pattern.notePositions().length} kicks
        </div>
      </div>
      <div class="notation-display">
        <pre>${notation}</pre>
      </div>
    `;
  }

  /**
   * Generate ASCII-style notation for the pattern
   */
  private generateNotation(pattern: Pattern, beatGrid: BeatGrid): string {
    const lines: string[] = [];
    const totalPositions = pattern.steps.length;

    // Get beat positions from BeatGrid (handles compound meters like 6/8)
    const beatPositions = beatGrid.beatPositions();

    // Top line: beat numbers (one number per beat position)
    const beatLine: string[] = [];
    let beatCounter = 1;
    for (let i = 0; i < totalPositions; i++) {
      if (beatPositions.includes(i)) {
        beatLine.push(beatCounter.toString());
        beatCounter++;
      } else {
        beatLine.push(' ');
      }
    }
    lines.push(beatLine.join(' '));

    // Second line: subdivision markers
    const subdivLine: string[] = [];
    for (let i = 0; i < pattern.steps.length; i++) {
      if (beatPositions.includes(i)) {
        subdivLine.push('|'); // Beat marker
      } else {
        subdivLine.push('.'); // Subdivision marker
      }
    }
    lines.push(subdivLine.join(' '));

    // Third line: kick pattern
    const kickLine: string[] = [];
    for (let i = 0; i < pattern.steps.length; i++) {
      if (pattern.steps[i]) {
        kickLine.push('X'); // Kick
      } else {
        kickLine.push('-'); // Rest
      }
    }
    lines.push(kickLine.join(' '));

    // Fourth line: metrical strength visualization
    const strengthLine: string[] = [];
    for (let i = 0; i < pattern.steps.length; i++) {
      const strength = beatGrid.positionStrength(i);
      if (strength >= 1.0) {
        strengthLine.push('█'); // Strongest (downbeat)
      } else if (strength >= 0.7) {
        strengthLine.push('▓'); // Strong
      } else if (strength >= 0.5) {
        strengthLine.push('▒'); // Medium
      } else if (strength >= 0.3) {
        strengthLine.push('░'); // Weak
      } else {
        strengthLine.push('·'); // Weakest
      }
    }
    lines.push(strengthLine.join(' '));

    return lines.join('\n');
  }

  /**
   * Get the container element
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Check if notation is visible
   */
  isShown(): boolean {
    return this.isVisible;
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.element.remove();
  }
}

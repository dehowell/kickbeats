/**
 * Pattern Notation Component
 * Displays rhythmic pattern in graphical notation using SVG
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
    container.style.visibility = 'hidden'; // Hidden by default but space reserved
    // Render placeholder to reserve space
    container.innerHTML = '<div class="notation-empty">Pattern will appear here</div>';
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
    this.element.style.visibility = 'visible';
    this.render();
  }

  /**
   * Hide the notation
   */
  hide(): void {
    this.isVisible = false;
    this.element.style.visibility = 'hidden';
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
    const svg = this.generateSVGNotation(this.pattern, beatGrid);

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
        ${svg}
      </div>
    `;
  }

  /**
   * Generate SVG-based graphical notation for the pattern
   */
  private generateSVGNotation(pattern: Pattern, beatGrid: BeatGrid): string {
    const totalPositions = pattern.steps.length;
    const beatPositions = beatGrid.beatPositions();

    // SVG dimensions
    const cellWidth = 40;
    const cellHeight = 60;
    const padding = 20;
    const width = totalPositions * cellWidth + padding * 2;
    const height = cellHeight + padding * 2;

    // Track measure boundaries for visual grouping
    const stepsPerMeasure = pattern.timeSignature.numerator * pattern.subdivision;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="pattern-svg" xmlns="http://www.w3.org/2000/svg">`;

    // Add measure separators
    svg += '<g class="measure-separators">';
    for (let i = 0; i <= pattern.numMeasures; i++) {
      const x = padding + i * stepsPerMeasure * cellWidth;
      svg += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${padding + cellHeight}"
               stroke="var(--color-border)" stroke-width="2" opacity="0.3"/>`;
    }
    svg += '</g>';

    // Draw each position
    svg += '<g class="positions">';
    let currentBeat = 1;

    for (let i = 0; i < totalPositions; i++) {
      const x = padding + i * cellWidth;
      const y = padding;
      const isBeatPosition = beatPositions.includes(i);
      const isKick = pattern.steps[i];
      const strength = beatGrid.positionStrength(i);

      // Background strength indicator
      const bgOpacity = 0.1 + strength * 0.2;
      svg += `<rect x="${x + 5}" y="${y}" width="${cellWidth - 10}" height="${cellHeight}"
               fill="var(--color-primary)" opacity="${bgOpacity}" rx="4"/>`;

      // Beat number at top (only on beat positions)
      if (isBeatPosition) {
        svg += `<text x="${x + cellWidth / 2}" y="${y + 15}"
                 text-anchor="middle"
                 font-size="12"
                 font-weight="bold"
                 fill="var(--color-text)">${currentBeat}</text>`;
        currentBeat++;
      }

      // Subdivision marker line
      if (isBeatPosition) {
        svg += `<line x1="${x + cellWidth / 2}" y1="${y + 20}"
                 x2="${x + cellWidth / 2}" y2="${y + 30}"
                 stroke="var(--color-text)" stroke-width="3"/>`;
      } else {
        svg += `<line x1="${x + cellWidth / 2}" y1="${y + 23}"
                 x2="${x + cellWidth / 2}" y2="${y + 27}"
                 stroke="var(--color-text-secondary)" stroke-width="2"/>`;
      }

      // Kick indicator (circle)
      if (isKick) {
        const radius = isBeatPosition ? 10 : 8;
        svg += `<circle cx="${x + cellWidth / 2}" cy="${y + 45}" r="${radius}"
                 fill="var(--color-accent)"
                 stroke="var(--color-text)"
                 stroke-width="2"/>`;
      } else {
        // Empty position (small dot)
        svg += `<circle cx="${x + cellWidth / 2}" cy="${y + 45}" r="3"
                 fill="var(--color-text-secondary)"
                 opacity="0.4"/>`;
      }
    }
    svg += '</g>';

    // Add legend
    svg += `<g class="legend" transform="translate(${padding}, ${height - 15})">
              <circle cx="0" cy="-5" r="6" fill="var(--color-accent)" stroke="var(--color-text)" stroke-width="1"/>
              <text x="12" y="0" font-size="11" fill="var(--color-text-secondary)">Kick Drum</text>
            </g>`;

    svg += '</svg>';

    return svg;
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

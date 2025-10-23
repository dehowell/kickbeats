/**
 * Tempo Control Component
 * Slider and input for adjusting playback tempo (40-300 BPM)
 */

import { TEMPO_CONSTRAINTS } from '../../models/types';

export class TempoControl {
  private element: HTMLElement;
  private slider: HTMLInputElement;
  private input: HTMLInputElement;
  private currentTempo: number;

  constructor(container: HTMLElement, initialTempo: number = TEMPO_CONSTRAINTS.DEFAULT) {
    this.currentTempo = this.clampTempo(initialTempo);
    this.element = this.createElement();
    this.slider = this.element.querySelector('.tempo-slider') as HTMLInputElement;
    this.input = this.element.querySelector('.tempo-input') as HTMLInputElement;
    this.setupEventListeners();
    container.appendChild(this.element);
  }

  /**
   * Create tempo control element
   */
  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'tempo-control';
    container.setAttribute('data-testid', 'tempo-control');

    container.innerHTML = `
      <div class="tempo-control__header">
        <label for="tempo-slider" class="tempo-control__label">Tempo</label>
        <div class="tempo-control__value">
          <input
            type="number"
            class="tempo-input"
            value="${this.currentTempo}"
            min="${TEMPO_CONSTRAINTS.MIN}"
            max="${TEMPO_CONSTRAINTS.MAX}"
            aria-label="Tempo in BPM"
          />
          <span class="tempo-control__unit">BPM</span>
        </div>
      </div>
      <input
        type="range"
        id="tempo-slider"
        class="tempo-slider"
        min="${TEMPO_CONSTRAINTS.MIN}"
        max="${TEMPO_CONSTRAINTS.MAX}"
        value="${this.currentTempo}"
        step="1"
        aria-label="Tempo slider"
      />
      <div class="tempo-control__markers">
        <span>${TEMPO_CONSTRAINTS.MIN}</span>
        <span>${TEMPO_CONSTRAINTS.DEFAULT}</span>
        <span>${TEMPO_CONSTRAINTS.MAX}</span>
      </div>
    `;

    return container;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Slider change
    this.slider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.setTempo(value);
      this.dispatchTempoChange(value);
    });

    // Input change
    this.input.addEventListener('change', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.setTempo(value);
      this.dispatchTempoChange(value);
    });

    // Input validation on blur
    this.input.addEventListener('blur', () => {
      this.setTempo(this.currentTempo); // Ensure display is clamped
    });
  }

  /**
   * Set tempo value (with clamping)
   */
  setTempo(tempo: number): void {
    this.currentTempo = this.clampTempo(tempo);
    this.slider.value = this.currentTempo.toString();
    this.input.value = this.currentTempo.toString();
  }

  /**
   * Get current tempo value
   */
  getTempo(): number {
    return this.currentTempo;
  }

  /**
   * Clamp tempo to valid range
   */
  private clampTempo(tempo: number): number {
    return Math.max(
      TEMPO_CONSTRAINTS.MIN,
      Math.min(TEMPO_CONSTRAINTS.MAX, Math.round(tempo))
    );
  }

  /**
   * Increment tempo by amount
   */
  incrementTempo(amount: number): void {
    this.setTempo(this.currentTempo + amount);
    this.dispatchTempoChange(this.currentTempo);
  }

  /**
   * Dispatch tempo change event
   */
  private dispatchTempoChange(tempo: number): void {
    const event = new CustomEvent('tempo-change', {
      bubbles: true,
      detail: { tempo }
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Enable/disable control
   */
  setEnabled(enabled: boolean): void {
    this.slider.disabled = !enabled;
    this.input.disabled = !enabled;
  }

  /**
   * Get container element
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.element.remove();
  }
}

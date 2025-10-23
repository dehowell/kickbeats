/**
 * Time Signature Selector Component
 * Dropdown for selecting different time signatures
 */

import { TimeSignature, TIME_SIGNATURES } from '../../models/types';

export class TimeSignatureSelector {
  private element: HTMLElement;
  private select: HTMLSelectElement;
  private currentTimeSignature: TimeSignature;

  constructor(container: HTMLElement, initialTimeSignature: TimeSignature = TIME_SIGNATURES.fourFour) {
    this.currentTimeSignature = initialTimeSignature;
    this.element = this.createElement();
    this.select = this.element.querySelector('.time-signature-select') as HTMLSelectElement;
    this.setupEventListeners();
    container.appendChild(this.element);
  }

  /**
   * Create time signature selector element
   */
  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'time-signature-selector';
    container.setAttribute('data-testid', 'time-signature-selector');

    // Get current time signature string for initial selection
    const currentSig = `${this.currentTimeSignature.numerator}/${this.currentTimeSignature.denominator}`;

    container.innerHTML = `
      <div class="time-signature-selector__header">
        <label for="time-signature-select" class="time-signature-selector__label">Time Signature</label>
      </div>
      <select
        id="time-signature-select"
        class="time-signature-select"
        aria-label="Select time signature"
      >
        <option value="4/4" ${currentSig === '4/4' ? 'selected' : ''}>4/4 (Common Time)</option>
        <option value="3/4" ${currentSig === '3/4' ? 'selected' : ''}>3/4 (Waltz)</option>
        <option value="6/8" ${currentSig === '6/8' ? 'selected' : ''}>6/8 (Compound Duple)</option>
        <option value="2/4" ${currentSig === '2/4' ? 'selected' : ''}>2/4 (March)</option>
        <option value="5/4" ${currentSig === '5/4' ? 'selected' : ''}>5/4 (Take Five)</option>
      </select>
    `;

    return container;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.select.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      const timeSignature = this.parseTimeSignature(value);
      if (timeSignature) {
        this.setTimeSignature(timeSignature);
        this.dispatchTimeSignatureChange(timeSignature);
      }
    });
  }

  /**
   * Parse time signature string (e.g., "4/4") to TimeSignature object
   */
  private parseTimeSignature(value: string): TimeSignature | null {
    const parts = value.split('/');
    if (parts.length !== 2) return null;

    const numerator = parseInt(parts[0], 10);
    const denominator = parseInt(parts[1], 10);

    if (isNaN(numerator) || isNaN(denominator)) return null;

    return { numerator, denominator };
  }

  /**
   * Set time signature value
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this.currentTimeSignature = timeSignature;
    this.select.value = `${timeSignature.numerator}/${timeSignature.denominator}`;
  }

  /**
   * Get current time signature
   */
  getTimeSignature(): TimeSignature {
    return this.currentTimeSignature;
  }

  /**
   * Dispatch time signature change event
   */
  private dispatchTimeSignatureChange(timeSignature: TimeSignature): void {
    const event = new CustomEvent('time-signature-change', {
      bubbles: true,
      detail: { timeSignature }
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Enable/disable selector
   */
  setEnabled(enabled: boolean): void {
    this.select.disabled = !enabled;
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

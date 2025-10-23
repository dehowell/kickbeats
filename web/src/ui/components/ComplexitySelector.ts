/**
 * Complexity Selector Component
 * Button group for selecting pattern complexity (simple/medium/complex)
 */

import { ComplexityLevel } from '../../models/types';

export class ComplexitySelector {
  private element: HTMLElement;
  private currentComplexity: ComplexityLevel;
  private buttons: Map<ComplexityLevel, HTMLButtonElement>;

  constructor(container: HTMLElement, initialComplexity: ComplexityLevel = 'medium') {
    this.currentComplexity = initialComplexity;
    this.buttons = new Map();
    this.element = this.createElement();
    this.setupEventListeners();
    container.appendChild(this.element);
  }

  /**
   * Create complexity selector element
   */
  private createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'complexity-selector';
    container.setAttribute('data-testid', 'complexity-selector');

    container.innerHTML = `
      <div class="complexity-selector__header">
        <label class="complexity-selector__label">Complexity</label>
      </div>
      <div class="complexity-selector__buttons" role="group" aria-label="Pattern complexity">
        <button
          class="complexity-button ${this.currentComplexity === 'simple' ? 'complexity-button--active' : ''}"
          data-complexity="simple"
          aria-label="Simple complexity (2-4 kicks)"
          aria-pressed="${this.currentComplexity === 'simple'}"
        >
          Simple
          <span class="complexity-button__hint">2-4 kicks</span>
        </button>
        <button
          class="complexity-button ${this.currentComplexity === 'medium' ? 'complexity-button--active' : ''}"
          data-complexity="medium"
          aria-label="Medium complexity (4-6 kicks)"
          aria-pressed="${this.currentComplexity === 'medium'}"
        >
          Medium
          <span class="complexity-button__hint">4-6 kicks</span>
        </button>
        <button
          class="complexity-button ${this.currentComplexity === 'complex' ? 'complexity-button--active' : ''}"
          data-complexity="complex"
          aria-label="Complex complexity (6-8 kicks)"
          aria-pressed="${this.currentComplexity === 'complex'}"
        >
          Complex
          <span class="complexity-button__hint">6-8 kicks</span>
        </button>
      </div>
    `;

    // Store button references
    const buttons = container.querySelectorAll('.complexity-button');
    buttons.forEach((button) => {
      const complexity = (button as HTMLButtonElement).getAttribute('data-complexity') as ComplexityLevel;
      this.buttons.set(complexity, button as HTMLButtonElement);
    });

    return container;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.buttons.forEach((button, complexity) => {
      button.addEventListener('click', () => {
        this.setComplexity(complexity);
        this.dispatchComplexityChange(complexity);
      });
    });
  }

  /**
   * Set complexity level
   */
  setComplexity(complexity: ComplexityLevel): void {
    this.currentComplexity = complexity;
    this.updateButtonStates();
  }

  /**
   * Get current complexity level
   */
  getComplexity(): ComplexityLevel {
    return this.currentComplexity;
  }

  /**
   * Update button active states
   */
  private updateButtonStates(): void {
    this.buttons.forEach((button, complexity) => {
      const isActive = complexity === this.currentComplexity;
      button.classList.toggle('complexity-button--active', isActive);
      button.setAttribute('aria-pressed', isActive.toString());
    });
  }

  /**
   * Dispatch complexity change event
   */
  private dispatchComplexityChange(complexity: ComplexityLevel): void {
    const event = new CustomEvent('complexity-change', {
      bubbles: true,
      detail: { complexity }
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Enable/disable selector
   */
  setEnabled(enabled: boolean): void {
    this.buttons.forEach((button) => {
      button.disabled = !enabled;
    });
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

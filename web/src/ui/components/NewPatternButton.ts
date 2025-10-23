/**
 * New Pattern Button Component
 * Generates a new rhythmic pattern
 */

export class NewPatternButton {
  private element: HTMLButtonElement;

  constructor(container: HTMLElement) {
    this.element = this.createButton();
    container.appendChild(this.element);
  }

  /**
   * Create button element
   */
  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'new-pattern-button';
    button.setAttribute('data-testid', 'new-pattern-button');
    button.setAttribute('aria-label', 'Generate new pattern');
    button.innerHTML = 'New Pattern';

    button.addEventListener('click', () => {
      this.dispatchNewPatternEvent();
    });

    return button;
  }

  /**
   * Dispatch new pattern event
   */
  private dispatchNewPatternEvent(): void {
    const event = new CustomEvent('new-pattern', {
      bubbles: true
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Enable/disable button
   */
  setEnabled(enabled: boolean): void {
    this.element.disabled = !enabled;
  }

  /**
   * Get button element
   */
  getElement(): HTMLButtonElement {
    return this.element;
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.element.remove();
  }
}

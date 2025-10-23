/**
 * Reveal Pattern Button Component
 * Toggles pattern notation visibility
 */

export class RevealButton {
  private element: HTMLButtonElement;
  private isRevealed: boolean;

  constructor(container: HTMLElement) {
    this.isRevealed = false;
    this.element = this.createButton();
    container.appendChild(this.element);
  }

  /**
   * Create button element
   */
  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'reveal-button';
    button.setAttribute('data-testid', 'reveal-button');
    button.setAttribute('aria-label', 'Reveal pattern notation');
    button.innerHTML = 'Reveal Pattern';

    button.addEventListener('click', () => {
      this.dispatchRevealEvent();
    });

    return button;
  }

  /**
   * Update button state
   */
  setRevealed(isRevealed: boolean): void {
    this.isRevealed = isRevealed;
    this.updateButtonContent();
  }

  /**
   * Update button content based on state
   */
  private updateButtonContent(): void {
    if (this.isRevealed) {
      this.element.innerHTML = 'Hide Pattern';
      this.element.setAttribute('aria-label', 'Hide pattern notation');
      this.element.classList.add('reveal-button--revealed');
    } else {
      this.element.innerHTML = 'Reveal Pattern';
      this.element.setAttribute('aria-label', 'Reveal pattern notation');
      this.element.classList.remove('reveal-button--revealed');
    }
  }

  /**
   * Dispatch reveal toggle event
   */
  private dispatchRevealEvent(): void {
    const event = new CustomEvent('reveal-toggle', {
      bubbles: true,
      detail: { shouldReveal: !this.isRevealed }
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

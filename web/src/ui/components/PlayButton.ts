/**
 * Play Button Component
 * Toggle between play and pause states
 */

export class PlayButton {
  private element: HTMLButtonElement;
  private isPlaying: boolean;

  constructor(container: HTMLElement) {
    this.isPlaying = false;
    this.element = this.createButton();
    container.appendChild(this.element);
  }

  /**
   * Create button element
   */
  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'play-button';
    button.setAttribute('data-testid', 'play-button');
    button.setAttribute('aria-label', 'Play pattern');
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('type', 'button');

    // Set initial content directly since this.element isn't assigned yet
    button.innerHTML = '▶️ Play';

    button.addEventListener('click', () => {
      this.dispatchToggleEvent();
    });

    return button;
  }

  /**
   * Update button display
   */
  setPlaying(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    this.updateButtonContent();
  }

  /**
   * Update button content based on state
   */
  private updateButtonContent(): void {
    if (this.isPlaying) {
      this.element.innerHTML = '⏸ Pause';
      this.element.setAttribute('aria-label', 'Pause pattern');
      this.element.setAttribute('aria-pressed', 'true');
      this.element.classList.add('play-button--playing');
    } else {
      this.element.innerHTML = '▶️ Play';
      this.element.setAttribute('aria-label', 'Play pattern');
      this.element.setAttribute('aria-pressed', 'false');
      this.element.classList.remove('play-button--playing');
    }
  }

  /**
   * Dispatch play toggle event
   */
  private dispatchToggleEvent(): void {
    const event = new CustomEvent('play-toggle', {
      bubbles: true,
      detail: { shouldPlay: !this.isPlaying }
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

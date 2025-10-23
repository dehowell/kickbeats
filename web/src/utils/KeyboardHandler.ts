/**
 * Keyboard Handler Utility
 * Manages keyboard shortcuts for the application
 */

export type KeyboardShortcut = ' ' | 'n' | 'r' | 'ArrowUp' | 'ArrowDown';

export type KeyboardCallback = () => void;

export class KeyboardHandler {
  private shortcuts: Map<KeyboardShortcut, KeyboardCallback>;
  private isListening: boolean;

  constructor() {
    this.shortcuts = new Map();
    this.isListening = false;
  }

  /**
   * Register a keyboard shortcut
   */
  register(key: KeyboardShortcut, callback: KeyboardCallback): void {
    this.shortcuts.set(key, callback);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: KeyboardShortcut): void {
    this.shortcuts.delete(key);
  }

  /**
   * Start listening for keyboard events
   */
  start(): void {
    if (this.isListening) return;

    document.addEventListener('keydown', this.handleKeyDown);
    this.isListening = true;
  }

  /**
   * Stop listening for keyboard events
   */
  stop(): void {
    if (!this.isListening) return;

    document.removeEventListener('keydown', this.handleKeyDown);
    this.isListening = false;
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ignore if user is typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const key = event.key as KeyboardShortcut;
    const callback = this.shortcuts.get(key);

    if (callback) {
      event.preventDefault();
      callback();
    }
  };

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.shortcuts.clear();
  }
}

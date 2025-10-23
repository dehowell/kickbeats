/**
 * Visibility Handler Utility
 * Manages browser tab visibility changes for audio playback
 */

export type VisibilityCallback = (isVisible: boolean) => void;

export class VisibilityHandler {
  private callbacks: Set<VisibilityCallback>;
  private isListening: boolean;

  constructor() {
    this.callbacks = new Set();
    this.isListening = false;
  }

  /**
   * Register a callback for visibility changes
   */
  onVisibilityChange(callback: VisibilityCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Start listening for visibility changes
   */
  start(): void {
    if (this.isListening) return;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.isListening = true;
  }

  /**
   * Stop listening for visibility changes
   */
  stop(): void {
    if (!this.isListening) return;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.isListening = false;
  }

  /**
   * Check if page is currently visible
   */
  isVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * Handle visibility change event
   */
  private handleVisibilityChange = (): void => {
    const isVisible = this.isVisible();

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      callback(isVisible);
    });
  };

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.callbacks.clear();
  }
}

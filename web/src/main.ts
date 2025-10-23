/**
 * Application Entry Point
 * Initializes the Kickbeats web application
 */

import { PracticeController } from './ui/controllers/PracticeController';
import { registerSW } from 'virtual:pwa-register';
import { BrowserCompatibility } from './utils/BrowserCompatibility';
import './ui/styles/base.css';
import './ui/styles/layout.css';
import './ui/styles/components.css';
import './ui/styles/notation.css';
import './ui/styles/controls.css';
import './ui/styles/updates.css';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Show update notification when new version available
    const event = new CustomEvent('sw-update-available');
    window.dispatchEvent(event);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  }
});

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('app');

  if (!appContainer) {
    console.error('App container not found');
    return;
  }

  // Check browser compatibility first
  const compatibility = BrowserCompatibility.check();
  const browserInfo = BrowserCompatibility.getBrowserInfo();

  console.log(`Browser: ${browserInfo.name} ${browserInfo.version}`);

  if (!compatibility.isSupported) {
    const errorMessage = BrowserCompatibility.getErrorMessage(compatibility);
    appContainer.innerHTML = `
      <div class="error-message">
        <h2>Browser Not Supported</h2>
        <p>${errorMessage}</p>
        <p>Your browser: ${browserInfo.name} ${browserInfo.version}</p>
      </div>
    `;
    return;
  }

  // Show warnings if any
  if (compatibility.warnings.length > 0) {
    console.warn('Browser compatibility warnings:', compatibility.warnings);
  }

  try {
    // Create and initialize practice controller
    const controller = new PracticeController(appContainer);
    await controller.initialize();

    console.log('Kickbeats initialized successfully');

    // Store controller globally for debugging (remove in production)
    (window as any).__kickbeats__ = controller;
    (window as any).__updateSW__ = updateSW;
  } catch (error) {
    console.error('Failed to initialize Kickbeats:', error);
    appContainer.innerHTML = `
      <div class="error-message">
        <h2>Initialization Error</h2>
        <p>Failed to start Kickbeats. Please refresh the page and try again.</p>
        <p>Error: ${error}</p>
        <details>
          <summary>Technical Details</summary>
          <pre>${error}</pre>
        </details>
      </div>
    `;
  }
});

// Listen for update available event
window.addEventListener('sw-update-available', () => {
  showUpdateNotification();
});

/**
 * Show update notification banner
 */
function showUpdateNotification(): void {
  const existing = document.getElementById('sw-update-notification');
  if (existing) return; // Already showing

  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-notification__content">
      <p>A new version of Kickbeats is available!</p>
      <div class="update-notification__actions">
        <button id="update-btn" class="update-notification__button update-notification__button--primary">
          Update Now
        </button>
        <button id="dismiss-btn" class="update-notification__button update-notification__button--secondary">
          Later
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Handle update button
  const updateBtn = document.getElementById('update-btn');
  updateBtn?.addEventListener('click', () => {
    const updateSW = (window as any).__updateSW__;
    if (updateSW) {
      updateSW(true); // Force update
    }
  });

  // Handle dismiss button
  const dismissBtn = document.getElementById('dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();
  });
}

// Handle unload
window.addEventListener('beforeunload', () => {
  const controller = (window as any).__kickbeats__;
  if (controller) {
    controller.dispose();
  }
});

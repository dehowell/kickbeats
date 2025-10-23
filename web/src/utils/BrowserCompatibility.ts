/**
 * Browser Compatibility Checker
 * Validates browser support for required features
 */

export interface CompatibilityResult {
  isSupported: boolean;
  missingFeatures: string[];
  warnings: string[];
}

export class BrowserCompatibility {
  /**
   * Check if browser supports all required features
   */
  static check(): CompatibilityResult {
    const missingFeatures: string[] = [];
    const warnings: string[] = [];

    // Check Web Audio API
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      missingFeatures.push('Web Audio API');
    }

    // Check IndexedDB
    if (!window.indexedDB) {
      missingFeatures.push('IndexedDB');
    }

    // Check Service Worker
    if (!('serviceWorker' in navigator)) {
      warnings.push('Service Worker (offline functionality will not be available)');
    }

    // Check localStorage
    if (!window.localStorage) {
      warnings.push('LocalStorage');
    }

    // Check Promise support
    if (typeof Promise === 'undefined') {
      missingFeatures.push('Promise');
    }

    // Check ES6 features (the build process requires ES6, so if this code runs, ES6 is supported)
    // No need to explicitly test since TypeScript transpilation handles this

    // Browser-specific checks
    const userAgent = navigator.userAgent.toLowerCase();

    // Detect Safari
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      // Safari has some Web Audio quirks
      warnings.push('Safari detected: Audio may require user interaction to start');
    }

    // Detect Firefox
    if (userAgent.includes('firefox')) {
      // Firefox handles audio context differently
      warnings.push('Firefox detected: Some audio features may behave differently');
    }

    // Detect iOS
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    if (isIOS) {
      warnings.push('iOS detected: Audio requires user interaction and may have limitations');
    }

    // Detect Android
    const isAndroid = userAgent.includes('android');
    if (isAndroid) {
      // Check Android version
      const androidVersion = userAgent.match(/android (\d+)/);
      if (androidVersion && parseInt(androidVersion[1]) < 7) {
        warnings.push('Older Android version detected: Some features may not work optimally');
      }
    }

    return {
      isSupported: missingFeatures.length === 0,
      missingFeatures,
      warnings
    };
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(result: CompatibilityResult): string {
    if (result.isSupported) {
      return '';
    }

    const features = result.missingFeatures.join(', ');
    return `Your browser is missing required features: ${features}. Please use a modern browser like Chrome, Firefox, Safari, or Edge.`;
  }

  /**
   * Check if audio context needs user gesture
   */
  static needsUserGesture(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    // iOS, Safari, and modern Chrome require user gesture
    return (
      /iphone|ipad|ipod/.test(userAgent) ||
      (userAgent.includes('safari') && !userAgent.includes('chrome')) ||
      userAgent.includes('chrome')
    );
  }

  /**
   * Get browser name and version
   */
  static getBrowserInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';

    // Detect browser
    if (userAgent.includes('Firefox/')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.includes('Edg/')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.includes('Chrome/')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.includes('Safari/')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      if (match) version = match[1];
    }

    return { name, version };
  }
}

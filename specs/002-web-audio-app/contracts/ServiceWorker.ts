/**
 * Service Worker Contract
 *
 * Defines message types and caching strategies for PWA offline functionality.
 */

/**
 * Service worker message types
 */
export type ServiceWorkerMessage =
  | SkipWaitingMessage
  | CacheStatusMessage
  | UpdateAvailableMessage
  | ClearCacheMessage;

/**
 * Skip waiting message (activate updated service worker immediately)
 */
export interface SkipWaitingMessage {
  type: 'SKIP_WAITING';
}

/**
 * Cache status request/response
 */
export interface CacheStatusMessage {
  type: 'CACHE_STATUS';
  payload?: {
    cacheNames: string[];
    totalSize: number;
  };
}

/**
 * Update available notification
 */
export interface UpdateAvailableMessage {
  type: 'UPDATE_AVAILABLE';
  payload: {
    version: string;
    timestamp: string;
  };
}

/**
 * Clear cache request
 */
export interface ClearCacheMessage {
  type: 'CLEAR_CACHE';
  payload?: {
    cacheName?: string; // Specific cache or all if undefined
  };
}

/**
 * Service worker lifecycle states
 */
export type ServiceWorkerState =
  | 'installing'
  | 'installed'
  | 'activating'
  | 'activated'
  | 'redundant';

/**
 * Service worker registration status
 */
export interface ServiceWorkerStatus {
  /** Is service worker supported? */
  supported: boolean;

  /** Is service worker registered? */
  registered: boolean;

  /** Current registration */
  registration: ServiceWorkerRegistration | null;

  /** Is update available? */
  updateAvailable: boolean;

  /** Current worker state */
  state: ServiceWorkerState | null;
}

/**
 * Caching strategy types
 */
export type CachingStrategy =
  | 'cache-first' // Try cache, fallback to network
  | 'network-first' // Try network, fallback to cache
  | 'cache-only' // Only use cache
  | 'network-only' // Only use network
  | 'stale-while-revalidate'; // Return cache immediately, update in background

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache name */
  name: string;

  /** Caching strategy */
  strategy: CachingStrategy;

  /** URL patterns to match */
  urlPatterns: RegExp[];

  /** Cache expiration in seconds (optional) */
  maxAge?: number;

  /** Maximum cache entries (optional) */
  maxEntries?: number;
}

/**
 * PWA cache configuration
 */
export const CACHE_CONFIG: CacheConfig[] = [
  {
    name: 'kickbeats-app-shell',
    strategy: 'cache-first',
    urlPatterns: [
      /\.html$/,
      /\.css$/,
      /\.js$/,
      /manifest\.json$/,
      /^\/$/
    ]
  },
  {
    name: 'kickbeats-assets',
    strategy: 'cache-first',
    urlPatterns: [
      /\.png$/,
      /\.jpg$/,
      /\.svg$/,
      /\.ico$/,
      /\.woff2?$/
    ]
  }
];

/**
 * Precache manifest entry
 */
export interface PrecacheEntry {
  /** URL to cache */
  url: string;

  /** Revision/hash for cache busting */
  revision: string;
}

/**
 * Service worker install event handler
 */
export interface InstallHandler {
  /**
   * Handle service worker install event
   * @param event - Install event
   * @param precacheManifest - Assets to precache
   */
  onInstall(event: ExtendableEvent, precacheManifest: PrecacheEntry[]): void;
}

/**
 * Service worker activate event handler
 */
export interface ActivateHandler {
  /**
   * Handle service worker activate event
   * @param event - Activate event
   * @param cacheWhitelist - Cache names to keep
   */
  onActivate(event: ExtendableEvent, cacheWhitelist: string[]): void;
}

/**
 * Service worker fetch event handler
 */
export interface FetchHandler {
  /**
   * Handle service worker fetch event
   * @param event - Fetch event
   * @param cacheConfig - Cache configuration
   */
  onFetch(event: FetchEvent, cacheConfig: CacheConfig[]): void;
}

/**
 * Service worker message handler
 */
export interface MessageHandler {
  /**
   * Handle messages from app
   * @param event - Message event
   */
  onMessage(event: ExtendableMessageEvent): void;
}

/**
 * Service worker update checker
 */
export interface UpdateChecker {
  /**
   * Check for service worker updates
   * @returns Promise resolving to true if update available
   */
  checkForUpdates(): Promise<boolean>;

  /**
   * Apply pending update (skip waiting and reload)
   */
  applyUpdate(): Promise<void>;

  /**
   * Subscribe to update notifications
   * @param callback - Called when update is available
   */
  onUpdateAvailable(callback: (version: string) => void): () => void;
}

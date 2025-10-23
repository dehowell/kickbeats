/**
 * Session Storage Contract
 *
 * Defines the interface for IndexedDB persistence layer.
 * Provides offline storage for sessions, settings, and patterns.
 */

import { PracticeSession, AppSettings, Pattern } from './types';

/**
 * Session storage interface
 */
export interface ISessionStorage {
  /**
   * Initialize IndexedDB connection
   * @returns Promise that resolves when database is ready
   * @throws Error if IndexedDB is not supported
   */
  initialize(): Promise<void>;

  /**
   * Save practice session
   * @param session - Session to save
   */
  saveSession(session: PracticeSession): Promise<void>;

  /**
   * Get session by ID
   * @param sessionId - Session identifier
   * @returns Session or null if not found
   */
  getSession(sessionId: string): Promise<PracticeSession | null>;

  /**
   * Get most recent session
   * @returns Most recent session or null if none exist
   */
  getLatestSession(): Promise<PracticeSession | null>;

  /**
   * Get all sessions sorted by start time (newest first)
   * @param limit - Maximum number to return (default: 100)
   */
  getAllSessions(limit?: number): Promise<PracticeSession[]>;

  /**
   * Delete session by ID
   * @param sessionId - Session identifier
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Delete sessions older than specified date
   * @param olderThan - Delete sessions before this date
   */
  deleteOldSessions(olderThan: Date): Promise<number>;

  /**
   * Save user settings
   * @param settings - Settings to save
   */
  saveSettings(settings: AppSettings): Promise<void>;

  /**
   * Get user settings
   * @returns Settings or default settings if none saved
   */
  getSettings(): Promise<AppSettings>;

  /**
   * Save pattern (optional feature for analytics)
   * @param pattern - Pattern to save
   */
  savePattern(pattern: Pattern): Promise<void>;

  /**
   * Get patterns by session ID
   * @param sessionId - Session identifier
   */
  getPatternsBySession(sessionId: string): Promise<Pattern[]>;

  /**
   * Clear all data (for reset/debugging)
   */
  clearAll(): Promise<void>;

  /**
   * Check storage quota
   * @returns Estimated storage usage
   */
  getStorageEstimate(): Promise<StorageEstimate>;
}

/**
 * Storage estimate
 */
export interface StorageEstimate {
  /** Storage quota in bytes */
  quota: number;

  /** Storage usage in bytes */
  usage: number;

  /** Usage percentage (0-100) */
  usagePercent: number;

  /** Is storage nearly full? (>80% used) */
  isNearlyFull: boolean;
}

/**
 * IndexedDB schema version
 */
export const DB_VERSION = 1;

/**
 * Database name
 */
export const DB_NAME = 'kickbeats-pwa';

/**
 * Object store names
 */
export const STORES = {
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  PATTERNS: 'patterns'
} as const;

/**
 * Index names
 */
export const INDEXES = {
  SESSIONS: {
    SESSION_START: 'sessionStart',
    LAST_ACTIVITY: 'lastActivity'
  },
  PATTERNS: {
    SESSION_ID: 'sessionId',
    COMPLEXITY_LEVEL: 'complexityLevel'
  }
} as const;

/**
 * Database initialization schema
 */
export interface DatabaseSchema {
  version: number;
  stores: StoreSchema[];
}

/**
 * Object store schema
 */
export interface StoreSchema {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: IndexSchema[];
}

/**
 * Index schema
 */
export interface IndexSchema {
  name: string;
  keyPath: string;
  unique?: boolean;
}

/**
 * Get database schema definition
 */
export function getDatabaseSchema(): DatabaseSchema {
  return {
    version: DB_VERSION,
    stores: [
      {
        name: STORES.SESSIONS,
        keyPath: 'sessionId',
        indexes: [
          { name: INDEXES.SESSIONS.SESSION_START, keyPath: 'sessionStart' },
          { name: INDEXES.SESSIONS.LAST_ACTIVITY, keyPath: 'lastActivity' }
        ]
      },
      {
        name: STORES.SETTINGS,
        keyPath: 'id' // Singleton with id = 'user-settings'
      },
      {
        name: STORES.PATTERNS,
        keyPath: 'id',
        indexes: [
          { name: INDEXES.PATTERNS.SESSION_ID, keyPath: 'sessionId' },
          {
            name: INDEXES.PATTERNS.COMPLEXITY_LEVEL,
            keyPath: 'complexityLevel'
          }
        ]
      }
    ]
  };
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage error codes
 */
export type StorageErrorCode =
  | 'NOT_SUPPORTED' // IndexedDB not supported
  | 'INITIALIZATION_FAILED' // Database initialization failed
  | 'QUOTA_EXCEEDED' // Storage quota exceeded
  | 'TRANSACTION_FAILED' // Transaction error
  | 'NOT_FOUND' // Record not found
  | 'INVALID_DATA'; // Data validation failed

/**
 * Default app settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  defaultTempo: 120,
  defaultComplexity: 'medium',
  defaultTimeSignature: { numerator: 4, denominator: 4 },
  autoRevealAfterLoops: 0,
  clickVolume: 0.5,
  kickVolume: 0.7
};

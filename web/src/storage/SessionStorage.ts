/**
 * IndexedDB Storage Wrapper
 * Persistent storage for sessions and settings
 */

import { PracticeSession, AppSettings, DEFAULT_APP_SETTINGS } from '../models/types';

const DB_NAME = 'kickbeats-db';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const SETTINGS_STORE = 'settings';
const SETTINGS_KEY = 'app-settings';

export class SessionStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private fallbackMode: boolean = false; // Use in-memory storage if IndexedDB fails

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB is not supported - using fallback mode (sessions will not persist)');
        this.fallbackMode = true;
        resolve();
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn(`Failed to open IndexedDB: ${request.error} - using fallback mode`);
        this.fallbackMode = true;
        resolve(); // Don't reject, just use fallback mode
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.fallbackMode = false;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        try {
          // Create sessions store
          if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
            const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
              keyPath: 'sessionId'
            });
            sessionsStore.createIndex('lastActivity', 'lastActivity', { unique: false });
          }

          // Create settings store
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE);
          }
        } catch (error) {
          console.warn('Failed to create IndexedDB stores:', error);
          this.fallbackMode = true;
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save a practice session
   */
  async saveSession(session: PracticeSession): Promise<void> {
    await this.ensureInitialized();

    if (this.fallbackMode) {
      // In fallback mode, just resolve without saving
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
        const store = transaction.objectStore(SESSIONS_STORE);
        const request = store.put(session);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn(`Failed to save session: ${request.error}`);
          resolve(); // Resolve anyway to not break the app
        };
      } catch (error) {
        console.warn('Failed to save session:', error);
        resolve(); // Resolve anyway
      }
    });
  }

  /**
   * Load a specific session by ID
   */
  async loadSession(sessionId: string): Promise<PracticeSession | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to load session: ${request.error}`));
    });
  }

  /**
   * Load the most recent session
   */
  async loadMostRecentSession(): Promise<PracticeSession | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('lastActivity');
      const request = index.openCursor(null, 'prev'); // Get most recent

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value as PracticeSession);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(new Error(`Failed to load recent session: ${request.error}`));
    });
  }

  /**
   * List all sessions, sorted by last activity (most recent first)
   */
  async listSessions(limit: number = 10): Promise<PracticeSession[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const index = store.index('lastActivity');
      const request = index.openCursor(null, 'prev');
      const sessions: PracticeSession[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && sessions.length < limit) {
          sessions.push(cursor.value as PracticeSession);
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };

      request.onerror = () => reject(new Error(`Failed to list sessions: ${request.error}`));
    });
  }

  /**
   * Delete a session by ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.delete(sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete session: ${request.error}`));
    });
  }

  /**
   * Clear old sessions (keep only the N most recent)
   */
  async clearOldSessions(keepCount: number = 20): Promise<void> {
    await this.ensureInitialized();

    const sessions = await this.listSessions(1000); // Get all
    const toDelete = sessions.slice(keepCount);

    for (const session of toDelete) {
      await this.deleteSession(session.sessionId);
    }
  }

  /**
   * Save application settings
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put(settings, SETTINGS_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save settings: ${request.error}`));
    });
  }

  /**
   * Load application settings (returns defaults if none saved)
   */
  async loadSettings(): Promise<AppSettings> {
    await this.ensureInitialized();

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(SETTINGS_KEY);

      request.onsuccess = () => {
        const settings = request.result as AppSettings | undefined;
        resolve(settings || { ...DEFAULT_APP_SETTINGS });
      };

      request.onerror = () => {
        // On error, return defaults
        console.warn('Failed to load settings, using defaults:', request.error);
        resolve({ ...DEFAULT_APP_SETTINGS });
      };
    });
  }

  /**
   * Clear all data (for testing/debugging)
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE, SETTINGS_STORE], 'readwrite');

      // Clear both stores
      transaction.objectStore(SESSIONS_STORE).clear();
      transaction.objectStore(SETTINGS_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error(`Failed to clear data: ${transaction.error}`));
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }
}

// Singleton instance for convenience
let instance: SessionStorage | null = null;

export function getSessionStorage(): SessionStorage {
  if (!instance) {
    instance = new SessionStorage();
  }
  return instance;
}

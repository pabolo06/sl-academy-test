/**
 * SL Academy Platform - Offline Database (IndexedDB)
 * Uses the `idb` library for type-safe IndexedDB access.
 *
 * Stores:
 *   - scheduleCache: cached schedule data per weekStart key
 *   - outbox: queued mutations for offline sync
 *
 * SSR Guard: all functions check `typeof window !== 'undefined'` before
 * accessing IndexedDB, so Next.js SSR/SSG will never break.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ── Schema ────────────────────────────────────────────────────────────────────

interface OutboxEntry {
    id?: number;            // auto-incremented
    url: string;            // API endpoint
    method: string;         // HTTP method
    body: string | null;    // JSON stringified body
    headers: Record<string, string>;
    createdAt: string;      // ISO timestamp
    retries: number;        // number of failed retry attempts
}

interface SLAcademyDB extends DBSchema {
    scheduleCache: {
        key: string;          // weekStart date string (e.g. "2025-03-24")
        value: {
            weekStart: string;
            data: any;          // Schedule object from API
            cachedAt: string;   // ISO timestamp
        };
    };
    outbox: {
        key: number;
        value: OutboxEntry;
        indexes: { 'by-created': string };
    };
}

// ── Database Instance ─────────────────────────────────────────────────────────

const DB_NAME = 'sl-academy-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SLAcademyDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SLAcademyDB>> | null {
    if (typeof window === 'undefined') return null;

    if (!dbPromise) {
        dbPromise = openDB<SLAcademyDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Schedule cache store
                if (!db.objectStoreNames.contains('scheduleCache')) {
                    db.createObjectStore('scheduleCache', { keyPath: 'weekStart' });
                }

                // Outbox store for offline mutations
                if (!db.objectStoreNames.contains('outbox')) {
                    const outboxStore = db.createObjectStore('outbox', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    outboxStore.createIndex('by-created', 'createdAt');
                }
            },
        });
    }

    return dbPromise;
}

// ── Schedule Cache API ────────────────────────────────────────────────────────

/**
 * Cache a schedule response from the API.
 */
export async function cacheSchedule(weekStart: string, data: any): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.put('scheduleCache', {
        weekStart,
        data,
        cachedAt: new Date().toISOString(),
    });
}

/**
 * Retrieve a cached schedule, optionally checking max age.
 * @param weekStart - The week start date string
 * @param maxAgeMs - Maximum cache age in milliseconds (default: 1 hour)
 * @returns The cached schedule data, or null if not found/expired
 */
export async function getCachedSchedule(
    weekStart: string,
    maxAgeMs: number = 3600_000
): Promise<any | null> {
    const db = await getDb();
    if (!db) return null;

    const entry = await db.get('scheduleCache', weekStart);
    if (!entry) return null;

    // Check expiry
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > maxAgeMs) {
        await db.delete('scheduleCache', weekStart);
        return null;
    }

    return entry.data;
}

/**
 * Clear all cached schedules.
 */
export async function clearScheduleCache(): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.clear('scheduleCache');
}

// ── Outbox API (Offline Mutations) ────────────────────────────────────────────

/**
 * Queue a mutation for later sync when online.
 */
export async function addToOutbox(
    url: string,
    method: string,
    body: any | null,
    headers: Record<string, string> = {}
): Promise<number | undefined> {
    const db = await getDb();
    if (!db) return undefined;

    return db.add('outbox', {
        url,
        method,
        body: body ? JSON.stringify(body) : null,
        headers,
        createdAt: new Date().toISOString(),
        retries: 0,
    });
}

/**
 * Get all pending outbox entries, ordered by creation time.
 */
export async function getOutboxEntries(): Promise<OutboxEntry[]> {
    const db = await getDb();
    if (!db) return [];

    return db.getAllFromIndex('outbox', 'by-created');
}

/**
 * Remove a successfully synced entry from the outbox.
 */
export async function removeFromOutbox(id: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.delete('outbox', id);
}

/**
 * Increment the retry counter for a failed entry.
 */
export async function incrementRetry(id: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const entry = await db.get('outbox', id);
    if (entry) {
        entry.retries += 1;
        await db.put('outbox', entry);
    }
}

/**
 * Get count of pending outbox entries.
 */
export async function getOutboxCount(): Promise<number> {
    const db = await getDb();
    if (!db) return 0;
    return db.count('outbox');
}

/**
 * Attempt to sync all outbox entries.
 * Returns the number of successfully synced entries.
 */
export async function syncOutbox(): Promise<{
    synced: number;
    failed: number;
    remaining: number;
}> {
    const entries = await getOutboxEntries();
    let synced = 0;
    let failed = 0;
    const MAX_RETRIES = 5;

    for (const entry of entries) {
        if (entry.retries >= MAX_RETRIES) {
            // Give up on this entry after too many retries
            if (entry.id) await removeFromOutbox(entry.id);
            failed += 1;
            continue;
        }

        try {
            const response = await fetch(entry.url, {
                method: entry.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...entry.headers,
                },
                body: entry.body,
                credentials: 'include',
            });

            if (response.ok) {
                if (entry.id) await removeFromOutbox(entry.id);
                synced += 1;
            } else if (response.status >= 400 && response.status < 500) {
                // Client error — don't retry
                if (entry.id) await removeFromOutbox(entry.id);
                failed += 1;
            } else {
                // Server error — retry later
                if (entry.id) await incrementRetry(entry.id);
                failed += 1;
            }
        } catch {
            // Network error — increment retry and continue
            if (entry.id) await incrementRetry(entry.id);
            failed += 1;
        }
    }

    const remaining = await getOutboxCount();
    return { synced, failed, remaining };
}

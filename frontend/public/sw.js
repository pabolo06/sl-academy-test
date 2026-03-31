/**
 * SL Academy Platform - Service Worker
 * Handles offline caching, outbox sync, and PWA functionality.
 *
 * Strategy:
 *   - Static assets: cache-first, network fallback
 *   - API GET requests: network-first, IndexedDB/cache fallback
 *   - API mutations: if offline, queued to IndexedDB outbox by the app layer
 *   - Background sync: flushes outbox when connectivity returns
 */

const CACHE_NAME = 'sl-academy-v2';
const STATIC_CACHE = 'sl-academy-static-v2';
const DYNAMIC_CACHE = 'sl-academy-dynamic-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/tracks',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Clone response before caching
            const responseClone = response.clone();

            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          })
          .catch(() => {
            // Return cached version if available
            return caches.match(request);
          })
      );
    }
    // Non-GET API requests are handled by the app layer (outbox)
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseClone = response.clone();

        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// ── Background Sync ──────────────────────────────────────────────────────────
// When connectivity returns, flush the outbox.

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-outbox') {
    event.waitUntil(syncOutbox());
  }
});

/**
 * Flush outbox entries from IndexedDB.
 * Opens the sl-academy-offline database directly (no idb library in SW).
 */
async function syncOutbox() {
  console.log('[SW] Syncing outbox...');

  try {
    const db = await openOutboxDB();
    const tx = db.transaction('outbox', 'readwrite');
    const store = tx.objectStore('outbox');
    const index = store.index('by-created');

    // Get all entries via cursor
    const entries = [];
    let cursor = await promisifyRequest(index.openCursor());
    while (cursor) {
      entries.push({ ...cursor.value, id: cursor.primaryKey });
      cursor = await promisifyRequest(cursor.continue());
    }

    let synced = 0;
    const MAX_RETRIES = 5;

    for (const entry of entries) {
      if (entry.retries >= MAX_RETRIES) {
        // Remove entries that exceeded max retries
        const delTx = db.transaction('outbox', 'readwrite');
        delTx.objectStore('outbox').delete(entry.id);
        await promisifyTransaction(delTx);
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
          // Success — remove from outbox
          const delTx = db.transaction('outbox', 'readwrite');
          delTx.objectStore('outbox').delete(entry.id);
          await promisifyTransaction(delTx);
          synced++;
        } else if (response.status >= 400 && response.status < 500) {
          // Client error — don't retry, remove
          const delTx = db.transaction('outbox', 'readwrite');
          delTx.objectStore('outbox').delete(entry.id);
          await promisifyTransaction(delTx);
        } else {
          // Server error — increment retries
          await incrementRetryInDB(db, entry.id, entry.retries);
        }
      } catch (err) {
        // Network still down — increment retry
        await incrementRetryInDB(db, entry.id, entry.retries);
      }
    }

    db.close();
    console.log(`[SW] Outbox sync complete: ${synced}/${entries.length} synced`);

    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'OUTBOX_SYNC_COMPLETE',
        synced,
        total: entries.length,
      });
    }
  } catch (err) {
    console.error('[SW] Outbox sync error:', err);
  }
}

// ── IndexedDB helpers (raw API, no idb library in SW) ─────────────────────────

function openOutboxDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sl-academy-offline', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('scheduleCache')) {
        db.createObjectStore('scheduleCache', { keyPath: 'weekStart' });
      }
      if (!db.objectStoreNames.contains('outbox')) {
        const store = db.createObjectStore('outbox', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-created', 'createdAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    if (!request) { resolve(null); return; }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisifyTransaction(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function incrementRetryInDB(db, id, currentRetries) {
  const tx = db.transaction('outbox', 'readwrite');
  const store = tx.objectStore('outbox');
  const entry = await promisifyRequest(store.get(id));
  if (entry) {
    entry.retries = currentRetries + 1;
    store.put(entry);
  }
  await promisifyTransaction(tx);
}

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SL Academy';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.url || '/',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

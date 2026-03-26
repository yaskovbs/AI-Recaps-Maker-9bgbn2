// Service Worker for AI Recaps Maker - Push Notifications & PWA
// Supports both mobile and desktop browsers

const APP_NAME = 'AI Recaps Maker';
const CACHE_NAME = 'ai-recaps-v1';
const RUNTIME_CACHE = 'ai-recaps-runtime-v1';

const PRECACHE_URLS = [
  '/',
  '/home',
  '/index.html',
  '/favicon.ico',
  '/logo-icon.png',
  '/android-chrome-192x192.png',
];

// Handle push events (from server-sent push notifications)
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || APP_NAME;
  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    dir: 'rtl',
    lang: 'he',
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click - open or focus the app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle service worker activation - clean old caches
self.addEventListener('activate', function(event) {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => self.clients.claim());
    })
  );
});

// Handle install - pre-cache essential resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((error) => {
        console.warn('Pre-caching failed for some URLs:', error);
      });
    })
  );
  self.skipWaiting();
});

// Listen for messages from the main app (for local notifications)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || event.data;
    self.registration.showNotification(title || APP_NAME, {
      body: options?.body || '',
      icon: options?.icon || '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: options?.tag || 'local',
      data: options?.data || { url: '/' },
      dir: 'rtl',
      lang: 'he',
      requireInteraction: options?.requireInteraction || false,
      vibrate: [200, 100, 200],
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle fetch events - network first, fallback to cache
self.addEventListener('fetch', function(event) {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-api-keys') {
    event.waitUntil(syncApiKeys());
  }
  if (event.tag === 'sync-preferences') {
    event.waitUntil(syncPreferences());
  }
});

async function syncApiKeys() {
  try {
    const cache = await caches.open('api-keys-pending');
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();

      await fetch(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      await cache.delete(request);
    }
  } catch (error) {
    console.error('Background sync failed for API keys:', error);
  }
}

async function syncPreferences() {
  try {
    const cache = await caches.open('preferences-pending');
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();

      await fetch(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      await cache.delete(request);
    }
  } catch (error) {
    console.error('Background sync failed for preferences:', error);
  }
}

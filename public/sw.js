// Service Worker for AI Recaps Maker
// Handles: COI headers (SharedArrayBuffer/FFmpeg), PWA caching, Push Notifications

const APP_NAME = 'AI Recaps Maker';
const CACHE_NAME = 'ai-recaps-v3';
const RUNTIME_CACHE = 'ai-recaps-runtime-v3';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo-icon.png',
  '/android-chrome-192x192.png',
];

// ─────────────────────────────────────────────────────────────────────────────
// COI SERVICE WORKER  (Cross-Origin Isolation for SharedArrayBuffer / FFmpeg)
//
//  • Adds  Cross-Origin-Opener-Policy: same-origin
//          Cross-Origin-Embedder-Policy: require-corp
//    to the main HTML document (so SharedArrayBuffer is available for FFmpeg).
//
//  • Adds  Cross-Origin-Resource-Policy: cross-origin
//    to every cross-origin response so that COEP doesn't block them
//    (this is what allows Supabase Storage uploads to succeed).
// ─────────────────────────────────────────────────────────────────────────────

function addCoiHeaders(response, request) {
  // Only modify responses we can actually read
  if (!response || response.type === 'opaque' || response.type === 'error') {
    return response;
  }

  const newHeaders = new Headers(response.headers);
  const isSameOrigin = new URL(request.url).origin === self.location.origin;

  if (isSameOrigin) {
    // For same-origin HTML pages — enable Cross-Origin Isolation
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('text/html')) {
      newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
      newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    }
  } else {
    // For cross-origin resources (Supabase, CDN, etc.) — opt them into CORP
    // so COEP doesn't block them
    if (!newHeaders.has('Cross-Origin-Resource-Policy')) {
      newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL — pre-cache essential resources
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      })
    )
  );
  self.skipWaiting();
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE — clean old caches
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (!currentCaches.includes(name)) return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH — add COI headers to every response
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) and chrome-extension requests
  if (!url.protocol.startsWith('http')) return;

  // Skip POST / PUT / DELETE (uploads) — pass through completely unmodified
  // Do NOT wrap these responses — wrapping causes 503 on large file uploads
  if (request.method !== 'GET') {
    return; // Let the browser handle it natively
  }

  // For same-origin GET requests — network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const modified = addCoiHeaders(response.clone(), request);
          if (response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, modified.clone()));
          }
          return modified;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') return caches.match('/index.html');
            return new Response('Offline', { status: 503 });
          })
        )
    );
    return;
  }

  // For cross-origin GET requests (CDN fonts, etc.) — add CORP header
  event.respondWith(
    fetch(request)
      .then((response) => addCoiHeaders(response, request))
      .catch(() => new Response('Cross-origin fetch failed', { status: 503 }))
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() || '' }; }

  event.waitUntil(
    self.registration.showNotification(data.title || APP_NAME, {
      body: data.body || '',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: data.tag || 'default',
      data: { url: data.url || '/' },
      dir: 'rtl',
      lang: 'he',
      requireInteraction: data.requireInteraction || false,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (targetUrl !== '/') client.navigate(targetUrl);
          return;
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
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
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

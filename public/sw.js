// Service Worker for AI Recaps Maker - Push Notifications
// Supports both mobile and desktop browsers

const APP_NAME = 'AI Recaps Maker';

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

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Handle install
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Listen for messages from the main app (for local notifications)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url, requireInteraction } = event.data;
    self.registration.showNotification(title || APP_NAME, {
      body: body || '',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: tag || 'local',
      data: { url: url || '/' },
      dir: 'rtl',
      lang: 'he',
      requireInteraction: requireInteraction || false,
      vibrate: [200, 100, 200],
    });
  }
});

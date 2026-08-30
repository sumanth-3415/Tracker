// TrackMate Service Worker - Offline Cache & Background Support
const CACHE_NAME = 'trackmate-v1.5.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon.svg',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/dashboard.css',
  './css/avatar.css',
  './css/gamification.css',
  './css/focus-room.css',
  './css/trackers.css',
  './css/tasks.css',
  './css/habits.css',
  './css/calendar.css',
  './css/analytics.css',
  './css/reports.css',
  './css/settings.css',
  './js/config.js',
  './js/db.js',
  './js/sync.js',
  './js/parser.js',
  './js/streak-engine.js',
  './js/recurring.js',
  './js/state.js',
  './js/notifications.js',
  './js/reports-engine.js',
  './js/charts.js',
  './js/avatar-simulator.js',
  './js/gamification.js',
  './js/focus-room.js',
  './js/views/dashboard-view.js',
  './js/views/trackers-view.js',
  './js/views/tasks-view.js',
  './js/views/habits-view.js',
  './js/views/calendar-view.js',
  './js/views/goals-view.js',
  './js/views/analytics-view.js',
  './js/views/reports-view.js',
  './js/views/shared-view.js',
  './js/views/settings-view.js',
  './js/router.js',
  './js/app.js'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core app shell');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[ServiceWorker] Pre-caching warning for some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate & Cache First for Local Assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Offline
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

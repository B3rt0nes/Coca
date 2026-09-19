const CACHE_NAME = 'coca-app-v5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/board.css',
  './css/consensus.css',
  './css/responsive.css',
  './js/app.js',
  './js/auth.js',
  './js/db.js',
  './js/board.js',
  './js/deck.js',
  './js/dragdrop.js',
  './js/ui.js',
  './js/validation.js',
  './js/consensus.js',
  './js/firebase-config.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo per le richieste GET dello stesso dominio o asset statici noti
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // Ignora gli errori di fetch (es. offline) e restituisci la cache se c'è
      });

      // Stale-while-revalidate: ritorna subito la cache, ma aggiornala in background
      return cachedResponse || fetchPromise;
    })
  );
});

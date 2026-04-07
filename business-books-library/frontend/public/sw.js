const CACHE_NAME = 'bbl-cache-v1';

// Recursos esenciales a cachear (HTML, CSS, JS basico)
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json'
];

// Instalación del Service Worker y precaching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Cache First Strategy for assets
self.addEventListener('fetch', event => {
    // Si la petición es del API de libros (nuestro backend)
    // usaremos Network First par obtener datos actualizados, con fallback a cache.
    if (event.request.url.includes('/api/books')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone the response and save it
                    const clone = response.clone();
                    caches.open('bbl-api-cache').then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache First Strategy (Stale While Revalidate) para estáticos
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    const networkFetch = fetch(event.request).then(response => {
                        // Update cache with new response
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            // Don't cache browser-sync or extension things if they slip in
                            if (event.request.url.startsWith('http') && event.request.method === 'GET') {
                                cache.put(event.request, responseClone);
                            }
                        });
                        return response;
                    }).catch(() => {
                        // Ignore errors if offline
                    });

                    // Return cached immediately if available, otherwise wait for network
                    return cachedResponse || networkFetch;
                })
        );
    }
});

// Limpieza de caches antiguos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME, 'bbl-api-cache'];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

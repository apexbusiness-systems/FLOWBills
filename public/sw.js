const CACHE_NAME = 'flowbills-v11';
const STATIC_ASSETS = [
  '/favicon.png',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Service Worker - SKIP WAITING IMMEDIATELY
self.addEventListener('install', (event) => {
  console.log('FlowBills Service Worker installing - skipping waiting...');
  // Skip waiting immediately to activate as soon as possible
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
        // Don't fail installation if caching fails
      })
  );
});

// Activate Service Worker - delete only old FlowBills cache versions
self.addEventListener('activate', (event) => {
  console.log('FlowBills Service Worker activating - clearing stale FlowBills caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames
        .filter((cacheName) => cacheName.startsWith('flowbills-') && cacheName !== CACHE_NAME)
        .map((cacheName) => {
          console.log('Deleting stale cache:', cacheName);
          return caches.delete(cacheName);
        }));
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch Event - Refined Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Bypass Vite dev/HMR and source files
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@id') || url.pathname.startsWith('/src/')) {
    return;
  }

  // 1. Navigation (HTML) - Network First
  // Always try to fetch the latest index.html to ensure we get new asset references
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If network success, clone and cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // If network fails (offline), return cached version
          return caches.match(request);
        })
    );
    return;
  }

  // 2. Hashed Assets (JS/CSS/Images with hash) - Cache First (Immutable)
  // Vite generates assets with hashes like assets/index-1234.js
  // These are safe to cache aggressively because the filename changes if content changes
  if (url.pathname.startsWith('/assets/') && /-[a-zA-Z0-9]{8,}\./.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cache only valid responses
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. Static Assets (Icons, Manifest) - Stale While Revalidate
  // Serve from cache immediately, but update cache in background
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Everything Else (API, etc) - Network Only
  // Do not cache API responses or dynamic content by default
  // Just let the browser handle it naturally (fetch)
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

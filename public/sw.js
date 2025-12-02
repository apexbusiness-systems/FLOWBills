const CACHE_NAME = 'flowbills-v9'; // Fixed SW conflicts - network-only for critical assets
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.png'
  // Note: Vite JS/CSS bundles have hashed names and are cached dynamically
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
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
        // Don't fail installation if caching fails
      })
  );
});

// Fetch Event - NETWORK ONLY for critical assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Bypass Vite dev/HMR and source files
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@id') || url.pathname.startsWith('/src/')) {
    return;
  }

  // NETWORK ONLY for HTML - never cache index.html to avoid stale app
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request));
    return;
  }

  // NETWORK ONLY for JavaScript bundles - never cache app code
  if (request.destination === 'script') {
    event.respondWith(fetch(request));
    return;
  }

  // NETWORK ONLY for CSS bundles - never cache styles
  if (request.destination === 'style') {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for images and static assets (with cache fallback)
  if (request.destination === 'image' || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default: network-first for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Activate Service Worker - Delete ALL old caches for clean state
self.addEventListener('activate', (event) => {
  console.log('FlowBills Service Worker activating - clearing all old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL caches (including old versions)
      return Promise.all(cacheNames.map((cacheName) => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      }));
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
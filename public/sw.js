const CACHE_NAME = 'flowbills-v5'; // Aggressive cache clearing
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

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass Vite dev/HMR and source files
  if (url.pathname.startsWith('/@vite') || url.pathname.startsWith('/@id') || url.pathname.startsWith('/src/')) {
    return;
  }

  // Network-first for images and static icons/assets
  if (request.destination === 'image' || url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
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

  // Default: cache-first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        })
      );
    })
  );
});

// Activate Service Worker - AGGRESSIVE TAKEOVER
self.addEventListener('activate', (event) => {
  console.log('FlowBills Service Worker activating - taking over immediately...');
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
      // Force reload all open pages
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          console.log('Navigating client to force refresh:', client.url);
          client.navigate(client.url);
        });
      })
    ])
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
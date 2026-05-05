// sw.js - No Cache Version
const CACHE_NAME = 'tunisia-brain-v6'; // Update version to clear old caches

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName); // Delete ALL caches
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch from network, never use cache
  event.respondWith(fetch(event.request));
});

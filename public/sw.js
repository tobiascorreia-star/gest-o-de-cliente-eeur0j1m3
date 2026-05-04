const CACHE_NAME = 'gestao-cliente-v2'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Bypass cache for all PocketBase API requests to ensure PWA session synchronization
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/backend/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Network-first strategy for everything else
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})

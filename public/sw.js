const CACHE_NAME = 'gestao-cliente-v3'

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

  // Network-first strategy: try network, cache response, fallback to cache on error
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})

const CACHE_NAME = 'gestao-cliente-v4'

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

  // Force network-first check for the main document and JS files to always get the latest build
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          }
          return response
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request)
          if (cachedResponse) return cachedResponse
          return new Response('Network error', { status: 503, statusText: 'Service Unavailable' })
        }),
    )
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
      .catch(async () => {
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) return cachedResponse
        return new Response('Network error', { status: 503, statusText: 'Service Unavailable' })
      }),
  )
})

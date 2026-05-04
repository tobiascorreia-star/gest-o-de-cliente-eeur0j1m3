const CACHE_NAME = 'gestao-clientes-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // PWA installability requires a fetch handler
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
    }),
  )
})

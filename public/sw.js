// Service Worker para la PWA de Recursos FECHITAT
const CACHE_NAME = 'fechitat-recursos-v2';

const PRECACHE_ASSETS = [
  '/recursos',
  '/recursos/formacion/programa-examen',
  '/recursos/formacion/teoria',
  '/recursos/formacion/terminologia',
  '/recursos/formacion/temporizador',
  '/recursos/documentos-oficiales',
  '/documentos/programa-examen-fechitat.pdf',
  '/documentos/teoria-examen-fechitat.pdf',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/images/general/fechitat-logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        // En desarrollo o SSR algunos assets pueden fallar individualmente
        console.warn('Advertencia precacheando assets:', error);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo gestionar solicitudes del mismo origen
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Navegación HTML (páginas): Network first con fallback a caché (ideal para offline en el dojang/examen)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          // Si la página específica no está en caché, intentar servir la portada de recursos
          if (url.pathname.startsWith('/recursos')) {
            const fallback = await caches.match('/recursos');
            if (fallback) return fallback;
          }
          return new Response('Sin conexión: Abre un recurso guardado previamente.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Archivos estáticos (_astro, fuentes, imágenes, CSS, JS): Cache first con actualización en segundo plano
  const isStatic =
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/screenshots/') ||
    url.pathname.startsWith('/documentos/') ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidar en background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Offline */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Resto de solicitudes: Network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

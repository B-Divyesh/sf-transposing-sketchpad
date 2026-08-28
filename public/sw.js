const VERSION = 'ts-v3';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/assets/pitch-landscape.avif', '/assets/pitch-landscape.webp', '/assets/pitch-landscape.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then(async (cache) => {
    await cache.addAll(PRECACHE);
    const index = await fetch('/index.html');
    const markup = await index.clone().text();
    const builtAssets = [...markup.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)].map((match) => match[1]);
    await cache.put('/index.html', index);
    if (builtAssets.length) await cache.addAll(builtAssets);
  }).then(async () => {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(RUNTIME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(url.pathname, { ignoreVary: true })) || (await caches.match('/index.html', { ignoreVary: true })) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(url.pathname, { ignoreVary: true }).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(RUNTIME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

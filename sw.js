self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('guardiao-pro-v11').then((cache) => cache.addAll(['/', '/index.html', '/manifest.json', '/splash.png', '/icon.png'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});

const CACHE_NAME = 'uorc-signin-v2';

const APP_ASSETS = [
  '/webapp/',
  '/webapp/index.html',
  '/webapp/waiver.html',
  '/webapp/docs/quickstart-signin.html',
  '/webapp/css/styles.css',
  '/webapp/manifest.webmanifest',
  '/webapp/assets/uorc_app_icon_black.png',
  '/webapp/assets/uorc_app_icon_black_192x192.png',
  '/webapp/assets/uorc_app_icon_black_512x512.png',
  '/webapp/assets/uorc_app_icon_black_maskable_512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        return caches.match('/webapp/waiver.html');
      });
    })
  );
});

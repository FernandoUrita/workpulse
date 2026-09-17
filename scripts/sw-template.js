const CACHE_PREFIX = 'workpulse-shell-';
const CACHE_NAME = CACHE_PREFIX + '__BUILD_VERSION__';
const LOCAL_URLS = __PRECACHE_URLS__;
const CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-regular-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-brands-400.woff2',
];
const APP_ROUTES = new Set(['/', '/dashboard', '/tasks', '/meetings', '/items', '/mom', '/settings', '/login', '/register']);
const PRECACHE = [...LOCAL_URLS, ...CDN_URLS];
const ASSET_URLS = new Set(PRECACHE.map(url => new URL(url, self.location.origin).href));

self.addEventListener('install', event => {
  // Atomic install: don't report offline readiness with missing assets/icons.
  // Never activate an update automatically while someone is editing.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const appNavigation = request.mode === 'navigate' && url.origin === self.location.origin && APP_ROUTES.has(url.pathname.replace(/\/$/, '') || '/');
  // Only the static app shell is cached; API calls and user data bypass this worker.
  if (!appNavigation && !ASSET_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Static precache content is identical across Origin header variants.
    const response = await cache.match(appNavigation ? '/index.html' : request, { ignoreVary: true });
    return response || fetch(request);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'ACTIVATE_UPDATE') return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appWindows = windows.filter(client => new URL(client.url).origin === self.location.origin);
    if (appWindows.length > 1) {
      event.source?.postMessage({ type: 'UPDATE_BLOCKED' });
      return;
    }
    await self.skipWaiting();
  })());
});

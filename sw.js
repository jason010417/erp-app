const CACHE = 'erp-v2-build14';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/utils.js',
  './js/logger.js',
  './js/auth.js',
  './js/locations.js',
  './js/inventory.js',
  './js/firebase.js',
  './js/customers.js',
  './js/smartsearch.js',
  './js/inventory_ui.js',
  './js/home.js',
  './js/estimates.js',
  './js/orders.js',
  './js/production.js',
  './js/purchase.js',
  './js/transfer.js',
  './js/pos.js',
  './js/storeB.js',
  './js/events.js',
  './js/report.js',
  './js/gift.js',
  './js/processing.js',
  './js/admin.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(err => console.warn('Cache add failed:', err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 網路優先（開發期間），避免快取問題
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request)
    )
  );
});

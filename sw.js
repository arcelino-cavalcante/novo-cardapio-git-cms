const CACHE_NAME = 'lamundo-v1';
const ASSETS = [
    './',
    './index.html',
    './admin.html',
    './manifest.json',
    './favicon.ico',
    './js/app.js',
    './js/admin.js',
    './js/db.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Network first for logic, cache fallback for assets potentially
    // For this app, mostly network is vital for realtime.
    // We just need a SW to allow "Add to Home Screen".
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request).then(response => {
                // If in cache return it, otherwise if it's a page navigation return index.html (offline fallback)
                if (response) return response;
                // Simple offline fallback
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

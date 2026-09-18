/* =====================================================
   TIME ECHO PLATFORMER — DEV SW (no stale cache)
   Always fetch fresh, wipe old cache, no resurrection
   ===================================================== */

const TEMP_CACHE = 'time-echo-temp';

// ── Install ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate immediately
});

// ── Activate: DELETE EVERYTHING ───────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: NETWORK FIRST (no stale cache) ─────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET + APIs
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('fonts.googleapis.com')) return;
  if (url.hostname.includes('fonts.gstatic.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache latest version (optional safety)
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(TEMP_CACHE).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback (last cached version if available)
        return caches.match(event.request);
      })
  );
});

// ── Message: force update ─────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
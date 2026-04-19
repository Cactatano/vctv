/* ═══════════════════════════════════════════════════════════════
   VCtv TM — Service Worker
   ───────────────────────────────────────────────────────────────
   Cache shell assets para funcionamento offline.  Estratégia:
     • Shell (HTML/CSS/JS/fontes): cache-first com revalidação
     • PDFs: cache-first (grandes e raramente mudam)
     • API Pollinations: network-first (sempre queremos resposta
       atual da IA, mas caímos em cache se offline)
   =========================================================== */

const SW_VERSION = 'vctv-tm-v1.0.0';
const CACHE_SHELL = `vctv-shell-${SW_VERSION}`;
const CACHE_PDFS  = `vctv-pdfs-${SW_VERSION}`;
const CACHE_RUNTIME = `vctv-runtime-${SW_VERSION}`;

/* Arquivos do "shell" pré-cacheados no install */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo_rounded.png',
  /* CSS */
  './styles/main.css',
  './styles/liquid-glass.css',
  './styles/components.css',
  './styles/sections.css',
  './styles/intro.css',
  './styles/vcai.css',
  './styles/animations.css',
  './styles/responsive.css',
  /* JS */
  './scripts/main.js',
  './scripts/data.js',
  './scripts/intro.js',
  './scripts/glass.js',
  './scripts/search.js',
  './scripts/favorites.js',
  './scripts/gallery.js',
  './scripts/theme.js',
  './scripts/pdf-reader.js',
  './scripts/vcai.js',
  './scripts/countdown.js',
  './scripts/pwa.js',
  './scripts/utils.js',
  /* Assets */
  './assets/noise.svg',
];

/* ─── INSTALL ───────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        /* mesmo se um asset falhar, instalamos o resto */
        console.warn('[SW] addAll parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

/* ─── ACTIVATE ──────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => !k.endsWith(SW_VERSION))
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

/* ─── HELPERS ───────────────────────────────────────────────── */
function isPDF(url) {
  return url.pathname.endsWith('.pdf');
}
function isShellAsset(url) {
  const same = url.origin === self.location.origin;
  if (!same) return false;
  return (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css')  ||
    url.pathname.endsWith('.js')   ||
    url.pathname.endsWith('.svg')  ||
    url.pathname.endsWith('.png')  ||
    url.pathname.endsWith('.json')
  );
}
function isPollinations(url) {
  return url.hostname.includes('pollinations.ai');
}

/* ─── FETCH ─────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* PDFs: cache-first */
  if (isPDF(url)) {
    event.respondWith(
      caches.open(CACHE_PDFS).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp && resp.status === 200) cache.put(req, resp.clone());
          return resp;
        } catch {
          return new Response('PDF indisponível offline.', { status: 503 });
        }
      })
    );
    return;
  }

  /* Pollinations: network-first */
  if (isPollinations(url)) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_RUNTIME).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* Shell: cache-first com revalidação */
  if (isShellAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fresh = fetch(req).then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_SHELL).then((c) => c.put(req, copy));
          }
          return resp;
        }).catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  /* Default: try network, cai em cache */
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

/* ─── MESSAGE ───────────────────────────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});

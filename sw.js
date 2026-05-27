const CACHE = 'does-v14';
const STATIC_ASSETS = ['./', './index.html', './manifest.json'];

/* ── Genera un icono PNG sintético como ArrayBuffer ── */
function makePNGIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.14;
  // Fondo azul
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#1a5fd4');
  bg.addColorStop(1, '#026be0');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();
  // Escudo blanco simplificado
  const cx = size / 2, cy = size * 0.46, sw = size * 0.48, sh = size * 0.54;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - sh * 0.5);
  ctx.lineTo(cx + sw * 0.5, cy - sh * 0.28);
  ctx.lineTo(cx + sw * 0.5, cy + sh * 0.1);
  ctx.quadraticCurveTo(cx + sw * 0.5, cy + sh * 0.5, cx, cy + sh * 0.5);
  ctx.quadraticCurveTo(cx - sw * 0.5, cy + sh * 0.5, cx - sw * 0.5, cy + sh * 0.1);
  ctx.lineTo(cx - sw * 0.5, cy - sh * 0.28);
  ctx.closePath();
  ctx.fill();
  // Letra D azul dentro del escudo
  ctx.fillStyle = '#026be0';
  ctx.font = `bold ${size * 0.28}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('D', cx, cy + size * 0.01);
  return canvas.convertToBlob({ type: 'image/png' });
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isGoogleFont = url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com');
  const isCDN = url.hostname.includes('cdn.jsdelivr.net');
  const isLocal = url.origin === self.location.origin;

  // Iconos PWA — genera PNG sintético si no existe el archivo físico
  if (isLocal && url.pathname.includes('/icons/icon-')) {
    const size = url.pathname.includes('512') ? 512 : 192;
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request)
          .then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then(c => c.put(e.request, clone));
              return res;
            }
            throw new Error('icon not found');
          })
          .catch(() => {
            // Genera el icono si no existe físicamente
            return makePNGIcon(size).then(blob => {
              const r = new Response(blob, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=86400' } });
              caches.open(CACHE).then(c => c.put(e.request, r.clone()));
              return r;
            });
          });
      })
    );
    return;
  }

  // Cache-first para fuentes y CDN
  if (isGoogleFont || isCDN) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate para archivos locales
  if (isLocal) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first para el resto
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

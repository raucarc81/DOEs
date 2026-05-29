const CACHE = 'does-v15';
const STATIC_ASSETS = ['./', './index.html', './manifest.json'];

/* ── Genera un icono PNG sintético como ArrayBuffer ── */
function makePNGIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.18;
  const cx = size / 2, cy = size / 2;

  // Fondo oscuro táctico
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#0a0e1a');
  bg.addColorStop(1, '#0b1b32');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Sirena policial estilizada (luz azul)
  const sw2 = size;
  const sh2 = size;
  // Gradiente de luz azul en el centro
  const glow = ctx.createRadialGradient(cx, cy*0.7, 0, cx, cy*0.7, size*0.45);
  glow.addColorStop(0, 'rgba(0,150,255,0.45)');
  glow.addColorStop(0.5, 'rgba(0,100,220,0.2)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Cuerpo del coche policial simplificado
  const cw = size * 0.62, ch = size * 0.28;
  const cx2 = cx - cw/2, cy2 = cy * 0.78 - ch/2;
  // Carrocería
  ctx.beginPath();
  ctx.roundRect(cx2, cy2, cw, ch, size*0.04);
  ctx.fillStyle = '#1a3060';
  ctx.fill();
  ctx.strokeStyle = '#2a50a0';
  ctx.lineWidth = size * 0.015;
  ctx.stroke();
  // Sirena en el techo
  const sw3 = size * 0.28, sh3 = size * 0.08;
  ctx.beginPath();
  ctx.roundRect(cx - sw3/2, cy2 - sh3 - size*0.02, sw3, sh3, size*0.02);
  ctx.fillStyle = '#026be0';
  ctx.fill();
  // Destello azul izquierda
  ctx.beginPath();
  ctx.roundRect(cx - sw3/2, cy2 - sh3 - size*0.02, sw3*0.45, sh3, [size*0.02,0,0,size*0.02]);
  ctx.fillStyle = 'rgba(50,150,255,0.9)';
  ctx.fill();
  // Destello rojo derecha
  ctx.beginPath();
  ctx.roundRect(cx + sw3*0.05, cy2 - sh3 - size*0.02, sw3*0.45, sh3, [0,size*0.02,size*0.02,0]);
  ctx.fillStyle = 'rgba(220,50,50,0.85)';
  ctx.fill();

  // Texto DOEs en la parte inferior
  const barH = size * 0.26;
  const barY = size - barH;
  const barGrad = ctx.createLinearGradient(0, barY, 0, size);
  barGrad.addColorStop(0, 'rgba(10,14,26,0)');
  barGrad.addColorStop(0.3, 'rgba(10,14,26,0.88)');
  barGrad.addColorStop(1, 'rgba(10,14,26,0.97)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, barY, size, barH);

  const fs = size * 0.22;
  ctx.font = `bold ${fs}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillText('DOEs', cx+1.5, size - barH*0.42 + 1.5);
  // Texto blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillText('DOEs', cx, size - barH*0.42);

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

// Cambia VERSION cada vez que subas una versión nueva de index.html
const VERSION = "finanzas-ni-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  // Solo archivos propios; la tasa de cambio (otro dominio) nunca se guarda en caché
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (r.mode === "navigate") {
    // Red primero para recibir actualizaciones; sin conexión usa la copia guardada
    e.respondWith(fetch(r).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return res;
    }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(r, copy)); }
    return res;
  })));
});

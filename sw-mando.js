/* Service worker de la Fonoteca (mando.html): solo toca sus propios archivos (las demas
   paginas de la carpeta pasan de largo). Primero la red, para que siempre
   llegue la version nueva; si no hay conexion, la copia guardada. */
const CACHE = 'mando-v18';
const MIOS = ['mando.html', 'taxonomia.js', 'mando.webmanifest', 'cd.js', 'base.jpg', 'mascaras.png', 'pesas.jpg', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(MIOS.map(n => /.(jpg|png)$/.test(n) && n.indexOf('icon') < 0 ? 'portadas/' + n : n))).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const nombre = u.pathname.split('/').pop() || '';
  if (MIOS.indexOf(nombre) < 0) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(u.pathname.endsWith('mando.html') ? 'mando.html' : e.request, copia)); }
    return r;
  }).catch(() => caches.match(u.pathname.endsWith('mando.html') ? 'mando.html' : e.request)));
});

/* Motor de portadas de CD (antes portadas.html, ahora dentro de la Fonoteca).
   CD.preparar() carga la foto base; CD.dibujar(ctx, ajustes) pinta una portada de ${W}px. */
window.CD = (() => {
'use strict';
const W = 1024;
/* Versión de la página. Cambiarla en cada publicación: al abrir, se mira si
   el servidor tiene otra y, si es así, se recarga sin caché (el iPhone
   guarda la página y las imágenes mucho rato, sobre todo como app). */
const VERSION = '2026-10-04a';

/* Zona útil de la cinta (en píxeles de la imagen de 1024). Deja fuera
   el doblez del borde derecho, como en la original. */
const CAJA_NORMAL = { x: 722, y: 392, w: 246, h: 256 };
/* Con el disco suelto la cinta se dobla por el borde: el texto tiene que
   caber antes del pliegue (el borde del disco pasa por x ≈ 915 a esa altura). */
const CAJA_DOBLADA = { x: 716, y: 392, w: 186, h: 256 };
let CAJA = CAJA_NORMAL;
const TAM_MAX = 112;   // "SALSA" en la original mide lo que da este tamaño
/* Permanent Marker viene inclinada y algo achatada; la letra de la foto es
   recta y más alta. Se endereza (ENDEREZA) y se estira en vertical (ALTO_X). */
const ENDEREZA = 0.16, ALTO_X = 1.3;

/* Tonos elegidos para verse bien juntos (una colección), no colores
   primarios. Los id se mantienen para que lo ya guardado siga funcionando. */
const DISCOS = [
  { id: 'orig', n: 'Dorado (original)', c: null, vista: 'conic-gradient(#f9b84a,#c9661a,#fbd27a,#7a3b0a,#f9b84a)' },
  { id: 'plata', n: 'Plata', c: '#c6c9cf' },
  { id: 'negro', n: 'Grafito', c: '#2e2f33' },
  { id: 'burdeos', n: 'Burdeos', c: '#7e1a2b' },
  { id: 'rojo', n: 'Rojo', c: '#c23a2e' },
  { id: 'naranja', n: 'Naranja', c: '#d9772b' },
  { id: 'amarillo', n: 'Mostaza', c: '#d9a82e' },
  { id: 'oliva', n: 'Oliva', c: '#6f7a3a' },
  { id: 'verde', n: 'Verde botella', c: '#2f8f5b' },
  { id: 'cian', n: 'Turquesa', c: '#1e9a9a' },
  { id: 'azul', n: 'Azul', c: '#3a6fc4' },
  { id: 'grisaceo', n: 'Azul grisáceo', c: '#4f6f96' },
  { id: 'marino', n: 'Azul noche', c: '#23345c' },
  { id: 'morado', n: 'Morado', c: '#6a4a9c' },
  { id: 'lavanda', n: 'Lavanda', c: '#a893d6' },
  { id: 'rosa', n: 'Rosa', c: '#e0709e' }
];
const CINTAS = [
  { id: 'orig', n: 'Cobre (original)', c: null, vista: '#b5602a' },
  { id: 'blanco', n: 'Blanca', c: '#f1ede4' },
  { id: 'amarillo', n: 'Amarilla', c: '#f2c230' },
  { id: 'rojo', n: 'Roja', c: '#c9302a' },
  { id: 'rosa', n: 'Rosa', c: '#ef7fb0' },
  { id: 'azul', n: 'Azul', c: '#3565c9' },
  { id: 'verde', n: 'Verde', c: '#3f9a4e' },
  { id: 'gris', n: 'Gris plata', c: '#9a9d9f' },
  { id: 'negro', n: 'Negra', c: '#2b2b2b' }
];

let fotoImg = null, logoImg = null, logoBlanco = null;
let alCargarPesas = null;

/* ---------------- recoloreado ---------------- */
let base = null, lum = null, mDisco = null, mCinta = null, mFondo = null, pesasImg = null;
let refDisco = 1, topeDisco = 2, refCinta = 1, topeCinta = 2;

function cargarImg(src) {
  return new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error('No se pudo cargar ' + src)); i.src = src; });
}
function pixeles(img) {
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, W, W);
  return x.getImageData(0, 0, W, W).data;
}
/* Luz de referencia (media) y techo (percentil 98) de una zona, para
   saber qué píxeles son "más claros de lo normal" (reflejos) */
function referencia(mascara) {
  let s = 0, n = 0; const hist = new Uint32Array(256);
  for (let i = 0; i < lum.length; i++) if (mascara[i] > 200) { s += lum[i]; n++; hist[Math.round(lum[i] * 255)]++; }
  const media = s / n;
  let acum = 0, p98 = 1;
  for (let v = 0; v < 256; v++) { acum += hist[v]; if (acum >= n * 0.98) { p98 = v / 255; break; } }
  return [media, Math.max(1.05, p98 / media)];
}

async function preparar() {
  const [b, m] = await Promise.all([cargarImg('portadas/base.jpg?v=' + VERSION), cargarImg('portadas/mascaras.png?v=' + VERSION)]);
  /* su disco de pesas (foto real, alineada a esta plantilla): se carga
     aparte y, si falla, "Pesas" cae al dibujo de goma */
  cargarImg('portadas/pesas.jpg?v=' + VERSION).then(i => {
    pesasImg = i;
    if (alCargarPesas) alCargarPesas();
  }).catch(() => {});
  base = pixeles(b);
  const mp = pixeles(m);
  const n = W * W;
  lum = new Float32Array(n); mDisco = new Uint8Array(n); mCinta = new Uint8Array(n); mFondo = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    lum[i] = (0.299 * base[j] + 0.587 * base[j + 1] + 0.114 * base[j + 2]) / 255;
    mDisco[i] = mp[j]; mCinta[i] = mp[j + 1]; mFondo[i] = mp[j + 2];   // azul = fondo fuera de la caja
  }
  [refDisco, topeDisco] = referencia(mDisco);
  [refCinta, topeCinta] = referencia(mCinta);
  prepararLuces();
}

/* Un CD de verdad no es de un color plano: donde le da la luz se ve un
   arcoíris que cambia con el ángulo. Se precalcula cuánto brilla cada
   píxel del disco en la foto (iriPeso) y qué color del arcoíris le toca
   (iriArco). fueraM = lo que no es disco ni cinta (fondo y caja), para
   teñirlo muy suavemente con el color del disco. */
let iriPeso = null, iriArco = null, fueraM = null, detalle = null;
function prepararLuces() {
  const n = W * W;
  iriPeso = new Float32Array(n); iriArco = new Uint8ClampedArray(n * 3); fueraM = new Float32Array(n);
  detalle = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    fueraM[i] = Math.max(0, 1 - (mDisco[i] + mCinta[i]) / 255);
    if (!mDisco[i]) continue;
    {
      /* detalle[i] > 0 aclara, < 0 oscurece (se aplica en detallesCD) */
      const x = i % W, y = (i / W) | 0, rh = Math.hypot(x - DX, y - DY);
      const suave = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a)));
      let dd = 0;
      // surcos de datos: modulación finísima que da textura al brillo
      if (rh > 185) dd += 0.045 * suave(185, 200, rh) * Math.sin(rh * 1.9) * Math.sin(rh * 0.23 + 1.3);
      // canto exterior: línea oscura y un filo de luz por fuera
      dd -= 0.28 * Math.max(0, 1 - Math.abs(rh - (DR - 7)) / 2.5);
      dd += 0.2 * Math.max(0, 1 - Math.abs(rh - (DR - 3)) / 1.5);
      detalle[i] = dd * mDisco[i] / 255;
    }
    const r = lum[i] / refDisco;
    const p = Math.pow(Math.min(1, Math.max(0, (r - 0.9) / (topeDisco - 0.9))), 1.1) * mDisco[i] / 255;
    if (!p) continue;
    iriPeso[i] = p;
    const x = i % W, y = (i / W) | 0;
    /* en un CD real el espectro se abre del centro hacia fuera dentro de
       cada rayo de luz: el tono depende sobre todo del radio */
    /* el ángulo entra con peso 1 exacto: así la vuelta completa suma un
       ciclo entero de tono y no queda un corte en el lado izquierdo */
    let h = Math.hypot(x - DX, y - DY) / DR * 1.7 + Math.atan2(y - DY, x - DX) / (2 * Math.PI);
    h = ((h % 1) + 1) % 1;
    /* hsv(h, 0.43, 1) -> rgb */
    const k = n => (n + h * 6) % 6, f = n => 1 - 0.55 * Math.max(0, Math.min(k(n), 4 - k(n), 1));
    iriArco[i * 3] = f(5) * 255; iriArco[i * 3 + 1] = f(3) * 255; iriArco[i * 3 + 2] = f(1) * 255;
  }
}
/* Sombra de la cinta sobre el disco: está pegada encima, así que por
   abajo y por la izquierda oscurece un poco el disco. */
let sombraCinta = null;
function prepararSombraCinta() {
  if (sombraCinta) return;
  sombraCinta = new Float32Array(W * W);
  const T = { x0: 705 - 5, y0: 372 + 7, x1: 995 - 5, y1: 667 + 7 };   // cinta desplazada
  for (let y = T.y0 - 30; y < T.y1 + 30; y++) for (let x = T.x0 - 30; x < T.x1 + 30; x++) {
    const i = y * W + x;
    if (!mDisco[i] || mCinta[i] > 200) continue;
    const dx = Math.max(T.x0 - x, 0, x - T.x1), dy = Math.max(T.y0 - y, 0, y - T.y1);
    const d = Math.hypot(dx, dy);
    sombraCinta[i] = 0.42 * Math.exp(-(d * d) / (2 * 7 * 7)) * (1 - mCinta[i] / 255) * mDisco[i] / 255;
  }
}
function sombraDeCinta(d) {
  prepararSombraCinta();
  for (let i = 0; i < sombraCinta.length; i++) {
    const v = sombraCinta[i];
    if (!v) continue;
    const j = i * 4;
    d[j] *= 1 - v; d[j + 1] *= 1 - v; d[j + 2] *= 1 - v;
  }
}
/* ---------------- disco de oro ----------------
   Oro pulido: la luz de cada píxel (de la foto original) se pasa por un
   degradado bronce oscuro → oro → amarillo casi blanco, con más contraste
   que el CD normal y sin arcoíris (el oro no lo tiene). */
const ORO = [[0, [34, 20, 4]], [0.22, [96, 60, 12]], [0.42, [176, 122, 30]], [0.58, [226, 176, 62]],
             [0.72, [250, 214, 120]], [0.86, [255, 240, 190]], [1, [255, 252, 238]]];
function colorOro(u) {
  for (let k = 1; k < ORO.length; k++) {
    if (u <= ORO[k][0]) {
      const [u0, c0] = ORO[k - 1], [u1, c1] = ORO[k], t = (u - u0) / (u1 - u0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
    }
  }
  return ORO[ORO.length - 1][1];
}
function dorar(d) {
  for (let i = 0; i < mDisco.length; i++) {
    const m = mDisco[i];
    if (!m) continue;
    const u = Math.pow(Math.min(1, Math.max(0, lum[i] / refDisco / topeDisco)), 0.8);
    const c = colorOro(u), f = m / 255, j = i * 4;
    d[j] = d[j] * (1 - f) + c[0] * f; d[j + 1] = d[j + 1] * (1 - f) + c[1] * f; d[j + 2] = d[j + 2] * (1 - f) + c[2] * f;
  }
}
/* destellos en los puntos donde la luz pega más fuerte: lo que hace que
   parezca un disco de oro de premio y no un disco amarillo */
let _puntosBrillo = null;
function puntosBrillo() {
  if (_puntosBrillo) return _puntosBrillo;
  const cand = [];
  for (let y = DY - DR; y < DY + DR; y += 4) for (let x = DX - DR; x < DX + DR; x += 4) {
    const i = y * W + x, r = Math.hypot(x - DX, y - DY);
    /* solo en la superficie del disco: lejos del agujero, del borde y de la cinta */
    const lejosCinta = x < 660 || y < 330 || y > 710;
    if (mDisco[i] > 250 && r > 240 && r < DR - 45 && lejosCinta) cand.push([lum[i], x, y]);
  }
  cand.sort((a, b) => b[0] - a[0]);
  const elegidos = [];
  for (const c of cand) {
    if (elegidos.every(e => Math.hypot(e[1] - c[1], e[2] - c[2]) > 260)) elegidos.push(c);
    if (elegidos.length === 3) break;
  }
  return (_puntosBrillo = elegidos.map((e, k) => ({ x: e[1], y: e[2], t: [1, 0.7, 0.5][k] })));
}
function destellos(c) {
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const p of puntosBrillo()) {
    const r = 70 * p.t;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, 'rgba(255,252,235,0.95)'); g.addColorStop(0.25, 'rgba(255,236,170,0.45)'); g.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
    /* estrella de cuatro puntas, fina */
    for (const [ax, ay, largo] of [[1, 0, 2.6], [0, 1, 2.2], [0.7, 0.7, 1.2], [0.7, -0.7, 1.2]]) {
      const L = r * largo;
      const gl = c.createLinearGradient(p.x - ax * L, p.y - ay * L, p.x + ax * L, p.y + ay * L);
      gl.addColorStop(0, 'rgba(255,245,210,0)'); gl.addColorStop(0.5, 'rgba(255,250,230,0.85)'); gl.addColorStop(1, 'rgba(255,245,210,0)');
      c.strokeStyle = gl; c.lineWidth = 2.2 * p.t + 0.6;
      c.beginPath(); c.moveTo(p.x - ax * L, p.y - ay * L); c.lineTo(p.x + ax * L, p.y + ay * L); c.stroke();
    }
  }
  c.restore();
}
/* ---------------- sin cinta ----------------
   Debajo de la cinta la foto original no tiene disco. Se rellena con el
   mismo disco girado 70° (de una zona donde no hay cinta): como el CD es
   circular, los rayos y los anillos encajan. */
/* Zona a rellenar: la cinta ensanchada 4 px (para que no quede su silueta) */
let _zonaCinta = null;
function zonaCinta() {
  if (_zonaCinta) return _zonaCinta;
  const z = new Uint8Array(W * W);
  for (let y = 350; y < 690; y++) for (let x = 690; x < 1010; x++) {
    let dentro = false;
    for (let dy = -4; dy <= 4 && !dentro; dy += 2) for (let dx = -4; dx <= 4 && !dentro; dx += 2)
      if (mCinta[(y + dy) * W + x + dx] > 30) dentro = true;
    if (dentro) z[y * W + x] = 1;
  }
  /* para cada radio, el ángulo donde empieza y acaba el hueco */
  const amin = new Float32Array(1100).fill(9), amax = new Float32Array(1100).fill(-9);
  for (let y = 350; y < 690; y++) for (let x = 690; x < 1010; x++) {
    if (!z[y * W + x]) continue;
    const r = Math.round(Math.hypot(x - DX, y - DY)), a = Math.atan2(y - DY, x - DX);
    if (a < amin[r]) amin[r] = a;
    if (a > amax[r]) amax[r] = a;
  }
  return (_zonaCinta = { z, amin, amax });
}
/* Debajo de la cinta la foto original no tiene disco. Como los rayos de luz
   del CD van en ángulo, se rellena cada punto mezclando lo que hay justo a
   un lado y al otro del hueco a su misma distancia del centro: los rayos
   continúan como si la cinta nunca hubiera estado. */
function rellenarCinta(d) {
  const { z, amin, amax } = zonaCinta(), orig = new Uint8ClampedArray(d);
  const muestra = (r, a, ch) => {
    const x = Math.round(DX + r * Math.cos(a)), y = Math.round(DY + r * Math.sin(a));
    return orig[(y * W + x) * 4 + ch];
  };
  for (let y = 350; y < 690; y++) for (let x = 690; x < 1010; x++) {
    const i = y * W + x;
    if (!z[i]) continue;
    const rr = Math.hypot(x - DX, y - DY), r = Math.round(rr), a = Math.atan2(y - DY, x - DX);
    const a0 = amin[r] - 0.03, a1 = amax[r] + 0.03, t = Math.min(1, Math.max(0, (a - a0) / (a1 - a0 || 1)));
    const j = i * 4;
    for (let ch = 0; ch < 3; ch++) d[j + ch] = muestra(rr, a0, ch) * (1 - t) + muestra(rr, a1, ch) * t;
  }
}
/* El disco de pesas no está perfectamente centrado, así que girarlo
   descoloca los anillos. Se combinan las dos cosas: la forma (anillos,
   luces) continuada de un lado al otro del hueco, como en el CD, y encima
   solo el grano fino de la goma copiado de otra zona girada. */
function pesasSinCinta(img) {
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const im = x.getImageData(0, 0, W, W), d = im.data, orig = new Uint8ClampedArray(d);
  const { z } = zonaCinta();
  /* 1) forma: mezcla angular (igual que rellenarCinta) */
  rellenarCinta(d);
  /* 2) grano: (goma girada) − (su media local), sumado encima */
  const a = 70 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const rot = (xx, y, ch) => {
    const dx = xx - DX, dy = y - DY;
    return orig[(Math.round(DY + dy * ca - dx * sa) * W + Math.round(DX + dx * ca + dy * sa)) * 4 + ch];
  };
  for (let y = 350; y < 690; y++) for (let xx = 690; xx < 1010; xx++) {
    const i = y * W + xx;
    if (!z[i]) continue;
    const jj = i * 4;
    for (let ch = 0; ch < 3; ch++) {
      let m = 0;
      for (let oy = -3; oy <= 3; oy += 3) for (let ox = -3; ox <= 3; ox += 3) m += rot(xx + ox, y + oy, ch);
      d[jj + ch] = Math.max(0, Math.min(255, d[jj + ch] + (rot(xx, y, ch) - m / 9) * 0.9));
    }
  }
  x.putImageData(im, 0, 0);
  return c;
}
let pesasSin = null;
let _mascaraCompleta = null;
function mascaraDiscoCompleta() {
  if (_mascaraCompleta) return _mascaraCompleta;
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d'), im = x.createImageData(W, W);
  for (let i = 0; i < mDisco.length; i++) {
    const px = i % W, py = (i / W) | 0, r = Math.hypot(px - DX, py - DY);
    const bajoCinta = r < DR + 0.5 && r > R_HUB && zonaCinta().z[i] ? 255 : 0;
    im.data[i * 4 + 3] = Math.max(mDisco[i], bajoCinta);
  }
  x.putImageData(im, 0, 0);
  return (_mascaraCompleta = c);
}
function detallesCD(d) {
  for (let i = 0; i < detalle.length; i++) {
    const v = detalle[i];
    if (!v) continue;
    const j = i * 4;
    for (let ch = 0; ch < 3; ch++) d[j + ch] = v > 0 ? d[j + ch] + (255 - d[j + ch]) * v : d[j + ch] * (1 + v);
  }
}
function iridiscencia(d, fuerza) {
  for (let i = 0; i < iriPeso.length; i++) {
    const p = iriPeso[i];
    if (!p) continue;
    const w = p * fuerza, j = i * 4, a = i * 3;
    for (let ch = 0; ch < 3; ch++) {
      const o = Math.min(255, d[j + ch] * 0.35 + iriArco[a + ch] * 0.75);
      d[j + ch] = d[j + ch] * (1 - w) + o * w;
    }
  }
}
/* Fondo de estudio: lo que hay fuera de la caja pasa a ser un degradado
   suave del color del disco (más claro en el centro) con la sombra de la
   caja cayendo hacia abajo, como en una foto de producto. */
let sombraCaja = null;
function prepararSombra() {
  if (sombraCaja) return;
  sombraCaja = new Float32Array(W * W);
  const x0 = 34, x1 = 986, y0 = 112, y1 = 962;          // caja desplazada hacia abajo
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!mFondo[i]) continue;
    const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
    const d = Math.hypot(dx, dy);
    sombraCaja[i] = 0.34 * Math.exp(-(d * d) / (2 * 22 * 22)) + 0.1 * Math.exp(-(d * d) / (2 * 70 * 70));
  }
}
function fondoEstudio(d, hex) {
  prepararSombra();
  const c = hexRgb(hex);
  const claro = c.map(v => 1 - (1 - v) * 0.22), oscuro = c.map(v => 1 - (1 - v) * 0.5);
  for (let i = 0; i < mFondo.length; i++) {
    const a = mFondo[i];
    if (!a) continue;
    const x = i % W, y = (i / W) | 0;
    const t = Math.min(1, Math.hypot(x - 512, y - 470) / 700);
    const k = 1 - sombraCaja[i], f = a / 255, j = i * 4;
    for (let ch = 0; ch < 3; ch++) {
      const v = (claro[ch] + (oscuro[ch] - claro[ch]) * t) * k * 255;
      d[j + ch] = d[j + ch] * (1 - f) + v * f;
    }
  }
}
function fondoTenido(d, hex) {
  const c = hexRgb(hex), past = c.map(v => 1 - (1 - v) * 0.55);
  for (let i = 0; i < fueraM.length; i++) {
    const f = fueraM[i] * 0.16;
    if (!f) continue;
    const j = i * 4;
    d[j] *= 1 - f * (1 - past[0]); d[j + 1] *= 1 - f * (1 - past[1]); d[j + 2] *= 1 - f * (1 - past[2]);
  }
}

const hexRgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255);
const luz = h => { const [r, g, b] = hexRgb(h); return 0.299 * r + 0.587 * g + 0.114 * b; };
function hexHsl(hex) {
  const [r, g, b] = hexRgb(hex), max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

/* Cada píxel: más oscuro que la media -> el color oscurecido en la misma
   proporción; más claro -> el color aclarado hacia blanco. Así un disco
   plateado conserva sus rayos de luz y una cinta blanca sus arrugas. */
function tenir(datos, mascara, hex, ref, tope, contraste, suelo) {
  const c = hexRgb(hex), k = contraste == null ? 1 : contraste, s0 = suelo || 0;
  for (let i = 0, j = 0; i < mascara.length; i++, j += 4) {
    const a = mascara[i];
    if (!a) continue;
    const r = 1 + (lum[i] / ref - 1) * k;
    let o0, o1, o2;
    if (r <= 1) { const q = s0 + (1 - s0) * Math.max(0, r); o0 = c[0] * q; o1 = c[1] * q; o2 = c[2] * q; }
    else {
      const t = Math.min(1, (r - 1) / (tope - 1)) * 0.85;
      o0 = c[0] + (1 - c[0]) * t; o1 = c[1] + (1 - c[1]) * t; o2 = c[2] + (1 - c[2]) * t;
    }
    const f = a / 255;
    datos[j]     = datos[j]     * (1 - f) + o0 * 255 * f;
    datos[j + 1] = datos[j + 1] * (1 - f) + o1 * 255 * f;
    datos[j + 2] = datos[j + 2] * (1 - f) + o2 * 255 * f;
  }
}

/* ---------------- texto a rotulador ---------------- */
/* Reparte las palabras en 1..4 líneas y se queda con el reparto que
   permite la letra más grande dentro de la cinta. */
function repartos(palabras, n) {
  if (n === 1) return [[palabras.join(' ')]];
  const out = [];
  for (let i = 1; i <= palabras.length - n + 1; i++)
    for (const resto of repartos(palabras.slice(i), n - 1)) out.push([palabras.slice(0, i).join(' ')].concat(resto));
  return out;
}
/* Al escribir a mano en una cinta estrecha se aprietan las letras: se
   permite estrechar hasta un 18 % antes de tener que bajar el tamaño. */
const ESTRECHA = 0.82;
function mejorReparto(ctx, palabras, alto) {
  let mejor = null;
  for (let n = 1; n <= Math.min(4, palabras.length); n++) {
    for (const lineas of repartos(palabras, n)) {
      const ancho = Math.max(...lineas.map(l => ctx.measureText(l).width));
      const tam = Math.min(TAM_MAX, CAJA.w / (ancho * ESTRECHA) * 100, CAJA.h / (n * alto * ALTO_X));
      if (!mejor || tam > mejor.tam + 0.5) mejor = { lineas, tam, alto };
    }
  }
  return mejor;
}
function maquetar(ctx, texto) {
  let palabras = texto.split(/\s+/).filter(Boolean);
  if (!palabras.length) return null;
  ctx.font = '100px "Permanent Marker"';
  const alto = 1.02;   // interlineado, en "em"
  let mejor = mejorReparto(ctx, palabras, alto);
  /* Una palabra muy larga (13+ letras) dejaría la letra diminuta: se parte
     con guion en 2-4 trozos, como se haría a mano en una cinta estrecha, y
     solo si así queda claramente más grande. */
  for (let trozos = 2; trozos <= 4; trozos++) {
    const prueba = [];
    palabras.forEach(w => {
      if (w.length < 13) { prueba.push(w); return; }
      const t = Math.ceil(w.length / trozos);
      for (let i = 0; i < w.length; i += t) prueba.push(w.slice(i, i + t) + (i + t < w.length ? '-' : ''));
    });
    if (prueba.length === palabras.length) break;   // no hay ninguna palabra tan larga
    const otro = mejorReparto(ctx, prueba, alto);
    if (otro.tam > mejor.tam * 1.15) mejor = otro;
  }
  /* Con letra pequeña (nombres largos) sobra alto en la cinta: las letras
     se hacen más altas, como cuando alguien escribe apretado. */
  const n = mejor.lineas.length;
  const objetivo = Math.min(0.62 + 0.14 * (n - 1), 0.95) * CAJA.h;
  mejor.altoX = Math.max(ALTO_X, Math.min(1.85, objetivo / (n * mejor.tam * alto)));
  return mejor;
}
/* rotulador negro sobre cinta clara; blanco (de pintura) sobre cinta oscura */
function colorTinta(st) {
  const cc = colorDe(CINTAS, st.cinta, st.cintaOtro);
  if (!cc) return '#17110e';
  const [r, g, b] = hexRgb(cc);
  return 0.299 * r + 0.587 * g + 0.114 * b < 0.3 ? '#f2eee6' : '#17110e';
}
/* Tinta de rotulador: pequeñas zonas donde la tinta no cubre del todo */
let _grano = null;
function granoTinta() {
  if (_grano) return _grano;
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d'), im = x.createImageData(W, W), rnd = azar(99);
  for (let y = CAJA.y - 40; y < CAJA.y + CAJA.h + 40; y++) {
    for (let xx = CAJA.x - 40; xx < CAJA.x + CAJA.w + 40; xx++) {
      const j = (y * W + xx) * 4, v = rnd();
      im.data[j + 3] = v < 0.035 ? 50 + rnd() * 70 : v * 16;
    }
  }
  x.putImageData(im, 0, 0);
  return (_grano = c);
}
/* Cada letra se dibuja por separado con un poco de variación de tamaño,
   giro y altura (con semilla: el mismo texto sale siempre igual), para que
   parezca escrito a mano y no una fuente. */
function escribirCinta(c, texto, st) {
  const L = temp('tinta'), x = L.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, W, W);
  const m = maquetar(x, texto);
  if (!m) return;
  const tinta = colorTinta(st), oscura = luz(tinta) < 0.5;
  x.font = m.tam.toFixed(1) + 'px "Permanent Marker"';
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  x.fillStyle = tinta;
  /* Las tildes de las mayúsculas (Í, Á, Ó…) sobresalen por arriba: cada
     línea que las lleva deja ese hueco extra respecto a la de encima, o la
     tilde acaba pegada a la línea anterior como si fuera una coma. */
  const capAsc = x.measureText('HAMX').actualBoundingBoxAscent;
  const ascL = m.lineas.map(l => Math.max(capAsc, x.measureText(l).actualBoundingBoxAscent));
  const desc = Math.max(0, x.measureText(m.lineas.join('')).actualBoundingBoxDescent);
  let altoX = m.altoX;
  const medir = ax => {
    const paso = m.tam * m.alto * ax, extra = ascL.map(v => (v - capAsc) * ax * 1.1);
    let bloque = (ascL[0] + desc) * ax + paso * (m.lineas.length - 1);
    for (let i = 1; i < extra.length; i++) bloque += extra[i];
    return { paso, extra, bloque };
  };
  let g = medir(altoX);
  if (g.bloque > CAJA.h * 0.97) { altoX *= CAJA.h * 0.97 / g.bloque; g = medir(altoX); }
  const cx = CAJA.x + CAJA.w / 2, cy = CAJA.y + CAJA.h / 2;
  const y0 = CAJA.y + (CAJA.h - g.bloque) / 2 + ascL[0] * altoX;
  const bases = [];
  for (let i = 0, y = y0; i < m.lineas.length; i++) { if (i) y += g.paso + g.extra[i]; bases.push(y); }
  const rnd = azar(semillaDe(texto));
  x.translate(cx, cy); x.rotate(-0.012); x.translate(-cx, -cy);
  m.lineas.forEach((l, i) => {
    const letras = Array.from(l);
    const anchos = letras.map(ch => x.measureText(ch).width);
    const total = anchos.reduce((a, b) => a + b, 0);
    const sx = Math.min(1, CAJA.w / total);            // estrechar si no cabe
    const ym = bases[i] - (capAsc - desc) / 2 * altoX;    // centro de la línea
    let px = cx - total * sx / 2;
    letras.forEach((ch, k) => {
      const w = anchos[k] * sx;
      const e = 1 + (rnd() - 0.5) * 0.09, giro = (rnd() - 0.5) * 0.08, dy = (rnd() - 0.5) * m.tam * 0.06;
      x.save();
      x.translate(px + w / 2, ym + dy);
      x.rotate(giro);
      x.transform(sx * e, 0, ENDEREZA, altoX * e, 0, 0);
      x.fillText(ch, 0, (capAsc - desc) / 2);
      x.restore();
      px += w;
    });
  });
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'destination-out';
  x.drawImage(granoTinta(), 0, 0);
  x.globalCompositeOperation = 'source-over';
  /* la tinta oscura se multiplica con la cinta (se ve su textura debajo) */
  c.save();
  c.globalAlpha = 0.95;
  c.globalCompositeOperation = oscura ? 'multiply' : 'source-over';
  c.drawImage(L, 0, 0);
  c.restore();
}

/* ---------------- geometría del disco en la foto ---------------- */
const DX = 537, DY = 512, DR = 405;   // centro y radio del disco
const R_HUB = 168;                     // hasta aquí llegan el centro transparente y el anillo oscuro
const LUZ = -2.36;                     // la luz de la foto viene de arriba a la izquierda

const ACABADOS = [
  { id: 'cd', n: 'CD brillante' },
  { id: 'metal', n: 'Metal cepillado', def: '#b9bdc4' },
  { id: 'goma', n: 'Goma de pesas', def: '#262626' },
  { id: 'vinilo', n: 'Vinilo', def: '#171717' },
  { id: 'puntos', n: 'Puntos en relieve', def: '#b9cde3' },
  { id: 'pesas', n: 'Disco de pesas', def: '#1c1c1c' },
  { id: 'oro', n: 'Disco de oro', def: '#d4a024' },
  { id: 'foto', n: 'Tu foto' }
];
const POSICIONES = [{ id: 'izq', n: 'Izquierda' }, { id: 'arriba', n: 'Arriba' }, { id: 'abajo', n: 'Abajo' }];
const ESTILOS = [{ id: 'relieve', n: 'En relieve' }, { id: 'blanco', n: 'Blanco' }, { id: 'negro', n: 'Negro' }];
/* Zonas del texto grande: el hueco entre el centro y el borde del disco */
const ZONAS = {
  izq:    { x: DX - 262, y: DY, w: 140, h: 200 },
  arriba: { x: DX, y: DY - 262, w: 250, h: 140 },
  abajo:  { x: DX, y: DY + 262, w: 250, h: 140 }
};

/* Todo lo que define un diseño (sin el texto de la cinta). Las plantillas,
   ideas y "Mis diseños" parten de aquí, para no arrastrar restos del
   diseño anterior (un texto de borde olvidado, un dibujo, etc.). */
const DISENO_BASE = {
  acabado: 'cd', disco: 'orig', cinta: 'orig', patOn: false, patLogo: false, patEmoji: '♫',
  patTam: 62, patSep: 2.25, patFondo: true, irid: true, fondo: false, brillo: true,
  encuadre: 'suelto', fondoSuelto: 'negro', patBlanco: true, borde: '', grande: '', grandePos: 'izq', estilo: 'relieve'
};
const CLAVES_DISENO = Object.keys(DISENO_BASE).concat(['discoOtro', 'cintaOtro']);
/* {T} en el borde o el texto grande = el texto de la cinta */
function completo(p, texto) {
  const d = Object.assign({}, DISENO_BASE, p);
  ['borde', 'grande'].forEach(k => { d[k] = String(d[k]).replace(/\{T\}/g, (texto || '').trim()); });
  return d;
}
const PLANTILLAS = [
  { n: 'Yeezus', muestra: 'SALSA', p: {} },
  { n: 'Iconos', muestra: 'HITS', p: { acabado: 'metal', disco: 'marino', cinta: 'azul', patOn: true, patEmoji: '♫' } },
  { n: 'Piel de gallina', muestra: 'CHILLS', p: { acabado: 'puntos', cinta: 'blanco' } },
  { n: 'Vinilo', muestra: 'JAZZ', p: { acabado: 'vinilo', cinta: 'blanco', borde: 'LADO A · 33 RPM', estilo: 'blanco' } },
  { n: 'Neón', muestra: 'NOCHE', p: { disco: 'rosa', cinta: 'negro', patOn: true, patEmoji: '✦', patTam: 40, patFondo: false } },
  { n: 'Luna', muestra: 'CHILL', p: { acabado: 'metal', disco: 'morado', cinta: 'blanco', patOn: true, patEmoji: '☾', patTam: 46, patFondo: false } }
];

/* ---------------- utilidades de dibujo ---------------- */
const temps = {};
function temp(nombre) {
  if (!temps[nombre]) { const c = document.createElement('canvas'); c.width = c.height = W; temps[nombre] = c; }
  return temps[nombre];
}
/* azar con semilla: la textura sale igual en la vista previa, en las
   miniaturas y en la imagen que se sube */
function azar(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
let _mascara = null;
function mascaraDisco() {
  if (_mascara) return _mascara;
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d'), im = x.createImageData(W, W);
  for (let i = 0; i < mDisco.length; i++) im.data[i * 4 + 3] = mDisco[i];
  x.putImageData(im, 0, 0);
  return (_mascara = c);
}

/* ---------------- acabados ---------------- */
/* Misma idea que tenir(): un factor de luz r por píxel; r<1 oscurece el
   color, r>1 lo acerca a blanco (k = cuánto brilla el material). */
const texturas = {};
function textura(acabado, hex) {
  const clave = acabado + hex;
  if (texturas[clave]) return texturas[clave];
  const c = hexRgb(hex);
  const cv = document.createElement('canvas'); cv.width = cv.height = W;
  const x = cv.getContext('2d'), im = x.createImageData(W, W), d = im.data;
  const rnd = azar(7);
  const anillos = new Float32Array(1400);
  for (let i = 0, v = 0; i < anillos.length; i++) { v = v * 0.55 + (rnd() - 0.5); anillos[i] = v; }
  const k = acabado === 'metal' ? 0.8 : acabado === 'goma' ? 0.35 : acabado === 'puntos' ? 0.6 : 0.5;
  for (let y = DY - DR - 4; y < DY + DR + 4; y++) {
    for (let xx = DX - DR - 4; xx < DX + DR + 4; xx++) {
      const dx = xx - DX, dy = y - DY, rho = Math.sqrt(dx * dx + dy * dy);
      if (rho > DR + 3) continue;
      const th = Math.atan2(dy, dx);
      let r, brillo = 0;
      if (acabado === 'metal') {
        /* rayado circular fino + dos franjas de luz que giran con el disco */
        r = 1 + 0.16 * anillos[Math.round(rho * 3)] + 0.34 * Math.cos(2 * (th - 0.5)) + 0.12 * Math.cos(4 * (th + 0.4)) + 0.05 * (rnd() - 0.5);
      } else if (acabado === 'goma') {
        /* grano de goma, un poco de luz hacia arriba a la izquierda y dos
           surcos biselados como en un disco de pesas */
        r = 1 + 0.24 * (rnd() - 0.5) + 0.05 * anillos[Math.round(rho * 1.5)] + 0.1 * Math.cos(th - LUZ) * (rho / DR);
        for (const g of [220, 352, DR - 7]) {
          const dd = rho - g;
          if (dd > -6 && dd < 6) r += 0.55 * Math.cos(th - LUZ) * Math.sign(dd) * (1 - Math.abs(dd) / 6);
        }
      } else if (acabado === 'puntos') {
        /* piel de gallina: bultitos pequeños, desiguales en tamaño y algo
           desordenados, con poco relieve. Ordenados y grandes parecían una
           alfombrilla de ducha. */
        const s = 17, fila = Math.round(dy / (s * 0.866)), desp = (fila & 1) * s / 2;
        const col = Math.round((dx - desp) / s);
        const fr = v => v - Math.floor(v);
        const h1 = fr(Math.sin(fila * 127.1 + col * 311.7) * 43758.55), h2 = fr(Math.sin(fila * 269.5 + col * 183.3) * 43758.55);
        const ex = dx - (col * s + desp + (h1 - 0.5) * 5), ey = dy - (fila * s * 0.866 + (h2 - 0.5) * 5);
        const rb = 3.4 + h2 * 2.8, dd = Math.sqrt(ex * ex + ey * ey);
        r = 0.93 + 0.05 * (rnd() - 0.5) + 0.12 * Math.cos(th - LUZ) * (rho / DR);
        if (dd < rb) {
          const nz = Math.sqrt(1 - (dd / rb) * (dd / rb));
          r += 0.4 * (-(ex / rb) * 0.6 - (ey / rb) * 0.6 + nz * 0.53 - 0.53);
        } else if (dd < rb + 2) {
          r -= 0.1 * Math.max(0, (ex + ey) / (dd * 1.41)) * (1 - (dd - rb) / 2);
        }
      } else {
        /* vinilo: surcos + el típico reflejo en cruz */
        const surco = 0.5 + 0.5 * Math.sin(rho * 2.3 + anillos[Math.round(rho * 2)] * 2);
        r = 0.8 + 0.3 * surco;
        brillo = Math.pow(Math.max(0, Math.cos(2 * (th - 0.7))), 8) * 0.5 * (0.7 + 0.3 * surco);
      }
      const j = (y * W + xx) * 4;
      for (let ch = 0; ch < 3; ch++) {
        let o = r <= 1 ? c[ch] * r : c[ch] + (1 - c[ch]) * Math.min(1, r - 1) * k;
        o = o + (1 - o) * brillo;
        d[j + ch] = o * 255;
      }
      d[j + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0);
  return (texturas[clave] = cv);
}

/* La foto propia lleva encima los brillos del CD original, suaves,
   para que siga pareciendo un disco dentro de la caja. */
let _brillo = null;
function brilloCD() {
  if (_brillo) return _brillo;
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d'), im = x.createImageData(W, W);
  for (let i = 0; i < lum.length; i++) {
    const g = Math.max(0, Math.min(255, 128 * lum[i] / refDisco));
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return (_brillo = c);
}
/* Un CD serigrafiado: la foto va impresa (mate), así que solo recibe un
   toque de la luz del disco, lo justo para que no parezca un recorte plano. */
function dibujarFoto(x, img, st) {
  img = img || fotoImg;
  /* zoom 1 = la foto entera cabe en el disco; más zoom = se recorta. X/Y
     (-1..1) mueven el recorte, para sacar una cara del agujero central. */
  const zoom = Math.max(1, (st && st.fotoZoom) || 1);
  const lado = Math.min(img.width, img.height) / zoom;
  const mx = (img.width - lado) / 2, my = (img.height - lado) / 2;
  const sx = mx + mx * Math.max(-1, Math.min(1, (st && st.fotoX) || 0));
  const sy = my + my * Math.max(-1, Math.min(1, (st && st.fotoY) || 0));
  x.drawImage(img, sx, sy, lado, lado, DX - DR, DY - DR, DR * 2, DR * 2);
  x.save();
  x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.35;
  x.drawImage(brilloCD(), 0, 0);
  x.restore();
}

/* ---------------- dibujo repetido ---------------- */
const simbolos = s => {
  s = (s || '').trim();
  if (!s) return [];
  if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(s), g => g.segment).filter(g => g.trim());
  return Array.from(s).filter(g => g.trim());
};
/* Símbolos "de trazo": cada móvil los pinta distinto (a veces como emoji
   de color), así que se dibujan como silueta en blanco o negro. Todo lo
   demás se trata como emoji y se deja con sus colores. */
const MONO = new Set(Array.from('♫♪✦★☆♥♡⚡❄☾☀●○▲△■◆✿❀☂✈✎✚✕✓☁☘⚓♠♣♦∞☯☮✌'));
function sprite(g, tam, blanco) {
  const lado = Math.ceil(tam * 1.6);
  const c = document.createElement('canvas'); c.width = c.height = lado;
  const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const mono = MONO.has(g.replace(/️|︎/g, ''));
  x.font = tam + 'px ' + (mono
    ? '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif'
    : '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif');
  x.fillText(mono ? g.replace(/️/g, '') + '︎' : g, lado / 2, lado / 2 + tam * 0.04);
  if (mono) {
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = blanco ? '#f6f4ef' : '#141414';
    x.fillRect(0, 0, lado, lado);
  }
  return c;
}
function dibujarPatron(x, st, xFondo) {
  const tam = st.patTam, paso = tam * (st.patSep || 2.25);
  const usarLogo = st.patLogo && logoImg;
  const lista = simbolos(st.patEmoji);
  if (!usarLogo && !lista.length) return;
  const logo = usarLogo ? (st.patBlanco ? logoBlanco : logoImg) : null;
  const sprites = logo ? [] : lista.map(g => sprite(g, tam, st.patBlanco));
  const filas = Math.ceil(DR / (paso * 0.866)) + 1;
  let n = 0;
  for (let j = -filas; j <= filas; j++) {
    for (let i = -filas - 1; i <= filas + 1; i++) {
      const px = DX + (i + (j & 1) * 0.5) * paso, py = DY + j * paso * 0.866;
      const rho = Math.hypot(px - DX, py - DY);
      if (rho < R_HUB + tam * 0.55 || rho > DR + tam * 0.4) continue;
      if (st.patFondo) {
        /* el círculo es una sombra translúcida: va directo al disco, sin
           pasar por la iluminación (que le quitaría transparencia) */
        const f = xFondo || x;
        f.fillStyle = 'rgba(0,0,0,0.22)';
        f.beginPath(); f.arc(px, py, tam * 0.88, 0, Math.PI * 2); f.fill();
      }
      if (logo) {
        const f = Math.min(tam * 1.1 / logo.width, tam * 1.1 / logo.height);
        x.drawImage(logo, px - logo.width * f / 2, py - logo.height * f / 2, logo.width * f, logo.height * f);
      } else {
        const sp = sprites[n % sprites.length];
        x.drawImage(sp, px - sp.width / 2, py - sp.height / 2);
      }
      n++;
    }
  }
}

/* ---------------- textos del disco ---------------- */
/* Relieve: sombra abajo-derecha, luz arriba-izquierda, y el interior se
   vacía para que se vea el material de debajo, como un grabado. */
function estampar(x, dibujo, estilo) {
  const g = temp('glifos'), gx = g.getContext('2d');
  gx.clearRect(0, 0, W, W); gx.fillStyle = '#fff'; dibujo(gx);
  const t = temp('tinte'), tx = t.getContext('2d');
  const capa = temp('relieve'), cx = capa.getContext('2d');
  cx.clearRect(0, 0, W, W);
  const pon = (color, alfa, ox, oy, modo) => {
    tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, W, W); tx.drawImage(g, 0, 0);
    tx.globalCompositeOperation = 'source-in'; tx.fillStyle = color; tx.fillRect(0, 0, W, W);
    cx.globalAlpha = alfa; cx.globalCompositeOperation = modo || 'source-over';
    cx.drawImage(t, ox, oy);
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  };
  if (estilo === 'relieve') {
    pon('#000', 0.6, 2.5, 2.5);
    pon('#fff', 0.45, -1.5, -1.5);
    pon('#000', 1, 0, 0, 'destination-out');
    pon('#fff', 0.1, 0, 0);
  } else {
    pon(estilo === 'blanco' ? '#f5f2ea' : '#121212', 0.95, 0, 0);
  }
  x.drawImage(capa, 0, 0);
}
function textoBorde(gx, texto) {
  const tam = 30, radio = DR - 28;
  gx.font = '600 ' + tam + 'px Oswald, "Arial Narrow", sans-serif';
  gx.textAlign = 'center'; gx.textBaseline = 'middle';
  const unidad = texto + '     ';
  const ancho = gx.measureText(unidad).width, circ = 2 * Math.PI * radio;
  const veces = Math.max(1, Math.floor(circ / ancho));
  const letras = Array.from(unidad.repeat(veces));
  const extra = (circ - ancho * veces) / letras.length;   // reparte el hueco sobrante entre letras
  let a = -Math.PI / 2 - 0.35;
  for (const l of letras) {
    const w = gx.measureText(l).width + extra;
    a += w / 2 / radio;
    gx.save();
    gx.translate(DX + radio * Math.cos(a), DY + radio * Math.sin(a));
    gx.rotate(a + Math.PI / 2);
    gx.fillText(l, 0, 0);
    gx.restore();
    a += w / 2 / radio;
  }
}
function textoGrande(gx, texto, pos) {
  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lineas.length) return;
  const z = ZONAS[pos] || ZONAS.izq, alto = 0.92;
  gx.font = '700 100px Oswald, "Arial Narrow", sans-serif';
  const ancho = Math.max(...lineas.map(l => gx.measureText(l).width));
  const tam = Math.min(150, z.w / ancho * 100, z.h / (lineas.length * alto));
  gx.font = '700 ' + tam.toFixed(1) + 'px Oswald, "Arial Narrow", sans-serif';
  gx.textAlign = 'center'; gx.textBaseline = 'middle';
  const y0 = z.y - (lineas.length - 1) * tam * alto / 2;
  lineas.forEach((l, i) => gx.fillText(l, z.x, y0 + i * tam * alto));
}
/* Mapas de luz sacados de la foto original: sombra (para multiplicar) y
   reflejos (para aclarar). Así lo impreso en el disco recibe los mismos
   rayos de luz del CD en vez de parecer una pegatina plana. */
let _sombra = null, _reflejo = null;
function mapasLuz() {
  if (_sombra) return;
  const hacer = f => {
    const c = document.createElement('canvas'); c.width = c.height = W;
    const x = c.getContext('2d'), im = x.createImageData(W, W);
    for (let i = 0; i < lum.length; i++) {
      const g = f(lum[i] / refDisco);
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return c;
  };
  _sombra = hacer(r => 255 * Math.min(1, 0.42 + 0.58 * r));
  _reflejo = hacer(r => 255 * Math.max(0, Math.min(1, (r - 1) / (topeDisco - 1))));
}
function iluminar(capa, fuerza) {
  mapasLuz();
  const copia = temp('copia'), cx = copia.getContext('2d');
  cx.clearRect(0, 0, W, W); cx.drawImage(capa, 0, 0);
  const x = capa.getContext('2d');
  x.save();
  x.globalAlpha = fuerza; x.globalCompositeOperation = 'multiply'; x.drawImage(_sombra, 0, 0);
  x.globalAlpha = fuerza * 0.5; x.globalCompositeOperation = 'screen'; x.drawImage(_reflejo, 0, 0);
  x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; x.drawImage(copia, 0, 0);
  x.restore();
}
function textosDisco(x, st) {
  const may = t => st.mayus ? t.toLocaleUpperCase('es-ES') : t;
  const borde = may((st.borde || '').trim()), grande = may(st.grande || '').trim();
  if (!borde && !grande) return;
  estampar(x, gx => {
    if (borde) textoBorde(gx, borde);
    if (grande) textoGrande(gx, grande, st.grandePos);
  }, st.estilo);
}

/* ---------------- pintar ---------------- */
const colorDe = (lista, id, otro) => id === 'otro' ? otro : (lista.find(x => x.id === id) || lista[0]).c;
const textoDe = st => { const t = (st.texto || '').trim(); return st.mayus ? t.toLocaleUpperCase('es-ES') : t; };

function dibujar(c, st) {
  CAJA = st.encuadre === 'suelto' ? CAJA_DOBLADA : CAJA_NORMAL;
  const img = new ImageData(new Uint8ClampedArray(base), W, W);
  const hexD = colorDe(DISCOS, st.disco, st.discoOtro), hexC = colorDe(CINTAS, st.cinta, st.cintaOtro);
  const foto = st.fotoImg || fotoImg;
  let acabado = st.acabado === 'foto' && !foto ? 'cd' : st.acabado;
  if (!ACABADOS.some(a => a.id === acabado)) acabado = 'cd';
  /* suelo 0.2: en un CD de color la sombra sigue siendo de ese color, no negra */
  /* el disco de pesas es una foto algo descentrada: rellenar bajo la cinta
     deja marcas, así que ese disco conserva siempre su cinta */
  const baseCD = acabado === 'cd' || acabado === 'oro', sinCinta = !!st.sinCinta && acabado !== 'pesas';
  if (acabado === 'cd' && hexD) tenir(img.data, mDisco, hexD, refDisco, topeDisco, 1, 0.2);
  if (acabado === 'cd' && st.irid !== false) iridiscencia(img.data, hexD ? 0.6 : 0.3);
  if (acabado === 'oro') dorar(img.data);
  if (baseCD) detallesCD(img.data);
  if (sinCinta) rellenarCinta(img.data);
  else sombraDeCinta(img.data);
  if (st.fondo !== false) {
    const def = (ACABADOS.find(a => a.id === acabado) || {}).def;
    const hexFondo = acabado === 'foto' ? '#9aa0a8' : hexD || def || '#d98b2b';
    fondoTenido(img.data, hexFondo);
    fondoEstudio(img.data, hexFondo);
  }
  /* el cobre original tiene manchas oscuras que en una cinta blanca o
     amarilla parecen suciedad: cuanto más clara la cinta, más se suavizan */
  if (hexC && !sinCinta) tenir(img.data, mCinta, hexC, refCinta, topeCinta, 1 - 0.65 * luz(hexC));
  c.putImageData(img, 0, 0);
  if (!baseCD || st.patOn || (st.borde || '').trim() || (st.grande || '').trim()) {
    const capa = temp('capa'), x = capa.getContext('2d');
    x.clearRect(0, 0, W, W);
    if (acabado === 'foto') dibujarFoto(x, foto, st);
    else if (acabado === 'pesas') {
      if (sinCinta && pesasImg && !pesasSin) pesasSin = pesasSinCinta(pesasImg);
      x.drawImage((sinCinta ? pesasSin : pesasImg) || textura('goma', '#262626'), 0, 0);
    }
    else if (acabado !== 'cd') x.drawImage(textura(acabado, hexD || ACABADOS.find(a => a.id === acabado).def), 0, 0);
    /* lo "impreso" (dibujos y textos en blanco/negro) va en su capa y se
       ilumina; el relieve ya lleva su propia luz y sombra */
    const imp = temp('impreso'), ix = imp.getContext('2d');
    ix.clearRect(0, 0, W, W);
    if (st.patOn) dibujarPatron(ix, st, x);
    if (st.estilo !== 'relieve') textosDisco(ix, st);
    iluminar(imp, baseCD || acabado === 'foto' ? 1 : 0.45);
    x.drawImage(imp, 0, 0);
    if (st.estilo === 'relieve') textosDisco(x, st);
    /* todo lo nuevo se recorta con la forma del disco: el centro
       transparente y la cinta siguen siendo los de la foto */
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(sinCinta ? mascaraDiscoCompleta() : mascaraDisco(), 0, 0);
    x.globalCompositeOperation = 'source-over';
    c.drawImage(capa, 0, 0);
    if (!baseCD && !sinCinta) {
      const im2 = c.getImageData(0, 0, W, W); sombraDeCinta(im2.data); c.putImageData(im2, 0, 0);
    }
  }
  const suelto = st.encuadre === 'suelto';
  if (acabado === 'oro') destellos(c);
  if (st.brillo !== false && !suelto) brilloTapa(c);
  if (!sinCinta) escribirCinta(c, textoDe(st), st);
  if (suelto) sinCaja(c, st, hexD);
}

/* ---------------- sin caja: el disco suelto ----------------
   Se recorta el disco entero (con su anillo transparente y el agujero
   central abierto) más la cinta, y se pone sobre un fondo liso con su
   sombra. Sin la caja el disco es el protagonista. La sombra se calcula
   con la forma (círculo + rectángulo de la cinta) desplazada, sin
   desenfoques de canvas, que en iPhone antiguos no existen. */
let alfaSuelto = null, sombraSuelto = null, cintaEncogida = null, alfaCirculo = null;
const DOBLEZ = 4;   // px de cinta que se ven "dando la vuelta" al canto
/* La foto original tiene un filo del fondo blanco alrededor de la cinta.
   Con caja no se nota, pero sobre negro sí: se encoge la máscara 2 px
   (el mínimo de cada vecindario) para dejar ese filo fuera. */
function encogerCinta() {
  let m = mCinta;
  for (let pasada = 0; pasada < 2; pasada++) {
    const o = new Uint8Array(W * W);
    for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!m[i]) continue;
      o[i] = Math.min(m[i], m[i - 1], m[i + 1], m[i - W], m[i + W]);
    }
    m = o;
  }
  return m;
}
function prepararSuelto() {
  if (alfaSuelto) return;
  cintaEncogida = encogerCinta();
  alfaSuelto = new Float32Array(W * W); sombraSuelto = new Float32Array(W * W); alfaCirculo = new Float32Array(W * W);
  const SX = 14, SY = 22, SB = 26;                       // desplazamiento y suavidad de la sombra
  const T = { x0: 705, y0: 372, x1: 995, y1: 667 };      // la cinta
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, r = Math.hypot(x - DX, y - DY);
    let a = Math.min(1, Math.max(0, DR + 0.5 - r));
    if (r < 50) a = Math.min(1, Math.max(0, r - 49.5));  // agujero central
    alfaSuelto[i] = Math.max(a, cintaEncogida[i] / 255 * Math.min(1, Math.max(0, DR + DOBLEZ + 0.5 - r)));
    alfaCirculo[i] = a;
    const rs = Math.hypot(x - DX - SX, y - DY - SY);
    const dCirc = Math.max(0, rs - DR);
    const dxT = Math.max(T.x0 + SX - x, 0, x - T.x1 - SX), dyT = Math.max(T.y0 + SY - y, 0, y - T.y1 - SY);
    const d = Math.max(0, dCirc - DOBLEZ);
    sombraSuelto[i] = rs < 52 && dxT + dyT > 0 ? 0 : Math.exp(-(d * d) / (2 * SB * SB));
  }
}
const FONDOS_SUELTO = [{ id: 'negro', n: 'Negro' }, { id: 'blanco', n: 'Blanco' }, { id: 'color', n: 'Color del disco' }];
function sinCaja(c, st, hexD) {
  prepararSuelto();
  const im = c.getImageData(0, 0, W, W), d = im.data;
  let bg = [18, 18, 18], fuerza = 0.6, bgA = null, bgB = null;  // #121212, el negro de Spotify
  if (st.fondoSuelto === 'blanco') { bg = [251, 251, 250]; fuerza = 0.22; }
  if (st.fondoSuelto === 'color') {
    /* degradado diagonal con dos tonos del mismo color del disco: uno
       claro arriba-izquierda, otro oscuro y con el matiz girado abajo-
       derecha, como las portadas de playlist por defecto de Spotify */
    const [h0, s0, l0] = hexHsl(hexD || '#d98b2b'), s1 = Math.max(55, s0);
    bgA = hexRgb(hsl(h0, s1, Math.min(62, Math.max(42, l0 + 14)))).map(v => v * 255);
    bgB = hexRgb(hsl((h0 + 30) % 360, s1, Math.max(12, l0 - 24))).map(v => v * 255);
    fuerza = 0.38;
  }
  /* El pliegue: justo antes del borde la cinta se curva (se oscurece),
     en la arista coge un filo de luz, y lo que da la vuelta al canto se
     ve en sombra. */
  const sinC = st.sinCinta && st.acabado !== 'pesas';
  const alfa = sinC ? alfaCirculo : alfaSuelto;
  if (!sinC) for (let y = 360; y < 680; y++) for (let x = 860; x < 1000; x++) {
    const i = y * W + x, m = cintaEncogida[i] / 255;
    if (!m) continue;
    const t = Math.hypot(x - DX, y - DY) - DR, j = i * 4;
    let mul = 1, luz = 0;
    if (t > -16 && t <= -3) mul = 1 - 0.28 * (t + 16) / 13;
    else if (t > -3 && t <= -0.5) luz = 0.22;
    else if (t > -0.5) mul = 0.42;
    if (mul === 1 && !luz) continue;
    for (let ch = 0; ch < 3; ch++) {
      const v = d[j + ch] * mul;
      d[j + ch] = d[j + ch] * (1 - m) + (v + (255 - v) * luz) * m;
    }
  }
  /* luz de canto arriba a la izquierda: sin ella un disco negro (el de
     pesas) se funde con el fondo negro */
  if (st.fondoSuelto !== 'blanco') {
    for (let y = DY - DR - 2; y < DY + DR + 2; y++) for (let x = DX - DR - 2; x < DX + DR + 2; x++) {
      const t = DR - Math.hypot(x - DX, y - DY);
      if (t < 0 || t > 5) continue;
      const i = y * W + x;
      if (cintaEncogida[i] > 40 && !sinC) continue;
      const l = Math.max(0, Math.cos(Math.atan2(y - DY, x - DX) - LUZ)) * (1 - t / 5) * 0.32, j = i * 4;
      if (l <= 0) continue;
      d[j] += (255 - d[j]) * l; d[j + 1] += (255 - d[j + 1]) * l; d[j + 2] += (255 - d[j + 2]) * l;
    }
  }
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, a = alfa[i];
    if (a >= 1) continue;
    const k = 1 - sombraSuelto[i] * fuerza, j = i * 4;
    let bgx = bg;
    if (bgA) { const t2 = (x + y) / (2 * (W - 1)); bgx = [0, 1, 2].map(c => bgA[c] * (1 - t2) + bgB[c] * t2); }
    d[j] = d[j] * a + bgx[0] * k * (1 - a);
    d[j + 1] = d[j + 1] * a + bgx[1] * k * (1 - a);
    d[j + 2] = d[j + 2] * a + bgx[2] * k * (1 - a);
  }
  c.putImageData(im, 0, 0);
}

/* Reflejo suave en diagonal sobre la tapa de plástico (encima del disco,
   pero no sobre la cinta, que va pegada por fuera, ni sobre el fondo). */
let _tapa = null;
function mascaraTapa() {
  if (_tapa) return _tapa;
  const c = document.createElement('canvas'); c.width = c.height = W;
  const x = c.getContext('2d'), im = x.createImageData(W, W);
  for (let i = 0; i < mFondo.length; i++) im.data[i * 4 + 3] = Math.max(0, 255 - mFondo[i] - mCinta[i]);
  x.putImageData(im, 0, 0);
  return (_tapa = c);
}
function brilloTapa(c) {
  const b = temp('brillo'), x = b.getContext('2d');
  x.clearRect(0, 0, W, W);
  const g = x.createLinearGradient(80, 0, 900, 1024);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.3, 'rgba(255,255,255,0)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.13)');
  g.addColorStop(0.47, 'rgba(255,255,255,0.03)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.08)');
  g.addColorStop(0.6, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, W);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(mascaraTapa(), 0, 0);
  x.globalCompositeOperation = 'source-over';
  c.drawImage(b, 0, 0);
}

const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
function semillaDe(s) { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
/* Spotify solo acepta JPEG en base64 de hasta 256 KB */
function jpegDe(origen) {
  const LIM = 250000;
  for (const lado of [1024, 800, 640]) {
    let c = origen;
    if (lado !== W) { c = document.createElement('canvas'); c.width = c.height = lado; c.getContext('2d').drawImage(origen, 0, 0, lado, lado); }
    for (let q = 0.92; q >= 0.6; q -= 0.08) { const b64 = c.toDataURL('image/jpeg', q).split(',')[1]; if (b64.length <= LIM) return b64; }
  }
  throw new Error('La imagen no cabe en el límite de Spotify');
}
let _prep = null;
return {
  W, DISCOS, CINTAS, ACABADOS, completo, dibujar, jpegDe, hexHsl, hsl,
  preparar: () => _prep || (_prep = (async () => { try { await document.fonts.load('40px "Permanent Marker"'); await document.fonts.load('700 40px Oswald'); } catch (e) {} await preparar(); })()),
  listo: () => !!base,
  alPesas: fn => { alCargarPesas = fn; }
};
})();

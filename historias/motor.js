/* Motor de «Historias de la música» (historias.html), hermana de la Fonoteca.
   Lee window.HISTORIAS (lo rellenan los archivos de historias/datos/) y pinta:
   - #            → portada con todas las historias agrupadas por familia
   - #h/<id>[/n]  → una historia por capítulos (n = capítulo al que saltar)
   Cada pieza: { a: año, art: artista, t: título, n: nota, tipo?: 'hito'|'disco', q?: búsqueda, alias?: [nombres] }
   'hito' = momento clave sin audio; 'disco' = se escucha el álbum entero.
   No usa la API de Spotify: «Escuchar» abre una búsqueda, así no gasta cupo.
   «La tienes» sale de lo que la Fonoteca ya guardó en este aparato (IndexedDB «mando»):
   solo se lee, nunca se escribe. «Escuchada» se apunta en este aparato. */
(function () {
  const $ = (s) => document.querySelector(s);
  const H = window.HISTORIAS;
  const main = $('#main'), buscar = $('#buscar');
  const K_OIDAS = 'historias_oidas_v1', K_ULTIMA = 'historias_ultima_v1', K_FILTRO = 'historias_filtro_v1';
  const MOV = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mismo tema que la Fonoteca si allí se eligió uno a mano
  try {
    const p = JSON.parse(localStorage.getItem('mando_prefs_v1') || '{}');
    if (p.tema) document.documentElement.dataset.theme = p.tema;
  } catch (e) {}

  const ICO = {
    nota: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    atras: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    copia: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    dado: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/>',
    sig: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
  };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24">' + ICO[n] + '</svg>';
  $('.marca').innerHTML = ic('nota');
  $('#aFono').innerHTML = ic('atras') + '<span>Fonoteca</span>';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const piezas = (h) => h.capitulos.flatMap((c) => c.items);
  const escuchables = (h) => piezas(h).filter((i) => i.tipo !== 'hito');
  const urlSpotify = (i) => 'https://open.spotify.com/search/' + encodeURIComponent(i.q || i.art + ' ' + i.t);
  const familias = () => [...new Set(H.map((h) => h.familia))];
  const leer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fmt = (n) => n.toLocaleString('es-ES');

  let _t;
  function toast(txt) {
    const t = $('#toast'); t.textContent = txt; t.classList.add('ver');
    clearTimeout(_t); _t = setTimeout(() => t.classList.remove('ver'), 2200);
  }

  /* ---------- escuchadas (en este aparato) ---------- */
  const OIDAS = new Set(leer(K_OIDAS, []));
  const clave = (h, i) => h.id + '|' + i.art + '|' + i.t;
  const oidas = (h) => escuchables(h).filter((i) => OIDAS.has(clave(h, i))).length;

  /* ---------- «la tienes»: lo que la Fonoteca guardó en este aparato ---------- */
  const normT = (s) => norm(String(s || '').replace(/\s[-–]\s.*$/, '').replace(/[([].*?[)\]]/g, ''))
    .replace(/[^a-z0-9Ѐ-ӿᄀ-ᇿ぀-ヿ㄰-㆏一-鿿가-힯 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const clavesArt = (i) => String(i.art).split(/\s*(?:&|,|\by\b|\band\b|\bvs\.?|\bfeat\.?|\bcon\b)\s*/i).concat(i.alias || [])
    .map(normT).filter(Boolean).map((p) => p.split(' ').filter((w) => w.length > 1).pop() || p);
  let TUYAS = null;
  function leerFonoteca() {
    return new Promise((ok) => {
      let r;
      try { r = indexedDB.open('mando'); } catch (e) { return ok(null); }
      // Si la base no existe, no la creamos: la Fonoteca la necesita intacta
      r.onupgradeneeded = () => { try { r.transaction.abort(); } catch (e) {} ok(null); };
      r.onerror = () => ok(null);
      r.onsuccess = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('kv')) { db.close(); return ok(null); }
        const t = new Map(), d = new Map();
        const meter = (m, k, a) => { if (!k) return; (m.get(k) || m.set(k, []).get(k)).push(a); };
        try {
          const cur = db.transaction('kv').objectStore('kv').openCursor();
          cur.onsuccess = () => {
            const c = cur.result;
            if (!c) { db.close(); return ok(t.size ? { t, d } : null); }
            const k = String(c.key), v = c.value;
            if ((k === 'likes' || k === 'copiaLikesPistas' || k.indexOf('pl:') === 0) && v && Array.isArray(v.pistas)) {
              for (const p of v.pistas) {
                const a = normT((p.artists || []).map((x) => x.name).join(' '));
                meter(t, normT(p.title), a);
                meter(d, normT(p.album), a);
              }
            }
            c.continue();
          };
          cur.onerror = () => { db.close(); ok(null); };
        } catch (e) { db.close(); ok(null); }
      };
    });
  }
  function laTienes(i) {
    if (!TUYAS || i.tipo === 'hito') return false;
    const arts = (i.tipo === 'disco' ? TUYAS.d : TUYAS.t).get(normT(i.t));
    if (!arts) return false;
    const ks = clavesArt(i);
    return arts.some((a) => ks.some((k) => (' ' + a + ' ').indexOf(' ' + k + ' ') >= 0));
  }
  const tuyas = (h) => escuchables(h).filter(laTienes).length;

  /* ---------- pintado ---------- */
  function lado(actual) {
    $('#lado').innerHTML = '<div class="tit">Historias</div>' +
      '<a class="volver" href="mando.html">' + ic('atras') + 'Fonoteca</a>' +
      '<a href="#"' + (actual ? '' : ' class="on"') + '>' + ic('nota') + 'Todas</a>' +
      familias().map((f) => '<div class="sec">' + esc(f) + '</div>' +
        H.filter((h) => h.familia === f).map((h) =>
          '<a href="#h/' + h.id + '" style="--c:' + h.color + '"' + (actual === h.id ? ' class="on"' : '') + '><i class="pto"></i>' + esc(h.titulo) + '</a>').join('')).join('');
    const on = $('#lado a.on'); if (on && actual) on.scrollIntoView({ block: 'nearest' });
  }

  // Resalta los términos buscados dentro de un texto ya escapado
  function marcar(txt, terms) {
    let s = esc(txt);
    if (!terms || !terms.length) return s;
    const n = norm(s);
    const zonas = [];
    for (const t of terms) { let p = n.indexOf(t); while (p >= 0) { zonas.push([p, p + t.length]); p = n.indexOf(t, p + t.length); } }
    if (!zonas.length) return s;
    zonas.sort((a, b) => a[0] - b[0]);
    let out = '', ult = 0;
    for (const [a, b] of zonas) { if (a < ult) continue; out += s.slice(ult, a) + '<mark>' + s.slice(a, b) + '</mark>'; ult = b; }
    return out + s.slice(ult);
  }

  function fila(i, h, terms) {
    const hito = i.tipo === 'hito';
    const etiqueta = hito ? '<span class="tipo">hito</span>' : i.tipo === 'disco' ? '<span class="tipo">disco</span>' : '';
    const k = clave(h, i), oida = OIDAS.has(k);
    return '<li class="row' + (hito ? ' hito' : '') + (oida ? ' oida-on' : '') + '" style="--tinte:' + h.color + '">' +
      '<span class="anyo">' + esc(i.a) + '</span>' +
      '<div class="txt"><div class="t1">' + marcar(i.t, terms) + etiqueta + '</div><div class="t2">' + marcar(i.art, terms) +
      (laTienes(i) ? ' <span class="tuya">la tienes</span>' : '') + '</div>' +
      (i.n ? '<p class="nota">' + marcar(i.n, terms) + '</p>' : '') + '</div>' +
      (hito ? '' : '<button class="oida' + (oida ? ' on' : '') + '" data-k="' + esc(k) + '" title="' + (oida ? 'Escuchada' : 'Marcar como escuchada') + '" aria-pressed="' + oida + '">' + ic('check') + '</button>' +
        '<a class="btn sm oir" href="' + urlSpotify(i) + '" target="_blank" rel="noopener" title="Buscar en Spotify">' + ic('play') + '<span>Escuchar</span></a>') +
      '</li>';
  }

  function progreso(h) {
    const n = escuchables(h).length, o = oidas(h), t = tuyas(h);
    return '<div class="progreso" style="--tinte:' + h.color + '"><div class="barra"><i style="width:' + (n ? Math.round(100 * o / n) : 0) + '%"></i></div>' +
      '<span>' + (o ? 'Escuchadas ' + o + ' de ' + n : n + ' piezas por escuchar') + (t ? ' · tienes ' + t + ' en tu música' : '') + '</span></div>';
  }

  function tarjeta(h) {
    const n = escuchables(h).length, o = oidas(h), t = tuyas(h);
    const desde = (String(h.periodo).match(/\d{4}/) || [''])[0];
    return '<a class="tarj" href="#h/' + h.id + '" style="--c:' + h.color + '">' +
      '<span class="deco" aria-hidden="true">' + esc(desde) + '</span>' +
      '<span class="eti">' + esc(h.periodo) + '</span><b>' + esc(h.titulo) + '</b>' +
      '<span class="lema">' + esc(h.lema) + '</span>' +
      '<span class="cuenta">' + n + ' piezas' + (h.capitulos.length > 1 ? ' · ' + h.capitulos.length + ' capítulos' : '') +
      (t ? ' · tienes ' + t : '') + '</span>' +
      (o ? '<span class="mini"><i style="width:' + Math.round(100 * o / n) + '%"></i></span>' : '') + '</a>';
  }

  function portada() {
    lado(null);
    const fams = familias();
    let filtro = leer(K_FILTRO, '');
    if (fams.indexOf(filtro) < 0) filtro = '';
    const ultima = H.find((h) => h.id === leer(K_ULTIMA, ''));
    const total = H.reduce((s, h) => s + escuchables(h).length, 0);
    const oTot = H.reduce((s, h) => s + oidas(h), 0);
    main.innerHTML = '<div class="cab portada-cab"><span class="eti">Para leer y escuchar</span><h2>Historias de la música</h2>' +
      '<p>Cada historia es una lista elegida a mano y en orden cronológico, con el porqué de cada pieza. Sin algoritmos que te cuelen nada.</p>' +
      '<p class="resumen">' + H.length + ' historias · ' + fmt(total) + ' piezas' + (oTot ? ' · llevas ' + fmt(oTot) + ' escuchadas' : '') + '</p>' +
      '<div class="btnrow">' + (ultima ? '<a class="btn pri" href="#h/' + ultima.id + '" style="--tinte:' + ultima.color + '">' + ic('sig') + 'Sigue con «' + esc(ultima.titulo) + '»</a>' : '') +
      '<button class="btn" id="azar">' + ic('dado') + 'Una al azar</button></div></div>' +
      '<div class="filtros" role="tablist"><button class="chip' + (filtro ? '' : ' on') + '" data-f="">Todas</button>' +
      fams.map((f) => '<button class="chip' + (f === filtro ? ' on' : '') + '" data-f="' + esc(f) + '">' + esc(f) + '</button>').join('') + '</div>' +
      fams.filter((f) => !filtro || f === filtro).map((f) => '<section class="familia"><span class="eti">' + esc(f) +
        ' <i>' + H.filter((h) => h.familia === f).length + '</i></span><div class="rejilla">' +
        H.filter((h) => h.familia === f).map(tarjeta).join('') + '</div></section>').join('');
    $('#azar').onclick = () => {
      const pool = H.filter((h) => !filtro || h.familia === filtro);
      const sin = pool.filter((h) => !oidas(h));
      const l = sin.length ? sin : pool;
      location.hash = '#h/' + l[Math.floor(Math.random() * l.length)].id;
    };
    main.querySelector('.filtros').onclick = (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      guardar(K_FILTRO, b.dataset.f); cambiar(portada);
    };
  }

  let espia = null;
  function historia(h) {
    lado(h.id);
    guardar(K_ULTIMA, h.id);
    const varios = h.capitulos.length > 1;
    const sig = H[(H.indexOf(h) + 1) % H.length];
    const nHitos = piezas(h).length - escuchables(h).length;
    main.innerHTML = '<div class="hero" style="--tinte:' + h.color + '">' +
      '<a class="btn sm atras" href="#">' + ic('atras') + 'Todas</a>' +
      '<span class="eti">' + esc(h.familia) + ' · ' + esc(h.periodo) + '</span>' +
      '<h2>' + esc(h.titulo) + '</h2><p class="lema-h">' + esc(h.lema) + '</p><p>' + esc(h.intro) + '</p>' +
      '<div id="prog">' + progreso(h) + '</div>' +
      '<div class="btnrow"><a class="btn pri" href="mando.html?historia=' + h.id + '" title="La Fonoteca busca cada canción y crea la playlist en tu Spotify">' + ic('play') + 'Crear en mi Spotify</a>' +
      '<button class="btn" id="copiar">' + ic('copia') + 'Copiar lista</button></div>' +
      '<p class="datos">' + escuchables(h).length + ' piezas' + (nHitos ? ' · ' + nHitos + ' momentos clave' : '') + (varios ? ' · ' + h.capitulos.length + ' capítulos' : '') + '</p></div>' +
      (varios ? '<nav class="indice" style="--tinte:' + h.color + '">' + h.capitulos.map((c, k) => '<a class="chip" data-cap="' + (k + 1) + '" href="#h/' + h.id + '/' + (k + 1) + '">' + esc(c.corto || c.titulo) + '</a>').join('') + '</nav>' : '') +
      h.capitulos.map((c, k) => '<section class="capitulo" id="cap-' + (k + 1) + '" style="--tinte:' + h.color + '">' +
        (varios ? '<span class="eti">Capítulo ' + (k + 1) + '</span>' : '') +
        '<h3>' + esc(c.titulo) + '<span>' + esc(c.periodo) + '</span></h3>' +
        (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') +
        '<ol class="lista">' + c.items.map((i) => fila(i, h)).join('') + '</ol></section>').join('') +
      '<a class="siguiente" href="#h/' + sig.id + '" style="--c:' + sig.color + '"><span class="eti">Siguiente historia</span><b>' + esc(sig.titulo) + '</b>' + ic('sig') + '</a>';
    $('#copiar').onclick = () => {
      const txt = escuchables(h).map((i) => i.a + ' · ' + i.art + ' — ' + i.t).join('\n');
      navigator.clipboard.writeText(txt).then(() => toast('Lista copiada'), () => toast('No se pudo copiar'));
    };
    // El índice de capítulos marca dónde estás al hacer scroll
    if (espia) espia.disconnect();
    const ind = $('.indice');
    if (ind && 'IntersectionObserver' in window) {
      espia = new IntersectionObserver((ents) => {
        for (const e of ents) if (e.isIntersecting) {
          const n = e.target.id.slice(4);
          ind.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.cap === n));
          const on = ind.querySelector('.chip.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: MOV ? 'smooth' : 'auto' });
        }
      }, { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('.capitulo').forEach((s) => espia.observe(s));
    }
  }

  /* ---------- búsqueda ---------- */
  // Entiende décadas («80s», «años 80», «1980s»), años sueltos («1977») y varias palabras a la vez.
  function analizar(texto) {
    let q = norm(texto).trim(), desde = null, hasta = null;
    q = q.replace(/\b(?:(?:los\s+)?anos\s+)?(\d{2,4})s\b|\b(?:los\s+)?anos\s+(\d{2})\b|\blos\s+(\d0)\b/g, (m, a, b, c) => {
      let d = +(a || b || c);
      if (d < 100) d += d < 30 ? 2000 : 1900;
      if (d % 10 === 0) { desde = d; hasta = d + 9; return ' '; }
      return m;
    });
    q = q.replace(/\b(1[89]\d\d|20\d\d)\b/g, (m) => { desde = hasta = +m; return ' '; });
    const terms = q.split(/\s+/).filter((w) => w.length > 1 || /\d/.test(w));
    return { terms, desde, hasta };
  }
  let filtroBusca = 'todo';
  function resultados(texto) {
    lado(null);
    const { terms, desde, hasta } = analizar(texto);
    const historias = terms.length ? H.filter((h) => {
      const hay = norm(h.titulo + ' ' + h.lema + ' ' + h.familia + ' ' + h.capitulos.map((c) => c.titulo).join(' '));
      return terms.every((t) => hay.indexOf(t) >= 0);
    }) : [];
    const grupos = [];
    let total = 0;
    for (const h of H) {
      const tit = norm(h.titulo);
      const enc = [];
      h.capitulos.forEach((c, k) => c.items.forEach((i) => {
        if (filtroBusca === 'canciones' && i.tipo === 'hito') return;
        if (filtroBusca === 'hitos' && i.tipo !== 'hito') return;
        if (desde != null && (i.a < desde || i.a > hasta)) return;
        const hay = norm(i.art + ' ' + i.t + ' ' + (i.n || '') + ' ' + (i.alias || []).join(' ') + ' ' + c.titulo) + ' ' + tit;
        if (terms.every((t) => hay.indexOf(t) >= 0)) enc.push({ i, k });
      }));
      if (enc.length) { grupos.push({ h, enc }); total += enc.length; }
    }
    grupos.sort((a, b) => b.enc.length - a.enc.length);
    const rango = desde != null ? (desde === hasta ? ' · año ' + desde : ' · ' + desde + '–' + hasta) : '';
    let html = '<div class="cab busca-cab"><span class="eti">Buscar' + esc(rango) + '</span><h2>' + fmt(total) + ' resultado' + (total === 1 ? '' : 's') + '</h2>' +
      '<p class="resumen">' + (grupos.length ? 'En ' + grupos.length + ' historia' + (grupos.length === 1 ? '' : 's') : 'Prueba con un artista, un título, un año («1977») o una década («80s»).') + '</p>' +
      '<div class="filtros">' + [['todo', 'Todo'], ['canciones', 'Solo canciones'], ['hitos', 'Solo momentos clave']].map(([v, l]) =>
        '<button class="chip' + (filtroBusca === v ? ' on' : '') + '" data-b="' + v + '">' + l + '</button>').join('') + '</div></div>';
    if (historias.length) html += '<section class="familia"><span class="eti">Historias</span><div class="rejilla">' + historias.slice(0, 6).map(tarjeta).join('') + '</div></section>';
    let pintadas = 0;
    for (const { h, enc } of grupos) {
      if (pintadas > 400) { html += '<p class="resumen">Hay más resultados: afina la búsqueda.</p>'; break; }
      html += '<section class="grupo" style="--tinte:' + h.color + '"><a class="grupo-cab" href="#h/' + h.id + '"><i class="pto" style="--c:' + h.color + '"></i><b>' + esc(h.titulo) + '</b><span>' + enc.length + '</span></a>' +
        '<ol class="lista">' + enc.map(({ i }) => fila(i, h, terms)).join('') + '</ol></section>';
      pintadas += enc.length;
    }
    main.innerHTML = html;
    main.querySelector('.filtros').onclick = (e) => {
      const b = e.target.closest('[data-b]'); if (!b) return;
      filtroBusca = b.dataset.b; resultados(buscar.value.trim());
    };
  }

  // Marcar o desmarcar una pieza como escuchada
  main.addEventListener('click', (e) => {
    const b = e.target.closest('.oida'); if (!b) return;
    const k = b.dataset.k, on = !OIDAS.has(k);
    on ? OIDAS.add(k) : OIDAS.delete(k);
    guardar(K_OIDAS, [...OIDAS]);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    b.closest('.row').classList.toggle('oida-on', on);
    const h = H.find((x) => x.id === k.split('|')[0]), p = $('#prog');
    if (h && p) p.innerHTML = progreso(h);
    if (on && h && oidas(h) === escuchables(h).length) toast('¡Historia completa!');
  });

  // Cambio de pantalla con una entrada suave. (Las View Transitions del navegador
  // podían dejar la ruta esperando a un fotograma que no llegaba: se pinta ya.)
  function cambiar(fn) {
    fn();
    if (MOV) { main.classList.remove('entra'); void main.offsetWidth; main.classList.add('entra'); }
  }

  function ruta(mantenerScroll) {
    if (buscar.value.trim().length > 1) return resultados(buscar.value.trim());
    filtroBusca = 'todo';
    const m = location.hash.match(/^#h\/([^/]+)(?:\/(\d+))?/) || [];
    const h = H.find((x) => x.id === m[1]);
    document.title = h ? h.titulo + ' · Historias' : 'Historias de la música';
    const y = scrollY;
    if (!h) { portada(); scrollTo(0, mantenerScroll ? y : 0); return; }
    historia(h);
    if (mantenerScroll) return scrollTo(0, y);
    const destino = m[2] && document.getElementById('cap-' + m[2]);
    destino ? destino.scrollIntoView({ behavior: 'auto' }) : scrollTo(0, 0);
  }

  addEventListener('hashchange', () => { buscar.value = ''; cambiar(() => ruta()); });
  let _b;
  buscar.addEventListener('input', () => { clearTimeout(_b); _b = setTimeout(() => ruta(), 140); });
  addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== buscar) { e.preventDefault(); buscar.focus(); buscar.select(); }
    else if (e.key === 'Escape' && document.activeElement === buscar) { buscar.value = ''; buscar.blur(); ruta(); }
  });

  // Botón para volver arriba
  const arriba = document.createElement('button');
  arriba.className = 'arriba'; arriba.title = 'Volver arriba'; arriba.innerHTML = ic('arriba');
  arriba.onclick = () => scrollTo({ top: 0, behavior: MOV ? 'smooth' : 'auto' });
  document.body.append(arriba);
  addEventListener('scroll', () => arriba.classList.toggle('ver', scrollY > 900), { passive: true });

  ruta();
  leerFonoteca().then((t) => { if (t) { TUYAS = t; ruta(true); } });
})();

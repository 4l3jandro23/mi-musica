/* Motor de «Historias de la música» (historias.html), hermana de la Fonoteca.
   Lee window.HISTORIAS (lo rellenan los archivos de historias/datos/) y pinta:
   - #                 → portada: la de hoy, familias y filas de discos
   - #explorar[/fam]   → todas las historias en rejilla, con filtro y orden
   - #h/<id>[/n]       → una historia por caras (n = cara a la que saltar)
   - #crono, #juego[/id]
   Cada pieza: { a: año, art: artista, t: título, n: nota, tipo?: 'hito'|'disco', q?: búsqueda, alias?: [nombres], v?: veredicto }
   'hito' = momento clave sin audio; 'disco' = se escucha el álbum entero.
   No usa la API de Spotify: «Spotify» y «YouTube» abren una búsqueda, así no gasta cupo.
   «La tienes» sale de lo que la Fonoteca ya guardó en este aparato (IndexedDB «mando»):
   solo se lee, nunca se escribe. «Escuchada» se apunta en este aparato.
   Diseño 5 (2026-10-17): cada historia es una funda con su vinilo; los capítulos son caras (A, B, C…). */
(function () {
  const $ = (s) => document.querySelector(s);
  const H = window.HISTORIAS;
  const main = $('#main'), buscar = $('#buscar');
  const K_OIDAS = 'historias_oidas_v1', K_ULTIMA = 'historias_ultima_v1', K_FILTRO = 'historias_filtro_v1', K_ORDEN = 'historias_orden_v1';
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
    lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    izq: '<path d="M15 18l-6-6 6-6"/>',
    der: '<path d="M9 18l6-6-6-6"/>',
    hito: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    chispa: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mando: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="14" r="1"/>',
    casa: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    rejilla: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    disco: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.5-1 7.5-.6 10.5 1M7.6 12.8c2.9-.8 6-.4 8.4 1M8.3 15.9c2.2-.5 4.4-.3 6.3.8"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>'
  };
  // Veredicto de los mitos: v = 'falso' | 'cierto' | 'medias'
  const VER = { falso: 'Mito', cierto: 'Verdad', medias: 'A medias' };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICO[n] + '</svg>';
  $('.marca').innerHTML = ic('disco');
  $('#aFono').innerHTML = ic('atras') + '<span>Fonoteca</span>';
  $('#icoBusca').innerHTML = ic('lupa');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const piezas = (h) => h.capitulos.flatMap((c) => c.items);
  const escuchables = (h) => piezas(h).filter((i) => i.tipo !== 'hito');
  const busq = (i) => i.q || i.art + ' ' + i.t;
  const urlSpotify = (i) => 'https://open.spotify.com/search/' + encodeURIComponent(busq(i));
  const urlYouTube = (i) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(busq(i) + (i.tipo === 'disco' ? ' full album' : ''));
  const enlaces = (i, cls) => '<a class="oir sp ' + (cls || '') + '" href="' + urlSpotify(i) + '" target="_blank" rel="noopener" title="Buscar en Spotify">' + ic('spotify') + '<span>Spotify</span></a>' +
    '<a class="oir yt ' + (cls || '') + '" href="' + urlYouTube(i) + '" target="_blank" rel="noopener" title="Buscar en YouTube">' + ic('youtube') + '<span>YouTube</span></a>';

  /* Familias en un orden pensado (las desconocidas, al final), con su color y una línea de presentación */
  const FAM = {
    'Las 500': ['#c9a227', 'Los 500 mejores discos y canciones de la historia'],
    'Para cada momento': ['#f2994a', 'Estaciones, gimnasio, coche y estados de ánimo'],
    'La música por dentro': ['#5c6bc0', 'Instrumentos, vídeos, polémicas, inventos y plataformas'],
    'Especiales': ['#e86aa8', 'Listas temáticas, tu vida y rarezas'],
    'Historia': ['#9a7b4f', 'De la prehistoria a la Segunda Guerra Mundial'],
    'Pop': ['#ff7a59', 'Del pop de los 50 al hyperpop'],
    'Rock': ['#d0473a', 'Del rock and roll al metal'],
    'Hip hop': ['#d9a21b', 'Del Bronx al rage, estilo a estilo'],
    'Soul y funk': ['#b0623a', 'Soul, funk, disco y R&B'],
    'Electrónica': ['#3aa0e8', 'House, techno, trance y compañía'],
    'Bass music': ['#3e9e5e', 'Jungle, garage, dubstep y drum and bass'],
    'Latino': ['#e04f8a', 'Salsa, reguetón, México, Puerto Rico y más'],
    'España': ['#e0662a', 'De la copla a la Movida y el trap'],
    'Mundo': ['#2bb3a3', 'Música de todos los rincones'],
    'Jazz': ['#6b8cae', 'Del ragtime al jazz de hoy'],
    'Raíces americanas': ['#b5883b', 'Blues, country, folk y Estados Unidos'],
    'Clásica y cine': ['#7a5ad6', 'Clásica, ópera, cine y videojuegos'],
    'Discográficas': ['#6d6d7a', 'Los sellos que hicieron la historia']
  };
  const ORDEN_FAM = Object.keys(FAM);
  const familias = () => [...new Set(H.map((h) => h.familia))].sort((a, b) =>
    (ORDEN_FAM.indexOf(a) + 1 || 99) - (ORDEN_FAM.indexOf(b) + 1 || 99));
  const colorFam = (f) => (FAM[f] || ['#888'])[0];
  const lineaFam = (f) => (FAM[f] || ['', ''])[1];
  // El dibujo de la funda depende de la familia: así se reconoce de un vistazo
  const dibujo = (f) => Math.max(0, ORDEN_FAM.indexOf(f) - 3) % 6;
  const fmt = (n) => n.toLocaleString('es-ES');
  // Años: los de antes de Cristo llevan «a. C.»
  const fa = (a) => a < 0 ? (a <= -10000 ? fmt(-a) : String(-a)) + ' a. C.' : String(a);
  const inicio = (h) => Math.min(...piezas(h).map((i) => i.a));
  const fin = (h) => Math.max(...piezas(h).map((i) => i.a));
  // Los capítulos se leen como las caras de un disco
  const CARAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cara = (k) => CARAS[k] || String(k + 1);
  // Nombre corto para la portada de la funda: «Historia de la bachata» → «Bachata»
  const nombreFunda = (t) => {
    const s = String(t).replace(/^(?:la |una )?(?:breve )?historia (?:de (?:la |el |los |las )?|del )/i, '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  // Historias añadidas hace poco (salen en «Novedades» y con la etiqueta «Nueva»)
  const NUEVAS = ['bowie', 'moby', 'colon', 'daftpunk', 'himnos', 'abba', 'spinnin', 'swing', 'bebop', 'cooljazz', 'hardbop', 'freejazz', 'fusion', 'jazzlatino', 'vocesjazz', 'musicales', 'disney', 'anime'];
  const leer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

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

  /* ---------- piezas comunes ---------- */
  // La funda con su vinilo. grande = la de la cabecera de una historia
  function funda(h, grande) {
    const y0 = inicio(h), y1 = fin(h);
    return '<span class="disco' + (grande ? ' grande' : '') + '" style="--c:' + h.color + '" aria-hidden="true">' +
      '<span class="vinilo"><i></i></span>' +
      '<span class="funda" data-p="' + dibujo(h.familia) + '">' +
      '<span class="f-anyo">' + esc(fa(y0)) + (y1 !== y0 ? '<em>' + esc(fa(y1)) + '</em>' : '') + '</span>' +
      '<span class="f-tit">' + esc(nombreFunda(h.titulo)) + '</span>' +
      '<span class="f-fam">' + esc(h.familia) + '</span></span></span>';
  }

  function tarjeta(h) {
    const n = escuchables(h).length, o = oidas(h), t = tuyas(h);
    return '<a class="tarj" href="#h/' + h.id + '" style="--c:' + h.color + '">' + funda(h) +
      (NUEVAS.indexOf(h.id) >= 0 ? '<span class="nueva">Nueva</span>' : '') +
      '<span class="t-tit">' + esc(h.titulo) + '</span>' +
      '<span class="t-lema">' + esc(h.lema) + '</span>' +
      '<span class="t-meta">' + n + ' piezas' + (h.capitulos.length > 1 ? ' · ' + h.capitulos.length + ' caras' : '') + (t ? ' · tienes ' + t : '') + '</span>' +
      (o ? '<span class="mini"><i style="width:' + Math.round(100 * o / n) + '%"></i></span>' : '') + '</a>';
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

  // cod: posición en la cara («A3»); extra: html bajo el artista (p. ej. la historia de la que viene)
  function fila(i, h, terms, extra, cod) {
    const hito = i.tipo === 'hito';
    const etiqueta = (i.tipo === 'disco' ? '<span class="tipo">disco entero</span>' : '') +
      (VER[i.v] ? '<span class="veredicto ' + i.v + '">' + VER[i.v] + '</span>' : '');
    const pos = cod && /^#/.test(cod) ? '<em class="pos">' + cod.slice(1) + '</em>' : '';
    const anyo = pos + (i.a < 0 ? (i.a <= -10000 ? fmt(-i.a) : -i.a) + '<small>a. C.</small>' : esc(i.a));
    if (hito) {
      return '<li class="row hito" style="--tinte:' + h.color + '"><span class="anyo">' + anyo + '</span>' +
        '<div class="txt"><span class="h-eti">' + ic('hito') + 'Momento clave</span><div class="t1">' + marcar(i.t, terms) + etiqueta + '</div>' +
        '<div class="t2">' + marcar(i.art, terms) + '</div>' + (extra || '') +
        (i.n ? '<p class="nota">' + marcar(i.n, terms) + '</p>' : '') + '</div></li>';
    }
    const k = clave(h, i), oida = OIDAS.has(k);
    return '<li class="row' + (oida ? ' oida-on' : '') + '" style="--tinte:' + h.color + '">' +
      '<span class="anyo">' + anyo + (cod && !pos ? '<b>' + cod + '</b>' : '') + '</span>' +
      '<div class="txt"><div class="t1">' + marcar(i.t, terms) + etiqueta + '</div><div class="t2">' + marcar(i.art, terms) +
      (laTienes(i) ? ' <span class="tuya">la tienes</span>' : '') + '</div>' + (extra || '') +
      (i.n ? '<p class="nota">' + marcar(i.n, terms) + '</p>' : '') + '</div>' +
      '<div class="acc"><button class="oida' + (oida ? ' on' : '') + '" data-k="' + esc(k) + '" title="' + (oida ? 'Escuchada' : 'Marcar como escuchada') + '" aria-label="Escuchada" aria-pressed="' + oida + '">' + ic('check') + '</button>' +
      enlaces(i) + '</div></li>';
  }

  function progreso(h) {
    const n = escuchables(h).length, o = oidas(h), t = tuyas(h);
    return '<div class="progreso"><div class="barra"><i style="width:' + (n ? Math.round(100 * o / n) : 0) + '%"></i></div>' +
      '<span>' + (o ? 'Escuchadas ' + o + ' de ' + n : n + ' piezas por escuchar') + (t ? ' · tienes ' + t + ' en tu música' : '') + '</span></div>';
  }

  // Una fila horizontal de discos, con flechas en el ordenador
  function carrusel(titulo, sub, color, lista, ver) {
    return '<section class="fila-discos" style="--c:' + color + '"><div class="fd-cab"><div class="fd-txt"><h2>' + esc(titulo) + '</h2>' +
      (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' + (ver ? '<a class="btn sm" href="' + ver + '">Ver todas</a>' : '') +
      '<button class="flecha" data-dir="-1" aria-label="Anteriores">' + ic('izq') + '</button><button class="flecha" data-dir="1" aria-label="Siguientes">' + ic('der') + '</button></div>' +
      '<div class="pista">' + lista.map(tarjeta).join('') + '</div></section>';
  }

  // Un momento clave al azar, para descubrir historias
  function sabiasQue() {
    const todos = [];
    H.forEach((h) => h.capitulos.forEach((c, k) => c.items.forEach((i) => { if (i.tipo === 'hito' && i.n) todos.push({ h, i, k }); })));
    if (!todos.length) return '';
    const { h, i, k } = todos[Math.floor(Math.random() * todos.length)];
    return '<a class="sabias" href="#h/' + h.id + '/' + (k + 1) + '" style="--c:' + h.color + '"><span class="s-anyo">' + esc(fa(i.a)) + '</span>' +
      '<span class="s-txt"><span class="eti">' + ic('chispa') + '¿Sabías que…?</span><b>' + esc(i.art) + ': ' + esc(i.t) + '</b><span class="nota">' + esc(i.n) + '</span>' +
      '<span class="de">' + esc(h.titulo) + ic('sig') + '</span></span></a>';
  }

  /* ---------- navegación: lateral en el ordenador y pestañas abajo en el móvil ---------- */
  const hashFam = (f) => '#explorar/' + encodeURIComponent(f);
  function lado(actual) {
    const sec = actual === 'crono' || actual === 'juego' || actual === 'explorar' ? actual : actual ? 'h' : 'inicio';
    $('#lado').innerHTML = '<a class="tit" href="#"><i class="marca">' + ic('disco') + '</i>Historias</a>' +
      '<a class="volver" href="mando.html">' + ic('atras') + 'Fonoteca</a>' +
      '<a href="#"' + (sec === 'inicio' ? ' class="on"' : '') + '>' + ic('casa') + 'Inicio</a>' +
      '<a href="#explorar"' + (sec === 'explorar' ? ' class="on"' : '') + '>' + ic('rejilla') + 'Explorar</a>' +
      '<a href="#crono"' + (sec === 'crono' ? ' class="on"' : '') + '>' + ic('reloj') + 'Cronología</a>' +
      '<a href="#juego"' + (sec === 'juego' ? ' class="on"' : '') + '>' + ic('mando') + 'Juego</a>' +
      '<div class="sec">Familias</div>' +
      familias().map((f) => {
        const hs = H.filter((h) => h.familia === f);
        const abierta = hs.some((h) => h.id === actual);
        return '<details class="grupo-lado"' + (abierta ? ' open' : '') + ' style="--c:' + colorFam(f) + '"><summary><i class="pto"></i>' + esc(f) + '<span>' + hs.length + '</span></summary>' +
          hs.map((h) => '<a href="#h/' + h.id + '" style="--c:' + h.color + '"' + (actual === h.id ? ' class="on"' : '') + '><i class="pto"></i>' + esc(h.titulo) + '</a>').join('') + '</details>';
      }).join('');
    const on = $('#lado a.on'); if (on && actual) on.scrollIntoView({ block: 'nearest' });
    $('#tabs').innerHTML = [['inicio', '#', 'casa', 'Inicio'], ['explorar', '#explorar', 'rejilla', 'Explorar'], ['crono', '#crono', 'reloj', 'Cronología'], ['juego', '#juego', 'mando', 'Juego']]
      .map(([id, href, i, txt]) => '<a href="' + href + '"' + (sec === id ? ' class="on" aria-current="page"' : '') + '>' + ic(i) + '<span>' + txt + '</span></a>').join('');
  }

  // La de hoy: cambia cada día y es la misma en todos los aparatos
  function deHoy() {
    const d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    return H[(n * 37) % H.length];
  }

  function portada() {
    lado(null);
    const fams = familias();
    const ultima = H.find((h) => h.id === leer(K_ULTIMA, ''));
    const hoy = deHoy();
    const total = H.reduce((s, h) => s + escuchables(h).length, 0);
    const nHitos = H.reduce((s, h) => s + piezas(h).length - escuchables(h).length, 0);
    const oTot = H.reduce((s, h) => s + oidas(h), 0);
    const empezadas = H.filter((h) => oidas(h) && oidas(h) < escuchables(h).length);
    let html = '<section class="p-hero">' +
      '<div class="p-txt"><span class="eti">Una discoteca para leer y escuchar</span><h1>Historias<br>de la música</h1>' +
      '<p>Cada historia es un disco hecho a mano: canciones en orden, cada una con su porqué. Sin algoritmos que te cuelen nada.</p>' +
      '<p class="cuenta-total">' + H.length + ' historias · ' + fmt(total) + ' canciones · ' + fmt(nHitos) + ' momentos clave' + (oTot ? ' · ' + fmt(oTot) + ' escuchadas' : '') + '</p>' +
      '<div class="btnrow">' + (ultima ? '<a class="btn pri" href="#h/' + ultima.id + '" style="--tinte:' + ultima.color + '">' + ic('play') + 'Sigue con «' + esc(nombreFunda(ultima.titulo)) + '»</a>' : '') +
      '<button class="btn" id="azar">' + ic('dado') + 'Una al azar</button><a class="btn" href="#explorar">' + ic('rejilla') + 'Ver todas</a></div></div>' +
      '<a class="p-hoy" href="#h/' + hoy.id + '" style="--c:' + hoy.color + '">' + funda(hoy, true) +
      '<span class="hoy-pie"><span class="eti">Hoy suena</span><b>' + esc(hoy.titulo) + '</b><span>' + esc(hoy.lema) + '</span></span></a></section>';
    html += '<nav class="fams" aria-label="Familias">' + fams.map((f) => '<a class="chip" href="' + hashFam(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) +
      '<em>' + H.filter((h) => h.familia === f).length + '</em></a>').join('') + '</nav>';
    html += sabiasQue();
    if (empezadas.length) html += carrusel('Seguir escuchando', 'Las que tienes a medias', 'var(--acc)', empezadas);
    const nuevas = H.filter((h) => NUEVAS.indexOf(h.id) >= 0);
    if (nuevas.length) html += carrusel('Recién llegadas', nuevas.length + ' historias nuevas', '#d4568a', nuevas);
    html += fams.map((f) => {
      const hs = H.filter((h) => h.familia === f);
      return carrusel(f, lineaFam(f) + ' · ' + hs.length, colorFam(f), hs, hashFam(f));
    }).join('');
    main.innerHTML = html;
    $('#azar').onclick = () => {
      const sin = H.filter((h) => !oidas(h));
      const l = sin.length ? sin : H;
      location.hash = '#h/' + l[Math.floor(Math.random() * l.length)].id;
    };
    main.onclick = flechas;
  }
  function flechas(e) {
    const fl = e.target.closest('.flecha');
    if (fl) { const p = fl.closest('.fila-discos').querySelector('.pista'); p.scrollBy({ left: +fl.dataset.dir * p.clientWidth * 0.85, behavior: MOV ? 'smooth' : 'auto' }); }
  }

  function explorar(fam) {
    lado('explorar');
    const fams = familias();
    const filtro = fams.indexOf(fam) >= 0 ? fam : '';
    const orden = leer(K_ORDEN, 'defecto');
    let lista = H.filter((h) => !filtro || h.familia === filtro);
    if (orden === 'crono') lista = lista.slice().sort((a, b) => inicio(a) - inicio(b));
    else if (orden === 'az') lista = lista.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    else if (orden === 'grande') lista = lista.slice().sort((a, b) => piezas(b).length - piezas(a).length);
    else if (orden === 'nuevas') lista = lista.slice().sort((a, b) => (NUEVAS.indexOf(b.id) >= 0) - (NUEVAS.indexOf(a.id) >= 0));
    main.innerHTML = '<div class="cab" style="--c:' + (filtro ? colorFam(filtro) : 'var(--acc)') + '"><span class="eti">' + ic('rejilla') + ' Explorar</span>' +
      '<h1>' + esc(filtro || 'Todas las historias') + '</h1><p>' + esc(filtro ? lineaFam(filtro) + '.' : 'Las ' + H.length + ' historias, de la prehistoria al último TikTok.') + ' ' + lista.length + ' discos.</p></div>' +
      '<div class="filtros"><a class="chip' + (filtro ? '' : ' on') + '" href="#explorar">Todas</a>' +
      fams.map((f) => '<a class="chip' + (f === filtro ? ' on' : '') + '" href="' + hashFam(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) + '</a>').join('') + '</div>' +
      '<div class="orden"><span>Ordenar</span>' + [['defecto', 'Recomendado'], ['crono', 'Por época'], ['az', 'A-Z'], ['grande', 'Más largas'], ['nuevas', 'Nuevas primero']].map(([v, l]) =>
        '<button class="chip' + (orden === v ? ' on' : '') + '" data-o="' + v + '">' + l + '</button>').join('') + '</div>' +
      '<div class="rejilla">' + lista.map(tarjeta).join('') + '</div>';
    const on = main.querySelector('.filtros .chip.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
    main.onclick = (e) => {
      const o = e.target.closest('[data-o]');
      if (o) { guardar(K_ORDEN, o.dataset.o); cambiar(() => explorar(fam)); }
    };
  }

  let espia = null;
  function historia(h) {
    main.onclick = null;
    lado(h.id);
    guardar(K_ULTIMA, h.id);
    const varios = h.capitulos.length > 1;
    const fam = H.filter((x) => x.familia === h.familia);
    const sig = fam.length > 1 ? fam[(fam.indexOf(h) + 1) % fam.length] : H[(H.indexOf(h) + 1) % H.length];
    const ant = fam.length > 2 ? fam[(fam.indexOf(h) - 1 + fam.length) % fam.length] : null;
    const nHitos = piezas(h).length - escuchables(h).length;
    let rk = 0;
    main.innerHTML = '<div class="hero" style="--tinte:' + h.color + ';--c:' + h.color + '">' +
      '<div class="migas"><a class="btn sm vidrio" href="#">' + ic('atras') + 'Inicio</a><a class="btn sm vidrio" href="' + hashFam(h.familia) + '"><i class="pto" style="--c:' + colorFam(h.familia) + '"></i>' + esc(h.familia) + '</a></div>' +
      '<div class="hero-in">' + funda(h, true) +
      '<div class="hero-txt"><span class="eti">' + esc(h.periodo) + '</span>' +
      '<h1>' + esc(h.titulo) + '</h1><p class="lema-h">' + esc(h.lema) + '</p>' +
      '<p class="datos">' + escuchables(h).length + ' piezas' + (nHitos ? ' · ' + nHitos + ' momentos clave' : '') + (varios && !h.ranking ? ' · ' + h.capitulos.length + ' caras' : '') + '</p>' +
      '<div id="prog">' + progreso(h) + '</div>' +
      '<div class="btnrow"><a class="btn pri" href="mando.html?historia=' + h.id + '" title="La Fonoteca busca cada canción y crea la playlist en tu Spotify">' + ic('spotify') + 'Crear en mi Spotify</a>' +
      '<button class="btn" id="copiar">' + ic('copia') + 'Copiar lista</button>' +
      '<a class="btn" href="#juego/' + h.id + '" title="Adivina el año de las piezas de esta historia">' + ic('mando') + 'Ponte a prueba</a></div></div></div>' +
      '<p class="intro">' + esc(h.intro) + '</p></div>' +
      (varios ? '<nav class="indice" style="--tinte:' + h.color + '" aria-label="Caras">' + h.capitulos.map((c, k) => '<a class="chip" data-cap="' + (k + 1) + '" href="#h/' + h.id + '/' + (k + 1) + '">' + (h.ranking ? '' : '<b>' + cara(k) + '</b>') + esc(c.corto || c.titulo) + '</a>').join('') + '</nav>' : '') +
      h.capitulos.map((c, k) => {
        let n = 0;
        const L = cara(k);
        if (h.ranking) {
          return '<section class="capitulo" id="cap-' + (k + 1) + '" style="--tinte:' + h.color + '">' +
            '<header class="cap-cab"><div><span class="eti">Puestos ' + esc(c.corto || c.titulo) + '</span><h2>' + esc(c.titulo) + '</h2>' + (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') + '</div></header>' +
            '<ol class="lista">' + c.items.map((i) => fila(i, h, null, '', i.tipo === 'hito' ? '' : '#' + (++rk))).join('') + '</ol></section>';
        }
        return '<section class="capitulo" id="cap-' + (k + 1) + '" style="--tinte:' + h.color + '">' +
          '<header class="cap-cab">' + (varios ? '<span class="letra">' + L + '</span>' : '') + '<div><span class="eti">' + (varios ? 'Cara ' + L + ' · ' : '') + esc(c.periodo) + '</span>' +
          '<h2>' + esc(c.titulo) + '</h2>' + (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') + '</div></header>' +
          '<ol class="lista">' + c.items.map((i) => fila(i, h, null, '', i.tipo === 'hito' ? '' : (varios ? L : '') + (++n))).join('') + '</ol></section>';
      }).join('') +
      '<div class="nav-fin">' + (ant ? '<a class="siguiente ant" href="#h/' + ant.id + '" style="--c:' + ant.color + '">' + ic('atras') + '<span><span class="eti">Anterior en ' + esc(h.familia) + '</span><b>' + esc(ant.titulo) + '</b></span></a>' : '') +
      '<a class="siguiente" href="#h/' + sig.id + '" style="--c:' + sig.color + '"><span><span class="eti">Siguiente' + (fam.length > 1 ? ' en ' + esc(h.familia) : ' historia') + '</span><b>' + esc(sig.titulo) + '</b></span>' + ic('sig') + '</a></div>';
    $('#copiar').onclick = () => {
      const txt = escuchables(h).map((i) => fa(i.a) + ' · ' + i.art + ' — ' + i.t).join('\n');
      navigator.clipboard.writeText(txt).then(() => toast('Lista copiada'), () => toast('No se pudo copiar'));
    };
    // El índice de caras marca dónde estás al hacer scroll
    if (espia) espia.disconnect();
    const ind = $('.indice');
    if (ind && 'IntersectionObserver' in window) {
      espia = new IntersectionObserver((ents) => {
        for (const e of ents) if (e.isIntersecting) {
          const n = e.target.id.slice(4);
          ind.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.cap === n));
          const on = ind.querySelector('.chip.on');
          if (on) ind.scrollTo({ left: on.offsetLeft - ind.clientWidth / 2 + on.clientWidth / 2, behavior: MOV ? 'smooth' : 'auto' });
        }
      }, { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('.capitulo').forEach((s) => espia.observe(s));
    }
  }

  /* ---------- cronología: todos los momentos clave en una sola línea del tiempo ---------- */
  let cronoFam = '';
  const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX'];
  const etapa = (a) => a < 0 ? 'Antes de Cristo' : a < 1500 ? 'Antigüedad y Edad Media' : a < 1900 ? 'Siglo ' + ROM[Math.floor(a / 100) + 1] : Math.floor(a / 10) * 10 + 's';
  function cronologia() {
    main.onclick = null;
    lado('crono');
    const todos = [];
    H.forEach((h) => h.capitulos.forEach((c, k) => c.items.forEach((i) => {
      if (i.tipo === 'hito' && (!cronoFam || h.familia === cronoFam)) todos.push({ h, i, k });
    })));
    todos.sort((x, y) => x.i.a - y.i.a || x.h.titulo.localeCompare(y.h.titulo, 'es'));
    const grupos = [];
    let g = null;
    for (const e of todos) { const n = etapa(e.i.a); if (!g || g.n !== n) grupos.push(g = { n, l: [] }); g.l.push(e); }
    main.innerHTML = '<div class="cab" style="--c:var(--acc)"><span class="eti">' + ic('reloj') + ' Toda la historia de un vistazo</span><h1>Cronología</h1>' +
      '<p>Los ' + fmt(todos.length) + ' momentos clave de todas las historias, del más antiguo al más reciente. Pulsa en la historia para leer el contexto.</p></div>' +
      '<div class="filtros quieto"><button class="chip' + (cronoFam ? '' : ' on') + '" data-cf="">Todas</button>' +
      familias().map((f) => '<button class="chip' + (f === cronoFam ? ' on' : '') + '" data-cf="' + esc(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) + '</button>').join('') + '</div>' +
      '<nav class="indice saltos">' + grupos.map((g, n) => '<button class="chip" data-s="' + n + '">' + esc(g.n) + '</button>').join('') + '</nav>' +
      grupos.map((g, n) => '<section class="capitulo crono-sec" id="ct-' + n + '" style="--tinte:var(--acc)"><header class="cap-cab"><div><span class="eti">' + g.l.length + ' momento' + (g.l.length === 1 ? '' : 's') + '</span><h2>' + esc(g.n) + '</h2></div></header>' +
        '<ol class="lista">' + g.l.map(({ h, i, k }) => fila(i, h, null, '<a class="de-h" href="#h/' + h.id + '/' + (k + 1) + '" style="--c:' + h.color + '"><i class="pto"></i>' + esc(h.titulo) + '</a>')).join('') + '</ol></section>').join('');
    main.onclick = (e) => {
      const f = e.target.closest('[data-cf]');
      if (f) { cronoFam = f.dataset.cf; cambiar(cronologia); scrollTo(0, 0); return; }
      const s = e.target.closest('[data-s]');
      if (s) { const el = document.getElementById('ct-' + s.dataset.s); if (el) el.scrollIntoView({ behavior: MOV ? 'smooth' : 'auto' }); }
    };
  }

  /* ---------- juego: ¿de qué año es? y ¿mito o verdad? ---------- */
  const K_JUEGO = 'historias_juego_v1';
  let JG = null;
  const azar = (l) => l[Math.floor(Math.random() * l.length)];
  const barajar = (l) => { for (let n = l.length - 1; n > 0; n--) { const m = Math.floor(Math.random() * (n + 1)); [l[n], l[m]] = [l[m], l[n]]; } return l; };
  // Tres años falsos cerca del bueno (más separados cuanto más antiguo)
  function opcionesAnyo(a) {
    const paso = a < 0 ? Math.max(100, Math.round(-a * 0.12 / 100) * 100) : a < 1800 ? 20 : a < 1950 ? 4 : 2;
    const s = new Set([a]);
    for (let n = 0; s.size < 4 && n < 300; n++) {
      let y = a + (Math.floor(Math.random() * 6) + 1) * paso * (Math.random() < 0.5 ? -1 : 1);
      if (a > 0 && y > 2026) y = a - (y - a);
      if (a > 0 && y <= 0) continue;
      s.add(y);
    }
    return barajar([...s]);
  }
  const partes = (n) => { const m = String(n).match(/^Se dice: (.*?)\s*Realidad: (.*)$/); return m ? { dice: m[1], real: m[2] } : { dice: n, real: '' }; };
  function juego(id) {
    main.onclick = null;
    lado('juego');
    const h0 = H.find((x) => x.id === id) || null;
    const hayMitos = (h) => piezas(h).some((i) => VER[i.v]);
    let modo = JG && JG.id === (h0 ? h0.id : '') ? JG.modo : (h0 && hayMitos(h0) ? 'mito' : 'anyo');
    if (h0 && modo === 'mito' && !hayMitos(h0)) modo = 'anyo';
    if (!JG || JG.id !== (h0 ? h0.id : '') || JG.modo !== modo) JG = { id: h0 ? h0.id : '', modo, ac: 0, ro: 0, racha: 0, q: null, resp: null };
    const st = leer(K_JUEGO, { anyo: 0, mito: 0 });
    if (!JG.q) {
      const pool = [];
      (h0 ? [h0] : H).forEach((h) => h.capitulos.forEach((c, k) => c.items.forEach((i) => {
        if (modo === 'mito' ? VER[i.v] : i.a != null) pool.push({ h, i, k });
      })));
      let q = azar(pool);
      if (JG.ult && pool.length > 1) for (let n = 0; n < 5 && q.i === JG.ult; n++) q = azar(pool);
      JG.q = q; JG.ult = q.i; JG.resp = null;
      JG.ops = modo === 'mito' ? ['falso', 'cierto', 'medias'] : opcionesAnyo(q.i.a);
    }
    const { h, i, k } = JG.q, resp = JG.resp, bien = modo === 'mito' ? i.v : i.a;
    const p = partes(i.n);
    const etOp = (o) => modo === 'mito' ? VER[o] : fa(o);
    let html = '<div class="cab" style="--c:var(--acc)"><span class="eti">' + ic('mando') + (h0 ? ' Con «' + esc(h0.titulo) + '»' : ' Con todas las historias') + '</span><h1>' + (modo === 'mito' ? '¿Mito o verdad?' : '¿De qué año es?') + '</h1>' +
      '<div class="filtros quieto"><button class="chip' + (modo === 'anyo' ? ' on' : '') + '" data-jm="anyo">¿De qué año?</button>' +
      (!h0 || hayMitos(h0) ? '<button class="chip' + (modo === 'mito' ? ' on' : '') + '" data-jm="mito">¿Mito o verdad?</button>' : '') +
      (h0 ? '<a class="chip" href="#juego">Todas las historias</a>' : '') + '</div>' +
      '<div class="marcador"><span><b>' + JG.ac + '</b> de ' + JG.ro + '</span><span>Racha <b>' + JG.racha + '</b></span><span>Mejor racha <b>' + (st[modo] || 0) + '</b></span></div></div>' +
      '<div class="jcarta' + (resp == null ? '' : resp === bien ? ' ok' : ' mal') + '" style="--c:' + h.color + '">' +
      '<span class="eti">' + (modo === 'mito' ? 'Se dice que…' : i.tipo === 'hito' ? ic('hito') + 'Momento clave' : i.tipo === 'disco' ? 'Disco' : 'Canción') + '</span>' +
      (modo === 'mito' ? '<b class="pregunta">' + esc(p.dice) + '</b><span class="sub">' + esc(i.art) + ' · ' + esc(i.t) + '</span>'
        : '<b class="pregunta">' + esc(i.t) + '</b><span class="sub">' + esc(i.art) + '</span>') +
      '<div class="jops">' + JG.ops.map((o, n) => '<button class="jop' + (resp == null ? '' : o === bien ? ' bien' : o === resp ? ' fallo' : ' apagada') + '" data-op="' + n + '"' + (resp == null ? '' : ' disabled') + '><kbd>' + (n + 1) + '</kbd>' + esc(etOp(o)) + '</button>').join('') + '</div>' +
      (resp == null ? '' : '<div class="jsol"><b>' + (resp === bien ? '¡Bien!' : modo === 'mito' ? 'Es «' + VER[bien] + '»' : 'Es de ' + fa(bien)) + '</b>' +
        '<p>' + esc(modo === 'mito' ? (p.real ? 'Realidad: ' + p.real : i.n) : i.n) + '</p>' +
        '<div class="btnrow"><button class="btn pri" id="jsig" style="--tinte:' + h.color + '">' + ic('sig') + 'Siguiente</button>' +
        (i.tipo === 'hito' ? '' : enlaces(i, 'btn')) +
        '<a class="btn" href="#h/' + h.id + '/' + (k + 1) + '">' + ic('disco') + esc(h.titulo) + '</a></div></div>') +
      '</div>';
    main.innerHTML = html;
    main.onclick = (e) => {
      const m = e.target.closest('[data-jm]');
      if (m) { JG = { id: JG.id, modo: m.dataset.jm, ac: 0, ro: 0, racha: 0, q: null }; cambiar(() => juego(id)); return; }
      const o = e.target.closest('[data-op]');
      if (o && JG.resp == null) return responder(+o.dataset.op, id);
      if (e.target.closest('#jsig')) { JG.q = null; cambiar(() => juego(id)); }
    };
  }
  function responder(n, id) {
    const bien = JG.modo === 'mito' ? JG.q.i.v : JG.q.i.a;
    JG.resp = JG.ops[n]; JG.ro++;
    if (JG.resp === bien) {
      JG.ac++; JG.racha++;
      const st = leer(K_JUEGO, { anyo: 0, mito: 0 });
      if (JG.racha > (st[JG.modo] || 0)) { st[JG.modo] = JG.racha; guardar(K_JUEGO, st); if (JG.racha > 2) toast('¡Nueva mejor racha: ' + JG.racha + '!'); }
    } else JG.racha = 0;
    juego(id);
  }
  // Teclas 1-4 para responder e Intro para la siguiente
  addEventListener('keydown', (e) => {
    if (!JG || !/^#juego/.test(location.hash) || document.activeElement === buscar || e.metaKey || e.ctrlKey || e.altKey) return;
    const id = location.hash.split('/')[1];
    if (JG.resp == null && /^[1-4]$/.test(e.key) && +e.key <= JG.ops.length) { e.preventDefault(); responder(+e.key - 1, id); }
    else if (JG.resp != null && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); JG.q = null; juego(id); }
  });

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
    main.onclick = null;
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
    let html = '<div class="cab" style="--c:var(--acc)"><span class="eti">' + ic('lupa') + ' Buscar' + esc(rango) + '</span><h1>' + fmt(total) + ' resultado' + (total === 1 ? '' : 's') + '</h1>' +
      '<p>' + (grupos.length ? 'En ' + grupos.length + ' historia' + (grupos.length === 1 ? '' : 's') + '.' : 'Prueba con un artista, un título, un año («1977») o una década («80s»).') + '</p>' +
      '<div class="filtros quieto">' + [['todo', 'Todo'], ['canciones', 'Solo canciones'], ['hitos', 'Solo momentos clave']].map(([v, l]) =>
        '<button class="chip' + (filtroBusca === v ? ' on' : '') + '" data-b="' + v + '">' + l + '</button>').join('') + '</div></div>';
    if (historias.length) html += '<section class="fila-discos"><div class="fd-cab"><div class="fd-txt"><h2>Historias</h2></div></div><div class="rejilla">' + historias.slice(0, 8).map(tarjeta).join('') + '</div></section>';
    let pintadas = 0;
    for (const { h, enc } of grupos) {
      if (pintadas > 400) { html += '<p class="aviso">Hay más resultados: afina la búsqueda.</p>'; break; }
      html += '<section class="grupo" style="--tinte:' + h.color + '"><a class="grupo-cab" href="#h/' + h.id + '"><i class="pto" style="--c:' + h.color + '"></i><b>' + esc(h.titulo) + '</b><span>' + enc.length + '</span>' + ic('sig') + '</a>' +
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
    const y = scrollY;
    if (location.hash === '#crono') { document.title = 'Cronología · Historias'; cronologia(); scrollTo(0, mantenerScroll ? y : 0); return; }
    const j = location.hash.match(/^#juego(?:\/([^/]+))?/);
    if (j) { document.title = 'Juego · Historias'; juego(j[1]); if (!mantenerScroll) scrollTo(0, 0); return; }
    const x = location.hash.match(/^#explorar(?:\/(.+))?/);
    if (x) {
      let f = ''; try { f = decodeURIComponent(x[1] || ''); } catch (e) {}
      document.title = (f || 'Explorar') + ' · Historias'; explorar(f); scrollTo(0, mantenerScroll ? y : 0); return;
    }
    const m = location.hash.match(/^#h\/([^/]+)(?:\/(\d+))?/) || [];
    const h = H.find((x) => x.id === m[1]);
    document.title = h ? h.titulo + ' · Historias' : 'Historias de la música';
    if (!h) { portada(); scrollTo(0, mantenerScroll ? y : 0); return; }
    historia(h);
    if (mantenerScroll) return scrollTo(0, y);
    const destino = m[2] && document.getElementById('cap-' + m[2]);
    destino ? destino.scrollIntoView({ behavior: 'auto' }) : scrollTo(0, 0);
  }

  // Enlaces antiguos: el filtro de familia de la portada ahora es #explorar/<familia>
  if (!location.hash && leer(K_FILTRO, '')) guardar(K_FILTRO, '');

  addEventListener('hashchange', () => { buscar.value = ''; document.body.classList.remove('buscando'); cambiar(() => ruta()); });
  let _b;
  buscar.addEventListener('input', () => { clearTimeout(_b); _b = setTimeout(() => ruta(), 140); });
  addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== buscar) { e.preventDefault(); buscar.focus(); buscar.select(); }
    else if (e.key === 'Escape' && document.activeElement === buscar) { buscar.value = ''; buscar.blur(); ruta(); }
  });
  buscar.addEventListener('focus', () => document.body.classList.add('buscando'));
  buscar.addEventListener('blur', () => { if (!buscar.value) document.body.classList.remove('buscando'); });

  // Botón para volver arriba
  const arriba = document.createElement('button');
  arriba.className = 'arriba'; arriba.title = 'Volver arriba'; arriba.setAttribute('aria-label', 'Volver arriba'); arriba.innerHTML = ic('arriba');
  arriba.onclick = () => scrollTo({ top: 0, behavior: MOV ? 'smooth' : 'auto' });
  document.body.append(arriba);
  addEventListener('scroll', () => arriba.classList.toggle('ver', scrollY > 900), { passive: true });

  ruta();
  leerFonoteca().then((t) => { if (t) { TUYAS = t; ruta(true); } });
})();

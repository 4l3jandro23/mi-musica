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
    mando: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="14" r="1"/>'
  };
  // Veredicto de los mitos: v = 'falso' | 'cierto' | 'medias'
  const VER = { falso: 'Mito', cierto: 'Verdad', medias: 'A medias' };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24">' + ICO[n] + '</svg>';
  $('.marca').innerHTML = ic('nota');
  $('#aFono').innerHTML = ic('atras') + '<span>Fonoteca</span>';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const piezas = (h) => h.capitulos.flatMap((c) => c.items);
  const escuchables = (h) => piezas(h).filter((i) => i.tipo !== 'hito');
  const urlSpotify = (i) => 'https://open.spotify.com/search/' + encodeURIComponent(i.q || i.art + ' ' + i.t);
  /* Familias en un orden pensado (las desconocidas, al final), con su color y una línea de presentación */
  const FAM = {
    'Especiales': ['#e86aa8', 'Listas temáticas, tu vida y rarezas'],
    'Historia': ['#9a7b4f', 'De la prehistoria a la Segunda Guerra Mundial'],
    'Pop': ['#ff7a59', 'Del pop de los 50 al hyperpop'],
    'Rock': ['#d0473a', 'Del rock and roll al metal'],
    'Hip hop': ['#d9a21b', 'Del Bronx al rage, estilo a estilo'],
    'Soul y funk': ['#b0623a', 'Soul, funk, disco y R&B'],
    'Electrónica': ['#3aa0e8', 'House, techno, trance y compañía'],
    'Bass music': ['#3e9e5e', 'Jungle, garage, dubstep y drum and bass'],
    'Latino': ['#e04f8a', 'Salsa, reguetón, reggae y más'],
    'España': ['#e0662a', 'De la copla a la Movida y el trap'],
    'Mundo': ['#2bb3a3', 'Música de todos los rincones'],
    'Jazz': ['#6b8cae', 'Del ragtime al jazz de hoy'],
    'Raíces americanas': ['#b5883b', 'Blues, country y folk'],
    'Clásica y cine': ['#7a5ad6', 'Clásica, ópera, cine y videojuegos'],
    'Discográficas': ['#6d6d7a', 'Los sellos que hicieron la historia']
  };
  const ORDEN_FAM = Object.keys(FAM);
  const familias = () => [...new Set(H.map((h) => h.familia))].sort((a, b) =>
    (ORDEN_FAM.indexOf(a) + 1 || 99) - (ORDEN_FAM.indexOf(b) + 1 || 99));
  const colorFam = (f) => (FAM[f] || ['#888'])[0];
  const lineaFam = (f) => (FAM[f] || ['', ''])[1];
  // Años: los de antes de Cristo llevan «a. C.»
  const fa = (a) => a < 0 ? (a <= -10000 ? fmt(-a) : String(-a)) + ' a. C.' : String(a);
  const inicio = (h) => Math.min(...piezas(h).map((i) => i.a));
  // Historias añadidas hace poco (salen en «Novedades» y con la etiqueta «Nueva»)
  const NUEVAS = ['mitos', 'origenes','ww2', 'videojuegos', 'kanye', 'triste', 'alegre', 'preliminares', 'explicita', 'psytrance', 'movida', 'popespanol',
    'neosoul', 'folclore', 'rumba', 'afrobeat', 'bossanova', 'yachtrock', 'grime', 'gfunk', 'jazzrap', 'cloudrap', 'mumblerap', 'industrialrap',
    'drill', 'emorap', 'altrap', 'rage', 'tropicalhouse', 'electrohouse', 'dutchhouse', 'berghain', 'dub', 'dembow', 'concreta', 'jungle',
    'motown', 'defjam', 'atlantic', 'warner', 'sony', 'universal', 'spinnin'];
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
      '<a href="#crono"' + (actual === 'crono' ? ' class="on"' : '') + '>' + ic('reloj') + 'Cronología</a>' +
      '<a href="#juego"' + (actual === 'juego' ? ' class="on"' : '') + '>' + ic('mando') + 'Juego</a>' +
      familias().map((f) => {
        const hs = H.filter((h) => h.familia === f);
        const abierta = hs.some((h) => h.id === actual);
        return '<details class="grupo-lado"' + (abierta ? ' open' : '') + ' style="--c:' + colorFam(f) + '"><summary><i class="pto"></i>' + esc(f) + '<span>' + hs.length + '</span></summary>' +
          hs.map((h) => '<a href="#h/' + h.id + '" style="--c:' + h.color + '"' + (actual === h.id ? ' class="on"' : '') + '><i class="pto"></i>' + esc(h.titulo) + '</a>').join('') + '</details>';
      }).join('');
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

  // extra: html opcional bajo el artista (p. ej. la historia a la que pertenece)
  function fila(i, h, terms, extra) {
    const hito = i.tipo === 'hito';
    const etiqueta = (hito ? '<span class="tipo">' + ic('hito') + 'momento clave</span>' : i.tipo === 'disco' ? '<span class="tipo">disco</span>' : '') +
      (VER[i.v] ? '<span class="veredicto ' + i.v + '">' + VER[i.v] + '</span>' : '');
    const k = clave(h, i), oida = OIDAS.has(k);
    return '<li class="row' + (hito ? ' hito' : '') + (oida ? ' oida-on' : '') + '" style="--tinte:' + h.color + '">' +
      (i.a < 0 ? '<span class="anyo ac">' + (i.a <= -10000 ? fmt(-i.a) : -i.a) + '<small>a. C.</small></span>' : '<span class="anyo">' + esc(i.a) + '</span>') +
      '<div class="txt"><div class="t1">' + marcar(i.t, terms) + etiqueta + '</div><div class="t2">' + marcar(i.art, terms) +
      (laTienes(i) ? ' <span class="tuya">la tienes</span>' : '') + '</div>' + (extra || '') +
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
    const y = inicio(h), desde = y < 0 ? 'a. C.' : y;
    return '<a class="tarj" href="#h/' + h.id + '" style="--c:' + h.color + '">' +
      '<span class="deco" aria-hidden="true">' + esc(desde) + '</span>' +
      (NUEVAS.indexOf(h.id) >= 0 ? '<span class="nueva">Nueva</span>' : '') +
      '<span class="eti">' + esc(h.periodo) + '</span><b>' + esc(h.titulo) + '</b>' +
      '<span class="lema">' + esc(h.lema) + '</span>' +
      '<span class="cuenta">' + n + ' piezas' + (h.capitulos.length > 1 ? ' · ' + h.capitulos.length + ' capítulos' : '') +
      (t ? ' · tienes ' + t : '') + '</span>' +
      '<span class="tl" aria-hidden="true">' + h.capitulos.map((c) => '<i style="flex:' + Math.max(1, c.items.length) + '"></i>').join('') + '</span>' +
      (o ? '<span class="mini"><i style="width:' + Math.round(100 * o / n) + '%"></i></span>' : '') + '</a>';
  }

  // Una fila horizontal de tarjetas, con flechas en el ordenador
  function carrusel(titulo, sub, color, lista, extra) {
    return '<section class="familia carrusel" style="--c:' + color + '"><div class="fam-cab"><span class="pto"></span><div class="fam-txt"><b>' + esc(titulo) + '</b>' +
      (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' + (extra || '') +
      '<button class="flecha" data-dir="-1" aria-label="Anteriores">' + ic('izq') + '</button><button class="flecha" data-dir="1" aria-label="Siguientes">' + ic('der') + '</button></div>' +
      '<div class="pista">' + lista.map(tarjeta).join('') + '</div></section>';
  }

  // Un momento clave al azar, para descubrir historias
  function sabiasQue() {
    const todos = [];
    H.forEach((h) => h.capitulos.forEach((c, k) => c.items.forEach((i) => { if (i.tipo === 'hito' && i.n) todos.push({ h, i, k }); })));
    if (!todos.length) return '';
    const { h, i, k } = todos[Math.floor(Math.random() * todos.length)];
    return '<a class="sabias" href="#h/' + h.id + '/' + (k + 1) + '" style="--c:' + h.color + '"><span class="eti">' + ic('chispa') + '¿Sabías que…? · ' + esc(fa(i.a)) + '</span>' +
      '<b>' + esc(i.art) + ': ' + esc(i.t) + '</b><span class="nota">' + esc(i.n) + '</span><span class="de">' + esc(h.titulo) + ic('sig') + '</span></a>';
  }

  function portada() {
    lado(null);
    const fams = familias();
    let filtro = leer(K_FILTRO, '');
    if (fams.indexOf(filtro) < 0) filtro = '';
    const orden = leer(K_ORDEN, 'defecto');
    const ultima = H.find((h) => h.id === leer(K_ULTIMA, ''));
    const total = H.reduce((s, h) => s + escuchables(h).length, 0);
    const nHitos = H.reduce((s, h) => s + piezas(h).length - escuchables(h).length, 0);
    const oTot = H.reduce((s, h) => s + oidas(h), 0);
    const empezadas = H.filter((h) => oidas(h) && oidas(h) < escuchables(h).length);
    let html = '<div class="cab portada-cab"><span class="eti">Para leer y escuchar</span><h2>Historias de la música</h2>' +
      '<p>Cada historia es una lista elegida a mano y en orden cronológico, con el porqué de cada pieza. Sin algoritmos que te cuelen nada.</p>' +
      '<div class="cifras"><span><b>' + H.length + '</b>historias</span><span><b>' + fmt(total) + '</b>piezas</span><span><b>' + fmt(nHitos) + '</b>momentos clave</span>' +
      (oTot ? '<span><b>' + fmt(oTot) + '</b>escuchadas</span>' : '') + '</div>' +
      '<div class="btnrow">' + (ultima ? '<a class="btn pri" href="#h/' + ultima.id + '" style="--tinte:' + ultima.color + '">' + ic('sig') + 'Sigue con «' + esc(ultima.titulo) + '»</a>' : '') +
      '<button class="btn" id="azar">' + ic('dado') + 'Una al azar</button><a class="btn" href="#crono">' + ic('reloj') + 'Cronología</a>' +
      '<a class="btn" href="#juego">' + ic('mando') + 'Juego</a><button class="btn" id="aBuscar">' + ic('lupa') + 'Buscar</button></div></div>';
    html += '<div class="filtros" role="tablist"><button class="chip' + (filtro ? '' : ' on') + '" data-f="">Todas</button>' +
      fams.map((f) => '<button class="chip' + (f === filtro ? ' on' : '') + '" data-f="' + esc(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) + '</button>').join('') + '</div>';
    if (filtro) {
      // Una familia: rejilla con orden a elegir
      let lista = H.filter((h) => h.familia === filtro);
      if (orden === 'crono') lista = lista.slice().sort((a, b) => inicio(a) - inicio(b));
      else if (orden === 'az') lista = lista.slice().sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      else if (orden === 'grande') lista = lista.slice().sort((a, b) => piezas(b).length - piezas(a).length);
      html += '<section class="familia" style="--c:' + colorFam(filtro) + '"><div class="fam-cab grande"><span class="pto"></span><div class="fam-txt"><b>' + esc(filtro) + '</b><span>' +
        esc(lineaFam(filtro)) + ' · ' + lista.length + ' historias</span></div></div>' +
        '<div class="orden">' + [['defecto', 'Recomendado'], ['crono', 'Cronológico'], ['az', 'A-Z'], ['grande', 'Más largas']].map(([v, l]) =>
          '<button class="chip' + (orden === v ? ' on' : '') + '" data-o="' + v + '">' + l + '</button>').join('') + '</div>' +
        '<div class="rejilla">' + lista.map(tarjeta).join('') + '</div></section>';
    } else {
      html += '<div class="explora">' + fams.map((f) => {
        const hs = H.filter((h) => h.familia === f);
        return '<button class="fam-tile" data-f="' + esc(f) + '" style="--c:' + colorFam(f) + '"><b>' + esc(f) + '</b><span>' + esc(lineaFam(f)) + '</span><i>' + hs.length + '</i></button>';
      }).join('') + '</div>';
      html += sabiasQue();
      if (empezadas.length) html += carrusel('Seguir escuchando', 'Las que tienes a medias', 'var(--amber)', empezadas);
      const nuevas = H.filter((h) => NUEVAS.indexOf(h.id) >= 0);
      if (nuevas.length) html += carrusel('Novedades', nuevas.length + ' historias recién añadidas', '#d4568a', nuevas);
      html += fams.map((f) => {
        const hs = H.filter((h) => h.familia === f);
        return carrusel(f, lineaFam(f) + ' · ' + hs.length, colorFam(f), hs, '<button class="btn sm vertodas" data-f="' + esc(f) + '">Ver todas</button>');
      }).join('');
    }
    main.innerHTML = html;
    $('#azar').onclick = () => {
      const pool = H.filter((h) => !filtro || h.familia === filtro);
      const sin = pool.filter((h) => !oidas(h));
      const l = sin.length ? sin : pool;
      location.hash = '#h/' + l[Math.floor(Math.random() * l.length)].id;
    };
    $('#aBuscar').onclick = () => { buscar.focus(); };
    main.onclick = (e) => {
      const f = e.target.closest('[data-f]');
      if (f) { guardar(K_FILTRO, f.dataset.f); cambiar(portada); scrollTo({ top: 0, behavior: 'auto' }); return; }
      const o = e.target.closest('[data-o]');
      if (o) { guardar(K_ORDEN, o.dataset.o); cambiar(portada); return; }
      const fl = e.target.closest('.flecha');
      if (fl) { const p = fl.closest('.carrusel').querySelector('.pista'); p.scrollBy({ left: +fl.dataset.dir * p.clientWidth * 0.85, behavior: MOV ? 'smooth' : 'auto' }); }
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
    main.innerHTML = '<div class="hero" style="--tinte:' + h.color + '">' +
      '<div class="migas"><a class="btn sm atras" href="#">' + ic('atras') + 'Todas</a><a class="btn sm atras" href="#" data-fam="' + esc(h.familia) + '">' + esc(h.familia) + '</a></div>' +
      '<span class="eti">' + esc(h.familia) + ' · ' + esc(h.periodo) + '</span>' +
      '<h2>' + esc(h.titulo) + '</h2><p class="lema-h">' + esc(h.lema) + '</p><p>' + esc(h.intro) + '</p>' +
      '<div id="prog">' + progreso(h) + '</div>' +
      '<div class="btnrow"><a class="btn pri" href="mando.html?historia=' + h.id + '" title="La Fonoteca busca cada canción y crea la playlist en tu Spotify">' + ic('play') + 'Crear en mi Spotify</a>' +
      '<button class="btn" id="copiar">' + ic('copia') + 'Copiar lista</button>' +
      '<a class="btn" href="#juego/' + h.id + '" title="Adivina el año de las piezas de esta historia">' + ic('mando') + 'Ponte a prueba</a></div>' +
      '<p class="datos">' + escuchables(h).length + ' piezas' + (nHitos ? ' · ' + nHitos + ' momentos clave' : '') + (varios ? ' · ' + h.capitulos.length + ' capítulos' : '') + '</p>' +
      (varios ? '<div class="linea" aria-label="Capítulos">' + h.capitulos.map((c, k) => '<a href="#h/' + h.id + '/' + (k + 1) + '" style="flex:' + Math.max(2, c.items.length) + '" title="' + esc(c.titulo + ' · ' + c.periodo) + '"><i></i><span>' + esc(c.corto || c.titulo) + '</span></a>').join('') + '</div>' : '') +
      '</div>' +
      (varios ? '<nav class="indice" style="--tinte:' + h.color + '">' + h.capitulos.map((c, k) => '<a class="chip" data-cap="' + (k + 1) + '" href="#h/' + h.id + '/' + (k + 1) + '">' + esc(c.corto || c.titulo) + '</a>').join('') + '</nav>' : '') +
      h.capitulos.map((c, k) => '<section class="capitulo" id="cap-' + (k + 1) + '" style="--tinte:' + h.color + '">' +
        (varios ? '<span class="eti"><i class="num">' + (k + 1) + '</i>Capítulo ' + (k + 1) + ' de ' + h.capitulos.length + '</span>' : '') +
        '<h3>' + esc(c.titulo) + '<span>' + esc(c.periodo) + '</span></h3>' +
        (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') +
        '<ol class="lista">' + c.items.map((i) => fila(i, h)).join('') + '</ol></section>').join('') +
      '<div class="nav-fin">' + (ant ? '<a class="siguiente ant" href="#h/' + ant.id + '" style="--c:' + ant.color + '"><span class="eti">Anterior en ' + esc(h.familia) + '</span><b>' + esc(ant.titulo) + '</b>' + ic('atras') + '</a>' : '') +
      '<a class="siguiente" href="#h/' + sig.id + '" style="--c:' + sig.color + '"><span class="eti">Siguiente' + (fam.length > 1 ? ' en ' + esc(h.familia) : ' historia') + '</span><b>' + esc(sig.titulo) + '</b>' + ic('sig') + '</a></div>';
    main.querySelector('[data-fam]').onclick = (e) => { e.preventDefault(); guardar(K_FILTRO, h.familia); if (location.hash.length > 1) location.hash = '#'; else cambiar(portada); };
    $('#copiar').onclick = () => {
      const txt = escuchables(h).map((i) => fa(i.a) + ' · ' + i.art + ' — ' + i.t).join('\n');
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
    main.innerHTML = '<div class="cab"><span class="eti">' + ic('reloj') + ' Toda la historia de un vistazo</span><h2>Cronología</h2>' +
      '<p>Los ' + fmt(todos.length) + ' momentos clave de todas las historias, ordenados del más antiguo al más reciente. Pulsa en la historia para leer el contexto.</p></div>' +
      '<div class="filtros quieto"><button class="chip' + (cronoFam ? '' : ' on') + '" data-cf="">Todas</button>' +
      familias().map((f) => '<button class="chip' + (f === cronoFam ? ' on' : '') + '" data-cf="' + esc(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) + '</button>').join('') + '</div>' +
      '<nav class="indice saltos">' + grupos.map((g, n) => '<button class="chip" data-s="' + n + '">' + esc(g.n) + '</button>').join('') + '</nav>' +
      grupos.map((g, n) => '<section class="capitulo crono-sec" id="ct-' + n + '"><h3>' + esc(g.n) + '<span>' + g.l.length + ' momento' + (g.l.length === 1 ? '' : 's') + '</span></h3>' +
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
    let html = '<div class="cab"><span class="eti">' + ic('mando') + (h0 ? ' Con «' + esc(h0.titulo) + '»' : ' Con todas las historias') + '</span><h2>' + (modo === 'mito' ? '¿Mito o verdad?' : '¿De qué año es?') + '</h2>' +
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
        (i.tipo === 'hito' ? '' : '<a class="btn" href="' + urlSpotify(i) + '" target="_blank" rel="noopener">' + ic('play') + 'Escuchar</a>') +
        '<a class="btn" href="#h/' + h.id + '/' + (k + 1) + '">' + ic('nota') + esc(h.titulo) + '</a></div></div>') +
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
  // Teclas 1-4 para responder y Intro para la siguiente
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
    if (location.hash === '#crono') { document.title = 'Cronología · Historias'; const y = scrollY; cronologia(); scrollTo(0, mantenerScroll ? y : 0); return; }
    const j = location.hash.match(/^#juego(?:\/([^/]+))?/);
    if (j) { document.title = 'Juego · Historias'; juego(j[1]); if (!mantenerScroll) scrollTo(0, 0); return; }
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

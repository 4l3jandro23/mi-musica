/* Motor de «Historias de la música» (historias.html), hermana de la Fonoteca.
   Lee window.HISTORIAS (lo rellenan los archivos de historias/datos/) y pinta:
   - #[explorar/<familia>] → inicio: la línea del tiempo, historia a historia por la época en que empieza
   - #h/<id>[/n]           → una historia por caras (n = cara a la que saltar)
   - #anyos[/<año>]        → año a año: qué pasó y qué sonaba (y #crono, la cronología entera)
   - #tuyo                 → lo que llevas escuchado y los cambios que has hecho
   - #juego[/id]
   Cada pieza: { a: año, art: artista, t: título, n: nota, tipo?: 'hito'|'disco', q?: búsqueda, alias?: [nombres], v?: veredicto }
   'hito' = momento clave sin audio; 'disco' = se escucha el álbum entero.
   No usa la API de Spotify: «Spotify» y «YouTube» abren una búsqueda, así no gasta cupo.
   «La tienes» sale de lo que la Fonoteca ya guardó en este aparato (IndexedDB «mando»):
   solo se lee, nunca se escribe. «Escuchada» se apunta en este aparato.
   Diseño 6 (2026-11-01): todo va por año. Las caras de cada historia y sus canciones se ordenan
   por año al cargar, y las listas de «Las 500» se agrupan por décadas con su puesto al lado. */
(function () {
  const $ = (s) => document.querySelector(s);
  const H = window.HISTORIAS;
  const main = $('#main'), buscar = $('#buscar');
  const K_OIDAS = 'historias_oidas_v1', K_ULTIMA = 'historias_ultima_v1', K_ANYO = 'historias_anyo_v1';
  const MOV = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mismo tema que la Fonoteca si allí se eligió uno a mano
  try {
    const p = JSON.parse(localStorage.getItem('mando_prefs_v1') || '{}');
    if (p.tema) document.documentElement.dataset.theme = p.tema;
  } catch (e) {}

  const ICO = {
    atras: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    copia: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    dado: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/>',
    sig: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menos: '<path d="M5 12h14"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    hito: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    quitar: '<path d="M17 7 7 17M7 7l10 10"/>',
    lapiz: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    deshacer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mando: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="14" r="1"/>',
    casa: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    disco: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    spotify: '<circle cx="12" cy="12" r="10"/><path d="M7 9.5c3.5-1 7.5-.6 10.5 1M7.6 12.8c2.9-.8 6-.4 8.4 1M8.3 15.9c2.2-.5 4.4-.3 6.3.8"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>'
  };
  // Veredicto de los mitos: v = 'falso' | 'cierto' | 'medias'
  const VER = { falso: 'Mito', cierto: 'Verdad', medias: 'A medias' };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICO[n] + '</svg>';
  $('#aFono').innerHTML = ic('atras') + '<span>Fonoteca</span>';
  $('#icoBusca').innerHTML = ic('lupa');

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const fmt = (n) => n.toLocaleString('es-ES');
  // Años: los de antes de Cristo llevan «a. C.»
  const fa = (a) => a < 0 ? (a <= -10000 ? fmt(-a) : String(-a)) + ' a. C.' : String(a);
  const rango = (a, b) => a === b ? fa(a) : fa(a) + '–' + (a >= 0 && b >= 1000 && Math.floor(a / 100) === Math.floor(b / 100) && b - a < 100 ? String(b).slice(2) : fa(b));

  /* ---------- todo por año ----------
     Las caras se ordenan por el año en que empiezan y, dentro, las canciones por año (si empatan,
     se quedan como venían). Las listas de puestos («Las 500») se agrupan por décadas y cada pieza
     guarda su puesto. Se hace al cargar, así vale también para lo que se añada más adelante. */
  const desde = (c) => Math.min(...c.items.map((i) => i.a));
  const hasta = (c) => Math.max(...c.items.map((i) => i.a));
  const porAnyo = (l) => l.map((x, n) => [x, n]).sort((p, q) => p[0].a - q[0].a || p[1] - q[1]).map((p) => p[0]);
  const decadaRk = (a) => a < 1950 ? 1940 : Math.floor(a / 10) * 10;
  H.forEach((h) => {
    if (h.ranking) {
      let rk = 0;
      const todas = h.capitulos.flatMap((c) => c.items).map((i) => i.tipo === 'hito' ? i : Object.assign({}, i, { puesto: ++rk }));
      const grupos = new Map();
      for (const i of todas) { const d = decadaRk(i.a); (grupos.get(d) || grupos.set(d, []).get(d)).push(i); }
      h.capitulos = [...grupos.keys()].sort((a, b) => a - b).map((d) => {
        const items = porAnyo(grupos.get(d)), n = items.filter((i) => i.tipo !== 'hito').length;
        return { titulo: d === 1940 ? 'Antes de 1950' : 'Los años ' + (d < 2000 ? String(d).slice(2) : d), corto: d === 1940 ? 'Antes de 1950' : (d < 2000 ? String(d).slice(2) : d) + 's', items,
          intro: h.id === 'top500albumes' ? n + (n === 1 ? ' de los 500 es' : ' de los 500 son') + ' de estos años. Al lado de cada uno, su puesto en la lista.'
            : n + (n === 1 ? ' de las 500 es' : ' de las 500 son') + ' de estos años. Al lado de cada una, su puesto en la lista.' };
      });
    } else {
      h.capitulos = h.capitulos.map((c, n) => [Object.assign({}, c, { items: porAnyo(c.items) }), n])
        .sort((p, q) => desde(p[0]) - desde(q[0]) || p[1] - q[1]).map((p) => p[0]);
    }
    h.capitulos.forEach((c) => { c.periodo = rango(desde(c), hasta(c)); });
  });

  const piezas = (h) => h.capitulos.flatMap((c) => c.items);
  const escuchables = (h) => piezas(h).filter((i) => i.tipo !== 'hito');
  const busq = (i) => i.q || i.art + ' ' + i.t;
  const urlSpotify = (i) => 'https://open.spotify.com/search/' + encodeURIComponent(busq(i));
  const urlYouTube = (i) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(busq(i) + (i.tipo === 'disco' ? ' full album' : ''));
  const enlaces = (i, cls) => '<a class="oir ' + (cls || '') + '" href="' + urlSpotify(i) + '" target="_blank" rel="noopener" aria-label="Buscar en Spotify" title="Buscar en Spotify">' + ic('spotify') + '<span>Spotify</span></a>' +
    '<a class="oir ' + (cls || '') + '" href="' + urlYouTube(i) + '" target="_blank" rel="noopener" aria-label="Buscar en YouTube" title="Buscar en YouTube">' + ic('youtube') + '<span>YouTube</span></a>';

  /* Familias en un orden pensado (las desconocidas, al final), con su color y una línea de presentación */
  const FAM = {
    'Las 500': ['#c9a227', 'Los 500 mejores discos y canciones de la historia'],
    'Para cada momento': ['#f2994a', 'Estaciones, gimnasio, coche y estados de ánimo'],
    'Artistas': ['#b04fd1', 'Los Beatles, Bowie, ABBA, Daft Punk y otros que merecen su propio disco'],
    'Pop': ['#ff7a59', 'Del pop de los 50 al hyperpop'],
    'Rock': ['#d0473a', 'Del rock and roll al metal'],
    'Hip hop': ['#d9a21b', 'Del Bronx al rage, estilo a estilo'],
    'Soul y funk': ['#b0623a', 'Soul, funk, disco y R&B'],
    'Electrónica': ['#3aa0e8', 'De la música concreta al trance y el hardstyle'],
    'House, techno y EDM': ['#7cb342', 'Del house de Chicago y el techno de Detroit a los festivales'],
    'Jamaica y bass music': ['#3e9e5e', 'Del ska y el dub al jungle, el garage y el dubstep'],
    'Latino': ['#e04f8a', 'Salsa, reguetón, México, Puerto Rico y más'],
    'España': ['#e0662a', 'De la copla a la Movida y el trap'],
    'Mundo': ['#2bb3a3', 'Música de todos los rincones'],
    'Jazz': ['#6b8cae', 'Del ragtime al jazz de hoy'],
    'Raíces americanas': ['#b5883b', 'Blues, country, folk y Estados Unidos'],
    'Clásica y cine': ['#7a5ad6', 'Clásica, ópera, cine y videojuegos'],
    'La música por dentro': ['#5c6bc0', 'Instrumentos, samples, mitos, polémicas y plataformas'],
    'Historia': ['#9a7b4f', 'De la prehistoria a la pandemia'],
    'Humor e internet': ['#c7a63a', 'Memes, canciones absurdas, rarezas y lo peor de lo peor'],
    'Especiales': ['#e86aa8', 'Décadas, adolescencia, sensualidad y otras listas'],
    'Discográficas': ['#6d6d7a', 'Los sellos que hicieron la historia']
  };
  const ORDEN_FAM = Object.keys(FAM);
  const familias = () => [...new Set(H.map((h) => h.familia))].sort((a, b) =>
    (ORDEN_FAM.indexOf(a) + 1 || 99) - (ORDEN_FAM.indexOf(b) + 1 || 99));
  const colorFam = (f) => (FAM[f] || ['#888'])[0];
  const lineaFam = (f) => (FAM[f] || ['', ''])[1];
  const inicio = (h) => Math.min(...piezas(h).map((i) => i.a));
  const fin = (h) => Math.max(...piezas(h).map((i) => i.a));
  const porInicio = (l) => l.slice().sort((a, b) => inicio(a) - inicio(b) || a.titulo.localeCompare(b.titulo, 'es'));
  // Los capítulos se leen como las caras de un disco
  const CARAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cara = (k) => CARAS[k] || String(k + 1);
  // Nombre corto para la portada de la funda: «Historia de la bachata» → «Bachata»
  const nombreFunda = (t) => {
    const s = String(t).replace(/^(?:la |una )?(?:breve )?historia (?:de (?:la |el |los |las )?|del )/i, '').replace(/ de (?:la )?historia$/i, '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  // Historias añadidas hace poco (llevan la etiqueta «Nueva»)
  const NUEVAS = ['blackeyedpeas', 'charlixcx', 'pinkpantheress', 'bjork', 'califato'];
  const leer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  // Texto claro u oscuro según lo claro que sea el color de la funda
  const tinta = (hex) => {
    const m = String(hex).match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i); if (!m) return '#fff';
    const l = [m[1], m[2], m[3]].map((x) => { const v = parseInt(x, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    const L = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2], conBlanco = 1.05 / (L + 0.05), conNegro = (L + 0.05) / 0.0587;
    return conNegro >= conBlanco ? '#14151a' : '#ffffff';
  };

  let _t;
  // acc (opcional): {txt, fn} pinta un botón dentro del aviso, p. ej. «Deshacer»
  function toast(txt, acc) {
    const t = $('#toast'); t.textContent = txt; t.classList.add('ver'); t.classList.toggle('con-acc', !!acc);
    if (acc) {
      const b = document.createElement('button'); b.type = 'button'; b.innerHTML = ic('deshacer') + esc(acc.txt);
      b.onclick = () => { t.classList.remove('ver'); acc.fn(); }; t.append(b);
    }
    clearTimeout(_t); _t = setTimeout(() => t.classList.remove('ver'), acc ? 6000 : 2200);
  }
  const copiar = (txt) => navigator.clipboard.writeText(txt).then(() => toast('Lista copiada'), () => toast('No se pudo copiar'));

  /* ---------- escuchadas (en este aparato) ---------- */
  const OIDAS = new Set(leer(K_OIDAS, []));
  const clave = (h, i) => h.id + '|' + i.art + '|' + i.t;
  const oidas = (h) => escuchables(h).filter((i) => OIDAS.has(clave(h, i))).length;

  /* ---------- canciones quitadas (en este aparato) ----------
     Se guardan con la misma clave que las escuchadas. Se sacan de los capítulos al cargar,
     así que no salen en ningún sitio: listas, búsqueda, años, juego ni recuentos. */
  const K_QUITADAS = 'historias_quitadas_v1';
  let _porAnyo = null; // índice de «Años»; se rehace cuando cambian las quitadas
  const QUITADAS = new Set(leer(K_QUITADAS, []));
  /* Apartados (capítulos) editados: se pueden quitar o renombrar, también solo en este aparato.
     La clave es «id|título original», así que sobrevive a que cambie el orden de los capítulos. */
  const K_CAPS = 'historias_apartados_v1';
  const CAPS = leer(K_CAPS, {}); // clave → { fuera: true } | { nombre: '…' }
  const ORIG = new Map(H.map((h) => [h.id, h.capitulos.map((c) => Object.assign({}, c, { items: c.items.slice() }))]));
  const claveCap = (h, c) => h.id + '|' + c.titulo;
  const cambioCap = (h, c) => CAPS[claveCap(h, c)] || {};
  function aplicarQuitadas() {
    _porAnyo = null;
    H.forEach((h) => {
      const caps = ORIG.get(h.id).filter((c) => !cambioCap(h, c).fuera);
      h.capitulos = (caps.length ? caps : ORIG.get(h.id)).map((c) => {
        const nombre = cambioCap(h, c).nombre;
        return Object.assign({}, c, { orig: c.titulo, titulo: nombre || c.titulo, corto: nombre || c.corto,
          items: c.items.filter((i) => i.tipo === 'hito' || !QUITADAS.has(clave(h, i))) });
      }).filter((c) => c.items.length);
      if (!h.capitulos.length) h.capitulos = ORIG.get(h.id).map((c) => Object.assign({}, c, { orig: c.titulo }));
    });
  }
  const quitadasDe = (h) => ORIG.get(h.id).filter((c) => !cambioCap(h, c).fuera)
    .flatMap((c) => c.items).filter((i) => i.tipo !== 'hito' && QUITADAS.has(clave(h, i)));
  const capsFuera = (h) => ORIG.get(h.id).filter((c) => cambioCap(h, c).fuera);
  const capsRenombrados = (h) => ORIG.get(h.id).filter((c) => cambioCap(h, c).nombre);
  const textoCambios = (h) => {
    const l = capsFuera(h).map((c) => 'Quitar apartado: ' + c.titulo)
      .concat(capsRenombrados(h).map((c) => 'Renombrar: ' + c.titulo + ' → ' + cambioCap(h, c).nombre))
      .concat(quitadasDe(h).map((i) => 'Quitar canción: ' + i.art + ' — ' + i.t));
    return l.length ? '«' + h.titulo + '» (' + h.id + '):\n' + l.join('\n') : '';
  };
  function quitar(k, fuera) {
    fuera ? QUITADAS.add(k) : QUITADAS.delete(k);
    marcarTs('q|' + k);
    guardar(K_QUITADAS, [...QUITADAS]);
    aplicarQuitadas();
    ruta(true);
  }
  // v: { fuera: true }, { nombre }, o null para dejarlo como venía
  function editarCap(k, v) {
    if (v) CAPS[k] = v; else delete CAPS[k];
    marcarTs('c|' + k);
    guardar(K_CAPS, CAPS);
    aplicarQuitadas();
    ruta(true);
  }
  aplicarQuitadas();

  /* ---------- sincronizar con tus otros aparatos ----------
     Usa el mismo GitHub que la Fonoteca (mismo token, guardado en este navegador). En el archivo
     historias-sync.json van las escuchadas, las quitadas, los apartados cambiados y tu récord del
     juego. Cada cambio lleva su hora: si tocas lo mismo en dos aparatos, gana el último. */
  const K_GH = 'musicvault_github_v1', GH_SYNC = 'historias-sync.json', K_TS = 'historias_sync_ts_v1', K_SYNC_AT = 'historias_sync_at_v1';
  const ghCfg = () => { const g = leer(K_GH, null); return g && g.token && g.repo ? g : null; };
  const TS = leer(K_TS, {}); // 'o|clave' → hora, 'q|clave' → hora, 'c|claveCap' → hora
  let _tSync = 0;
  const programarSync = () => { clearTimeout(_tSync); _tSync = setTimeout(sincronizar, 15000); };
  const marcarTs = (k) => { TS[k] = Date.now(); guardar(K_TS, TS); programarSync(); };
  function docLocal() {
    const o = {}, q = {}, c = {};
    for (const k of OIDAS) o[k] = [1, TS['o|' + k] || 1];
    for (const k of QUITADAS) q[k] = [1, TS['q|' + k] || 1];
    for (const k in CAPS) c[k] = [CAPS[k], TS['c|' + k] || 1];
    for (const t in TS) {
      const [g, ...r] = t.split('|'), k = r.join('|');
      if (g === 'o' && !o[k]) o[k] = [0, TS[t]];
      if (g === 'q' && !q[k]) q[k] = [0, TS[t]];
      if (g === 'c' && !c[k]) c[k] = [null, TS[t]];
    }
    return { o, q, c, j: leer('historias_juego_v1', { anyo: 0, mito: 0 }) };
  }
  // Junta lo de fuera con lo de aquí; devuelve true si aquí ha cambiado algo
  function fundir(r) {
    if (!r) return false;
    let cambio = false;
    const una = (g, rem, set) => {
      for (const k in (rem || {})) {
        const [v, t] = rem[k], tiene = set.has(k);
        if ((TS[g + '|' + k] || (tiene ? 1 : 0)) >= t) continue;
        TS[g + '|' + k] = t;
        if (v && !tiene) { set.add(k); cambio = true; } else if (!v && tiene) { set.delete(k); cambio = true; }
      }
    };
    una('o', r.o, OIDAS); una('q', r.q, QUITADAS);
    for (const k in (r.c || {})) {
      const [v, t] = r.c[k]; if ((TS['c|' + k] || (CAPS[k] ? 1 : 0)) >= t) continue;
      TS['c|' + k] = t;
      if (JSON.stringify(CAPS[k] || null) !== JSON.stringify(v)) { if (v) CAPS[k] = v; else delete CAPS[k]; cambio = true; }
    }
    if (r.j) { const j = leer('historias_juego_v1', { anyo: 0, mito: 0 }); const n = { anyo: Math.max(j.anyo || 0, r.j.anyo || 0), mito: Math.max(j.mito || 0, r.j.mito || 0) }; if (n.anyo !== j.anyo || n.mito !== j.mito) guardar('historias_juego_v1', n); }
    guardar(K_TS, TS);
    if (cambio) { guardar(K_OIDAS, [...OIDAS]); guardar(K_QUITADAS, [...QUITADAS]); guardar(K_CAPS, CAPS); }
    return cambio;
  }
  const b64 = (t) => btoa(unescape(encodeURIComponent(t)));
  const ordenado = (d) => { const o = {}; for (const g of ['o', 'q', 'c']) { o[g] = {}; for (const k of Object.keys((d && d[g]) || {}).sort()) o[g][k] = d[g][k]; } o.j = (d && d.j) || {}; return o; };
  let _sincronizando = false;
  // devuelve true si quedó al día
  async function sincronizar() {
    if (_sincronizando) return false; _sincronizando = true;
    clearTimeout(_tSync); _tSync = 0;
    let ok = false;
    try {
      const g = ghCfg();
      if (!g) {
        // sin token, al menos se trae lo de los otros aparatos (solo lectura)
        const res = await fetch(GH_SYNC + '?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok && fundir(await res.json())) { aplicarQuitadas(); ruta(true); }
        return res.ok;
      }
      const api = 'https://api.github.com/repos/' + g.repo + '/contents/' + GH_SYNC;
      const cab = { Authorization: 'Bearer ' + g.token, Accept: 'application/vnd.github+json' };
      for (let n = 0; n < 3; n++) {
        const r = await fetch(api + '?ref=main&t=' + Date.now(), { headers: cab });
        let sha = null, rem = null;
        if (r.ok) { const d = await r.json(); sha = d.sha; rem = JSON.parse(decodeURIComponent(escape(atob(String(d.content).replace(/\s/g, ''))))); }
        else if (r.status !== 404) throw new Error('GitHub ' + r.status);
        if (fundir(rem)) { aplicarQuitadas(); ruta(true); }
        const cuerpo = JSON.stringify(ordenado(docLocal()));
        if (rem && JSON.stringify(ordenado(rem)) === cuerpo) { ok = true; break; }
        const p = await fetch(api, { method: 'PUT', headers: cab, body: JSON.stringify({ message: 'historias: escuchadas y cambios', content: b64(cuerpo), branch: 'main', sha: sha || undefined }) });
        if (p.status === 409 || p.status === 422) continue; // otro aparato escribió a la vez: se vuelve a juntar
        if (!p.ok) throw new Error('GitHub ' + p.status);
        ok = true; break;
      }
      if (ok) guardar(K_SYNC_AT, Date.now());
    } catch (e) { /* sin conexión: se reintenta en el siguiente cambio o al volver */ }
    finally { _sincronizando = false; }
    return ok;
  }
  // Código de vinculación de la Fonoteca (Ajustes › Vincular el móvil) o el token suelto
  function vincular(txt) {
    txt = String(txt || '').trim();
    let g = null;
    if (/^(ghp_|github_pat_)\w+$/.test(txt)) g = { repo: (leer(K_GH, {}) || {}).repo || '4l3jandro23/mi-musica', token: txt };
    const mm = txt.match(/FONO1:([A-Za-z0-9+/=]+)/);
    if (mm) { try { const o = JSON.parse(decodeURIComponent(escape(atob(mm[1])))); if (o.r && o.t) g = { repo: o.r, token: o.t }; } catch (e) {} }
    if (!g) { toast('Ese código no vale: cópialo entero desde la Fonoteca del ordenador'); return false; }
    guardar(K_GH, Object.assign({}, leer(K_GH, {}) || {}, g));
    toast('Vinculado: este aparato ya se sincroniza');
    sincronizar().then(() => ruta(true));
    return true;
  }
  let _oculta = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { _oculta = Date.now(); if (_tSync) sincronizar(); }
    else if (Date.now() - _oculta > 30000) sincronizar();
  });

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
  // Reparte el título en líneas de unas n letras (sin partir palabras)
  function enLineas(t, n) {
    const out = [];
    for (const w of String(t).split(/\s+/)) {
      const ult = out[out.length - 1];
      if (ult && (ult + ' ' + w).length <= n) out[out.length - 1] = ult + ' ' + w; else out.push(w);
    }
    return out;
  }
  // El título más grande que cabe en la funda (en unidades de un cuadrado de 100)
  function ajustar(t) {
    let mejor = null;
    const larga = Math.max(...String(t).split(/\s+/).map((w) => w.length));
    for (let n = larga; n <= String(t).length; n++) {
      const l = enLineas(t, n);
      if (l.length > 4) continue;
      const anchoMax = Math.max(...l.map((x) => x.length));
      const fs = Math.min(17, 84 / (anchoMax * 0.64), 60 / (l.length * 1.02));
      // una palabra corta sola en su línea («de», «la») queda mal: se castiga
      const nota = fs - (l.some((x) => x.length <= 3) && l.length > 1 ? 4 : 0) - (l.length - 1) * 0.6;
      if (!mejor || nota > mejor.nota) mejor = { l, fs, nota };
    }
    return mejor || { l: [t], fs: 8 };
  }
  // La funda con su vinilo. grande = la de la cabecera de una historia
  function funda(h, grande) {
    const { l, fs } = ajustar(nombreFunda(h.titulo)), tx = tinta(h.color);
    return '<span class="disco' + (grande ? ' grande' : '') + '" style="--c:' + h.color + '" aria-hidden="true">' +
      '<span class="vinilo"><i></i></span>' +
      '<svg class="funda" viewBox="0 0 100 100" focusable="false"><rect width="100" height="100" rx="1.6" fill="' + h.color + '"/>' +
      '<text class="f-tit" fill="' + tx + '" font-size="' + fs.toFixed(2) + '">' + l.map((x, k) => '<tspan x="8" y="' + (8 + fs * 0.82 + k * fs * 1.0).toFixed(2) + '">' + esc(x) + '</tspan>').join('') + '</text>' +
      '<text class="f-pie" fill="' + tx + '" font-size="6.4"><tspan x="8" y="84.5">' + esc(rango(inicio(h), fin(h))) + '</tspan><tspan x="8" y="92.5">' + esc(h.familia) + '</tspan></text></svg></span>';
  }

  function tarjeta(h) {
    const n = escuchables(h).length, o = oidas(h), t = tuyas(h);
    return '<a class="tarj" href="#h/' + h.id + '">' + funda(h) +
      '<span class="t-tit">' + esc(h.titulo) + (NUEVAS.indexOf(h.id) >= 0 ? ' <span class="nueva">Nueva</span>' : '') + '</span>' +
      '<span class="t-lema">' + esc(h.lema) + '</span>' +
      '<span class="t-meta">' + fmt(n) + ' canciones' + (t ? ' · tienes ' + t : '') + '</span>' +
      (o ? '<span class="barrita" aria-label="Escuchadas ' + o + ' de ' + n + '"><i style="width:' + Math.round(100 * o / n) + '%"></i></span>' : '') + '</a>';
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
    const etiqueta = (i.tipo === 'disco' ? ' <span class="tipo">disco entero</span>' : '') +
      (VER[i.v] ? ' <span class="veredicto ' + i.v + '">' + VER[i.v] + '</span>' : '');
    const anyo = '<span class="anyo">' + (i.a < 0 ? (i.a <= -10000 ? fmt(-i.a) : -i.a) + '<small>a. C.</small>' : esc(i.a)) +
      (i.puesto ? '<b class="puesto">nº ' + i.puesto + '</b>' : cod ? '<b>' + cod + '</b>' : '') + '</span>';
    if (hito) {
      return '<li class="row hito">' + anyo +
        '<div class="txt"><div class="t1" title="Momento clave">' + ic('hito') + '<span class="oculto">Momento clave: </span>' + marcar(i.t, terms) + etiqueta + '</div>' +
        '<div class="t2">' + marcar(i.art, terms) + '</div>' + (extra || '') +
        (i.n ? '<p class="nota">' + marcar(i.n, terms) + '</p>' : '') + '</div></li>';
    }
    const k = clave(h, i), oida = OIDAS.has(k);
    return '<li class="row' + (oida ? ' oida-on' : '') + '">' + anyo +
      '<div class="txt"><div class="t1">' + marcar(i.t, terms) + etiqueta + '</div><div class="t2">' + marcar(i.art, terms) +
      (laTienes(i) ? ' <span class="tuya">la tienes</span>' : '') + '</div>' + (extra || '') +
      (i.n ? '<p class="nota">' + marcar(i.n, terms) + '</p>' : '') + '</div>' +
      '<div class="acc"><button class="oida' + (oida ? ' on' : '') + '" data-k="' + esc(k) + '" title="' + (oida ? 'Escuchada' : 'Marcar como escuchada') + '" aria-label="Escuchada" aria-pressed="' + oida + '">' + ic('check') + '</button>' +
      enlaces(i) + (h.ranking ? '' : '<button class="quitar" data-q="' + esc(k) + '" title="Quitar de esta historia" aria-label="Quitar de esta historia">' + ic('quitar') + '</button>') + '</div></li>';
  }

  function progreso(h) {
    const n = escuchables(h).length, o = oidas(h), t = tuyas(h);
    return '<div class="progreso"><div class="barra"><i style="width:' + (n ? Math.round(100 * o / n) : 0) + '%"></i></div>' +
      '<span>' + (o ? 'Escuchadas ' + o + ' de ' + n : n + ' canciones por escuchar') + (t ? ' · tienes ' + t + ' en tu música' : '') + '</span></div>';
  }

  /* ---------- navegación: barra de arriba en el ordenador y pestañas abajo en el móvil ---------- */
  const hashFam = (f) => '#explorar/' + encodeURIComponent(f);
  const SECCIONES = [['inicio', '#', 'casa', 'Inicio'], ['anyos', '#anyos', 'reloj', 'Años'], ['tuyo', '#tuyo', 'persona', 'Lo tuyo'], ['juego', '#juego', 'mando', 'Juego']];
  function lado(sec) {
    $('#secc').innerHTML = SECCIONES.map(([id, href, i, txt]) => '<a href="' + href + '"' + (sec === id ? ' class="on" aria-current="page"' : '') + '>' + txt + '</a>').join('');
    $('#tabs').innerHTML = SECCIONES.map(([id, href, i, txt]) => '<a href="' + href + '"' + (sec === id ? ' class="on" aria-current="page"' : '') + '>' + ic(i) + '<span>' + txt + '</span></a>').join('');
  }

  // La de hoy: cambia cada día y es la misma en todos los aparatos
  function deHoy() {
    const d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    return H[(n * 37) % H.length];
  }

  /* ---------- inicio: la línea del tiempo ---------- */
  const ERAS = [
    { k: 'antes1900', d: -Infinity, h: 1899, tit: 'Antes de 1900', txt: 'De los cantos antiguos a las primeras grabaciones: la música de antes del disco.', foto: 'Cartel del fonógrafo de concierto de Edison, 1899' },
    { k: '1900', d: 1900, h: 1949, tit: 'De 1900 a 1949', txt: 'Discos de pizarra, la radio, el jazz, el tango y las grandes orquestas.', foto: 'Una banda de jazz en un hotel de Sídney, años 20' },
    { k: '1950', d: 1950, h: 1959, tit: 'Los años 50', txt: 'Nace el rock and roll y, con él, la música pensada para los jóvenes.', foto: 'Fiesta de rock and roll en Ámsterdam, 1957' },
    { k: '1960', d: 1960, h: 1969, tit: 'Los años 60', txt: 'Los Beatles, Motown, el soul, la psicodelia y los cantautores.', foto: 'Los Beatles llegan a Nueva York, 1964' },
    { k: '1970', d: 1970, h: 1979, tit: 'Los años 70', txt: 'Disco, punk, reggae, salsa y las primeras fiestas de hip hop.', foto: 'Sex Pistols en Noruega, 1977' },
    { k: '1980', d: 1980, h: 1989, tit: 'Los años 80', txt: 'El reggae llena estadios, llegan los sintetizadores y MTV, y nacen el house y el techno.', foto: 'Bob Marley & The Wailers en Londres, 1980' },
    { k: '1990', d: 1990, h: 1999, tit: 'Los años 90', txt: 'Grunge, britpop, raves, R&B y el rap que llega a todas partes.', foto: 'Love Parade de Berlín, 1998' },
    { k: '2000', d: 2000, h: 2009, tit: 'Los años 2000', txt: 'El iPod, las descargas, el reguetón y el pop que se hace en casa.', foto: 'Un iPod, el reproductor de los 2000' },
    { k: '2010', d: 2010, h: 2019, tit: 'Los años 2010', txt: 'Streaming, EDM de festival, trap y SoundCloud.', foto: 'Público del festival Defqon.1, 2016' },
    { k: '2020', d: 2020, h: 9999, tit: 'Los años 2020', txt: 'TikTok, la pandemia y la música latina en lo más alto.', foto: 'Rosalía en el Zócalo de Ciudad de México, 2023' }
  ];
  const eraDe = (a) => ERAS.find((e) => a >= e.d && a <= e.h) || ERAS[ERAS.length - 1];

  function portada(fam) {
    main.classList.remove('lectura');
    const fams = familias();
    const filtro = fams.indexOf(fam) >= 0 ? fam : '';
    lado('inicio');
    const lista = porInicio(H.filter((h) => !filtro || h.familia === filtro));
    const total = lista.reduce((s, h) => s + escuchables(h).length, 0);
    const ultima = H.find((h) => h.id === leer(K_ULTIMA, ''));
    const hoy = deHoy();
    let html = '<section class="ini-cab' + (filtro ? ' filtrada' : '') + '">' +
      (filtro ? '<h1>' + esc(filtro) + '</h1><div class="ini-txt"><p class="lead">' + esc(lineaFam(filtro)) + '. ' + lista.length + ' historias y ' + fmt(total) + ' canciones, de la más antigua a la más reciente.</p>'
        : '<h1>Historias de la música</h1><div class="ini-txt"><p class="lead">' + H.length + ' historias contadas canción a canción y ordenadas por año. ' + fmt(total) + ' canciones elegidas a mano, sin algoritmos.</p>') +
      '<div class="btnrow">' + (ultima && !filtro ? '<a class="btn pri" href="#h/' + ultima.id + '">' + ic('play') + 'Sigue con «' + esc(nombreFunda(ultima.titulo)) + '»</a>' : '') +
      '<button class="btn" id="azar">' + ic('dado') + 'Una al azar</button>' + (filtro ? '<a class="btn" href="#">Todas las familias</a>' : '') + '</div></div>';
    if (!filtro) html += '<a class="hoy" href="#h/' + hoy.id + '">' + funda(hoy, true) +
      '<span class="hoy-txt"><h2>' + esc(hoy.titulo) + '</h2><span class="lema">' + esc(hoy.lema) + '</span>' +
      '<span class="meta">La historia de hoy · ' + esc(rango(inicio(hoy), fin(hoy))) + ' · ' + fmt(escuchables(hoy).length) + ' canciones</span></span></a>';
    html += '</section>';
    html += '<section class="filtro"><h2 class="mini-h">Por familia</h2><nav class="fams" aria-label="Familias"><a class="chip' + (filtro ? '' : ' on') + '" href="#">Todas</a>' +
      fams.map((f) => '<a class="chip' + (f === filtro ? ' on' : '') + '" href="' + hashFam(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) + '</a>').join('') + '</nav></section>';
    const eras = ERAS.map((e) => ({ e, hs: lista.filter((h) => eraDe(inicio(h)) === e) })).filter((x) => x.hs.length);
    html += '<section class="filtro"><h2 class="mini-h">Salta a una época</h2><nav class="saltos" aria-label="Épocas">' + eras.map(({ e }) => '<a class="chip" href="#era-' + e.k + '" data-era="' + e.k + '">' + esc(e.k === 'antes1900' ? 'Antes de 1900' : e.k === '1900' ? '1900–1949' : e.k < '2000' ? e.k.slice(2) + 's' : e.k + 's') + '</a>').join('') + '</nav></section>';
    html += eras.map(({ e, hs }) => '<section class="era" id="era-' + e.k + '"><div class="era-cab">' +
      '<div class="era-txt"><h2>' + esc(e.tit) + '</h2><p>' + esc(e.txt) + '</p><p class="meta">' + hs.length + (hs.length === 1 ? ' historia empieza' : ' historias empiezan') + ' aquí</p></div>' +
      '<figure class="era-foto"><img src="historias/fotos/' + e.k + '.jpg" alt="' + esc(e.foto) + '" decoding="async" width="1200" height="800"><figcaption>' + esc(e.foto) + '</figcaption></figure></div>' +
      '<div class="rejilla">' + hs.map(tarjeta).join('') + '</div></section>').join('');
    html += '<footer class="pie"><p>Fotos: fonógrafo de Edison (Library of Congress, dominio público); banda de jazz (State Library of New South Wales, sin restricciones conocidas); Ámsterdam 1957 (Herbert Behrens / Anefo, CC0); los Beatles en JFK (UPI, dominio público); Sex Pistols (Riksarkivet de Noruega, sin restricciones conocidas); Bob Marley (Tankfield, CC BY-SA 3.0); Love Parade (Ago76, dominio público); iPod (Evan-Amos, dominio público); Defqon.1 (Wvdp, CC0); Rosalía (Secretaría de Cultura de la CDMX, CC BY 2.0). Todas vía Wikimedia Commons.</p>' +
      '<a class="btn" href="mando.html">' + ic('atras') + 'Volver a la Fonoteca</a></footer>';
    main.innerHTML = html;
    $('#azar').onclick = () => {
      const sin = lista.filter((h) => !oidas(h));
      const l = sin.length ? sin : lista;
      location.hash = '#h/' + l[Math.floor(Math.random() * l.length)].id;
    };
    const on = main.querySelector('.fams .chip.on'); if (on && filtro) on.scrollIntoView({ inline: 'center', block: 'nearest' });
    espiar('.era', '.saltos', 'era-', 'era');
    main.onclick = (e) => {
      const a = e.target.closest('.saltos [data-era]'); if (!a) return;
      e.preventDefault(); const s = document.getElementById('era-' + a.dataset.era);
      if (s) s.scrollIntoView({ behavior: MOV ? 'smooth' : 'auto' });
    };
  }

  // Marca en una fila de pastillas la sección por la que vas al hacer scroll
  let espia = null;
  function espiar(secSel, navSel, pref, attr) {
    if (espia) espia.disconnect();
    const nav = $(navSel); if (!nav || !('IntersectionObserver' in window)) return;
    espia = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) {
        const n = e.target.id.slice(pref.length);
        nav.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset[attr] === n));
        const on = nav.querySelector('.chip.on');
        if (on) nav.scrollTo({ left: on.offsetLeft - nav.clientWidth / 2 + on.clientWidth / 2, behavior: MOV ? 'smooth' : 'auto' });
      }
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll(secSel).forEach((s) => espia.observe(s));
  }

  /* ---------- una historia ---------- */
  // Lo que has cambiado en esta historia, para recuperarlo o pasarme la lista
  function cambiosHtml(h) {
    const f = capsFuera(h), r = capsRenombrados(h), q = quitadasDe(h);
    const n = f.length + r.length + q.length;
    if (!n) return '';
    return '<details class="cambios"><summary>' + ic('lapiz') + 'Has hecho ' + n + ' cambio' + (n === 1 ? '' : 's') + ' en esta historia</summary>' +
      '<p>Solo se ve así en este aparato. Si quieres que sea para siempre en la web, copia la lista y pásamela.</p><ul>' +
      f.map((c) => '<li><span><b>' + esc(c.titulo) + '</b> · apartado quitado</span><button class="btn sm" data-cap-volver="' + esc(claveCap(h, c)) + '">' + ic('deshacer') + 'Recuperar</button></li>').join('') +
      r.map((c) => '<li><span><b>' + esc(cambioCap(h, c).nombre) + '</b> · antes «' + esc(c.titulo) + '»</span><button class="btn sm" data-cap-volver="' + esc(claveCap(h, c)) + '">' + ic('deshacer') + 'Nombre original</button></li>').join('') +
      q.map((i) => '<li><span><b>' + esc(i.t) + '</b> · ' + esc(i.art) + ' · ' + esc(fa(i.a)) + '</span><button class="btn sm" data-volver="' + esc(clave(h, i)) + '">' + ic('deshacer') + 'Recuperar</button></li>').join('') +
      '</ul><button class="btn sm" id="copiarCambios">' + ic('copia') + 'Copiar la lista</button></details>';
  }
  // El cronograma de la historia: cada cara en su fila, con la barra en los años que cubre
  function linea(h) {
    const caps = h.capitulos; if (caps.length < 2 || caps.length > 12) return '';
    const a0 = inicio(h), a1 = Math.max(fin(h), a0 + 1);
    // escala que no aplasta los tramos recientes cuando la historia empieza siglos atrás
    const x = (a) => Math.pow((a - a0) / (a1 - a0), a1 - a0 > 300 ? 0.35 : 1) * 100;
    return '<div class="crono-h" role="list" aria-label="Las caras de esta historia en el tiempo">' + caps.map((c, k) => {
      const l = x(desde(c)), w = Math.max(x(hasta(c)) - l, 1.2);
      return '<a role="listitem" href="#h/' + h.id + '/' + (k + 1) + '"><span class="ch-nom">' + (h.ranking ? '' : '<b>' + cara(k) + '</b>') + esc(c.corto || c.titulo) + '</span>' +
        '<span class="ch-pista"><i style="left:' + l.toFixed(2) + '%;width:' + w.toFixed(2) + '%"></i></span><span class="ch-anyos">' + esc(c.periodo) + '</span></a>';
    }).join('') + '</div>';
  }

  function historia(h) {
    main.onclick = null;
    main.classList.add('lectura');
    lado('inicio');
    guardar(K_ULTIMA, h.id);
    const varios = h.capitulos.length > 1;
    const fam = porInicio(H.filter((x) => x.familia === h.familia));
    const todas = porInicio(H);
    const sig = fam.length > 1 ? fam[(fam.indexOf(h) + 1) % fam.length] : todas[(todas.indexOf(h) + 1) % todas.length];
    const ant = fam.length > 2 ? fam[(fam.indexOf(h) - 1 + fam.length) % fam.length] : null;
    const nHitos = piezas(h).length - escuchables(h).length;
    main.innerHTML = '<div class="hero">' +
      '<a class="volver-fam" href="' + hashFam(h.familia) + '">' + ic('atras') + esc(h.familia) + '</a>' +
      '<div class="hero-in">' + funda(h, true) +
      '<div class="hero-txt"><h1>' + esc(h.titulo) + '</h1><p class="lema-h">' + esc(h.lema) + '</p>' +
      '<p class="datos">' + esc(rango(inicio(h), fin(h))) + ' · ' + fmt(escuchables(h).length) + ' canciones' + (nHitos ? ' · ' + nHitos + ' momentos clave' : '') + (varios ? ' · ' + h.capitulos.length + (h.ranking ? ' épocas' : ' caras') : '') + '</p>' +
      '<div id="prog">' + progreso(h) + '</div>' +
      '<div class="btnrow"><a class="btn pri" href="mando.html?historia=' + h.id + '" title="La Fonoteca busca cada canción y crea la playlist en tu Spotify">' + ic('spotify') + 'Crear en mi Spotify</a>' +
      '<button class="btn" id="copiar">' + ic('copia') + 'Copiar lista</button>' +
      '<a class="btn" href="#juego/' + h.id + '">' + ic('mando') + 'Ponte a prueba</a></div></div></div>' +
      '<p class="intro">' + esc(h.intro) + '</p></div>' + linea(h) +
      (varios ? '<nav class="indice" aria-label="Caras">' + h.capitulos.map((c, k) => '<a class="chip" data-cap="' + (k + 1) + '" href="#h/' + h.id + '/' + (k + 1) + '">' + (h.ranking ? '' : '<b>' + cara(k) + '</b>') + esc(c.corto || c.titulo) + '</a>').join('') + '</nav>' : '') +
      h.capitulos.map((c, k) => {
        let n = 0;
        const L = cara(k), canc = c.items.filter((i) => i.tipo !== 'hito').length;
        return '<section class="capitulo" id="cap-' + (k + 1) + '">' +
          '<header class="cap-cab">' + (varios && !h.ranking ? '<span class="letra" aria-hidden="true">' + L + '</span>' : '') + '<div class="cap-txt">' +
          '<h2>' + esc(c.titulo) + '</h2><p class="periodo">' + esc(c.periodo) + ' · ' + canc + (canc === 1 ? ' canción' : ' canciones') + (varios && !h.ranking ? ' · cara ' + L : '') + '</p>' +
          (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') + '</div>' +
          (h.ranking ? '' : '<button class="editar-cap" data-cap="' + esc(h.id + '|' + c.orig) + '" title="Cambiar el nombre o quitar este apartado" aria-label="Editar este apartado">' + ic('lapiz') + '</button>') + '</header>' +
          '<ol class="lista">' + c.items.map((i) => fila(i, h, null, '', i.tipo === 'hito' || h.ranking ? '' : (varios ? L : '') + (++n))).join('') + '</ol></section>';
      }).join('') +
      cambiosHtml(h) +
      '<div class="nav-fin">' + (ant ? '<a class="siguiente ant" href="#h/' + ant.id + '">' + ic('atras') + '<span><span class="de">Anterior en ' + esc(h.familia) + '</span><b>' + esc(ant.titulo) + '</b></span></a>' : '') +
      (sig ? '<a class="siguiente" href="#h/' + sig.id + '"><span><span class="de">' + (fam.length > 1 ? 'Siguiente en ' + esc(h.familia) : 'Siguiente historia') + '</span><b>' + esc(sig.titulo) + '</b></span>' + ic('sig') + '</a>' : '') + '</div>';
    const cc = $('#copiarCambios'); if (cc) cc.onclick = () => copiar(textoCambios(h));
    $('#copiar').onclick = () => copiar(escuchables(h).map((i) => fa(i.a) + ' · ' + i.art + ' — ' + i.t).join('\n'));
    espiar('.capitulo', '.indice', 'cap-', 'cap');
  }

  /* ---------- años: qué pasó y qué sonaba ---------- */
  const A_MIN = 1900, A_MAX = 2026;
  let cronoFam = '';
  const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX'];
  const etapa = (a) => a < 0 ? 'Antes de Cristo' : a < 1500 ? 'Antigüedad y Edad Media' : a < 1900 ? 'Siglo ' + ROM[Math.floor(a / 100) + 1] : 'Los años ' + (a < 2000 ? String(Math.floor(a / 10) * 10).slice(2) : Math.floor(a / 10) * 10);
  function indiceAnyos() {
    if (_porAnyo) return _porAnyo;
    const m = new Map();
    H.forEach((h) => h.capitulos.forEach((c, k) => c.items.forEach((i) => { (m.get(i.a) || m.set(i.a, []).get(i.a)).push({ h, i, k }); })));
    return (_porAnyo = m);
  }
  function anyos(arg) {
    main.onclick = null;
    main.classList.add('lectura');
    lado('anyos');
    if (arg === 'crono') return cronologia();
    const ix = indiceAnyos();
    let y = parseInt(arg, 10);
    if (!(y >= A_MIN && y <= A_MAX)) y = leer(K_ANYO, 1997);
    y = Math.min(A_MAX, Math.max(A_MIN, y));
    guardar(K_ANYO, y);
    const cuenta = (a) => (ix.get(a) || []).filter((x) => x.i.tipo !== 'hito').length;
    let max = 1; for (let a = A_MIN; a <= A_MAX; a++) max = Math.max(max, cuenta(a));
    const es = ix.get(y) || [];
    const hm = new Map();
    for (const x of es) if (x.i.tipo === 'hito') { const k = norm(x.i.art + '|' + x.i.t); (hm.get(k) || hm.set(k, []).get(k)).push(x); }
    const hitos = [...hm.values()];
    // una canción puede estar en varias historias: sale una vez, con todas sus historias
    const canc = new Map();
    for (const x of es) if (x.i.tipo !== 'hito') { const k = norm(x.i.art + '|' + x.i.t); (canc.get(k) || canc.set(k, []).get(k)).push(x); }
    const lc = [...canc.values()].sort((p, q) => q.length - p.length || p[0].i.art.localeCompare(q[0].i.art, 'es'));
    const deH = (l) => '<span class="de-h">' + l.map(({ h, k }) => '<a href="#h/' + h.id + '/' + (k + 1) + '" style="--c:' + h.color + '"><i class="pto"></i>' + esc(h.titulo) + '</a>').join('') + '</span>';
    const dec = Math.floor(y / 10) * 10;
    const era = eraDe(y);
    let html = '<section class="cab"><h1>Año a año</h1><p class="lead">Elige un año y mira qué pasó y qué sonaba en todas las historias.</p></section>' +
      '<div class="anyo-top"><div class="selector">' +
      '<div class="sel-anyo"><button class="btn redondo" data-y="' + (y - 1) + '" aria-label="Año anterior"' + (y <= A_MIN ? ' disabled' : '') + '>' + ic('menos') + '</button>' +
      '<output aria-live="polite">' + y + '</output>' +
      '<button class="btn redondo" data-y="' + (y + 1) + '" aria-label="Año siguiente"' + (y >= A_MAX ? ' disabled' : '') + '>' + ic('mas') + '</button></div>' +
      '<div class="barras" role="group" aria-label="Canciones por año, de ' + A_MIN + ' a ' + A_MAX + '">';
    for (let a = A_MIN; a <= A_MAX; a++) {
      const n = cuenta(a);
      html += '<button data-y="' + a + '" class="' + (a === y ? 'on' : a >= dec && a < dec + 10 ? 'dec' : '') + '" style="--h:' + Math.max(4, Math.round(100 * Math.sqrt(n / max))) + '%" aria-label="' + a + ': ' + n + ' canciones" tabindex="-1"></button>';
    }
    html += '</div><div class="ejes"><span>1900</span><span>1925</span><span>1950</span><span>1975</span><span>2000</span><span>2026</span></div>' +
      '<div class="atajos-anyo">' + [1997, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((a) => '<button class="chip' + (a === y ? ' on' : '') + '" data-y="' + a + '">' + (a === 1997 ? '1997' : a + 's') + '</button>').join('') +
      '<a class="chip" href="#crono">Toda la cronología</a></div></div>' +
      '<figure class="era-foto"><img src="historias/fotos/' + era.k + '.jpg" alt="' + esc(era.foto) + '" width="1200" height="800"><figcaption>' + esc(era.tit) + ': ' + esc(era.foto) + '</figcaption></figure></div>';
    html += '<section class="capitulo"><header class="cap-cab"><div class="cap-txt"><h2>' + (hitos.length ? 'Lo que pasó en ' + y : 'En ' + y + ' no hay momentos clave apuntados') + '</h2>' +
      (hitos.length ? '<p class="periodo">' + hitos.length + (hitos.length === 1 ? ' momento clave' : ' momentos clave') + '</p>' : '<p class="periodo">Pero sí canciones: aquí debajo.</p>') + '</div></header>' +
      (hitos.length ? '<ol class="lista">' + hitos.map((l) => fila(l[0].i, l[0].h, null, deH(l))).join('') + '</ol>' : '') + '</section>';
    html += '<section class="capitulo"><header class="cap-cab"><div class="cap-txt"><h2>Lo que sonaba en ' + y + '</h2><p class="periodo">' + lc.length + (lc.length === 1 ? ' canción o disco' : ' canciones y discos') +
      (lc.length > 150 ? ' · primero las que salen en más historias' : '') + '</p></div></header>' +
      (lc.length ? '<ol class="lista">' + lc.slice(0, 150).map((l) => fila(l[0].i, l[0].h, null, deH(l))).join('') + '</ol>' +
        (lc.length > 150 ? '<p class="aviso">Hay ' + (lc.length - 150) + ' más. Búscalas escribiendo «' + y + '» arriba.</p>' : '')
        : '<p class="vacio">Ninguna canción de ' + y + ' en las historias.</p>') + '</section>';
    main.innerHTML = html;
    main.onclick = (e) => {
      const b = e.target.closest('[data-y]'); if (!b || b.disabled || b.closest('.barras')) return;
      location.hash = '#anyos/' + b.dataset.y;
    };
    const barras = main.querySelector('.barras'), salida = main.querySelector('.sel-anyo output');
    barras.tabIndex = 0;
    // arrastrar el dedo (o el ratón) por la gráfica cambia el año; al soltar, se abre
    const anyoEn = (x) => { const r = barras.getBoundingClientRect(); return Math.min(A_MAX, Math.max(A_MIN, A_MIN + Math.floor((x - r.left) / r.width * (A_MAX - A_MIN + 1)))); };
    let arrastre = null, x0 = 0, y0 = 0, horizontal = false, tactil = false;
    const pintar = (a) => { salida.textContent = a; barras.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.y === a)); };
    barras.onpointerdown = (e) => { tactil = e.pointerType === 'touch'; x0 = e.clientX; y0 = e.clientY; horizontal = !tactil; arrastre = anyoEn(e.clientX); if (!tactil) pintar(arrastre); };
    barras.onpointermove = (e) => {
      if (arrastre == null) return;
      if (tactil && !horizontal) {
        const dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
        if (dy > 8 && dy > dx) { arrastre = null; return; } // está bajando la página
        if (dx > 8) { horizontal = true; try { barras.setPointerCapture(e.pointerId); } catch (er) {} }
      }
      if (horizontal) { arrastre = anyoEn(e.clientX); pintar(arrastre); }
    };
    barras.onpointerup = (e) => { if (arrastre == null) return; const a = tactil && !horizontal ? anyoEn(e.clientX) : arrastre; arrastre = null; location.hash = '#anyos/' + a; };
    barras.onpointercancel = () => { arrastre = null; pintar(y); };
    barras.onkeydown = (e) => {
      const d = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -10, ArrowUp: 10 }[e.key];
      if (d) { e.preventDefault(); location.hash = '#anyos/' + Math.min(A_MAX, Math.max(A_MIN, y + d)); }
    };
  }
  function cronologia() {
    const todos = [];
    H.forEach((h) => h.capitulos.forEach((c, k) => c.items.forEach((i) => {
      if (i.tipo === 'hito' && (!cronoFam || h.familia === cronoFam)) todos.push({ h, i, k });
    })));
    todos.sort((x, y) => x.i.a - y.i.a || x.h.titulo.localeCompare(y.h.titulo, 'es'));
    const grupos = [];
    let g = null;
    for (const e of todos) { const n = etapa(e.i.a); if (!g || g.n !== n) grupos.push(g = { n, l: [] }); g.l.push(e); }
    main.innerHTML = '<section class="cab"><a class="volver-fam" href="#anyos">' + ic('atras') + 'Año a año</a><h1>Toda la cronología</h1>' +
      '<p class="lead">Los ' + fmt(todos.length) + ' momentos clave de todas las historias, del más antiguo al más reciente.</p></section>' +
      '<div class="filtros"><button class="chip' + (cronoFam ? '' : ' on') + '" data-cf="">Todas</button>' +
      familias().map((f) => '<button class="chip' + (f === cronoFam ? ' on' : '') + '" data-cf="' + esc(f) + '" style="--c:' + colorFam(f) + '"><i class="pto"></i>' + esc(f) + '</button>').join('') + '</div>' +
      '<nav class="indice" aria-label="Épocas">' + grupos.map((g, n) => '<button class="chip" data-s="' + n + '">' + esc(g.n.replace('Los años ', '')) + '</button>').join('') + '</nav>' +
      grupos.map((g, n) => '<section class="capitulo" id="ct-' + n + '"><header class="cap-cab"><div class="cap-txt"><h2>' + esc(g.n) + '</h2><p class="periodo">' + g.l.length + ' momento' + (g.l.length === 1 ? '' : 's') + ' clave</p></div></header>' +
        '<ol class="lista">' + g.l.map(({ h, i, k }) => fila(i, h, null, '<span class="de-h"><a href="#h/' + h.id + '/' + (k + 1) + '" style="--c:' + h.color + '"><i class="pto"></i>' + esc(h.titulo) + '</a></span>')).join('') + '</ol></section>').join('');
    main.onclick = (e) => {
      const f = e.target.closest('[data-cf]');
      if (f) { cronoFam = f.dataset.cf; cambiar(cronologia); scrollTo(0, 0); return; }
      const s = e.target.closest('[data-s]');
      if (s) { const el = document.getElementById('ct-' + s.dataset.s); if (el) el.scrollIntoView({ behavior: MOV ? 'smooth' : 'auto' }); }
    };
  }

  /* ---------- lo tuyo: lo que llevas escuchado y lo que has cambiado ---------- */
  function tuyo() {
    main.onclick = null;
    main.classList.remove('lectura');
    lado('tuyo');
    const conOidas = H.filter((h) => oidas(h));
    const aMedias = conOidas.filter((h) => oidas(h) < escuchables(h).length).sort((a, b) => oidas(b) / escuchables(b).length - oidas(a) / escuchables(a).length);
    const hechas = porInicio(conOidas.filter((h) => oidas(h) >= escuchables(h).length));
    const total = H.reduce((s, h) => s + oidas(h), 0);
    const tienes = TUYAS ? H.filter((h) => !oidas(h)).map((h) => [h, tuyas(h)]).filter((x) => x[1] >= 5).sort((a, b) => b[1] / escuchables(b[0]).length - a[1] / escuchables(a[0]).length).slice(0, 8) : [];
    const conCambios = H.filter((h) => textoCambios(h));
    let html = '<section class="cab"><h1>Lo tuyo</h1><p class="lead">' + (total ? 'Llevas ' + fmt(total) + ' canciones escuchadas en ' + conOidas.length + (conOidas.length === 1 ? ' historia' : ' historias') + (hechas.length ? ', y has terminado ' + hechas.length : '') + '.' :
      'Aún no has marcado ninguna canción como escuchada. Usa el botón del visto al lado de cada canción y aquí verás cómo vas.') + ' Se guarda en este aparato.</p></section>';
    if (!total) { const d = new Date(), n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); const l = [...new Set([0, 1, 2, 3].map((k) => H[(n * 37 + k * 53) % H.length]))];
      html += '<section class="bloque"><h2>Para empezar</h2><p class="sub">La historia de hoy y otras tres que cambian cada día.</p><div class="rejilla">' + l.map(tarjeta).join('') + '</div></section>'; }
    if (aMedias.length) html += '<section class="bloque"><h2>A medias</h2><div class="rejilla">' + aMedias.map(tarjeta).join('') + '</div></section>';
    if (hechas.length) html += '<section class="bloque"><h2>Terminadas</h2><div class="rejilla">' + hechas.map(tarjeta).join('') + '</div></section>';
    if (tienes.length) html += '<section class="bloque"><h2>Ya tienes muchas de estas</h2><p class="sub">Historias que no has empezado y en las que ya tienes canciones en tu Fonoteca.</p><div class="rejilla">' + tienes.map((x) => tarjeta(x[0])).join('') + '</div></section>';
    const g = ghCfg(), at = leer(K_SYNC_AT, 0);
    html += '<section class="bloque"><h2>Tus aparatos</h2>' + (g
      ? '<p class="sub">Lo que marcas aquí se guarda también en tu GitHub y llega a tus otros aparatos.' + (at ? ' Última vez: ' + new Date(at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '.' : '') + '</p><button class="btn" id="syncYa">' + ic('reloj') + 'Sincronizar ahora</button>'
      : '<p class="sub"><b>Este aparato no se sincroniza:</b> lo que marques aquí no llega a los demás. En la Fonoteca del ordenador ve a Ajustes › Vincular el móvil y pega aquí el código.</p>' +
        '<form class="vinc" id="vincF"><input id="vincC" placeholder="Pega el código de vinculación" autocomplete="off" aria-label="Código de vinculación"><button class="btn pri">Vincular</button></form>') + '</section>';
    html += '<section class="bloque"><h2>Tus cambios</h2>' + (conCambios.length ?
      '<p class="sub">Canciones y apartados que has quitado o renombrado en ' + conCambios.length + (conCambios.length === 1 ? ' historia' : ' historias') + '. Llegan a tus otros aparatos si están vinculados, pero no cambian la web para todos: copia la lista y pásamela para que sea para siempre.</p>' +
      '<ul class="lista-cambios">' + conCambios.map((h) => '<li><a href="#h/' + h.id + '"><i class="pto" style="--c:' + h.color + '"></i>' + esc(h.titulo) + '</a><span>' + ((n) => n + (n === 1 ? ' cambio' : ' cambios'))(textoCambios(h).split('\n').length - 1) + '</span></li>').join('') + '</ul>' +
      '<button class="btn pri" id="copiarTodo">' + ic('copia') + 'Copiar todos los cambios</button>'
      : '<p class="sub">No has quitado ni renombrado nada. Si en una historia sobra una canción, quítala con la equis de su fila; el lápiz de cada apartado sirve para renombrarlo o quitarlo.</p>') + '</section>';
    main.innerHTML = html;
    const ct = $('#copiarTodo'); if (ct) ct.onclick = () => copiar(conCambios.map(textoCambios).join('\n\n'));
    const sy = $('#syncYa'); if (sy) sy.onclick = () => { toast('Sincronizando…'); sincronizar().then((ok) => { toast(ok ? 'Al día' : 'No se pudo sincronizar: mira la conexión y prueba otra vez'); ruta(true); }); };
    const vf = $('#vincF'); if (vf) vf.onsubmit = (e) => { e.preventDefault(); if (vincular($('#vincC').value)) ruta(true); };
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
    main.classList.add('lectura');
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
    const que = modo === 'mito' ? 'Se dice que' : i.tipo === 'hito' ? 'Momento clave' : i.tipo === 'disco' ? 'Disco' : 'Canción';
    main.innerHTML = '<section class="cab"><h1>' + (modo === 'mito' ? '¿Mito o verdad?' : '¿De qué año es?') + '</h1>' +
      '<p class="lead">' + (h0 ? 'Con las piezas de «' + esc(h0.titulo) + '».' : 'Con todas las historias.') + ' Responde con 1-4 en el teclado y pasa con Intro.</p>' +
      '<div class="filtros"><button class="chip' + (modo === 'anyo' ? ' on' : '') + '" data-jm="anyo">¿De qué año?</button>' +
      (!h0 || hayMitos(h0) ? '<button class="chip' + (modo === 'mito' ? ' on' : '') + '" data-jm="mito">¿Mito o verdad?</button>' : '') +
      (h0 ? '<a class="chip" href="#juego">Con todas las historias</a>' : '') + '</div>' +
      '<p class="marcador">Aciertos <b>' + JG.ac + '</b> de ' + JG.ro + ' · racha <b>' + JG.racha + '</b> · tu mejor racha <b>' + (st[modo] || 0) + '</b></p></section>' +
      '<div class="jcarta' + (resp == null ? '' : resp === bien ? ' ok' : ' mal') + '" style="--c:' + h.color + '">' +
      (modo === 'mito' ? '<p class="que">' + que + '…</p><p class="pregunta">' + esc(p.dice) + '</p><p class="sub">' + esc(i.art) + ' · ' + esc(i.t) + '</p>'
        : '<p class="que">' + que + '</p><p class="pregunta">' + esc(i.t) + '</p><p class="sub">' + esc(i.art) + '</p>') +
      '<div class="jops">' + JG.ops.map((o, n) => '<button class="jop' + (resp == null ? '' : o === bien ? ' bien' : o === resp ? ' fallo' : ' apagada') + '" data-op="' + n + '"' + (resp == null ? '' : ' disabled') + '><kbd>' + (n + 1) + '</kbd>' + esc(etOp(o)) + '</button>').join('') + '</div>' +
      (resp == null ? '' : '<div class="jsol"><p class="veredicto-j">' + (resp === bien ? '¡Bien!' : modo === 'mito' ? 'Es «' + VER[bien] + '»' : 'Es de ' + fa(bien)) + '</p>' +
        '<p>' + esc(modo === 'mito' ? (p.real ? 'Realidad: ' + p.real : i.n) : i.n) + '</p>' +
        '<div class="btnrow"><button class="btn pri" id="jsig">' + ic('sig') + 'Siguiente</button>' +
        (i.tipo === 'hito' ? '' : enlaces(i, 'btn')) +
        '<a class="btn" href="#h/' + h.id + '/' + (k + 1) + '">' + ic('disco') + esc(h.titulo) + '</a></div></div>') +
      '</div>';
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
      if (JG.racha > (st[JG.modo] || 0)) { st[JG.modo] = JG.racha; guardar(K_JUEGO, st); programarSync(); if (JG.racha > 2) toast('¡Nueva mejor racha: ' + JG.racha + '!'); }
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
    let q = norm(texto).trim(), desdeA = null, hastaA = null;
    q = q.replace(/\b(?:(?:los\s+)?anos\s+)?(\d{2,4})s\b|\b(?:los\s+)?anos\s+(\d{2})\b|\blos\s+(\d0)\b/g, (m, a, b, c) => {
      let d = +(a || b || c);
      if (d < 100) d += d < 30 ? 2000 : 1900;
      if (d % 10 === 0) { desdeA = d; hastaA = d + 9; return ' '; }
      return m;
    });
    q = q.replace(/\b(1[89]\d\d|20\d\d)\b/g, (m) => { desdeA = hastaA = +m; return ' '; });
    const terms = q.split(/\s+/).filter((w) => w.length > 1 || /\d/.test(w));
    return { terms, desdeA, hastaA };
  }
  let filtroBusca = 'todo';
  function resultados(texto) {
    main.onclick = null;
    main.classList.add('lectura');
    lado(null);
    const { terms, desdeA, hastaA } = analizar(texto);
    const historias = terms.length ? porInicio(H.filter((h) => {
      const hay = norm(h.titulo + ' ' + h.lema + ' ' + h.familia + ' ' + h.capitulos.map((c) => c.titulo).join(' '));
      return terms.every((t) => hay.indexOf(t) >= 0);
    })) : [];
    const grupos = [];
    let total = 0;
    for (const h of H) {
      const tit = norm(h.titulo);
      const enc = [];
      h.capitulos.forEach((c, k) => c.items.forEach((i) => {
        if (filtroBusca === 'canciones' && i.tipo === 'hito') return;
        if (filtroBusca === 'hitos' && i.tipo !== 'hito') return;
        if (desdeA != null && (i.a < desdeA || i.a > hastaA)) return;
        const hay = norm(i.art + ' ' + i.t + ' ' + (i.n || '') + ' ' + (i.alias || []).join(' ') + ' ' + c.titulo) + ' ' + tit;
        if (terms.every((t) => hay.indexOf(t) >= 0)) enc.push({ i, k });
      }));
      if (enc.length) { grupos.push({ h, enc: porAnyo(enc.map((x) => Object.assign({ a: x.i.a }, x))) }); total += enc.length; }
    }
    grupos.sort((a, b) => b.enc.length - a.enc.length);
    const rg = desdeA != null ? (desdeA === hastaA ? ' del año ' + desdeA : ' de ' + desdeA + ' a ' + hastaA) : '';
    let html = '<section class="cab"><h1>' + fmt(total) + ' resultado' + (total === 1 ? '' : 's') + esc(rg) + '</h1>' +
      '<p class="lead">' + (grupos.length ? 'En ' + grupos.length + ' historia' + (grupos.length === 1 ? '' : 's') + ', cada una en orden de año.' : 'Prueba con un artista, un título, un año («1977») o una década («80s»).') + '</p>' +
      '<div class="filtros">' + [['todo', 'Todo'], ['canciones', 'Solo canciones'], ['hitos', 'Solo momentos clave']].map(([v, l]) =>
        '<button class="chip' + (filtroBusca === v ? ' on' : '') + '" data-b="' + v + '">' + l + '</button>').join('') + '</div></section>';
    if (historias.length) html += '<section class="bloque"><h2>Historias</h2><div class="rejilla">' + historias.slice(0, 8).map(tarjeta).join('') + '</div></section>';
    let pintadas = 0;
    for (const { h, enc } of grupos) {
      if (pintadas > 400) { html += '<p class="aviso">Hay más resultados: afina la búsqueda.</p>'; break; }
      html += '<section class="grupo"><a class="grupo-cab" href="#h/' + h.id + '"><i class="pto" style="--c:' + h.color + '"></i><b>' + esc(h.titulo) + '</b><span>' + enc.length + '</span>' + ic('sig') + '</a>' +
        '<ol class="lista">' + enc.map(({ i }) => fila(i, h, terms)).join('') + '</ol></section>';
      pintadas += enc.length;
    }
    main.innerHTML = html;
    main.querySelector('.filtros').onclick = (e) => {
      const b = e.target.closest('[data-b]'); if (!b) return;
      filtroBusca = b.dataset.b; resultados(buscar.value.trim());
    };
  }

  // Marcar o desmarcar una pieza como escuchada, quitar y recuperar
  main.addEventListener('click', (e) => {
    const eb = e.target.closest('.editar-cap');
    if (eb) { abrirEditor(eb); return; }
    const qb = e.target.closest('.quitar');
    if (qb) {
      const k = qb.dataset.q, row = qb.closest('.row');
      const hecho = () => { quitar(k, true); toast('Canción quitada', { txt: 'Deshacer', fn: () => quitar(k, false) }); };
      if (MOV && row) { row.classList.add('saliendo'); setTimeout(hecho, 220); } else hecho();
      return;
    }
    const cv = e.target.closest('[data-cap-volver]');
    if (cv) { editarCap(cv.dataset.capVolver, null); toast('Apartado como estaba'); return; }
    const vb = e.target.closest('[data-volver]');
    if (vb) { quitar(vb.dataset.volver, false); toast('Canción recuperada'); return; }
    const b = e.target.closest('.oida'); if (!b) return;
    const k = b.dataset.k, on = !OIDAS.has(k);
    on ? OIDAS.add(k) : OIDAS.delete(k);
    guardar(K_OIDAS, [...OIDAS]); marcarTs('o|' + k);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.title = on ? 'Escuchada' : 'Marcar como escuchada';
    b.closest('.row').classList.toggle('oida-on', on);
    const h = H.find((x) => x.id === k.split('|')[0]), p = $('#prog');
    if (h && p) p.innerHTML = progreso(h);
    if (on && h && oidas(h) === escuchables(h).length) toast('¡Historia completa!');
  });

  // Editor de un apartado, debajo de su cabecera: cambiar el nombre o quitarlo entero
  function abrirEditor(b) {
    const cab = b.closest('.cap-cab'), k = b.dataset.cap;
    const prev = cab.parentNode.querySelector('.editor-cap');
    if (prev) { prev.remove(); return; }
    const h = H.find((x) => x.id === k.split('|')[0]);
    const c = h && h.capitulos.find((x) => x.orig === k.slice(h.id.length + 1));
    if (!c) return;
    const unico = h.capitulos.length < 2;
    const n = c.items.filter((i) => i.tipo !== 'hito').length;
    const f = document.createElement('form');
    f.className = 'editor-cap';
    f.innerHTML = '<label>Nombre del apartado<input name="nombre" maxlength="80" value="' + esc(c.titulo) + '"></label>' +
      '<div class="btnrow"><button class="btn sm pri" type="submit">' + ic('check') + 'Guardar nombre</button>' +
      (unico ? '' : '<button class="btn sm peligro" type="button" data-accion="quitar">' + ic('quitar') + 'Quitar apartado (' + n + ' canciones)</button>') +
      '<button class="btn sm" type="button" data-accion="cerrar">Cancelar</button></div>' +
      (unico ? '<p>Es el único apartado de esta historia, así que no se puede quitar.</p>' : '');
    cab.after(f);
    const inp = f.querySelector('input'); inp.focus(); inp.select();
    f.onsubmit = (e) => {
      e.preventDefault();
      const v = inp.value.trim();
      editarCap(k, !v || v === c.orig ? null : { nombre: v });
      toast('Nombre guardado');
    };
    f.onclick = (e) => {
      const a = e.target.closest('[data-accion]'); if (!a) return;
      if (a.dataset.accion === 'cerrar') { f.remove(); return; }
      editarCap(k, { fuera: true });
      toast('Apartado quitado', { txt: 'Deshacer', fn: () => editarCap(k, null) });
    };
  }

  /* ---------- movimiento: cada bloque entra al aparecer (solo si no pides menos movimiento) ---------- */
  let revela = null;
  function animarEntradas() {
    if (!MOV || !('IntersectionObserver' in window)) return;
    if (revela) revela.disconnect();
    revela = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('dentro'); revela.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    main.querySelectorAll('.era-cab, .tarj, .cap-cab, .hoy, .bloque > h2, .jcarta').forEach((el, n) => {
      if (el.getBoundingClientRect().top < innerHeight * 0.9) return; // lo que ya se ve, quieto
      el.classList.add('revela'); el.style.setProperty('--d', (n % 4) * 70 + 'ms'); revela.observe(el);
    });
  }

  function cambiar(fn) {
    fn();
    if (MOV) { main.classList.remove('entra'); void main.offsetWidth; main.classList.add('entra'); }
  }

  function ruta(mantenerScroll) {
    if (buscar.value.trim().length > 1) return resultados(buscar.value.trim());
    filtroBusca = 'todo';
    const y = scrollY, hs = location.hash;
    const fijar = (t) => { document.title = t; scrollTo(0, mantenerScroll ? y : 0); animarEntradas(); };
    if (hs === '#crono') { anyos('crono'); return fijar('Cronología · Historias'); }
    const an = hs.match(/^#anyos(?:\/(-?\d+))?/);
    if (an) { anyos(an[1]); return fijar('Año a año · Historias'); }
    if (hs === '#tuyo') { tuyo(); return fijar('Lo tuyo · Historias'); }
    const j = hs.match(/^#juego(?:\/([^/]+))?/);
    if (j) { juego(j[1]); return fijar('Juego · Historias'); }
    const x = hs.match(/^#explorar(?:\/(.+))?/);
    if (x) {
      let f = ''; try { f = decodeURIComponent(x[1] || ''); } catch (e) {}
      if (f === 'Bass music') f = 'Jamaica y bass music'; // nombre antiguo de la familia
      portada(f); return fijar((f || 'Inicio') + ' · Historias');
    }
    const m = hs.match(/^#h\/([^/]+)(?:\/(\d+))?/) || [];
    const h = H.find((z) => z.id === m[1]);
    if (!h) { portada(''); return fijar('Historias de la música'); }
    document.title = h.titulo + ' · Historias';
    historia(h);
    animarEntradas();
    if (mantenerScroll) return scrollTo(0, y);
    const destino = m[2] && document.getElementById('cap-' + m[2]);
    destino ? destino.scrollIntoView({ behavior: 'auto' }) : scrollTo(0, 0);
  }

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
  sincronizar();
})();

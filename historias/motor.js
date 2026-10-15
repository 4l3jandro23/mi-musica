/* Motor de «Historias de la música» (historias.html), hermana de la Fonoteca.
   Lee window.HISTORIAS (lo rellenan los archivos de historias/datos/) y pinta:
   - #            → portada con todas las historias agrupadas por familia
   - #h/<id>[/n]  → una historia por capítulos (n = capítulo al que saltar)
   Cada pieza: { a: año, art: artista, t: título, n: nota, tipo?: 'hito'|'disco', q?: búsqueda }
   'hito' = momento clave sin audio; 'disco' = se escucha el álbum entero.
   No usa la API de Spotify: «Escuchar» abre una búsqueda, así no gasta cupo. */
(function () {
  const $ = (s) => document.querySelector(s);
  const H = window.HISTORIAS;
  const main = $('#main'), buscar = $('#buscar');

  // Mismo tema que la Fonoteca si allí se eligió uno a mano
  try {
    const p = JSON.parse(localStorage.getItem('mando_prefs_v1') || '{}');
    if (p.tema) document.documentElement.dataset.theme = p.tema;
  } catch (e) {}

  const ICO = {
    nota: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    atras: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    copia: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'
  };
  const ic = (n) => '<svg class="i" viewBox="0 0 24 24">' + ICO[n] + '</svg>';
  $('.marca').innerHTML = ic('nota');
  $('#aFono').innerHTML = ic('atras') + 'Fonoteca';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const piezas = (h) => h.capitulos.flatMap((c) => c.items);
  const escuchables = (h) => piezas(h).filter((i) => i.tipo !== 'hito');
  const urlSpotify = (i) => 'https://open.spotify.com/search/' + encodeURIComponent(i.q || i.art + ' ' + i.t);
  const familias = () => [...new Set(H.map((h) => h.familia))];

  let _t;
  function toast(txt) {
    const t = $('#toast'); t.textContent = txt; t.classList.add('ver');
    clearTimeout(_t); _t = setTimeout(() => t.classList.remove('ver'), 2200);
  }

  function lado(actual) {
    $('#lado').innerHTML = '<div class="tit">Historias</div>' +
      '<a class="volver" href="mando.html">' + ic('atras') + 'Fonoteca</a>' +
      '<a href="#"' + (actual ? '' : ' class="on"') + '>' + ic('nota') + 'Todas</a>' +
      familias().map((f) => '<div class="sec">' + esc(f) + '</div>' +
        H.filter((h) => h.familia === f).map((h) =>
          '<a href="#h/' + h.id + '" style="--c:' + h.color + '"' + (actual === h.id ? ' class="on"' : '') + '><i class="pto"></i>' + esc(h.titulo) + '</a>').join('')).join('');
  }

  function fila(i, h) {
    const hito = i.tipo === 'hito';
    const etiqueta = hito ? '<span class="tipo">hito</span>' : i.tipo === 'disco' ? '<span class="tipo">disco</span>' : '';
    return '<li class="row' + (hito ? ' hito' : '') + '" style="--tinte:' + h.color + '">' +
      '<span class="anyo">' + esc(i.a) + '</span>' +
      '<div class="txt"><div class="t1">' + esc(i.t) + etiqueta + '</div><div class="t2">' + esc(i.art) + '</div>' +
      (i.n ? '<p class="nota">' + esc(i.n) + '</p>' : '') + '</div>' +
      (hito ? '' : '<a class="btn sm oir" href="' + urlSpotify(i) + '" target="_blank" rel="noopener" title="Buscar en Spotify">' + ic('play') + '<span>Escuchar</span></a>') +
      '</li>';
  }

  function portada() {
    lado(null);
    main.innerHTML = '<div class="cab"><span class="eti">Para leer y escuchar</span><h2>Historias de la música</h2>' +
      '<p>Cada historia es una lista elegida a mano y en orden cronológico, con el porqué de cada pieza. Sin algoritmos que te cuelen nada.</p></div>' +
      familias().map((f) => '<section class="familia"><span class="eti">' + esc(f) + '</span><div class="rejilla">' +
        H.filter((h) => h.familia === f).map((h) =>
          '<a class="tarj" href="#h/' + h.id + '" style="--c:' + h.color + '">' +
          '<span class="eti">' + esc(h.periodo) + '</span><b>' + esc(h.titulo) + '</b>' +
          '<span class="lema">' + esc(h.lema) + '</span>' +
          '<span class="cuenta">' + escuchables(h).length + ' piezas' + (h.capitulos.length > 1 ? ' · ' + h.capitulos.length + ' capítulos' : '') + '</span></a>').join('') +
        '</div></section>').join('');
  }

  function historia(h) {
    lado(h.id);
    const varios = h.capitulos.length > 1;
    main.innerHTML = '<div class="hero" style="--tinte:' + h.color + '">' +
      '<a class="btn sm atras" href="#">' + ic('atras') + 'Todas</a>' +
      '<span class="eti">' + esc(h.familia) + ' · ' + esc(h.periodo) + '</span>' +
      '<h2>' + esc(h.titulo) + '</h2><p>' + esc(h.intro) + '</p>' +
      '<div class="btnrow"><a class="btn pri" href="mando.html?historia=' + h.id + '" title="La Fonoteca busca cada canción y crea la playlist en tu Spotify">' + ic('play') + 'Crear en mi Spotify</a>' +
      '<button class="btn" id="copiar">' + ic('copia') + 'Copiar lista</button>' +
      (varios ? h.capitulos.map((c, k) => '<a class="chip" href="#h/' + h.id + '/' + (k + 1) + '">Cap. ' + (k + 1) + '</a>').join('') : '') +
      '</div></div>' +
      h.capitulos.map((c, k) => '<section class="capitulo" id="cap-' + (k + 1) + '" style="--tinte:' + h.color + '">' +
        (varios ? '<span class="eti">Capítulo ' + (k + 1) + '</span>' : '') +
        '<h3>' + esc(c.titulo) + '<span>' + esc(c.periodo) + '</span></h3>' +
        (c.intro ? '<p>' + esc(c.intro) + '</p>' : '') +
        '<ol class="lista">' + c.items.map((i) => fila(i, h)).join('') + '</ol></section>').join('');
    $('#copiar').onclick = () => {
      const txt = escuchables(h).map((i) => i.a + ' · ' + i.art + ' — ' + i.t).join('\n');
      navigator.clipboard.writeText(txt).then(() => toast('Lista copiada'), () => toast('No se pudo copiar'));
    };
  }

  function resultados(texto) {
    lado(null);
    const q = norm(texto);
    const hits = H.flatMap((h) => piezas(h)
      .filter((i) => norm(i.a + ' ' + i.art + ' ' + i.t + ' ' + i.n).includes(q))
      .map((i) => ({ i, h })));
    main.innerHTML = '<div class="cab"><span class="eti">Buscar</span><h2>' + hits.length + ' resultado' + (hits.length === 1 ? '' : 's') + '</h2></div>' +
      '<ol class="lista">' + hits.map(({ i, h }) => fila(Object.assign({}, i, { n: h.titulo + (i.n ? ' · ' + i.n : '') }), h)).join('') + '</ol>';
  }

  function ruta() {
    main.classList.remove('entra'); void main.offsetWidth; main.classList.add('entra');
    if (buscar.value.trim().length > 1) return resultados(buscar.value.trim());
    const m = location.hash.match(/^#h\/([^/]+)(?:\/(\d+))?/) || [];
    const h = H.find((x) => x.id === m[1]);
    document.title = h ? h.titulo + ' · Historias' : 'Historias de la música';
    if (!h) { portada(); scrollTo(0, 0); return; }
    historia(h);
    const destino = m[2] && document.getElementById('cap-' + m[2]);
    destino ? destino.scrollIntoView() : scrollTo(0, 0);
  }

  addEventListener('hashchange', () => { buscar.value = ''; ruta(); });
  buscar.addEventListener('input', ruta);
  ruta();
})();

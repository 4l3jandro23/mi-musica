# -*- coding: utf-8 -*-
"""
Enriquecedor de la Fonoteca (fase 1).

Lee tus canciones (biblioteca.json, la sube la Fonoteca desde Ajustes) y, para
cada artista, busca datos en fuentes gratuitas:
  - MusicBrainz: quién es (identificador), país, tipo y años de actividad.
  - Wikidata / Wikipedia: foto y resumen corto en español (si existe).
  - Last.fm (artist.getInfo): géneros y biografía si Wikipedia no tiene.
  - Cover Art Archive: portada de los discos que no la traigan de Spotify.

Escribe en la carpeta del repo:
  - artistas-info.json     lo que lee la vista Explorar (biblioteca.html)
  - no-identificados.csv   los artistas que no ha sabido identificar

Reglas que cumple:
  - MusicBrainz: como mucho 1 petición por segundo y User-Agent propio.
  - Caché en enriquecer/cache/ (no se sube a GitHub): nunca pide dos veces lo mismo.
  - Reanudable: si lo cortas (Ctrl+C o cerrando la ventana), sigue donde lo dejó.
  - Las veces siguientes solo procesa artistas nuevos.
  - No toca ningún otro archivo tuyo.

Uso:  python enriquecer.py               todo lo que falte
      python enriquecer.py --prueba 20   solo los 20 artistas con más canciones
      python enriquecer.py --reintentar  vuelve a probar los no identificados
Solo usa la biblioteca estándar de Python: no hay que instalar nada más.
"""
import argparse
import csv
import html
import json
import os
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zlib

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(AQUI)
# la caché va fuera de OneDrive, para que la sincronización no la bloquee
CACHE_DIR = os.path.join(os.environ.get('LOCALAPPDATA') or AQUI, 'Fonoteca', 'cache')
SALIDA = os.path.join(REPO, 'artistas-info.json')
INFORME = os.path.join(REPO, 'no-identificados.csv')
CORRECCIONES = os.path.join(AQUI, 'correcciones.csv')
CONFIG = os.path.join(AQUI, 'config.txt')
VERSION_DATOS = 1

# Pausa mínima entre peticiones a cada servidor (segundos)
PAUSAS = {
    'musicbrainz.org': 1.1,          # su norma: 1 por segundo; dejamos margen
    'coverartarchive.org': 0.5,
    'ws.audioscrobbler.com': 0.25,   # Last.fm admite unas 5 por segundo
    'www.wikidata.org': 0.3,
    'es.wikipedia.org': 0.3,
    'en.wikipedia.org': 0.3,
}
LASTFM_RUIDO = {'seen live', 'favorite', 'favorites', 'favourite', 'favourites', 'spotify', 'albums i own',
                'vinyl', 'cd', 'under 2000 listeners', 'all', 'beautiful', 'awesome', 'love', 'cool', 'check out'}


def fold(s):
    """Como fold() de la Fonoteca: sin tildes y en minúsculas."""
    return re.sub('[̀-ͯ]', '', unicodedata.normalize('NFD', str(s or ''))).lower()


def plano(s):
    """Para comparar nombres: solo letras y números."""
    return re.sub(r'[\W_]+', '', fold(s).replace('&', 'and'))   # conserva letras de cualquier alfabeto


def leer_json(ruta):
    try:
        with open(ruta, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def leer_config():
    cfg = {}
    if os.path.exists(CONFIG):
        with open(CONFIG, encoding='utf-8-sig') as f:
            for linea in f:
                linea = linea.strip()
                if linea and not linea.startswith('#') and '=' in linea:
                    k, v = linea.split('=', 1)
                    cfg[k.strip().upper()] = v.strip()
    return cfg


# ----------------------------------------------------------------- caché
class Cache:
    def __init__(self):
        os.makedirs(CACHE_DIR, exist_ok=True)
        self.db = sqlite3.connect(os.path.join(CACHE_DIR, 'fonoteca.sqlite'))
        self.db.execute('CREATE TABLE IF NOT EXISTS http (clave TEXT PRIMARY KEY, estado INT, cuerpo BLOB, at REAL)')
        self.db.execute('CREATE TABLE IF NOT EXISTS artista (clave TEXT PRIMARY KEY, estado TEXT, datos TEXT, at REAL)')
        self.db.commit()

    def http_get(self, clave):
        r = self.db.execute('SELECT estado, cuerpo FROM http WHERE clave=?', (clave,)).fetchone()
        if not r:
            return None
        return r[0], (json.loads(zlib.decompress(r[1]).decode('utf-8')) if r[1] else None)

    def http_put(self, clave, estado, datos):
        cuerpo = zlib.compress(json.dumps(datos, ensure_ascii=False).encode('utf-8')) if datos is not None else None
        self.db.execute('INSERT OR REPLACE INTO http VALUES (?,?,?,?)', (clave, estado, cuerpo, time.time()))
        self.db.commit()

    def artista_get(self, clave):
        r = self.db.execute('SELECT estado, datos, at FROM artista WHERE clave=?', (clave,)).fetchone()
        return (r[0], json.loads(r[1]), r[2]) if r else None

    def artista_put(self, clave, estado, datos):
        self.db.execute('INSERT OR REPLACE INTO artista VALUES (?,?,?,?)',
                        (clave, estado, json.dumps(datos, ensure_ascii=False), time.time()))
        self.db.commit()


class SinClaveLastfm(Exception):
    pass


class Red:
    def __init__(self, cache, contacto):
        self.cache = cache
        self.ultima = {}
        self.ua = 'LaFonoteca/1.0 (script personal de biblioteca musical' + ('; ' + contacto if contacto else '') + ')'
        self.peticiones = 0

    def _esperar(self, host):
        pausa = PAUSAS.get(host, 0.3)
        falta = self.ultima.get(host, 0) + pausa - time.time()
        if falta > 0:
            time.sleep(falta)
        self.ultima[host] = time.time()

    def json(self, url, clave=None):
        """GET con caché. Devuelve el JSON, o None si no existe (404)."""
        clave = clave or url
        c = self.cache.http_get(clave)
        if c is not None:
            return c[1]
        host = urllib.parse.urlparse(url).netloc
        for intento in range(6):
            self._esperar(host)
            req = urllib.request.Request(url, headers={'User-Agent': self.ua, 'Accept': 'application/json'})
            try:
                self.peticiones += 1
                with urllib.request.urlopen(req, timeout=30) as r:
                    datos = json.loads(r.read().decode('utf-8'))
            except urllib.error.HTTPError as e:
                if host == 'ws.audioscrobbler.com':
                    try:
                        err = json.loads(e.read().decode('utf-8')).get('error')
                    except Exception:
                        err = None
                    if err in (10, 26) or e.code == 403:
                        raise SinClaveLastfm()
                if e.code in (429, 500, 502, 503, 504):
                    time.sleep(3 * (intento + 1))
                    continue
                self.cache.http_put(clave, e.code, None)     # 400, 404 y demás: no existe, no se vuelve a pedir
                return None
            except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError):
                time.sleep(3 * (intento + 1))
                continue
            if host == 'ws.audioscrobbler.com' and isinstance(datos, dict) and datos.get('error'):
                err = datos.get('error')
                if err in (10, 26):
                    raise SinClaveLastfm()
                if err in (11, 16, 29):          # servicio caído o demasiadas peticiones: reintentar
                    time.sleep(5 * (intento + 1))
                    continue
            self.cache.http_put(clave, 200, datos)
            return datos
        raise ConnectionError('No contesta ' + host)


# --------------------------------------------------------- fuentes
MB = 'https://musicbrainz.org/ws/2/'


def mb_escapar(s):
    return re.sub(r'([+\-&|!(){}\[\]^"~*?:\\/])', r'\\\1', s)


def mb_por_spotify(red, sp_id):
    d = red.json(MB + 'url?fmt=json&inc=artist-rels&resource=' +
                 urllib.parse.quote('https://open.spotify.com/artist/' + sp_id, safe=''))
    if not d:
        return None
    ids = [r['artist']['id'] for r in d.get('relations', []) if r.get('artist')]
    return ids[0] if len(set(ids)) == 1 else None


def mb_buscar(red, nombre):
    """Devuelve (mbid, dudoso) o (None, motivo)."""
    d = red.json(MB + 'artist/?fmt=json&limit=10&query=' + urllib.parse.quote('artist:"' + mb_escapar(nombre) + '"'))
    cands = (d or {}).get('artists', [])
    if not cands:
        return None, 'MusicBrainz no lo conoce'
    p = plano(nombre)
    if not p:
        return None, 'nombre sin letras'

    def coincide(c):
        nombres = [c.get('name'), c.get('sort-name')] + [a.get('name') for a in c.get('aliases', []) or []]
        return any(plano(n) == p for n in nombres if n)
    buenos = [c for c in cands if coincide(c) and int(c.get('score', 0)) >= 80]
    if not buenos:
        return None, 'ningún resultado con ese nombre exacto'
    if len(buenos) == 1:
        return buenos[0]['id'], False
    # varios con el mismo nombre: el primero (MusicBrainz ordena por relevancia), pero se marca como dudoso
    return buenos[0]['id'], True


def mb_ficha(red, mbid):
    return red.json(MB + 'artist/' + mbid + '?fmt=json&inc=url-rels+genres+tags+aliases')


def lastfm_info(red, clave_api, nombre, mbid=None):
    if not clave_api:
        return None
    base = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&format=json&autocorrect=1&lang=es'
    q = '&artist=' + urllib.parse.quote(nombre)
    d = red.json(base + q + '&api_key=' + clave_api, clave='lastfm:' + base + q)
    if not d or 'artist' not in d:
        return None
    return d['artist']


def limpiar_bio(texto):
    if not texto:
        return ''
    texto = re.sub(r'<a [^>]*>.*?</a>', '', texto, flags=re.S)   # «Read more on Last.fm»
    texto = re.sub(r'<[^>]+>', '', texto)
    texto = html.unescape(texto).strip()
    texto = re.sub(r'User-contributed text is available.*$', '', texto, flags=re.S).strip()
    texto = re.sub(r'\s+', ' ', texto)
    return recortar(texto)


def recortar(texto, maximo=650):
    if len(texto) <= maximo:
        return texto
    corte = texto[:maximo]
    punto = corte.rfind('. ')
    return (corte[:punto + 1] if punto > maximo * 0.5 else corte.rsplit(' ', 1)[0] + '…').strip()


def wikidata(red, qid, con_foto=True):
    """Foto (P18, solo si hace falta) y títulos de Wikipedia en español e inglés."""
    out = {}
    d = red.json('https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P18&entity=' + qid) if con_foto else None
    try:
        if not con_foto:
            raise KeyError
        fichero = d['claims']['P18'][0]['mainsnak']['datavalue']['value']
        out['img'] = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(fichero.replace(' ', '_')) + '?width=600'
    except (KeyError, IndexError, TypeError):
        pass
    d = red.json('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks&sitefilter=eswiki|enwiki&ids=' + qid)
    try:
        links = d['entities'][qid]['sitelinks']
        for k in ('eswiki', 'enwiki'):
            if k in links:
                out[k] = links[k]['title']
    except (KeyError, TypeError):
        pass
    return out


def wikipedia_resumen(red, idioma, titulo):
    d = red.json('https://' + idioma + '.wikipedia.org/api/rest_v1/page/summary/' + urllib.parse.quote(titulo.replace(' ', '_'), safe=''))
    if not d or d.get('type') == 'disambiguation':
        return '', ''
    return recortar(re.sub(r'\s+', ' ', d.get('extract') or '').strip()), ((d.get('content_urls') or {}).get('desktop') or {}).get('page', '')


def portada_caa(red, disco, artista):
    q = 'releasegroup:"' + mb_escapar(disco) + '" AND artist:"' + mb_escapar(artista) + '"'
    d = red.json(MB + 'release-group/?fmt=json&limit=5&query=' + urllib.parse.quote(q))
    for rg in (d or {}).get('release-groups', []):
        if int(rg.get('score', 0)) >= 90 and plano(rg.get('title')) == plano(disco):
            return 'https://coverartarchive.org/release-group/' + rg['id'] + '/front-500'
    return ''


# ---------------------------------------------------------- tus datos
def cargar_artistas():
    """Junta tus artistas con nº de canciones. Clave: id de Spotify (o 'n:' + nombre)."""
    bib = leer_json(os.path.join(REPO, 'biblioteca.json'))
    artistas, discos_sin_portada = {}, {}
    if bib and bib.get('l'):
        origen = 'biblioteca.json (%d canciones)' % len(bib['l'])
        for fila in bib['l']:
            arts = fila[2] or []
            for sp_id, nombre in arts:
                if not nombre:
                    continue
                k = sp_id or 'n:' + fold(nombre)
                a = artistas.setdefault(k, {'n': nombre, 'sp': sp_id or '', 'c': 0})
                a['c'] += 1
            if fila[3] and not fila[7] and arts:
                discos_sin_portada.setdefault(fila[3], (fila[4], arts[0][1]))
    else:
        hist = leer_json(os.path.join(REPO, 'historial-me-gusta.json')) or {}
        origen = 'historial-me-gusta.json (aún no hay biblioteca.json: súbela desde la Fonoteca › Ajustes)'
        for fila in hist.get('l', []):
            for nombre in fila[3] or []:
                k = 'n:' + fold(nombre)
                a = artistas.setdefault(k, {'n': nombre, 'sp': '', 'c': 0})
                a['c'] += 1
    # foto e id de Spotify que la Fonoteca ya tiene guardados
    fotos, ids_por_nombre = {}, {}
    reg = leer_json(os.path.join(REPO, 'artistas-registro.json')) or {}
    for x in reg.get('l', []):
        if x[1]:
            ids_por_nombre.setdefault(fold(x[0]), x[1])
            if x[2]:
                fotos[x[1]] = x[2]
    mis = leer_json(os.path.join(REPO, 'mis-artistas.json')) or {}
    for x in mis.get('artistas', []):
        if x.get('id') and x.get('img'):
            fotos.setdefault(x['id'], x['img'])
    for a in artistas.values():
        if not a['sp']:
            a['sp'] = ids_por_nombre.get(fold(a['n']), '')
        if a['sp'] in fotos:
            a['foto'] = fotos[a['sp']]
    etq = leer_json(os.path.join(REPO, 'etiquetas-canciones.json')) or {}
    return artistas, discos_sin_portada, etq.get('lfa', {}), origen


def cargar_correcciones():
    out = {}
    if not os.path.exists(CORRECCIONES):
        return out
    try:
        with open(CORRECCIONES, encoding='utf-8-sig') as f:
            texto = f.read()
    except UnicodeDecodeError:                        # guardado con Excel como «CSV» normal
        with open(CORRECCIONES, encoding='cp1252') as f:
            texto = f.read()
    sep = ';' if texto.count(';') >= texto.count(',') else ','
    for fila in csv.reader(texto.splitlines(), delimiter=sep):
        if len(fila) >= 2 and fila[0].strip() and not fila[0].strip().startswith('#') and not fila[0].lower().startswith('artista'):
            m = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', fila[1])
            if m:
                out[fold(fila[0].strip())] = m.group(0)
            elif fila[1].strip().lower() == 'ninguno':
                out[fold(fila[0].strip())] = 'ninguno'
            else:
                print('AVISO: en correcciones.csv, «%s» no tiene un enlace de MusicBrainz válido; lo ignoro.' % fila[0].strip())
    return out


# ------------------------------------------------------------ un artista
def procesar(red, a, clave_lf, lfa, forzado):
    nombre = a['n']
    info = {'n': nombre}
    if a.get('sp'):
        info['sp'] = a['sp']
    lf = None
    try:
        lf = lastfm_info(red, clave_lf, nombre)
    except SinClaveLastfm:
        raise
    # 1) quién es
    mbid, dudoso, motivo = None, False, ''
    if forzado == 'ninguno':
        motivo = 'marcado como «ninguno» en correcciones.csv'
    elif forzado:
        mbid = forzado
    if not mbid and not motivo and a.get('sp'):
        mbid = mb_por_spotify(red, a['sp'])
    if not mbid and not motivo and lf and lf.get('mbid') and plano(nombre) and plano(lf.get('name')) == plano(nombre):
        mbid = lf['mbid']
    if not mbid and not motivo:
        mbid, r = mb_buscar(red, nombre)
        if mbid:
            dudoso = r
        else:
            motivo = r
    ficha = mb_ficha(red, mbid) if mbid else None
    if mbid and not ficha:
        motivo, mbid = 'el identificador de MusicBrainz no existe', None
    # 2) datos de MusicBrainz
    wd = None
    if ficha:
        info['mb'] = mbid
        if ficha.get('country'):
            info['pais'] = ficha['country']
        area = (ficha.get('area') or {}).get('name') or (ficha.get('begin-area') or {}).get('name')
        if area:
            info['zona'] = area
        if ficha.get('type'):
            info['tipo'] = ficha['type']
        ls = ficha.get('life-span') or {}
        if ls.get('begin'):
            info['ini'] = ls['begin'][:4]
        if ls.get('ended') and ls.get('end'):
            info['fin'] = ls['end'][:4]
        for rel in ficha.get('relations', []):
            u = (rel.get('url') or {}).get('resource', '')
            if rel.get('type') == 'wikidata' and '/wiki/Q' in u:
                wd = u.rsplit('/', 1)[1]
    # 3) foto y resumen
    foto = a.get('foto', '')
    bio, fuente_bio, enlace_bio = '', '', ''
    if wd:
        w = wikidata(red, wd, con_foto=not foto)
        if not foto and w.get('img'):
            foto = w['img']
        for idioma, k in (('es', 'eswiki'), ('en', 'enwiki')):
            if w.get(k):
                bio, enlace_bio = wikipedia_resumen(red, idioma, w[k])
                if bio:
                    fuente_bio = 'Wikipedia' + ('' if idioma == 'es' else ' (inglés)')
                    break
    if not bio and lf:
        bio = limpiar_bio(((lf.get('bio') or {}).get('summary')))
        if len(bio) < 40:
            bio = ''
        if bio:
            fuente_bio, enlace_bio = 'Last.fm', lf.get('url', '')
    if foto:
        info['img'] = foto
    if bio:
        info['bio'], info['bioF'] = bio, fuente_bio
        if enlace_bio:
            info['bioU'] = enlace_bio
    # 4) géneros: Last.fm (por votos) + MusicBrainz + lo que ya tenía la Fonoteca
    gs = []
    if lf:
        tags = (lf.get('tags') or {}).get('tag') or []
        if isinstance(tags, dict):                    # Last.fm manda un objeto suelto si solo hay una
            tags = [tags]
        for t in tags:
            if isinstance(t, dict):
                gs.append(t.get('name', ''))
    if ficha:
        for g in sorted(ficha.get('genres') or [], key=lambda g: -g.get('count', 0)):
            gs.append(g.get('name', ''))
    gs += (lfa.get(fold(nombre)) or {}).get('g', [])
    vistos, limpios = set(), []
    for g in gs:
        f = fold(g).strip()
        if not f or f in vistos or f in LASTFM_RUIDO or f == fold(nombre) or re.fullmatch(r"\d{2,4}'?s?", f):
            continue
        vistos.add(f)
        limpios.append(f)
    if limpios:
        info['g'] = limpios[:8]
    if not ficha:
        info['est'] = 'nf'
        info['motivo'] = motivo or 'no identificado'
        return 'nf', info
    if dudoso:
        info['est'] = 'dud'
        return 'dud', info
    return 'ok', info


# ------------------------------------------------------------ salida
def escribir_salida(cache, artistas, portadas):
    out = {'at': int(time.time() * 1000), 'v': VERSION_DATOS, 'a': {}, 'caa': portadas}
    for k, a in artistas.items():
        r = cache.artista_get(k)
        if r:
            d = dict(r[1])
            d.pop('motivo', None)
            out['a'][k] = d
    tmp = SALIDA + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, SALIDA)
    return len(out['a'])


def escribir_informe(cache, artistas):
    filas = []
    for k, a in artistas.items():
        r = cache.artista_get(k)
        if r and r[0] in ('nf', 'dud'):
            motivo = r[1].get('motivo', '') if r[0] == 'nf' else 'hay varios artistas con ese nombre; he elegido uno, revisa si es el bueno'
            filas.append((a['c'], a['n'], 'No identificado' if r[0] == 'nf' else 'Con dudas', motivo,
                          'https://open.spotify.com/artist/' + a['sp'] if a.get('sp') else '',
                          'https://musicbrainz.org/search?type=artist&query=' + urllib.parse.quote(a['n']),
                          r[1].get('mb', '')))
    filas.sort(key=lambda f: -f[0])
    tmp = INFORME + '.tmp'
    with open(tmp, 'w', encoding='utf-8-sig', newline='') as f:   # con BOM y «;» para que Excel lo abra bien
        w = csv.writer(f, delimiter=';')
        w.writerow(['canciones', 'artista', 'estado', 'motivo', 'spotify', 'buscar en musicbrainz', 'elegido'])
        w.writerows(filas)
    os.replace(tmp, INFORME)
    return len(filas)


def duracion(seg):
    seg = int(seg)
    if seg < 90:
        return '%d s' % seg
    if seg < 5400:
        return '%d min' % round(seg / 60)
    return '%.1f h' % (seg / 3600)


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    ap = argparse.ArgumentParser(description='Rellena los datos de tus artistas para la vista Explorar.')
    ap.add_argument('--prueba', type=int, default=0, help='procesa solo los N artistas con más canciones')
    ap.add_argument('--reintentar', action='store_true', help='vuelve a probar los no identificados')
    ap.add_argument('--sin-lastfm', action='store_true', help='no usa Last.fm aunque haya clave')
    args = ap.parse_args()

    cfg = leer_config()
    clave_lf = '' if args.sin_lastfm else cfg.get('LASTFM_API_KEY', '')
    cache = Cache()
    red = Red(cache, cfg.get('CONTACTO', ''))
    artistas, sin_portada, lfa, origen = cargar_artistas()
    correcciones = cargar_correcciones()

    print('Fonoteca · datos de artistas')
    print('Leo tus canciones de', origen)
    print('Artistas en tu biblioteca:', len(artistas))
    if not clave_lf:
        print('AVISO: sin clave de Last.fm (enriquecer/config.txt). Sigo sin géneros ni bios de Last.fm.')

    orden = sorted(artistas.items(), key=lambda kv: (-kv[1]['c'], fold(kv[1]['n'])))
    if args.prueba:
        orden = orden[:args.prueba]
    pendientes = []
    for k, a in orden:
        forz = correcciones.get(fold(a['n']))
        r = cache.artista_get(k)
        if r is None:
            pendientes.append((k, a, forz))
        elif forz and forz != r[1].get('mb', 'ninguno' if r[0] == 'nf' else ''):
            pendientes.append((k, a, forz))
        elif args.reintentar and r[0] == 'nf':
            pendientes.append((k, a, forz))
    print('Ya hechos:', len(orden) - len(pendientes), '· Por hacer:', len(pendientes))
    if pendientes:
        print('Puedes cortarlo cuando quieras (Ctrl+C o cerrar la ventana): la próxima vez sigue aquí.\n')

    t0, hechos, cont, sin_red = time.time(), 0, {'ok': 0, 'dud': 0, 'nf': 0}, 0
    caa_viejo = (leer_json(SALIDA) or {}).get('caa') or {}
    try:
        for i, (k, a, forz) in enumerate(pendientes, 1):
            try:
                estado, info = procesar(red, a, clave_lf, lfa, forz)
            except SinClaveLastfm:
                print('\nLa clave de Last.fm no vale. Revisa enriquecer/config.txt (LASTFM_API_KEY=...).')
                print('Si quieres seguir sin Last.fm: python enriquecer.py --sin-lastfm')
                break
            except ConnectionError as e:
                sin_red += 1
                print('   %s → %s' % (a['n'], e))
                if sin_red >= 3:
                    print('\nParece que no hay internet (o los servidores no contestan). Guardo lo hecho; vuelve a lanzarlo luego.')
                    break
                continue
            except Exception as e:                    # un artista raro no debe parar todo
                print('   %s → error inesperado, lo salto: %s' % (a['n'], e))
                cache.artista_put(k, 'nf', {'n': a['n'], 'sp': a.get('sp', ''), 'est': 'nf', 'motivo': 'error: %s' % e})
                continue
            sin_red = 0
            cache.artista_put(k, estado, info)
            cont[estado] += 1
            hechos += 1
            marca = {'ok': 'OK ', 'dud': '¿? ', 'nf': '-- '}[estado]
            resto = (time.time() - t0) / hechos * (len(pendientes) - i)
            print('%s[%d/%d] %s (%d canc.)%s · quedan ~%s' % (marca, i, len(pendientes), a['n'], a['c'],
                  '' if estado != 'nf' else ' · ' + info.get('motivo', ''), duracion(resto)))
            if hechos % 50 == 0:
                escribir_salida(cache, artistas, caa_viejo)
    except KeyboardInterrupt:
        print('\nParado. Guardo lo hecho; la próxima vez sigue donde lo has dejado.')

    # portadas que faltan (casi nunca: Spotify suele traerla)
    portadas = {}
    viejo = leer_json(SALIDA) or {}
    portadas.update(viejo.get('caa') or {})
    faltan = [(al, d) for al, d in sin_portada.items() if al not in portadas]
    if faltan:
        print('\nBusco portada para', len(faltan), 'discos sin ella…')
        try:
            for al, (disco, art) in faltan:
                try:
                    u = portada_caa(red, disco, art)
                except ConnectionError:
                    continue
                if u:
                    portadas[al] = u
        except KeyboardInterrupt:
            pass

    n = escribir_salida(cache, artistas, portadas)
    m = escribir_informe(cache, artistas)
    print('\nHecho en', duracion(time.time() - t0), '·', red.peticiones, 'peticiones nuevas a internet')
    print('Esta vez: %d identificados, %d con dudas, %d sin identificar' % (cont['ok'], cont['dud'], cont['nf']))
    print('artistas-info.json: %d artistas con datos' % n)
    print('no-identificados.csv: %d para revisar (ábrelo con Excel o Google Sheets)' % m)


if __name__ == '__main__':
    main()

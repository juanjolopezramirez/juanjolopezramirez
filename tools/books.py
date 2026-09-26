"""PDF de cada palabra -> paginas listas para el flipbook.

    python tools/books.py            convierte solo lo que ha cambiado
    python tools/books.py --force    lo rehace todo

DONDE VAN LOS PDF. En `books/`, con el nombre de la palabra:

    books/ahava.pdf       el mismo libro para todos los idiomas
    books/ahava.es.pdf    solo para /es/ (gana al de arriba en ese idioma)
    books/ahava.en.pdf    solo para /en/ ... y asi con pt, fr, it

Las palabras que tienen libro son las de term-book.js: ahava, rhema,
emet, agape. Una palabra sin PDF en un idioma sigue abriendo el libro
escrito en HTML, asi que se pueden ir subiendo de uno en uno.

QUE SALE. Cada pagina del PDF se pinta dos veces en JPEG, a 900 y a
1600 px de ancho: el navegador coge la que le toca segun la pantalla, y
el movil no descarga la grande si no la necesita. Tambien sale el texto
de cada pagina (para lectores de pantalla) y los enlaces del PDF, que en
el flipbook se pueden tocar igual que en el PDF. Todo en
public/books/<palabra>/<idioma|all>/, y el indice de lo que hay en
src/data/books.js, que lo lee site.js.

Por que imagenes y no el PDF: abrir un PDF en el navegador pide pdf.js,
casi un mega de codigo antes de ver la primera pagina. Asi se convierte
una vez aqui y el visitante solo baja fotos de paginas.

LA PLANTILLA: 1600 x 2240 px, todas las paginas iguales y en numero par.
Tapa dura: la pagina 1 es la tapa y la ultima la contratapa; giran
rigidas y mas despacio, y con ellas la pagina que llevan pegada detras
(la 2 y la penultima). El color del carton que asoma por detras se saca
del borde de la tapa y la contratapa.

EL NOMBRE admite punto, guion bajo o guion antes del idioma, y tambien
«ahavah»: ahava.es.pdf, ahavah_es.pdf y ahava-es.pdf son lo mismo.

Necesita PyMuPDF (pip install pymupdf). GitHub lo corre solo al publicar
(.github/workflows/astro.yml), asi que al repo solo van los PDF; aqui se
ejecuta para verlo en local antes de subir. """

import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'books'
OUT = ROOT / 'public' / 'books'
INDEX = ROOT / 'src' / 'data' / 'books.js'

WORDS = {'ahava', 'rhema', 'emet', 'agape'}
LANGS = {'es', 'en', 'pt', 'fr', 'it'}
WIDTHS = (900, 1600)

# LA PLANTILLA: 1600 x 2240 px (5:7). Todas las paginas del mismo tamaño.
# Otro tamaño funciona, pero el libro no quedaria igual que los demas:
# el script avisa.
TEMPLATE = (1600, 2240)
QUALITY = 84

NAME = re.compile(r'^([a-z]+)(?:[._-]([a-z]{2}))?\.pdf$', re.I)
ALIAS = {'ahavah': 'ahava', 'agapi': 'agape'}


def digest(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:10]


def board(page):
    """El color del carton: la media del borde de la pagina (un 4% de cada
    lado), que es lo que se ve cuando el carton asoma por detras. """
    pix = page.get_pixmap(matrix=pymupdf.Matrix(120 / page.rect.width, 120 / page.rect.width), alpha=False)
    w, h, n, buf = pix.width, pix.height, pix.n, pix.samples
    m = max(2, round(w * 0.04))
    tot = [0, 0, 0]
    cnt = 0
    for y in range(h):
        for x in range(w):
            if m <= x < w - m and m <= y < h - m:
                continue
            i = (y * w + x) * n
            tot[0] += buf[i]; tot[1] += buf[i + 1]; tot[2] += buf[i + 2]
            cnt += 1
    return '#' + ''.join(f'{round(c / cnt):02x}' for c in tot)


def folio(page):
    """El numero impreso en la pagina, si lo tiene: un numero solo, en el
    ultimo 12% de la altura (donde van los folios). """
    limit = page.rect.height * 0.88
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                txt = span['text'].strip()
                if txt.isdigit() and len(txt) <= 3 and span['bbox'][1] >= limit:
                    return int(txt)
    return None


def offset(doc):
    """Cuantas paginas del PDF van antes de la que lleva impreso el 1.
    Se decide por mayoria entre las paginas numeradas; si el PDF no
    numera, None y el contador cuenta paginas del PDF. """
    votes = {}
    for i, page in enumerate(doc):
        n = folio(page)
        if n is not None:
            votes[i + 1 - n] = votes.get(i + 1 - n, 0) + 1
    return max(votes, key=votes.get) if votes else None


def render(pdf, dest, version):
    doc = pymupdf.open(pdf)
    if doc.page_count == 0:
        raise ValueError('el PDF no tiene paginas')
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)

    first = doc[0].rect
    pages = []
    for n, page in enumerate(doc, 1):
        r = page.rect
        for w in WIDTHS:
            pix = page.get_pixmap(matrix=pymupdf.Matrix(w / r.width, w / r.width), alpha=False)
            (dest / f'{n:02d}-{w}.jpg').write_bytes(pix.tobytes('jpeg', jpg_quality=QUALITY))

        links = []
        for ln in page.get_links():
            box = ln['from']
            spot = {
                'x': round(box.x0 / r.width, 4), 'y': round(box.y0 / r.height, 4),
                'w': round(box.width / r.width, 4), 'h': round(box.height / r.height, 4),
            }
            if ln.get('uri'):
                spot['href'] = ln['uri']
            elif ln.get('kind') == pymupdf.LINK_GOTO and ln.get('page', -1) >= 0:
                spot['page'] = ln['page']
            else:
                continue
            links.append(spot)

        text = ' '.join(page.get_text().split())
        pages.append({'text': text, 'links': links} if links else {'text': text})

    (dest / 'pages.json').write_text(json.dumps(pages, ensure_ascii=False), encoding='utf-8')
    off = offset(doc)
    uneven = any(abs(p.rect.width / p.rect.height - first.width / first.height) > 0.01 for p in doc)
    return {
        'pages': doc.page_count,
        'board': [board(doc[0]), board(doc[doc.page_count - 1])],
        'ratio': round(first.width / first.height, 4),
        'v': version,
        **({'offset': off} if off is not None else {}),
        **({'uneven': True} if uneven else {}),
    }


def main():
    force = '--force' in sys.argv
    if not SRC.exists():
        SRC.mkdir()
        print(f'Creada {SRC.relative_to(ROOT)}/ — deja ahi los PDF y vuelve a ejecutar.')

    old = {}
    if INDEX.exists():
        m = re.search(r'BOOKS = (\{.*\});', INDEX.read_text(encoding='utf-8'), re.S)
        if m:
            old = json.loads(m.group(1))

    books = {}
    for pdf in sorted(SRC.glob('*.pdf')):
        m = NAME.match(pdf.name)
        word, lang = (m.group(1).lower(), (m.group(2) or 'all').lower()) if m else (None, None)
        word = ALIAS.get(word, word)
        if word not in WORDS or (lang != 'all' and lang not in LANGS):
            print(f'  ?  {pdf.name}: no se reconoce. Usa <palabra>.pdf o <palabra>.<idioma>.pdf '
                  f'(palabras: {", ".join(sorted(WORDS))}; idiomas: {", ".join(sorted(LANGS))})')
            continue

        version = digest(pdf)
        dest = OUT / word / lang
        prev = old.get(word, {}).get(lang)
        if not force and prev and prev.get('v') == version and (dest / 'pages.json').exists():
            books.setdefault(word, {})[lang] = prev
            print(f'  =  {pdf.name}: sin cambios')
            continue

        try:
            info = render(pdf, dest, version)
        except Exception as e:  # un PDF roto no tumba los demas
            print(f'  x  {pdf.name}: {e}')
            continue
        books.setdefault(word, {})[lang] = info
        note = ' (ojo: no todas las paginas tienen el mismo tamaño)' if info.get('uneven') else ''
        if abs(info['ratio'] - TEMPLATE[0] / TEMPLATE[1]) > 0.01:
            note += f' (ojo: no es la plantilla {TEMPLATE[0]}x{TEMPLATE[1]} px)'
        if info['pages'] % 2:
            note += ' (ojo: numero impar de paginas; la contratapa no cerrara el libro)'
        if 'offset' in info:
            note += f' (numeracion impresa: la pagina {info["offset"] + 1} del PDF es la 1)'
        print(f'  +  {pdf.name}: {info["pages"]} paginas{note}')

    # Lo que ya no tiene PDF se borra, para no publicar libros viejos
    if OUT.exists():
        for word_dir in OUT.iterdir():
            for lang_dir in (word_dir.iterdir() if word_dir.is_dir() else []):
                if lang_dir.name not in books.get(word_dir.name, {}):
                    shutil.rmtree(lang_dir)
                    print(f'  -  {word_dir.name}/{lang_dir.name}: borrado, ya no hay PDF')
            if word_dir.is_dir() and not any(word_dir.iterdir()):
                word_dir.rmdir()

    INDEX.write_text(
        '/* Generado por tools/books.py — no editar a mano.\n'
        '   Que palabras tienen su libro en PDF, en que idioma («all» vale para\n'
        '   todos), cuantas paginas, su proporcion ancho/alto y la version del\n'
        '   PDF, que va en la URL de las imagenes para que nadie vea una vieja. */\n'
        f'export const BOOKS = {json.dumps(books, indent=2, sort_keys=True)};\n',
        encoding='utf-8')
    print(f'Listo: {sum(len(v) for v in books.values())} libro(s) en {INDEX.relative_to(ROOT)}')


if __name__ == '__main__':
    main()

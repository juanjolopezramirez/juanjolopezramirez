"""La baldosa de madera de la biblioteca (SVG) y el CSS para pegarla.

    python tools/madera.py            imprime la baldosa lista para pegar
    python tools/madera.py madera.txt la guarda en ese archivo

QUE ES. Cinco tablones verticales de 96 px en una baldosa de 480x480 que se
repite, cada uno con su tono de base (TONOS), una junta oscura entre tablon y
tablon con un hilo de luz al lado, y dos filtros sobre TODA la baldosa: la
veta (rayas finas y largas: feTurbulence con frecuencia muy distinta en x y en
y) y el poro (hilos claros que la luz marca). El ruido cambia con x, asi que
cada tablon sale distinto sin pagar un filtro por tablon. Se rasteriza una vez
por baldosa, como el grano del papel (paper.css).

COMO SE USA. El resultado va tal cual en `--m-tablones` de `.biblio`, en
src/styles/biblioteca.css. Para cambiar el tono de la sala, los TONOS de aqui
y `--m-sala` / `--m-hueco` / `--m-tabla` de alli (de noche, mas oscuros).
Cuidado con el contraste: el tablon mas claro bajo el pico de la luz tiene
que seguir dando 4.5:1 con el texto hueso (README, «La sala es de madera»).
"""
import io
import sys

W = 480
PLANK = 96
TONOS = ['#5d3a23', '#5f3d28', '#563620', '#62402a', '#5b3921']   # nogal calido, de uno a otro un poco distinto

def svg():
    """Dos filtros sobre TODA la baldosa (la veta y el poro), no dos por tablon:
    el ruido cambia con x, asi que cada tablon sale distinto sin pagar diez
    filtros. Los tablones se distinguen por el tono de su base y por la junta."""
    defs = (
        f"<filter id='v' filterUnits='userSpaceOnUse' x='0' y='0' width='{W}' height='{W}' color-interpolation-filters='sRGB'>"
        f"<feTurbulence type='fractalNoise' baseFrequency='0.11 0.0035' numOctaves='3' seed='23' stitchTiles='stitch'/>"
        f"<feColorMatrix type='matrix' values='0 0 0 0 .07  0 0 0 0 .035  0 0 0 0 .015  1.7 0 0 0 -.72'/></filter>"
        f"<filter id='p' filterUnits='userSpaceOnUse' x='0' y='0' width='{W}' height='{W}' color-interpolation-filters='sRGB'>"
        f"<feTurbulence type='fractalNoise' baseFrequency='0.55 0.012' numOctaves='2' seed='41' stitchTiles='stitch'/>"
        f"<feColorMatrix type='matrix' values='0 0 0 0 .80  0 0 0 0 .58  0 0 0 0 .38  1.5 0 0 0 -.74'/></filter>")
    cuerpo = [f"<rect x='{i * PLANK}' width='{PLANK}' height='{W}' fill='{t}'/>" for i, t in enumerate(TONOS)]
    cuerpo.append(f"<rect width='{W}' height='{W}' filter='url(%23v)'/>")
    cuerpo.append(f"<rect width='{W}' height='{W}' filter='url(%23p)' opacity='.4'/>")
    # las juntas: una raya oscura y, pegada, un hilo de luz
    for i in range(len(TONOS)):
        x = i * PLANK
        cuerpo.append(f"<rect x='{x}' width='3' height='{W}' fill='#120804' opacity='.85'/>")
        cuerpo.append(f"<rect x='{x + 3}' width='1.5' height='{W}' fill='#e0b283' opacity='.16'/>")
    return (f"<svg xmlns='http://www.w3.org/2000/svg' width='{W}' height='{W}'>"
            f"<defs>{defs}</defs>{''.join(cuerpo)}</svg>")

def uri(s):
    # lo que un url("data:...") necesita escapado
    return (s.replace('%23', '\x00').replace('%', '%25').replace('\x00', '%23')
             .replace('<', '%3C').replace('>', '%3E').replace('#', '%23').replace('"', '%22'))

if __name__ == '__main__':
    out = 'url("data:image/svg+xml,' + uri(svg()) + '")'
    if len(sys.argv) > 1:
        io.open(sys.argv[1], 'w', encoding='utf-8').write(out)
        print(len(out), 'caracteres, guardados en', sys.argv[1])
    else:
        print(out)

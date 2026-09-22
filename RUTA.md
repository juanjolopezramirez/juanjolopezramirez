# Dar el primer paso

La ruta de `/[lang]/contact/`. Se llega por **Caminemos → Dar el primer paso**.

**Dos juegos, uno detrás del otro, y cada uno pone un eje.**

1. **El mazo** — una carta a la vez, a la izquierda o a la derecha.
   *¿Esto te urge?* → el eje de la **urgencia**.
2. **La lista** — las que urgieron se ordenan en cuatro niveles:
   primero, después, algún día, no va → el eje de la **importancia**.

Cruzados dan la **matriz de Eisenhower completa**, que aparece en el
resultado sin que nadie haya tenido que rellenar cuatro cajas. Y al final,
dos cosas distintas: **en qué paso del camino está** y **si lo que pide es lo
que le sirve**.

> Eisenhower necesita dos ejes y una carta que se manda a un lado solo da
> uno. Hacerla entera a deslizamientos pediría dos pasadas sobre la baraja
> —treinta y cuatro gestos— y para el decimoquinto ya nadie está leyendo.
> Por eso cada juego pone un eje.

---

## Dónde está cada cosa

| Archivo | Qué guarda |
|---|---|
| `src/data/ruta/pasos.js` | Los tres pasos y su lema, en las dos voces |
| `src/data/ruta/cartas.js` | Las dos barajas — el mapa completo está abajo |
| `src/data/ruta/juegos.js` | Los dos ejes, los cuatro niveles y los cuatro cuadrantes |
| `src/data/ruta/servicios.js` | A qué trabajo lleva cada paso, y qué no hace falta todavía |
| `src/data/ruta/textos.js` | Todos los textos de pantalla, en cinco idiomas |
| `src/data/ruta/diagnostico.js` | El cálculo |
| `src/components/ruta/Ruta.astro` | Las cuatro pantallas |
| `src/components/ruta/Mazo.astro` | Juego 1: la pila y las dos dianas |
| `src/components/ruta/Lista.astro` | Juego 2: los cuatro niveles |
| `src/scripts/ruta.js` | El juego en el navegador |
| `src/server/recorrido.js` | El endpoint, escrito y sin enchufar (ver abajo) |

Ni una palabra de pantalla vive dentro de un componente. El español es el
original; los otros cuatro idiomas son traducción y se cambian a la vez.

---

## Los tres pasos

| | Negocio | Persona y marca personal |
|---|---|---|
| **El inicio** | Que te vean | Que te veas |
| **El medio** | Que te crean | Que te creas |
| **El fin** | Que vuelvan | Que vuelvas |

La marca personal usa la baraja de empresa —un deseo se dice igual lo firme
una empresa o una persona con nombre— pero se le habla en reflexivo.

---

## Los cuatro niveles

No son las letras S/A/B/C de los juegos de pelea: eso hay que explicarlo
antes de usarlo. Son cuatro cosas que cualquiera sabe decir de una tarea.

| Nivel | Qué quiere decir | ¿Importa? |
|---|---|---|
| **Primero** | Si esto no pasa, lo demás no importa | sí |
| **Después** | Va, pero detrás de lo de arriba | sí |
| **Algún día** | Me gustaría, pero no este año | no |
| **No va** | Esto no es para mí | no |

La línea entre *después* y *algún día* es la que parte la matriz.

---

## La matriz

| | **Importa** | **No importa** |
|---|---|---|
| **Urge** | Ahora | Te roba el día |
| **No urge** | Ponle fecha | Suéltalo |

Lo que hace útil a esa matriz no es el dibujo: es el cuadrante de **lo
urgente que no importa**. Eso es lo que se lleva los días, y solo se ve
cuando los dos ejes ya están puestos — por eso no se pregunta, se deduce.

---

## Los dos campos que hacen todo

Cada carta lleva dos:

- **`quiere`** — el paso donde vive el deseo si se lee tal cual.
- **`depende`** — el paso donde vive lo que hace falta de verdad.

Iguales, la carta **confirma**: lo que pides es justo lo que te sirve.

### La regla antitruco

Más de un tercio de cada baraja confirma — hoy **53 %** en empresa y **59 %**
en persona. Un sistema que siempre contesta «en realidad te falta otra cosa»
se descubre a la primera y tira abajo la credibilidad de todo lo demás.

La regla no está confiada a la memoria: `cartas.js` la comprueba al
construir y el sitio **no compila** si baja del tercio.

---

## El cálculo

Tres cuentas, y ninguna se pisa con las otras.

```
ORDEN = { inicio: 0, medio: 1, fin: 2 }

funcion diagnosticar(rama, urgentes, niveles):

    # QUE CARTAS MANDAN. Lo que aprieta es lo que define donde estas.
    # Si no marco nada urgente, mandan las que puso arriba en la lista;
    # y si tampoco, todas las que ordeno.
    consideradas = urgentes                    si son 3 o mas
                   si no, las de la lista con nivel importante
                   si no, todas las de la lista

    # 1 — EN QUE PASO ESTA. Lo dicen las cartas DERECHAS.
    cuenta = contar(c.depende) para c en consideradas
    mayor  = el valor mas alto de cuenta
    # Empate: manda el paso mas temprano. Lo que falta primero es lo que falta.
    paso = el primero de [inicio, medio, fin] cuyo cuenta == mayor

    # 2 — EMET O MET, por las cartas. Lo dice la DISTANCIA entre las dos.
    coinciden   = cuantas c tienen  c.quiere == c.depende
    adelantados = cuantas c tienen  ORDEN[c.quiere] > ORDEN[c.depende]
    tocados     = conjunto de c.depende

    si coinciden == total y tamaño(tocados) == 3:
        lectura = EQUILIBRIO      # bien en los tres: no se le vende nada
    si no si adelantados > coinciden:
        lectura = MET
    si no:
        lectura = EMET

    # 3 — EL DESORDEN, por la lista. Lo dice SU PROPIA MANO.
    arriba = cartas en PRIMERO o DESPUES
    abajo  = cartas en ALGUN DIA o NO VA
    inversiones = pares (a de arriba, b de abajo) donde
                  ORDEN[b.depende] < ORDEN[a.depende]
    # Es decir: pusiste arriba algo que depende de mas adelante y dejaste
    # abajo algo que el camino pide antes.

    # La lista puede ACUSAR, nunca ABSOLVER.
    si lectura == EMET y inversiones >= 2:
        lectura = MET

    # LA MATRIZ, carta a carta
    urgente + importante   -> ahora
    importante, no urgente -> ponle fecha
    urgente, no importante -> te roba el dia
    ninguno                -> sueltalo
```

**La tercera cuenta es la que no se puede discutir.** Que una carta esté
adelantada lo decide la baraja, que la escribí yo. Que alguien ponga «que la
gente vuelva» en PRIMERO y «saber qué me hace distinto» en ALGÚN DÍA lo
decide él, con el dedo, y queda en pantalla. Eso es Met dicho por su propia
mano; lo único que hace la página es leérselo de vuelta.

**No se acusa por defecto.** Met solo sale si las cartas adelantadas son más
que las que coinciden, o si la lista tiene dos inversiones. En empate se lee
Emet: decirle a alguien que está construyendo sobre nada es una frase seria y
solo se dice cuando sus propias respuestas lo sostienen.

**La lista puede acusar pero nunca absolver.** Una lista bien ordenada no
borra unas cartas adelantadas; una lista invertida sí delata a quien eligió
bien por casualidad.

**`quiere` por debajo de `depende`** —pedir algo cuyo requisito está más
adelante— no cuenta como ir adelantado. Ni acusa ni confirma: no suma.

---

## A dónde lleva cada paso

| Paso | Negocio y marca | Por mí |
|---|---|---|
| El inicio | **Recvid** — Qué te hace distinto · 2 semanas | **FraterniU** — Empezar por lo tuyo · 4 semanas |
| El medio | **Let Be** — Que lo que prometes funcione · 4 a 6 semanas | **Fraterni Academy** — Sostenerlo en el tiempo · 3 meses |
| El fin | **Fraterni Business** — Que funcione sin ti · 3 meses | **Fraterni Us** — Dejarlo por escrito · 3 meses |

Nunca se entrega solo el nombre de una marca: se entrega un trabajo con
nombre, con lo que incluye y cuánto dura. **El precio no sale en pantalla**
— se habla por WhatsApp, cuando ya se sabe el tamaño del trabajo.

**Tres de los seis destinos no han abierto** (Academy, Us, Business). Cuando
el resultado cae en uno, se dice tal cual y se ofrece avisar; el botón de
WhatsApp cambia a «Avísame cuando abra». `abierta` sale de si la marca tiene
dirección propia en `houses.js`, así que el día que abra basta con ponerle la
url allí.

**Qué no necesitas todavía** sale en todos los resultados menos en el de
equilibrio, donde no se vende nada y la frase no tendría contra qué
contrastar.

---

## El mapa completo

### Baraja empresa

**Ronda 1 — ¿Qué es lo que más te pesa hoy?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero que me conozcan más. | De poder decir en una frase qué haces distinto. Sin eso, más gente mirando solo reparte confusión. | inicio | inicio | **confirma** |
| Estoy cansado de hacerlo todo yo. | De que el trabajo esté escrito en alguna parte. Lo que solo vive en tu cabeza no se puede soltar. | fin | medio | adelantada |
| Vendo, pero no sé por qué me compran. | De saber qué te hace distinto. Si no sabes por qué te compran, no puedes repetirlo a propósito. | medio | inicio | adelantada |
| Quiero poder irme una semana sin que se caiga todo. | De que alguien más sepa hacerlo y lo tenga por escrito. Si ya lo tienes, eso es lo que sigue. | fin | fin | **confirma** |

**Ronda 2 — ¿Qué te gustaría poder mostrar?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero que mi marca se vea seria. | De que se vea igual en todas partes: el mismo logo, los mismos colores y el mismo tono en cada sitio. | inicio | inicio | **confirma** |
| Quiero tener una página propia. | De tener claro qué va a decir. Una página es el sitio donde pones lo que ya sabes decir de ti. | inicio | inicio | **confirma** |
| Quiero que mis clientes me recomienden. | De que la experiencia sea igual de buena la segunda vez. Nadie recomienda algo que le salió bien por suerte. | fin | medio | adelantada |

**Ronda 3 — ¿Qué te está costando más trabajo?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero un chatbot que responda por mí. | De tener muchos mensajes repetidos y una respuesta ya definida para cada uno. Si los tienes, es justo lo que necesitas. | medio | medio | **confirma** |
| Quiero cobrar más caro. | De que se note por qué vales más antes de decir el precio. El precio se defiende con lo que ya se ve. | medio | inicio | adelantada |
| Quiero dejar de improvisar cada pedido. | De escribir el paso a paso de un pedido, de principio a fin. Eso es exactamente lo que te falta. | medio | medio | **confirma** |
| No sé si lo del año pasado sirvió. | De tener anotado qué pasó cada mes. Si lo tienes, compararlo es el paso que sigue. | fin | fin | **confirma** |

**Ronda 4 — ¿Qué quisieras que pasara solo?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero que la gente vuelva. | De que la primera vez haya valido la pena. Nadie vuelve a un sitio donde no le pasó nada. | fin | medio | adelantada |
| Quiero automatizar lo que hago a mano. | De que ese trabajo tenga un orden fijo. Automatizar un desorden lo vuelve un desorden más rápido. | fin | medio | adelantada |
| Quiero que el negocio funcione sin mí. | De que otra persona pueda hacerlo igual leyendo lo que dejaste escrito. Ahí es donde estás. | fin | fin | **confirma** |

**Ronda 5 — ¿Con cuál te quedarías si tuvieras que elegir una?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero crecer sin dejar de ser lo que somos. | De tener escrito qué es lo que no se negocia. Sin eso, crecer es cambiar de cosa sin darte cuenta. | fin | inicio | adelantada |
| Quiero que mi equipo hable igual que yo. | De que exista un documento con tu forma de decir las cosas. Eso no se aprende de oído. | medio | inicio | adelantada |
| Quiero medir si lo que hago sirve. | De tener un número que ya estés mirando cada mes. Si lo tienes, medir es el paso correcto. | fin | fin | **confirma** |

_17 cartas · 9 confirman (53%)_

### Baraja persona

**Ronda 1 — ¿Qué es lo que más te pesa hoy?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero que sepan lo que sé hacer. | De poder decirlo en una frase, sin currículum. Lo que no se dice corto, no lo repite nadie. | inicio | inicio | **confirma** |
| Trabajo mucho y siento que no se nota. | De mostrar el trabajo, no de hacer más. Lo que no se ve no existe para quien decide. | inicio | inicio | **confirma** |
| No sé cómo cobrar lo que valgo. | De poder mostrar qué has hecho antes. El precio se sostiene con pruebas, no con argumentos. | medio | inicio | adelantada |
| Me preocupa que todo lo que sé se quede en mi cabeza. | De sacarlo de ahí: escribirlo o enseñárselo a alguien. Si ya te lo piden, ese es el paso. | fin | fin | **confirma** |

**Ronda 2 — ¿Qué te gustaría poder mostrar?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero tener un portafolio. | De elegir tres trabajos y contarlos bien. Un portafolio no es todo lo que has hecho. | inicio | inicio | **confirma** |
| Quiero que me busquen a mí, no a mi cargo. | De tener algo tuyo publicado con tu nombre encima. Un cargo lo ocupa cualquiera. | inicio | inicio | **confirma** |
| Quiero hablar en público sin bloquearme. | De repetirlo delante de alguien que te corrija. Eso se entrena, no se lee. | medio | medio | **confirma** |

**Ronda 3 — ¿Qué te está costando más trabajo?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero aprender algo que me sirva ya. | De saber para qué lo quieres. Sin eso, cualquier curso se siente útil y ninguno cambia nada. | medio | inicio | adelantada |
| Quiero cambiar de trabajo. | De saber qué haces mejor que la mayoría. Cambiar sin eso es repetir el mismo puesto en otro sitio. | fin | inicio | adelantada |
| Quiero terminar lo que empiezo. | De tener un plazo y alguien a quien rendirle cuentas. Es exactamente lo que falta. | medio | medio | **confirma** |
| No sé si estoy mejorando. | De tener algo tuyo de hace un año con qué compararte. Si lo tienes, mirarlo es el paso. | fin | fin | **confirma** |

**Ronda 4 — ¿Qué quisieras que pasara solo?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero que me recomienden sin pedirlo. | De que con quien trabajas quede con ganas de repetir. La recomendación es la segunda vez, no la primera. | fin | medio | adelantada |
| Quiero vivir de esto. | De que alguien ya te haya pagado por hacerlo, aunque sea poco. Ese es el paso que sigue. | fin | medio | adelantada |
| Quiero enseñar lo que aprendí. | De tener a alguien que ya te lo pidió. Si lo tienes, enseñar es el paso correcto. | fin | fin | **confirma** |

**Ronda 5 — ¿Con cuál te quedarías si tuvieras que elegir una?**

| Izquierda · lo que quiero | Derecha · de qué depende | quiere | depende | |
|---|---|---|---|---|
| Quiero dejar algo que dure. | De poner por escrito lo que sabes, para que siga sin ti. Ahí es donde estás. | fin | fin | **confirma** |
| Quiero dejar de compararme. | De tener claro en qué eres distinto. Sin eso, todo el mundo parece ir más adelante. | medio | inicio | adelantada |
| Quiero rodearme de gente que va en serio. | De estar haciendo algo que puedas mostrar. A esa gente se llega con trabajo, no con ganas. | fin | medio | adelantada |

_17 cartas · 10 confirman (59%)_

---

## El backend

**Hoy no hay backend, y es una decisión del sitio, no un olvido.**
juanjo-web es Astro estático y se sirve desde GitHub Pages, donde no corre
código de servidor. Un endpoint dentro de `src/pages/` tumba la construcción
entera con `NoAdapterInstalled` — probado.

Así que el endpoint está escrito, validado y **fuera de `src/pages/`**, en
`src/server/recorrido.js`. Mientras tanto el navegador deja cada recorrido en
una cola en el dispositivo y lo reintenta en la siguiente visita: no se
pierde nada.

### Cómo se enchufa

1. `npm i @astrojs/<adaptador>` y ponerlo en `astro.config.mjs`.
2. Mover `src/server/recorrido.js` a `src/pages/api/recorrido.js` y cambiar
   las tres rutas de los imports: `../data/` pasa a `../../data/`.
3. Poner `RECOLECTOR_URL` (y `RECOLECTOR_TOKEN` si hace falta) en las
   variables del despliegue.
4. En `src/scripts/ruta.js`, poner `RECOLECTOR = '/api/recorrido'`.

Si prefieres no mover el sitio de GitHub Pages, el paso 4 admite cualquier
URL: un Worker de Cloudflare, una función de Netlify o un endpoint de
Supabase. El fichero de `src/server/` se copia ahí casi tal cual.

### Lo que se guarda

Rama, las cartas que urgieron, dónde quedó cada una en la lista, paso,
lectura, idioma y fecha. **Ni nombre, ni correo, ni teléfono, ni nada que
identifique.** El dato personal aparece cuando la
persona escribe por WhatsApp, y entonces lo tiene WhatsApp, no esta tabla.

Se avisa en una línea antes de la primera elección, con un botón para salir
que apaga el guardado de ese recorrido.

**El servidor no se fía de lo que llega:** el paso y la lectura se vuelven a
calcular desde las cartas. Si alguien manda `paso: fin` a mano, se ignora — o
los doscientos recorridos que van a servir para decidir no valdrían nada.

### La tabla

```
El esquema completo, con sus índices y las tres consultas que valen,
vive en `src/server/recorrido.sql`.
```

Las consultas van en el mismo fichero. La que más rinde es la tercera:
qué cartas se marcaron urgentes y después se mandaron abajo en la lista —
el cuadrante que roba los días.

---

## Lo que se quitó de esta ruta

Aquí hubo un directorio de marcas y, antes, un formulario. Las dos cosas
pedían lo mismo sin decirlo: que la persona ya supiera lo que necesita. El
formulario le pedía que lo escribiera; el directorio, que eligiera puerta.
Quien llega aquí casi nunca lo sabe — sabe lo que **quiere**, que no es lo
mismo.

Se borraron `Houses.astro`, `Ficha.astro`, sus estilos y las dos funciones
que los movían (`initFamilia`, `initFichas`). `houses.js` se queda: de ahí
salen los nombres y el estado de cada marca.

Y en la segunda vuelta se fue `Ronda.astro`, la mecánica de elegir una de
tres: no servía. Las cartas que escribió siguen enteras — lo que cambió es
cómo se juegan. Las preguntas de cada ronda tampoco se perdieron: ahora son
el rótulo que va cambiando encima del mazo según por qué grupo va la pila.

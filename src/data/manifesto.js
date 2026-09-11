/* Lo que es cada casa, dicho para que lo entienda cualquiera.

   El texto sale del documento de copy del fundador
   (`copy-web-fraterni-letbe-recvid.md`), adaptado a esta pagina: el
   «remate» de ese documento es aqui el subtitulo del «¿Por qué?», no una
   linea mas en la cara de la pregunta.

   LAS PIEZAS, en el orden en que se leen, con su largo maximo:

     pregunta  una sola: el gancho. 13 palabras.
     tacha     lo que te venden para resolverlo, no lo que culpas: «otro
               software mas» si, «suerte» o «tiempo» no. Si es una lista,
               van pasando en bucle, siempre tachadas. LA PRIMERA ESTA
               ELEGIDA A PROPOSITO y no se mueve: es la que se lee primero y
               la que se queda quieta sin guion o con el movimiento reducido.
               5 palabras cada una.
     pone      la respuesta, escrita a mano al lado. Siempre a la vista.
               7 palabras.
     remate    la linea que le da la vuelta a la pregunta. Encabeza el
               «¿Por qué?»: primero la vuelta, despues la razon. 12 palabras.
     porque    la razon, detras del boton «¿Por qué?». 65 palabras.
     que       la sublinea: lo que es la casa. 18 palabras.
     origen    por que existe, en primera persona.
     mision    un infinitivo y un objeto grande.
     vision    un estado del mundo. Nunca «Que + subjuntivo».
               Las tres, una linea cada una detras del icono de informacion.
               `larga` las explica en la pagina de la casa, si la casa
               tiene pagina; si no, no hace falta.
     como      con que piensa llegar. Solo en la pagina de la casa.

   EL PAR ES DE LA MISMA CATEGORIA. La tachada y la respuesta van en la misma
   linea, una al lado de la otra, y el ojo espera un reemplazo: si no son de
   la misma categoria gramatical, la sustitucion no suena. Let Be, FraterniU,
   Fraterni Us y Business, en sustantivos; Recvid y Academy, en infinitivos.
   Una tachada nueva tiene que ser de la categoria de su lista.

   TERRITORIOS. Let Be es infraestructura: que te encuentren. Recvid es
   relato: que te recuerden. Business es sistema: que funcione sin ti.
   Ninguna usa el vocabulario de la otra, y ninguna sublinea se apoya en otra
   marca sin explicarse sola —quien no conozca FraterniU tiene que entender
   Academy igual—. La excepcion es Business, que es justo la que junta a las
   otras tres y por eso las nombra.

   NINGUNA VENDE DEPENDENCIA; TODAS VENDEN CAPACIDAD. Solo lo que te sirve;
   te enseña a mostrarlo; un camino propio; saber para que lo aprendes; un
   camino compartido; un sistema que no te necesite. Es lo que dice, en una
   linea, el lema de Fraterni Ventures sobre el marco de la familia.

   EL CRITERIO ES EL DEL CODIGO ALEF: el vault `suEssencia` (emet-y-met,
   prueba-forense-del-fruto, najash, bitul, sindrome-de-lamec). Emet, verdad,
   se escribe con Alef, Mem y Tav: origen, proceso y conclusion. Sin el Alef
   queda Met: funciona en apariencia y no vive. Por eso:

   1. TRES PATAS. Origen, mision y vision: sin el origen, la ficha dice que
      hace la casa y a donde va, pero no por que existe.
   2. LA RESPUESTA A MANO APUNTA AL PARA QUE y no promete un resultado. Asi
      no reclama la ultima palabra (el filtro de la fe).
   3. LO TACHADO NO ES UN ERROR: es lo que se ofrece sin para que, el
      najash. Tachar para exhibir que uno sabe mas es el sindrome de Lamec.
   4. QUE NOS PUEDAN DEJAR. El filtro del amor mide si el autor se vuelve
      prescindible: un sistema que no te necesite, un camino que puedas
      seguir sin que nadie te empuje.
   5. LA PRESENCIA SALE DEL ORIGEN, NO DEL EJEMPLO.

   LOS ORIGENES TIENEN QUE SER CIERTOS. Un origen inventado es la forma mas
   pura de Met. Los de FraterniU, Academy y Fraterni Us son borradores del
   documento de copy, pendientes de confirmar: van marcados.

   CAMBIOS SOBRE EL DOCUMENTO, y por que:
   - Recvid mantiene la vision «Marcas que no necesitan a nadie para sonar a
     ellas mismas»: la de «no con presupuesto» ya se habia descartado.
   - Su «¿Por qué?» dice «todas las marcas» y no «las otras veinte»: una
     cifra que no dice de donde sale no va. Y sin «no se contrata, se
     aprende», que tambien se habia quitado.
   - El «¿Por qué?» de Let Be ya no abre con «La pregunta no es...»: ahora el
     remate va justo encima y lo diria dos veces.

   ESCRITO PARA UN NIÑO QUE ACABA DE APRENDER A LEER, sin superlativos y sin
   prometer como hecho lo que es un plan (capitulo 9 del marco).

   LA AUTORIDAD NO ES DE UNO. Es de Dios, que es amor, y se ve en hacer las
   cosas por el bien del otro sin buscarle daño. No se reclama: se nota.

   LA FAMILIA. Let Be y Recvid son la exposicion. Los productos Fraterni van
   por ramas: FraterniU es la persona y Fraterni Academy su escuela; Fraterni
   Us es el grupo y Fraterni Business, que cuelga de Us, junta a Let Be,
   Recvid y Fraterni Us para que una empresa funcione sin su dueño.
   Fraterni Ventures es la matriz: su logotipo y su lema encierran a la
   familia. El mapa entero esta en `ecosistema-fraterni.md`.

   DE MOMENTO SOLO EN ESPAÑOL. Los otros cuatro idiomas enseñan el español
   hasta que el texto quede aprobado: `say()` ya cae al español cuando falta
   uno. */

export const PROPOSITO = {
  'let-be': {
    pregunta: { es: '¿Qué le falta a tu negocio para destacar en internet?' },
    /* Sustantivos. La pagina web va primera a proposito: es lo primero que
       casi todos piden. */
    tacha: { es: ['Una página web', 'Un chatbot', 'Una app propia', 'Otro software más', 'El primer lugar en Google', 'Un community manager', 'Más pauta'] },
    pone: { es: 'Solo lo que tenga un para qué.' },
    remate: { es: 'La pregunta no es qué te falta. Es para qué.' },
    porque: { es: 'Hoy se puede construir casi todo. Un chatbot sin una pregunta que responda es un gasto con interfaz bonita; una automatización sin un proceso que sobre es trabajo nuevo disfrazado de ahorro. Por eso lo primero que hacemos no es cotizar: es entender para qué, y decirte con franqueza si la respuesta es «para nada».' },
    que: { es: 'Let Be construye lo digital de tu negocio. Solo lo que te sirve.' },
    origen: {
      /* Cuenta algo que paso: lo confirma el fundador. */
      corta: { es: 'Existimos porque vimos demasiados negocios buenos pagando por tecnología que nunca llegaron a usar.' },
      larga: { es: 'No fallaba la tecnología: faltaba preguntar para qué antes de construir.' }
    },
    mision: {
      corta: { es: 'Construir solo la tecnología que un negocio va a usar.' },
      larga: { es: 'Páginas, aplicaciones, chatbots y automatizaciones, con números que te dicen si están sirviendo. Antes de construir preguntamos para qué, y si la respuesta es «para nada», te lo decimos.' }
    },
    vision: {
      corta: { es: 'Un mercado donde ninguna empresa paga por tecnología que no usa.' },
      larga: { es: 'Muchos negocios buenos no han dado bien el salto a lo digital. Queremos que lo den con lo que de verdad necesitan, hecho a su medida.' }
    },
    como: { es: 'Primero entendemos contigo para qué; después construimos el lugar propio de tu negocio en internet y medimos si sirvió. Junto a Recvid, que te ayuda a encontrar lo que te distingue y a mostrarlo.' }
  },

  recvid: {
    pregunta: { es: '¿Por qué recuerdan a otras marcas y no a la tuya?' },
    /* Infinitivos. Las tendencias van primeras a proposito: son lo que mas
       se confunde con ser recordado. Contratar una agencia va tachado
       tambien a proposito: Recvid enseña para que un dia no la necesites,
       tampoco a Recvid. */
    tacha: { es: ['Seguir las tendencias', 'Pagar más pauta', 'Publicar todos los días', 'Tener mejor cámara', 'Contratar una agencia', 'Editar mejor', 'Grabar más'] },
    pone: { es: 'Saber por qué existes.' },
    remate: { es: 'La pregunta no es cuánto publicas. Es desde dónde.' },
    porque: { es: 'Una tendencia te consigue la vista de hoy y te deja igual a todas las marcas que la hicieron esta semana. Y la cámara casi nunca es el problema: las marcas no se olvidan por mala imagen, se olvidan porque nunca supieron para qué existían más allá de vender. Por eso enseñamos antes de grabar.' },
    /* «Te ayuda a encontrar» y no «encuentra»: lo que te distingue lo
       encuentras tu. Si lo encontrara Recvid, volverias a necesitarla. */
    que: { es: 'Recvid te ayuda a encontrar lo que te distingue, y te enseña a mostrarlo.' },
    origen: {
      /* Cuenta algo que paso: lo confirma el fundador. */
      corta: { es: 'Empezamos grabando lo nuestro. Ahí aprendimos que el equipo nunca fue el problema.' },
      larga: { es: 'Grabando nuestros propios sketches y reels vimos que lo que hace que alguien recuerde algo no se compra: se entiende.' }
    },
    mision: {
      corta: { es: 'Enseñarle a cada marca a contar lo que solo ella puede contar.' },
      larga: { es: 'Cámara, edición y estrategia, para las redes y para tus propios medios, explicadas para que un día lo hagas sin nosotros.' }
    },
    /* A nadie, tampoco a Recvid: una marca que necesita a quien le enseño
       para sonar a si misma no aprendio. */
    vision: {
      corta: { es: 'Marcas que no necesitan a nadie para sonar a ellas mismas.' },
      larga: { es: 'Una escuela al alcance de cualquiera que tenga algo que decir, donde aprender a grabar no dependa de tener dinero ni de nosotros.' }
    },
    como: { es: 'Hoy damos asesorías y hacemos nuestros propios sketches y reels, donde se ve lo que enseñamos. La plataforma llega pronto. Grabar por encargo, solo si el proyecto lo merece.' }
  },

  u: {
    pregunta: { es: '¿Por qué otros cumplen sus sueños en la pantalla y los tuyos siguen esperando?' },
    /* Sustantivos. «Otra app de hábitos» va primera a proposito: FraterniU es
       una app, y tacharla es el mismo gesto que Let Be tachando «una pagina
       web». */
    tacha: { es: ['Otra app de hábitos', 'Más motivación', 'Más disciplina', 'Otro sistema de productividad', 'Más tiempo libre', 'Otro año nuevo'] },
    pone: { es: 'Un camino propio.' },
    remate: { es: 'La pregunta no es cuánta disciplina te falta. Es hacia dónde.' },
    porque: { es: 'Ver a otros avanzar no es el problema. El problema es que ver reemplazó a avanzar: la pantalla entrega la sensación del logro sin el logro. Y lo que falta casi nunca es disciplina: es un destino lo bastante tuyo como para que la disciplina tenga sentido. Primero el rumbo. La constancia viene después.' },
    que: { es: 'FraterniU es una app para ordenarte y crecer.' },
    /* Origen, mision y vision: borradores del documento de copy, por
       confirmar. */
    origen: {
      corta: { es: 'Empezamos porque ordenarse no debería depender de tener a alguien encima.' },
      larga: { es: 'Su manifiesto lo dice así: «Dismantling chronic performance. Restoring your original identity». Desarmar la actuación de siempre y volver a lo que eres.' }
    },
    mision: {
      corta: { es: 'Darle a cada persona un camino que pueda seguir sin que nadie la empuje.' },
      larga: { es: 'Su lema: «Build your path, leave your mark». Productividad y crecimiento personal y profesional en un mismo lugar, para que salgas adelante con lo tuyo y no con lo que se ve bien en la pantalla.' }
    },
    vision: {
      corta: { es: 'Un mundo donde crecer no dependa de la suerte ni del origen.' },
      larga: { es: 'Dejar de actuar para los demás y volver a lo que eres. Una app que mida lo que avanzas, y no cuántos te miran.' }
    },
    como: { es: 'Estamos construyendo la app: ordena tu día, cuida tu concentración y mide lo que avanzas —no los «me gusta»—. Lo que haga falta aprender, lo enseña Fraterni Academy, su escuela.' }
  },

  /* De FraterniU. Sin pagina propia: sus `larga` no se leerian en ningun
     sitio, y no las lleva. */
  academy: {
    pregunta: { es: '¿Por qué terminas cursos y todo sigue igual?' },
    /* Infinitivos. */
    tacha: { es: ['Terminar otro curso', 'Tomar notas mejor', 'Conseguir otro certificado', 'Estudiar más horas', 'Buscar un mejor profesor', 'Empezar de cero otra vez'] },
    pone: { es: 'Saber para qué lo aprendes.' },
    remate: { es: 'La pregunta no es cuánto sabes. Es para qué lo querías.' },
    porque: { es: 'Un curso se termina el viernes y el lunes la vida sigue igual, porque terminar y aplicar son dos cosas distintas y solo una de las dos se certifica. Aquí no se mide cuánto viste: se mide qué cambió después. Por eso cada cosa que se enseña llega con el para qué pegado, y si no tiene uno, no se enseña.' },
    que: { es: 'Fraterni Academy es la escuela de FraterniU: se aprueba aplicando, no terminando.' },
    /* Borradores, por confirmar. */
    origen: { corta: { es: 'Nació porque coleccionar cursos terminados no cambió nada, y aplicar uno sí.' } },
    mision: { corta: { es: 'Enseñar solo lo que alguien va a aplicar.' } },
    vision: { corta: { es: 'Un aprendizaje que se mide por lo que cambia, no por lo que se certifica.' } },
    como: { es: 'Todavía no abre. Se construye junto a la app: cada entrenamiento termina en algo que se practica en FraterniU.' }
  },

  us: {
    pregunta: { es: '¿Por qué un grupo lleno de buenas ideas no termina ninguna?' },
    /* Sustantivos. */
    tacha: { es: ['Más reuniones', 'Un mejor grupo de WhatsApp', 'Otra herramienta de tareas', 'Más compromiso', 'Un líder más firme', 'Más tiempo'] },
    pone: { es: 'Un camino compartido.' },
    remate: { es: 'La pregunta no es de quién fue la idea. Es quién la sostiene.' },
    porque: { es: 'Un grupo no falla por falta de ideas: falla porque la idea es de todos y el siguiente paso no es de nadie. Las reuniones no lo arreglan, lo aplazan con buena cara. Lo que hace la diferencia es que el camino esté afuera de las cabezas, a la vista, con nombre propio en cada tramo. Eso se puede armar. La voluntad no.' },
    que: { es: 'Fraterni Us convierte un grupo de buenas intenciones en un grupo con un camino.' },
    /* Borradores, por confirmar. */
    origen: { corta: { es: 'Salió de ver grupos buenos disolverse sin que nadie se peleara.' } },
    mision: { corta: { es: 'Darle a un grupo el mismo camino que FraterniU le da a una persona.' } },
    vision: { corta: { es: 'Grupos que terminan lo que empiezan sin depender de quien más empuja.' } },
    como: { es: 'Todavía no abre. Es la misma app de FraterniU con espacio para el grupo: metas compartidas y avances que se ven entre todos. De aquí sale Fraterni Business.' }
  },

  /* De Fraterni Us. LA TARJETA QUE CAMBIO DE FONDO: antes hablaba de que los
     clientes vuelvan; ahora dice lo que Business es, el unico nodo que junta
     a Let Be, Recvid y Fraterni Us. Por eso es tambien la unica que nombra a
     las otras marcas. */
  business: {
    pregunta: { es: '¿Tu empresa funciona, o funcionas tú?' },
    /* Sustantivos. */
    tacha: { es: ['Un gerente más', 'Otro software de gestión', 'Más personal', 'Un manual de procesos', 'Más horas tuyas', 'Una reestructuración'] },
    pone: { es: 'Un sistema que no te necesite.' },
    remate: { es: 'La pregunta no es cuánto trabajas. Es qué pasa cuando no estás.' },
    porque: { es: 'Hay empresas que facturan bien y aun así no existen sin su dueño: todo lo que importa pasa por una sola cabeza. Contratar a alguien más no lo resuelve, lo reparte. Lo que lo resuelve es que la empresa tenga tres cosas que una persona no puede reemplazar: infraestructura que opere sin ti, un relato que cualquiera del equipo pueda contar igual y un método que el grupo sepa seguir solo. Eso se arma una vez y queda.' },
    que: { es: 'Fraterni Business junta las tres piezas: la infraestructura de Let Be, el criterio de Recvid y el método de Fraterni Us.' },
    origen: { corta: { es: 'Existimos porque una empresa que depende de una sola persona no es una empresa: es un empleo difícil.' } },
    mision: { corta: { es: 'Construir empresas que caminen sin quien las fundó.' } },
    vision: { corta: { es: 'Un mercado donde el dueño pueda irse un mes y nadie lo note.' } },
    como: { es: 'Todavía no abre. Empieza por mirar qué depende solo de ti; después arma las tres piezas: la infraestructura con Let Be, el relato con Recvid y el método con Fraterni Us.' }
  },

  /* La matriz. En el directorio no lleva ficha —su logotipo y su lema
     encierran a la familia—, pero tiene su pagina en proyectos, y ahi si se
     lee entera. */
  fraterni: {
    pregunta: { es: '¿Por qué mueren tantos proyectos buenos?' },
    tacha: { es: ['Falta de dinero', 'Mala suerte', 'Falta de tiempo'] },
    pone: { es: 'Están solos.' },
    porque: { es: 'Un proyecto solo carga con todo: el nombre, las cuentas, los errores. Con hermanos, lo que aprende uno le sirve a los demás.' },
    que: { es: 'Fraterni Ventures es la marca madre de la familia Fraterni.' },
    origen: {
      corta: { es: 'Fraterni viene de hermanos: existe para que ningún proyecto tenga que empezar solo.' },
      /* La matriz no manda sobre las casas: las acompaña. Es el filtro del
         amor aplicado a una empresa madre. */
      larga: { es: 'La matriz no está para mandar sobre las casas, sino para que ninguna cargue sola.' }
    },
    mision: {
      corta: { es: 'Crear proyectos que se ayuden entre ellos.' },
      larga: { es: 'Las casas comparten nombre, equipo y manera de trabajar. Lo que aprende una, le sirve a las otras.' }
    },
    vision: {
      corta: { es: 'Ser la marca de una familia de proyectos que duran.' },
      larga: { es: 'Que cada proyecto nuevo nazca con hermanos en vez de solo.' }
    },
    como: { es: 'Fraterni pone la estructura —el nombre, las cuentas, los acuerdos— para que cada casa se ocupe solo de su trabajo. Aquí se habla de sociedad, inversión y prensa; los encargos van por cada casa.' }
  }
};

/* El directorio y la pagina de proyectos llaman a dos casas por nombres
   distintos: la startup es `fraterniu` en uno y `u` en el otro, y la matriz
   `ventures` y `fraterni`. El texto se escribe una vez y los dos lo leen. */
const ALIAS = { fraterniu: 'u', ventures: 'fraterni' };
export const propositoDe = (id) => PROPOSITO[ALIAS[id] ?? id] ?? null;

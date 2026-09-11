/* Lo que es cada casa, dicho para que lo entienda cualquiera.

   LAS PIEZAS, en el orden en que se leen:

     pregunta  una sola. Pregunta por el para que, no por el que.
     tacha     lo que se suele pedir primero. Si es una lista, van pasando
               en bucle en el mismo sitio, siempre tachadas. LA ULTIMA ES LA
               QUE SE VE sin guion o con el movimiento reducido, asi que
               tiene que ser la que mejor contrasta con la buena. Y que
               midan parecido: la caja mide lo que la mas larga, y una corta
               dejaria un hueco antes de la respuesta.
     pone      la respuesta, escrita a mano al lado. Siempre a la vista: las
               tachadas cambian, ella no.
     porque    por que importa, en dos o tres frases. En el directorio va
               detras del boton «¿Por qué?»; en la pagina de la casa, a la
               vista.
     que       lo que es, en una frase corta.
     origen    por que existe la casa: una linea (corta) y otra que la
     mision    explica (larga). En la ficha del directorio solo las cortas,
     vision    detras del icono de informacion; en la pagina de la casa,
               todas.
     como      con que piensa llegar. Solo en la pagina de la casa.

   EL CRITERIO ES EL DEL CODIGO ALEF: el vault `suEssencia` (emet-y-met,
   prueba-forense-del-fruto, najash, bitul, sindrome-de-lamec) y el
   diagnostico `script-alef-letbe-recvid.md`. Emet, verdad, se escribe con
   Alef, Mem y Tav: origen, proceso y conclusion. Sin el Alef queda Met,
   muerte: funciona en apariencia y no vive. De ahi salen cinco reglas.

   1. TRES PATAS, NO DOS. La mision es Mem y la vision es Tav; faltaba el
      origen, por que existe la casa. Por eso `origen` va primero y la ficha
      enseña ORIGEN · MISION · VISION.

   2. LA RESPUESTA A MANO ES EL ALEF. Una respuesta que promete un resultado
      —«solo lo que trabaje para ti»— es un +1 con mejor gusto. La buena
      apunta al para que y le deja la decision al lector: «Depende de para
      qué». Pasa el filtro de la fe porque no reclama la ultima palabra.

   3. LO TACHADO NO ES UN ERROR. Es lo que se ofrece sin origen: una pagina,
      un chatbot, mas pauta. Ninguna es mala; todas son expansion sin para
      que, que es justo lo que ofrecio el najash. Tachar para exhibir que uno
      sabe mas es el sindrome de Lamec. Se tacha para que el lector mire
      primero el origen, y esa es la pregunta que hay que hacerse cada vez
      que se agrega una tachada nueva.

   4. QUE NOS PUEDAN DEJAR. El filtro del amor mide si el autor se vuelve
      prescindible, y es el unico que no se puede fingir. Recvid enseña para
      que un dia grabes sin nosotros; Let Be te devuelve la pregunta en vez
      de decidir por ti; Academy enseña hasta que ya no la necesites.

   5. LA PRESENCIA SALE DEL ORIGEN, NO DEL EJEMPLO. Un caso concreto —el
      restaurante de sushi— le daba vida a una linea, pero la ataba a ese
      caso. Lo que hace unica una frase es desde donde se dice.

   LOS ORIGENES TIENEN QUE SER CIERTOS. Un origen inventado es la forma mas
   pura de Met. Los que cuentan algo que paso —«vimos», «empezamos»— los
   confirma el fundador antes de traducirse.

   MINIMO. Cada frase que sobra le quita fuerza a la pregunta. La ficha era
   un parrafo y se leia como un folleto; si algo necesita tres lineas para
   explicarse, no va en la ficha.

   LA AUTORIDAD NO ES DE UNO. Es de Dios, que es amor, y se ve en hacer las
   cosas por el bien del otro sin buscarle daño. No se reclama: se nota. Por
   eso ningun texto dice «alguien que sabe de lo que habla», que pondria la
   autoridad en uno mismo.

   ESCRITO PARA UN NIÑO QUE ACABA DE APRENDER A LEER. Frases cortas, palabras
   de todos los dias, ningun superlativo, ninguna cifra que no diga de donde
   sale, nada de «lideres» ni de «soluciones».

   SIN PROMETER LO QUE AUN NO EXISTE. La plataforma de Recvid, la app de
   FraterniU, Fraterni Us, Fraterni Academy y Fraterni Business se estan
   construyendo, y el texto lo dice asi. Presentar como hecho lo que es un
   plan es lo que el capitulo 9 del marco llama marcar mal la certeza.

   LA FAMILIA. Let Be y Recvid son la exposicion: Let Be construye lo PROPIO
   —la pagina y los medios de tu negocio, solo lo que vas a usar— y Recvid
   te ayuda a encontrar lo que te DISTINGUE y a mostrarlo, en las redes y en
   esos medios. A la gente que traen la recibe Fraterni Business, que mira
   antes si el negocio la puede atender. Los productos Fraterni son el
   crecimiento, por ramas: FraterniU es la persona y Fraterni Academy es su
   escuela; Fraterni Us es el grupo y Fraterni Business lo lleva a las
   empresas. Fraterni Ventures es la matriz: en el directorio no se explica,
   las encierra. El mapa entero esta en `ecosistema-fraterni.md`.

   DE MOMENTO SOLO EN ESPAÑOL. Los otros cuatro idiomas enseñan el español
   hasta que el texto quede aprobado: `say()` ya cae al español cuando falta
   uno. El lema de FraterniU va traducido aqui; en ingles ira el original,
   «Build your path, leave your mark». */

export const PROPOSITO = {
  'let-be': {
    pregunta: { es: '¿Qué necesita tu negocio en internet, y qué no?' },
    /* Lo que se suele pedir primero. Ninguna es mala: todas son tecnologia
       sin para que. La pagina web va la ultima porque es lo primero que
       casi todos piden. */
    tacha: { es: ['Un chatbot más', 'Una app propia', 'Automatizarlo todo', 'Primero en Google', 'Otro software más', 'Una página web'] },
    pone: { es: 'Depende de para qué.' },
    porque: { es: 'Hoy se puede construir casi todo; la pregunta es para qué. Por eso lo primero no es cotizar: es entender contigo para qué, y si la respuesta es «para nada», decírtelo.' },
    que: { es: 'Let Be construye lo digital de tu negocio: solo lo que vas a usar.' },
    origen: {
      /* Cuenta algo que paso: lo confirma el fundador. */
      corta: { es: 'Vimos muchos negocios buenos pagando por tecnología que nunca usaron.' },
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
    pregunta: { es: '¿Qué hace que a una marca la recuerden?' },
    /* Lo que se compra para que te vean. Contratar agencia va tachado a
       proposito: Recvid enseña para que un dia no la necesites, tampoco a
       Recvid. Las tendencias van las ultimas: son lo que mas se confunde
       con ser recordado. */
    tacha: { es: ['Una mejor cámara', 'Publicar a diario', 'Pagar más pauta', 'Una mejor edición', 'Contratar agencia', 'Seguir tendencias'] },
    pone: { es: 'Saber por qué existe.' },
    porque: { es: 'Una tendencia te deja igual a las demás marcas. Lo que se recuerda es algo que dan ganas de vivir, y nace de saber para qué existes: no se contrata, se aprende.' },
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
    vision: {
      corta: { es: 'Un mercado donde la atención se gana con criterio, no con presupuesto.' },
      larga: { es: 'Una escuela abierta, donde aprender a grabar no dependa de tener dinero y donde no se olvide para qué se graba.' }
    },
    como: { es: 'Hoy damos asesorías y hacemos nuestros propios sketches y reels, donde se ve lo que enseñamos. La plataforma llega pronto. Grabar por encargo, solo si el proyecto lo merece.' }
  },

  u: {
    pregunta: { es: '¿Por qué ves a otros cumplir sus sueños en la pantalla y los tuyos siguen esperando?' },
    tacha: { es: ['Tiempo', 'Dinero', 'Suerte'] },
    pone: { es: 'Un camino propio.' },
    porque: { es: 'Mirar la vida de otros se lleva el tiempo de la tuya. Un camino propio no empieza por hacer más: empieza por volver a lo que eres.' },
    que: { es: 'FraterniU es una app para ordenarte y crecer.' },
    origen: {
      corta: { es: 'Existe porque vivir actuando para que te vean cansa, y hace olvidar quién eres.' },
      /* Su manifiesto, en ingles en el original. */
      larga: { es: 'Su manifiesto lo dice así: «Dismantling chronic performance. Restoring your original identity». Desarmar la actuación de siempre y volver a lo que eres.' }
    },
    mision: {
      /* El lema de FraterniU, traducido: «Build your path, leave your mark». */
      corta: { es: 'Construye tu camino, deja tu huella.' },
      larga: { es: 'Productividad y crecimiento personal y profesional en un mismo lugar, para que salgas adelante con lo tuyo y no con lo que se ve bien en la pantalla.' }
    },
    vision: {
      corta: { es: 'Que nadie se arrepienta de lo que no se atrevió a empezar.' },
      larga: { es: 'Dejar de actuar para los demás y volver a lo que eres. Una app que mida lo que avanzas, y no cuántos te miran.' }
    },
    como: { es: 'Estamos construyendo la app: ordena tu día, cuida tu concentración y mide lo que avanzas —no los «me gusta»—. Lo que haga falta aprender, lo enseña Fraterni Academy, su escuela.' }
  },

  /* De FraterniU. */
  academy: {
    pregunta: { es: '¿Por qué terminas cursos y todo sigue igual?' },
    tacha: { es: ['Otro curso', 'Más videos', 'Más información'] },
    /* Antes decia «Ponerlo en práctica», que es proceso (Mem). El para que
       va antes: sin el, tampoco se practica. */
    pone: { es: 'Saber para qué lo aprendes.' },
    porque: { es: 'Un curso sin para qué se olvida al terminar. Cuando sabes para qué aprendes algo, lo practicas, y lo practicado se queda.' },
    que: { es: 'Fraterni Academy es la escuela de FraterniU.' },
    origen: {
      corta: { es: 'Existe porque lo que se aprende sin un para qué se olvida.' },
      larga: { es: 'FraterniU pide practicar; Academy enseña lo que haga falta para hacerlo, y nada más.' }
    },
    mision: {
      corta: { es: 'Que lo que aprendes se note en lo que haces.' },
      larga: { es: 'Entrenamientos cortos de orden, carácter, concentración y oficio, para quienes usan FraterniU. Enseña hasta que ya no la necesites.' }
    },
    vision: {
      corta: { es: 'Que nadie termine un curso igual que como lo empezó.' },
      larga: { es: 'Una escuela donde cuenta lo que haces con lo aprendido, y no cuántos certificados tienes.' }
    },
    como: { es: 'Todavía no abre. Se construye junto a la app: cada entrenamiento termina en algo que se practica en FraterniU.' }
  },

  us: {
    pregunta: { es: '¿Por qué un grupo lleno de buenas ideas no termina ninguna?' },
    tacha: { es: ['Tiempo', 'Dinero', 'Ganas'] },
    pone: { es: 'Un camino compartido.' },
    porque: { es: 'Un grupo que no sabe para qué se juntó se gasta discutiendo por dónde ir. Cuando el para qué es de todos, las ideas se terminan.' },
    que: { es: 'Fraterni Us es FraterniU para grupos.' },
    origen: {
      corta: { es: 'Existe porque un grupo que olvida para qué se juntó termina separado.' },
      larga: { es: 'Lo que FraterniU hace con una persona —volver a lo que es—, Fraterni Us lo hace con un grupo: volver a por qué empezaron.' }
    },
    mision: {
      corta: { es: 'Que un grupo construya junto lo que nadie logra solo.' },
      larga: { es: 'Equipos, comunidades, clubes o familias: el mismo orden y la misma forma de medir lo que se avanza, pero compartidos.' }
    },
    vision: {
      corta: { es: 'Que ningún grupo se deshaga por no tener un rumbo común.' },
      larga: { es: 'Grupos que se acuerdan de por qué empezaron, y por eso terminan lo que empiezan.' }
    },
    como: { es: 'Todavía no abre. Es la misma app de FraterniU con espacio para el grupo: metas compartidas y avances que se ven entre todos. De aquí sale Fraterni Business, para las empresas.' }
  },

  /* De Fraterni Us. Recibe a la gente que trae la exposicion: antes de que
     llegue mas, mira si el negocio la puede atender y si es de los que se
     arriesgan. Mas gente de la que cabe no suma: se va y no vuelve. */
  business: {
    pregunta: { es: '¿Dónde está el dinero que tu negocio deja pasar?' },
    tacha: { es: ['En más anuncios', 'En otra ciudad', 'En clientes nuevos'] },
    /* Antes decia «En los que ya tienes», que los cuenta como recurso. Un
       cliente no se tiene: confio en ti. */
    pone: { es: 'En los que ya confiaron en ti.' },
    porque: { es: 'Cuidar a quien ya confió en ti suele costar menos que buscar a alguien nuevo. Y si llega más gente de la que puedes atender, se va y no vuelve.' },
    que: { es: 'Fraterni Business lleva Fraterni Us a las empresas: que tus clientes vuelvan.' },
    origen: {
      corta: { es: 'Existe porque muchos negocios buscan clientes nuevos mientras descuidan a los que ya confiaron en ellos.' },
      larga: { es: 'Un cliente no es una venta: es alguien que confió en ti. Cuidarlo es la forma de vender que no se agota.' }
    },
    mision: {
      corta: { es: 'Que las empresas cuiden al cliente que ya tienen.' },
      larga: { es: 'Antes de crecer, mirar si tu negocio puede atender a los que llegan y cuánto quiere arriesgar. Después, atención al cliente, orden por dentro y una forma de vender que no dependa de la suerte del mes.' }
    },
    vision: {
      corta: { es: 'Que ningún cliente se vaya por no haber sido bien atendido.' },
      larga: { es: 'Empresas que crecen porque sus clientes vuelven, y no solo porque llegan otros.' }
    },
    como: { es: 'Todavía no abre. Empieza por estudiar tu negocio: si aguanta la gente que traen Let Be y Recvid, y si es de los que se arriesgan —programas VIP, tarjetas de fidelidad, reseñas—. Después, asesorías y entrenamientos para equipos: cómo atender, cómo ordenarse por dentro y cómo volver a vender.' }
  },

  /* La matriz. En el directorio no se explica —su logotipo encierra a la
     familia—, pero tiene su pagina en proyectos, y ahi si se lee entera. */
  fraterni: {
    pregunta: { es: '¿Por qué mueren tantos proyectos buenos?' },
    tacha: { es: ['Mala suerte', 'Falta de tiempo', 'Falta de dinero'] },
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

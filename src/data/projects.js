/* Lo que estoy construyendo. Mismo formato que PARTNERS y misma cinta:
   solo cambian la lista y el rotulo que la encabeza.

   `scale` es la escala optica. No todos los logos pueden medir lo mismo de
   alto: uno muy apaisado a la misma altura que una letra suelta pesa el
   triple en la fila. El numero iguala el area que ocupa cada uno, pero
   amortiguada —(1.7 / proporcion) ^ 0.35, entre 0.62 y 1.30—, porque
   igualarla del todo dispara las letras altas y aplasta los logotipos
   largos. Con esto la diferencia entre el mas y el menos pesado baja de
   7.8 a 3.6 veces.

   Fraterni va en mapa de bits y no en vectorial como los demas. Su SVG
   lleva una imagen incrustada dentro —779KB para un logo que se ve a
   150px—, asi que se rasteriza una vez y pesa 4KB. El resto son curvas
   de verdad y entran tal cual. */
/* CAMPOS OPCIONALES — los mismos para PARTNERS y para PROJECTS.

   Nada de esto hace falta para que una casa salga en la cinta. Son para la
   TARJETA y para su ficha, y cada uno se puede poner por separado:

     role   { es, en, pt, fr, it }   Que es esa casa, en una linea. Si no
                                      esta, la tarjeta pone si es un cliente
                                      o un proyecto de casa, que ya lo sabe.
     blurb  { es, en, pt, fr, it }   La descripcion de la tarjeta. Dos
                                      renglones, y del mismo largo que las
                                      demas: en una rejilla, una descripcion
                                      corta al lado de una larga se lee como
                                      un hueco, no como una frase breve.
     tags   ['comunidad', '2025']    Por donde se filtra. Las etiquetas y sus
                                      ejes viven en entities.js.
     banner '/assets/banners/x.jpg'  La foto de cabecera. Si no esta, la
                                      tarjeta pinta un degradado de la casa
                                      con el logo grande y tenue detras — que
                                      es lo que hay ahora, y no queda a medias.
     works  [ … ]                     Lo que hice con ellos. Cada uno:
                                        { title: { es, en, … },
                                          year:  '2025',
                                          href:  'https://…'  (opcional) }

   Una casa sin `works` se ensena igual y su ficha lo dice al abrirla. La
   tarjeta no la marca por fuera: existir ya es informacion, y un aviso de
   «pronto» en cada una convertia la rejilla en una lista de deudas.

   Un ejemplo entero, para copiar:

     { id: 'bodega', name: 'Bodega', …,
       blurb: { es: '…', en: '…', pt: '…', fr: '…', it: '…' },
       works: [
         { title: { es: 'Identidad de marca', en: 'Brand identity' }, year: '2025' }
       ] },
*/
export const PROJECTS = [
  /* La marca propia tambien es un proyecto, asi que la firma entra con
     el resto. Tira del SVG que ya vive en /logos: es el mismo fichero que
     firma la portada de arranque, y duplicarlo seria pedir que se separen.
     Proporcion 2.28 -> escala 0.90 por la misma regla que los demas. */
  { id: 'juanjo',     name: 'Juan José López Ramírez', src: '/assets/logos/signature.svg', w: 572, h: 251, scale: 0.90,
    mark: 'mark',
    role: {
      es: 'Marca personal propia', en: 'My own personal brand', pt: 'Marca pessoal própria',
      fr: 'Ma marque personnelle', it: 'Marchio personale proprio'
    },
    blurb: {
      es: 'Estrategia de marca construida desde el origen: primero de dónde viene una casa, después cómo se ve. Diseño, audiovisual y tecnología, en ese orden.',
      en: 'Brand strategy built from the origin: first where a house comes from, then how it looks. Design, audiovisual and technology, in that order.',
      pt: 'Estratégia de marca construída desde a origem: primeiro de onde vem uma casa, depois como se vê. Design, audiovisual e tecnologia, por essa ordem.',
      fr: 'Stratégie de marque construite depuis l’origine : d’abord d’où vient une maison, ensuite à quoi elle ressemble. Design, audiovisuel et technologie, dans cet ordre.',
      it: 'Strategia di marca costruita dall’origine: prima da dove viene una casa, poi come si vede. Design, audiovisivo e tecnologia, in quest’ordine.'
    } },
  { id: 'fraterni',   name: 'Fraterni',       src: '/assets/projects/fraterni.png',   w: 600, h: 143, webp: '/assets/projects/fraterni.webp', scale: 0.73,
    tags: ['comunidad'],
    role: {
      es: 'Comunidad digital',
      en: 'Digital community',
      pt: 'Comunidade digital',
      fr: 'Communauté numérique',
      it: 'Comunità digitale'
    },
    blurb: {
      es: 'Lo colectivo por delante: la hermandad como práctica y no como palabra. Lo que un grupo llega a sostener cuando cada uno deja de ir por su cuenta.',
      en: 'The collective first: brotherhood as a practice, not as a word. What a group turns out to hold up once each person stops going it alone.',
      pt: 'O coletivo à frente: a fraternidade como prática e não como palavra. O que um grupo chega a sustentar quando cada um deixa de ir por sua conta.',
      fr: 'Le collectif d’abord : la fraternité comme pratique, pas comme mot. Ce qu’un groupe finit par porter dès que chacun cesse d’avancer seul.',
      it: 'Il collettivo davanti: la fratellanza come pratica e non come parola. Ciò che un gruppo arriva a reggere quando ognuno smette di andare per conto suo.'
    } },
  /* `u` se lee bien en el codigo pero no en una direccion: /es/u/ no dice
     nada. El id se queda y la direccion se le pone aparte. */
  { id: 'u',          name: 'FraterniU',      src: '/assets/projects/u.svg',          w: 132, h: 307, scale: 1.30,
    slug: 'fraterniu',
    tags: ['comunidad'],
    role: {
      es: 'Comunidad digital',
      en: 'Digital community',
      pt: 'Comunidade digital',
      fr: 'Communauté numérique',
      it: 'Comunità digitale'
    },
    blurb: {
      es: 'El crecimiento de cada uno, personal y profesional: primero se forma el carácter, porque encima de él es donde aguanta todo lo demás.',
      en: 'Each person’s growth, personal and professional: character gets formed first, because that is what everything else holds onto.',
      pt: 'O crescimento de cada um, pessoal e profissional: primeiro forma-se o carácter, porque é em cima dele que o resto aguenta.',
      fr: 'La croissance de chacun, personnelle et professionnelle : le caractère se forme d’abord, car c’est sur lui que tient tout le reste.',
      it: 'La crescita di ciascuno, personale e professionale: prima si forma il carattere, perché è su quello che regge tutto il resto.'
    } },
  { id: 'cordillera', name: 'Cordillera Unida FC', src: '/assets/projects/cordillera.svg', w: 290, h: 308, scale: 1.23,
    tags: ['deporte'],
    role: {
      es: 'Club de fútbol amateur',
      en: 'Amateur football club',
      pt: 'Clube de futebol amador',
      fr: 'Club de football amateur',
      it: 'Club di calcio amatoriale'
    },
    blurb: {
      es: 'Se arma desde cero: primero el grupo y la costumbre de entrenar, después la tabla. Aquí la palabra dada pesa más que cualquier fichaje.',
      en: 'Built from scratch: first the group and the habit of training, then the table. Here a word kept counts for more than any signing.',
      pt: 'Monta-se do zero: primeiro o grupo e o hábito de treinar, depois a tabela. Aqui a palavra dada pesa mais do que qualquer reforço.',
      fr: 'Bâti depuis zéro : d’abord le groupe et l’habitude de s’entraîner, ensuite le classement. Ici la parole tenue pèse plus que n’importe quelle recrue.',
      it: 'Si monta da zero: prima il gruppo e l’abitudine di allenarsi, poi la classifica. Qui la parola data pesa più di qualsiasi acquisto.'
    } },
  { id: 'let-be',     name: 'Let Be',         src: '/assets/projects/let-be.svg',     w: 519, h: 323, scale: 1.02,
    tags: ['software', 'comunidad'],
    role: {
      es: 'Estudio de desarrollo digital',
      en: 'Digital development studio',
      pt: 'Estúdio de desenvolvimento digital',
      fr: 'Studio de développement numérique',
      it: 'Studio di sviluppo digitale'
    },
    blurb: {
      es: 'Páginas, chatbots y automatizaciones a la medida. Lo que de verdad hace falta, que casi nunca es lo más grande ni lo más caro. Pronto, también comunidad.',
      en: 'Websites, chatbots and automations, made to measure. What is actually needed, which is almost never the biggest or the priciest. Soon, a community too.',
      pt: 'Páginas, chatbots e automações à medida. O que faz mesmo falta, que quase nunca é o maior nem o mais caro. Em breve, também comunidade.',
      fr: 'Sites, chatbots et automatisations sur mesure. Ce dont on a vraiment besoin, qui n’est presque jamais le plus gros ni le plus cher. Bientôt, une communauté.',
      it: 'Siti, chatbot e automazioni su misura. Quello che serve davvero, che quasi mai è la cosa più grande né la più cara. Presto, anche comunità.'
    } },
  { id: 'recvid',     name: 'Recvid',         src: '/assets/projects/recvid.svg',     w: 290, h: 298, scale: 1.22,
    tags: ['audiovisual', 'comunidad'],
    role: {
      es: 'Consultora y productora digital',
      en: 'Digital consultancy and production',
      pt: 'Consultoria e produtora digital',
      fr: 'Conseil et production numérique',
      it: 'Consulenza e produzione digitale'
    },
    blurb: {
      es: 'La estrategia y el rodaje en la misma mesa, porque una pieza que se ve bien y no dice nada no sirve para nada. Pronto, también comunidad.',
      en: 'Strategy and shoot at the same table, because a piece that looks good and says nothing is good for nothing. Soon, a community too.',
      pt: 'A estratégia e a rodagem na mesma mesa, porque uma peça que se vê bem e não diz nada não serve para nada. Em breve, também comunidade.',
      fr: 'La stratégie et le tournage à la même table, car une pièce qui rend bien et ne dit rien ne sert à rien. Bientôt, une communauté.',
      it: 'La strategia e le riprese allo stesso tavolo, perché un pezzo che si vede bene e non dice nulla non serve a niente. Presto, anche comunità.'
    } }
];

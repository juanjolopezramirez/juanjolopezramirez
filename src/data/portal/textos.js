/* Los textos del portal «The Alef Code» (hasta el 2026-10-26 se llamo «Álef»).

   EL NOMBRE va en ingles en los cinco idiomas: es un nombre propio, y el fundador
   lo pidio asi.

   SOLO EN ESPAÑOL, y asi se queda hasta que el fundador los apruebe: en los
   otros cuatro idiomas la pagina cae al español (tp() mezcla el idioma que toca
   sobre el español). Cuando los apruebe, se añade un bloque `en: {...}` aqui,
   y se traducen solo las claves que cambien.

   LA VOZ es la de la casa: frases cortas, palabras de todos los dias, nada
   de «cuenta», «credenciales» ni «sesion» cuando basta con «entrar». Y UNA SOLA
   pregunta en toda la tarjeta: «¿Prefieres escribirme?». Lo demas son
   afirmaciones (por eso «Pedir acceso» no lleva signo, y el campo del motivo
   dice «Cuentame para que quieres entrar» y no «¿Para que quieres entrar?»).

   Estos textos viajan al navegador (el guion de la tarjeta los lee de un
   <script type="application/json">) y por eso NUNCA llevan nada secreto. */
export const PORTAL_TEXTOS = {
  es: {
    nombre: 'The Alef Code',
    lema: 'Aquí empieza el camino.',
    paginaTitulo: 'The Alef Code',
    paginaDescripcion: 'Un lugar para seguir caminando.',
    demo: 'Demostración: nada de esto se guarda.',
    fondo: { pausar: 'Pausar el fondo', seguir: 'Mover el fondo' },

    cargando: 'Un momento…',
    aprobado: 'Entrando…',
    /* Las lineas de terminal bajo «Un momento…» (scripts/portal/carga.js): cada una es
       un paso que de verdad ocurre, en el orden en que ocurre. */
    bitacora: {
      conectando: 'conectando',
      quien: 'mirando quién eres',
      acceso: 'revisando tu acceso'
    },
    /* El enlace de la barra que vuelve a la portada (BarraTerminal.astro). No cierra nada.
       La frase entera a la vista (lo pidio el fundador: «Inicio» solo no se entendia). */
    inicio: { texto: 'Volver al inicio', nombre: 'Volver al inicio' },

    entrar: {
      titulo: 'Entrar',
      linea: 'Para seguir caminando.',
      google: 'Continuar con Google',
      o: 'o con tu correo',
      correo: 'Correo',
      clave: 'Contraseña',
      verClave: 'Mostrar contraseña',
      ocultarClave: 'Ocultar contraseña',
      boton: 'Entrar',
      olvide: 'Olvidé mi contraseña',
      pedir: 'Pedir acceso'
    },
    pedir: {
      titulo: 'Pedir acceso',
      linea: 'Yo reviso cada solicitud.',
      google: 'Registrarme con Google',
      o: 'o con tu correo',
      nombre: 'Nombre',
      correo: 'Correo',
      clave: 'Contraseña',
      ayudaClave: 'Mínimo 10 letras o números.',
      motivo: 'Cuéntame para qué quieres entrar (opcional)',
      boton: 'Pedir acceso',
      privacidad: 'Guardo tu nombre y tu correo para decidir. Nada más.',
      yaTengo: 'Ya tengo cuenta'
    },
    correoEnviado: {
      titulo: 'Revisa tu correo',
      linea: 'Te escribí para confirmar tu correo. Cuando lo confirmes, yo reviso tu solicitud.',
      volver: 'Volver'
    },
    recuperar: {
      titulo: 'Olvidé mi contraseña',
      linea: 'Escribe tu correo y te mando un enlace.',
      boton: 'Mandarme el enlace',
      hecho: 'Listo. Si ese correo está aquí, te escribí.',
      volver: 'Volver'
    },
    nuevaClave: {
      titulo: 'Elige una contraseña nueva',
      linea: 'Después de esto, entras con ella.',
      clave: 'Contraseña nueva',
      boton: 'Guardar contraseña'
    },
    pendiente: {
      titulo: 'Tu solicitud llegó',
      linea: 'Cuando la apruebe, aquí estará todo.',
      motivo: 'Cuéntame para qué quieres entrar (opcional)',
      guardar: 'Guardar',
      guardado: 'Guardado.',
      salir: 'Salir'
    },
    rechazado: {
      titulo: 'Por ahora no puedo abrirte',
      linea: 'Escríbeme y lo hablamos.',
      salir: 'Salir'
    },
    apagado: {
      titulo: 'Pronto',
      linea: 'Estoy terminando de abrir este lugar. Mientras, escríbeme.'
    },
    problema: {
      titulo: 'No pude conectar',
      linea: 'Revisa tu internet e intenta otra vez.',
      reintentar: 'Intentar otra vez'
    },
    escribeme: {
      titulo: '¿Prefieres escribirme?'
    },
    sinJavascript: 'Para entrar hace falta JavaScript. Mientras, escríbeme.',

    /* ---- El panel (/portal/panel/) ---- */
    panel: {
      paginaTitulo: 'The Alef Code · Panel',
      cargando: 'Un momento…',
      saliendo: 'Saliendo…',
      salirFallo: 'No pude cerrar la sesión. Revisa tu internet e intenta otra vez.',
      saludo: 'Hola',
      menu: 'Secciones',
      /* El boton de los dos modos: su nombre no cambia (lo dice «pulsado» o no) */
      modos: {
        nombre: 'Developer-Mode',
        corto: { self: 'Self', dev: 'Dev' },
        ahoraSelf: 'Ahora estás en Self-Mode.',
        ahoraDev: 'Ahora estás en Developer-Mode.'
      },
      salir: 'Salir',
      sinJavascript: 'Para entrar hace falta JavaScript.',
      problema: 'No pude conectar. Revisa tu internet e intenta otra vez.',
      reintentar: 'Intentar otra vez',
      /* Los nombres de las dos casas los puso el fundador, en ingles y asi se quedan */
      grupos: {
        miembros: 'Tú',
        self: 'Self-Mode',
        dev: 'Developer-Mode',
        acceso: 'Acceso'
      },
      secciones: {
        inicio: { titulo: 'Inicio', linea: 'Esto es lo que puedes hacer aquí.' },
        hoy: { titulo: 'Álef', linea: 'Mi vida personal y profesional, en un solo lugar.' },
        diario: { titulo: 'Mi Día', linea: 'Lo que escribo para mí, cada día.' },
        tablero: { titulo: 'Tablero', linea: 'Cómo va cada parte de mi vida.' },
        proyectos: { titulo: 'Proyectos', linea: 'Lo que estoy construyendo.' },
        trabajos: { titulo: 'Trabajos', linea: 'Las empresas con las que he trabajado.' },
        libros: { titulo: 'Recursos', linea: 'Lo que subo a Recursos.' },
        camino: { titulo: 'Camino', linea: 'Las etapas de por dónde he caminado.' },
        marca: { titulo: 'Brand Assets', linea: 'Mis logos e íconos, listos para bajar.' },
        taller: { titulo: 'Taller', linea: 'Donde escribo mis libros.' },
        accesos: { titulo: 'Compartir', linea: 'Tú decides quién pasa.' },
        seguridad: { titulo: 'Configuración', linea: 'Un código de tu celular para entrar como admin.' }
      },
      /* La barra de abajo del telefono (como la de una app) y su boton «Más» */
      barra: 'Secciones principales',
      mas: 'Más',
      seccionNoCarga: 'Esta sección cambió. Recarga la página.',
      /* El Taller (panel/dev/Taller.js): escribir un libro como en Word y diseñar paginas como en Canva */
      taller: {
        sinBase: 'El Taller aún no está conectado. Pruébalo en modo demo.',
        tituloNuevo: 'Título de tu nuevo libro', crear: 'Crear', sinObras: 'Aún no hay libros. Escribe un título y empieza.',
        objPasaje: 'Pasaje bíblico', pasajeTexto: 'El pasaje', pasajeTextoAyuda: 'Un renglón por versículo, si quieres.',
        pasajeReferencia: 'Referencia', pasajeReferenciaAyuda: 'Juan 3:16', pasajeHebreo: 'Si lo escribes en hebreo, va de derecha a izquierda y con su propia letra.',
        icono: 'Icono', sinIcono: 'Sin icono', iconoPropio: 'Tu icono', iconoSubir: 'Subir tu SVG', iconoIzq: 'Izquierda', iconoDer: 'Derecha', iconoSolo: 'Solo icono', iconoAyuda: 'Tu SVG: dibújalo a 24 × 24, de un solo color. Toma el color del texto del botón.', svgGrande: 'Ese SVG pesa más de 20 KB. Simplifícalo y súbelo de nuevo.', svgNoSirve: 'Ese archivo no es un SVG que pueda leer.', svgVacio: 'Ese SVG no trae formas que pueda dibujar: usa trazos y figuras simples.', svgListo: 'Icono listo.', svgComplejo: 'Ese SVG tiene demasiadas formas (más de 64). Simplifícalo o únelas y súbelo de nuevo.', svgClases: 'Ese SVG pone sus colores con estilos por clase. Expórtalo con «atributos de presentación» y súbelo de nuevo.',
        iconosBoton: { copiar: 'Copiar', enlace: 'Enlace', descargar: 'Descargar', escuchar: 'Escuchar', video: 'Video', pagina: 'Ir a una página', libro: 'Libro', volver: 'Volver', flecha: 'Flecha', quiz: 'Quiz' },
        capitalYCitas: 'Capital y citas', capitalEstilo: 'Estilo', capitalHundida: 'Hundida', capitalElevada: 'Elevada', capitalSencilla: 'Sencilla', capitalAuto: 'Auto', capitalSeparaAyuda: 'Vacío: crece con la letra', fuenteCapital: 'Letra de la capital', fuenteCitas: 'Letra de las citas', capitalLineas: 'Alto (en renglones)', capitalSepara: 'Espacio a su lado (mm)',
        citas: 'Citas', citaTamano: 'Tamaño (%)', citaSangria: 'Margen a los lados (mm)', citaCursiva: 'En cursiva',
        borrarLibro: 'Borrar «{titulo}»', borrarPregunta: '¿Borrar «{titulo}»?', borrarMidiendo: 'Midiendo cuánto ocupa…',
        borrarCuanto: 'Se borran sus capítulos, sus copias guardadas y {n} archivos ({peso}). No se puede deshacer.',
        borrarSinArchivos: 'Se borran sus capítulos y sus copias guardadas. No tiene imágenes ni PDF. No se puede deshacer.',
        borrarNoMide: 'No pude medir sus archivos. Revisa tu conexión antes de borrar.',
        borrarCopia: 'Bajar una copia antes', borrarBajando: 'Bajando la copia…', borrarCopiaLista: 'Copia bajada. Está en tus descargas.',
        borrarEscribe: 'Para confirmar, escribe el título del libro', borrarSi: 'Borrar para siempre', borrando: 'Borrando…',
        libroBorrado: 'Libro borrado. Liberaste {peso}.', libroBorradoQuedan: 'Libro borrado, pero {n} archivos no se pudieron quitar. Solo ocupan espacio.',
        volver: 'Libros', tituloObra: 'Título del libro', sacarPdf: 'Hacer el PDF', tituloVentana: 'Taller de libros', verLibro: 'Ver como libro', volverEscribir: 'Volver a escribir',
        deshacer: 'Deshacer', rehacer: 'Rehacer', anterior: 'Página anterior', siguiente: 'Página siguiente', pliegoDos: 'Páginas {a} y {b} de {total}',
        celular: 'Aquí solo puedes leer. Para escribir, usa un computador.',
        conflicto: 'Otra pestaña cambió este capítulo. ¿Con cuál te quedas? Ninguno se pierde.',
        traerOtro: 'Traer el de la otra pestaña', quedarme: 'Quedarme con este',
        inicio: 'Inicio', insertarTab: 'Insertar', pagina: 'Página', copias: 'Copias', capitulo: 'Capítulo',
        idioma: 'Idioma', tamano: 'Hoja', tamanoOtro: 'A mi medida', anchoMm: 'Ancho (mm)', altoMm: 'Alto (mm)',
        lados: { sup: 'Arriba', inf: 'Abajo', izq: 'Izquierda', der: 'Derecha' },
        fuenteCuerpo: 'Letra del libro', tamanoLetra: 'Tamaño (pt)', interlinea: 'Espacio entre renglones', numeros: 'Números de página',
        lugarNumero: 'Dónde va el número', lugares: { centro: 'Abajo, al centro', exterior: 'Abajo, hacia afuera', interior: 'Abajo, hacia adentro' }, indice: 'Índice al comienzo', indiceTitulo: 'Contenido',
        guardarVersion: 'Guardar una copia', verCopias: 'Ver copias', conArchivos: 'Incluir imágenes y PDF', bajarLibro: 'Bajar todo el libro',
        sinImportar: 'Es tu copia de seguridad. Volver a subirla aún no se puede.', versionHecha: 'Copia guardada.', restaurar: 'Volver a esta', confirmarRestaurar: 'Pulsa otra vez', restaurado: 'Volviste a esa copia.',
        motivos: { auto: 'Automática', manual: 'Tuya', reemplazar: 'Antes de reemplazar', restaurar: 'Antes de volver atrás', conflicto: 'Antes de resolver' },
        barra: 'Herramientas', nivel: 'Tipo de texto', niveles: { p: 'Texto', t1: 'Título', t2: 'Subtítulo', t3: 'Título pequeño' },
        fuente: 'Letra', fuenteDelLibro: 'Letra del libro', color: 'Color', negrita: 'Negrita', cursiva: 'Cursiva', subrayado: 'Subrayado', tachado: 'Tachado',
        alinear: { izquierda: 'A la izquierda', centro: 'Centrar', derecha: 'A la derecha', justificado: 'Justificar' },
        formula: 'Fórmula', formulaAyuda: 'Escribe / para una fracción. Escribe ^ para un exponente. Enter guarda. Escape cancela.', cancelar: 'Cancelar', capital: 'Capital', capitalAyuda: 'Letra grande al comenzar', llaveAyuda: 'Un espacio para llenar después', lista: 'Lista con puntos', listaNum: 'Lista con números', cita: 'Cita', separador: 'Línea',
        exponente: 'Exponente', subindice: 'Subíndice', imagen: 'Imagen', pdf: 'PDF',
        columnas: 'Columnas', columnasAyuda: 'Un número por columna. «1 2 1» son tres columnas. La del medio es el doble.', insertarColumnas: 'Insertar',
        simbolos: 'Símbolos', insertar: 'Insertar', enlace: 'Enlace', enlaceAyuda: 'La dirección, con https://', ponerEnlace: 'Poner', otraFuente: 'Otra letra',
        otraFuenteAyuda: 'El nombre exacto en Google Fonts', usarFuente: 'Usar esta letra', etiquetaEditor: 'El texto del capítulo',
        llavesEnPdf: 'Estas llaves saldrán tal cual en el PDF: {llaves}.', imagenesSinAlt: 'A {n} imágenes les falta decir qué muestran.', preparandoPdf: 'Preparando el PDF…',
        estados: { sucio: 'Sin guardar…', guardando: 'Guardando…', guardado: 'Guardado', red: 'Sin conexión. Lo volveré a intentar.', conflicto: 'Guardado detenido', permiso: 'Sin permiso', lleno: 'No cabe' },
        tituloVista: 'El libro listo para imprimir', paginasDelLibro: 'Páginas del libro', opciones: 'Opciones de lo elegido', palabras: 'palabras', pagDe: 'Pág. {n} de {total}', pagina2: 'Página',
        arrastrarCapitulo: 'Arrástralo para mover el capítulo', arrastrarPagina: 'Arrástrala para cambiarla de lugar',
        verZonaSegura: 'Zona segura', zonaSegura: 'Zona segura', pasaMargen: 'Algo pasa el margen', llegaAlBorde: 'Llega al borde de la hoja',
        alejar: 'Alejar', acercar: 'Acercar', ajustarZoom: 'Ver la hoja entera',
        leyendo: 'Leyendo página {n} de {total}…', pdfListo: 'PDF listo.', paginaLibre: 'Página libre', paginaPdf: 'Página de PDF', paginaBorrada: 'Página eliminada. Ctrl+Z la recupera.', paginaMovida: 'Listo, cambió de lugar.', capituloMovido: 'Capítulo movido.',
        menuPagina: 'Opciones de la página', irAPagina: 'Ir a esta página', libreAqui: 'Insertar página libre aquí', moverA: 'Mover a…', moverAPagina: 'Mover a la página (de {total})', mover: 'Mover', alInicio: 'Al inicio', alFinal: 'Al final', paginaQuedo: 'La página quedó en la {n}.', paginaDuplicada: 'Página duplicada.', moverEspera: 'Espera: aún estoy moviendo otra.', anchoPx: 'Ancho (px)', altoPx: 'Alto (px)', pxAyuda: 'A 300 ppp, la medida para Figma', pdfProporcion: 'Este PDF tiene otra proporción que el libro. ¿Qué hago?', pdfEstiraImagenes: 'Ajustar el libro estira las {n} imágenes que ya pusiste.', pdfAjustarLibro: 'Ajustar el libro a este PDF', pdfLibroAyuda: 'Cambia el ancho de todas las hojas del libro', imagenNoLlego: 'Esta imagen no llegó. Reintentar', paginaProtegida: 'Esa selección lleva páginas: no borré nada. Para borrar una, usa clic derecho.', deshacerPagina: 'Deshacer quitó una página. Ctrl+Y la recupera.', pdfQuedo: 'El PDF quedó desde la página {n}.', posicion: 'Posición y tamaño', agregar: 'Agregar', estaPagina: 'Esta página', agregarBoton: 'Agregar botón', colorAuto: 'Automático', colorRecientes: 'Usados en este libro', colorCodigo: 'Código', colorUsar: 'Usar', colorLetra: 'Color de la letra', colorHoja: 'Color de esta hoja', colorLibro: 'Hojas del libro', colorCapitulo: 'Este capítulo', colorFondoBoton: 'Color del botón', colorPocoVisible: 'Hay {n} textos que casi no se ven sobre su hoja.', pdfSinColor: 'Un PDF traído conserva su diseño. Lo que no cubre toma el color de las hojas.', imprenta: 'PDF para imprenta', imprentaAyuda: 'Agrega 3 mm de color en cada borde, para el corte.', imprentaSangre: 'Tus páginas de PDF no cubren esos 3 mm: su arte llega solo hasta el corte.', objBoton: 'Botón', botonNuevo: 'Botón', botonTexto: 'Qué dice', botonEnlace: 'Abrir enlace', botonCopiar: 'Copiar texto', botonLink: 'Enlace', botonLinkMal: 'Ese enlace no sirve. Debe empezar con https://', botonPrompt: 'Texto que se copia', botonProbar: 'Probar', botonCopiado: 'Copiado.', botonNoCopio: 'No pude copiar.', botonPdfCopiar: 'En el PDF no copia: solo se ve. En la web sí copiará.', objImagen: 'Imagen', objCuadro: 'Cuadro de texto', objZona: 'Zona para quiz', objImagenTexto: 'Imagen en el texto', escribeAqui: 'Escribe aquí', zonaNueva: 'Aquí vivirá un quiz',
        recorteAyuda: 'Mueve los bordes blancos. Arrastra dentro para acomodar la imagen. Lo de afuera no se borra.', listo: 'Listo', quitarRecorte: 'Quitar recorte', recortar: 'Recortar',
        ancho: 'Ancho (mm)', alto: 'Alto (mm)', anchoPct: 'Ancho (%)', giro: 'Giro (°)', letraPt: 'Letra (pt)', nombreZona: 'Nombre', alt: 'Qué muestra', pie: 'Pie de imagen', adorno: 'Solo adorna',
        adelante: 'Traer adelante', atras: 'Enviar atrás', duplicar: 'Duplicar', eliminar: 'Eliminar', altPagina: 'Qué muestra esta página', ajuste: 'Si no encaja', ajusteContener: 'Mostrar todo', ajusteCubrir: 'Llenar la hoja',
        agregarImagen: 'Agregar imagen', agregarCuadro: 'Agregar cuadro de texto', agregarZona: 'Agregar zona', duplicarPagina: 'Duplicar página', eliminarPagina: 'Eliminar página',
        imagenTextoAyuda: 'Va con su párrafo. Para moverla donde quieras, pásala a una página libre.', subirPagina: 'Subir página', bajarPagina: 'Bajar página', eliminarPaginaSeguro: 'Pulsa otra vez para eliminar',
        elegidas: '{n} páginas elegidas', elegidaUna: '1 página elegida.', eleccionVacia: 'Ninguna página elegida.', soloUnCapitulo: 'Se eligen páginas de un solo capítulo.', soloLibres: 'Solo se eligen páginas libres y de PDF.', duplicarVarias: 'Duplicar {n} páginas', eliminarVarias: 'Eliminar {n} páginas', eliminarVariasSeguro: 'Pulsa otra vez para eliminar {n} páginas', variasBorradas: '{n} páginas eliminadas. Ctrl+Z las recupera.', variasDuplicadas: '{n} páginas duplicadas. Las copias quedaron elegidas.', quitarEleccion: 'Quitar selección', moverVarias: 'Mover {n} páginas a…', moverVariasA: 'Que empiecen en la página (de {total})', subirVarias: 'Subir las páginas elegidas', bajarVarias: 'Bajar las páginas elegidas', bloqueSoloCapitulo: 'Varias páginas se mueven dentro de su capítulo. Para llevarlas a otro, muévelas de una en una.', bloqueYaAhi: 'Ya están ahí.', bloqueQuedo: 'Las {n} páginas quedaron desde la {p}.', colorVarias: 'Color de estas hojas', colorDeLasHojas: 'Color de las {n} hojas', colorDeLaHoja: 'Color de la hoja', ajusteDeLasPdf: 'Las {n} de PDF', ajusteDeLaPdf: 'La de PDF', pdfNoCambian: 'Las {n} de PDF no cambian de color: lo que no cubren toma el de las hojas del libro.', pdfNoCambiaUna: 'La de PDF no cambia de color: lo que no cubre toma el de las hojas del libro.', variasAyuda: 'Mayús+clic elige las de en medio; Ctrl+clic suma o quita una.', variasQuietas: 'Este capítulo ahora solo se puede mirar.', suprVarias: 'Pulsa Supr otra vez para eliminar {n} páginas.', suprUna: 'Pulsa Supr otra vez para eliminar la página.', ayudaMiniaturas: 'Clic elige una página. Mayús y clic, las de en medio. Control y clic, una más. Supr las elimina.', paginaDeTexto: 'Esta página sale del texto. Mueve su capítulo.', fueraDeZona: 'Algo se sale de la zona segura.', recorteLados: { l: 'Izquierda (%)', t: 'Arriba (%)', r: 'Derecha (%)', b: 'Abajo (%)' }, enLinea: 'En línea', aIzquierda: 'Izquierda', aDerecha: 'Derecha', pasarLibre: 'Pasar a página libre'
      },
      /* Brand Assets (panel/dev/Marca.js): elegir una pieza, su color, su fondo y su tamaño, y bajarla */
      marca: {
        pista: 'Imágenes: elige una pieza, verás cómo queda y la bajas en SVG o en PNG.',
        pistaDinamicos: 'Videos MP4: elige una animación, ajusta cómo la quieres y se hace aquí mismo.',
        grupo: 'Qué quieres bajar',
        grupos: { estaticos: 'Estáticos', dinamicos: 'Dinámicos' },
        animaciones: 'Animaciones',
        animacionesLinea: 'Con sonido, si quieres.',
        /* Las animaciones en video (panel/dev/MarcaVideo.js; las opciones, en data/portal/animaciones.js) */
        video: {
          vista: 'Así se ve un cuadro de la animación.',
          vistaAlt: 'Un cuadro de la animación',
          pantalla: 'Forma de la pantalla',
          formatos: { horizontal: 'Horizontal (16:9)', vertical: 'Vertical (9:16)', cuadrado: 'Cuadrado (1:1)' },
          calidad: 'Calidad',
          calidades: { '720': '720p', '1080': '1080p (Full HD)', '2160': '4K (la más pesada: tarda y pide un computador potente)' },
          noPuede: 'No disponible en este navegador',
          avance: 'Avance del video',
          cancelando: 'Cancelando…',
          duracion: 'Cuánto dura',
          duraciones: '{n} segundos',
          sonido: 'Con sonido',
          sonidoNo: 'Este navegador no puede ponerle sonido al video.',
          peso: 'Pesará unos {mb} MB.',
          hacer: 'Hacer el video',
          cancelar: 'Cancelar',
          mantener: 'Deja esta pestaña abierta mientras se hace.',
          progreso: { video: 'Dibujando el cuadro {hecho} de {total}…', sonido: 'Fabricando el sonido…', archivo: 'Armando el archivo…' },
          listo: 'Listo: se bajó {archivo} ({mb} MB).',
          cancelado: 'Cancelado. No se bajó nada.',
          sinSoporte: 'Este navegador no puede hacer videos. Prueba con Chrome o Edge en un computador.',
          errores: {
            video: 'No pude hacer el video. Prueba con una calidad más baja.',
            lienzo: 'No pude preparar el dibujo. Prueba con una calidad más baja.',
            atascado: 'El video se quedó atascado y lo paré. Prueba con una calidad más baja.'
          }
        },
        volver: 'Elegir otra pieza',
        piezas: 'piezas',
        color: 'Color',
        colorFijo: 'Esta pieza tiene varios colores y sale como está dibujada.',
        original: 'Como está dibujada',
        otro: 'Otro color',
        otroEtiqueta: 'Color (#RRGGBB)',
        otroAyuda: 'Seis letras o números, por ejemplo #00FF66.',
        tonos: { verde: 'Verde', blanco: 'Blanco', hueso: 'Hueso', pino: 'Pino', negro: 'Negro', rojo: 'Rojo', amarillo: 'Amarillo', iris: 'Iris' },
        fondo: 'Fondo',
        fondos: { transparente: 'Sin fondo', noche: 'Noche', hueso: 'Hueso', blanco: 'Blanco', negro: 'Negro' },
        espacio: 'Espacio alrededor',
        espacios: { ninguno: 'Sin espacio', poco: 'Un poco', mucho: 'Mucho', muchisimo: 'Muchísimo' },
        espacioAyuda: 'Con «Muchísimo» el dibujo queda pequeño en el centro: sirve para logos que se ven cortados.',
        formato: 'Formato',
        formatos: { svg: 'SVG (vectorial, escala sin perder nada)', png: 'PNG (imagen)' },
        tamano: 'Tamaño del lado más largo (solo para PNG)',
        preparando: 'Preparando {archivo}…',
        tamanoPx: '{n} px',
        bajar: 'Bajar',
        listo: 'Listo: se bajó {archivo}.',
        vista: 'Así queda',
        sinFondo: 'Sin fondo: lo que ves detrás es solo para que se lea.',
        errores: {
          archivo: 'No pude abrir esta pieza. Revisa tu internet e intenta otra vez.',
          imagen: 'No pude dibujar esta pieza.',
          color: 'Escribe el color con seis letras o números, como #00FF66.',
          bajar: 'No pude preparar el archivo. Prueba con un tamaño más chico.',
          video: 'No pude abrir las animaciones. Revisa tu internet e intenta otra vez.'
        }
      },
      /* Recursos: antes de subir algo, se elige que (libros hoy; videos y escritos, luego) */
      recursos: {
        pregunta: '¿Qué vas a subir?',
        volver: 'Elegir otra cosa',
        pronto: 'Pronto',
        tipos: {
          libro: { titulo: 'Libro', linea: 'Un PDF con su lomo y su portada.' },
          video: { titulo: 'Video', linea: 'Públicos o solo para miembros.' },
          escrito: { titulo: 'Escrito', linea: 'Una entrada para el blog.' }
        }
      },
      /* Developer-Mode: los editores de Libros y de Sobre el camino (panel/dev/*.js) */
      dev: {
        actualizar: {
          titulo: 'Actualizar la web',
          linea: 'Lo publicado sale en la web cuando la vuelves a armar. Se abre GitHub: pulsa «Run workflow» y en unos minutos está.',
          boton: 'Actualizar la web'
        },
        /* Lo que dice cada fila de la lista (contenido/Repositorio.js → Entrada.estado) */
        estados: { borrador: 'Borrador', publicado: 'Publicado', cambios: 'Publicado · con cambios', fuera: 'Fuera de la web' },
        editar: 'Editar',
        cerrar: 'Cerrar',
        cerrarSeguro: 'Cerrar sin guardar',
        cerrarVoz: 'Hay cambios sin guardar. Pulsa otra vez para cerrar sin guardarlos.',
        guardar: 'Guardar borrador',
        anterior: 'Anterior',
        siguiente: 'Siguiente',
        publicar: 'Publicar',
        publicarCambios: 'Publicar los cambios',
        despublicar: 'Quitar de la web',
        descartar: 'Descartar los cambios',
        descartarSeguro: 'Pulsa otra vez para descartar',
        borrar: 'Borrar',
        borrarSeguro: 'Pulsa otra vez para borrar',
        guardado: 'Borrador guardado. La web no cambia hasta que lo publiques.',
        guardadoCambios: 'Borrador guardado. La web sigue con lo publicado hasta que vuelvas a publicar.',
        publicado: 'Publicado. Para verlo en la web, actualízala.',
        despublicado: 'Ya no está publicado. Al actualizar la web, se quita.',
        descartado: 'Cambios descartados. Queda lo publicado.',
        borrado: 'Borrado.',
        /* Los formularios van por pasos (data/portal/etapas.js); el ultimo es «Revisar» */
        pasos: 'Pasos',
        pasoDe: 'Paso {n} de {total}: ',
        conError: 'tiene algo que revisar',
        etapas: {
          basico: 'Lo básico', pdf: 'El PDF', lomo: 'El lomo', idiomas: 'Idiomas', revisar: 'Revisar',
          etapa: 'La etapa', imagenes: 'Imágenes', hice: 'Lo que hice', pagina: 'Su página'
        },
        revisar: {
          ahora: 'Ahora: {estado}.',
          todoListo: 'Todo listo para publicar.',
          faltaAlgo: 'Para publicar, completa lo marcado.',
          listo: 'Listo.',
          falta: 'Falta: {campos}.',
          mal: 'Revisa: {campos}.',
          cambiar: 'Cambiar'
        },
        revisa: 'Revisa lo marcado.',
        revisaN: 'Revisa lo marcado: {n} campos.',
        enOtroIdioma: '{idioma}, bloque {n}: {texto}',
        subiendo: 'Subiendo los archivos…',
        idioma: 'Idioma en que está escrito',
        nombreCorto: 'Nombre corto',
        nombreCortoAyuda: 'Va en la dirección. Minúsculas y sin espacios. No cambia después.',
        ningunArchivo: 'Ningún archivo elegido',
        etiquetas: 'Etiquetas',
        etiquetasAyuda: 'Las que quieras, separadas por comas.',
        otraVersion: 'Otra versión',
        quitarVersion: 'Quitar esta versión',
        versionIdioma: 'Idioma',
        traducidaIA: 'Esta traducción la hizo una IA',
        ia: {
          titulo: 'Lo que hizo la IA',
          linea: 'Quien lo lea lo verá debajo. Si no usaste IA, déjalo vacío.',
          nota: 'Una frase tuya (opcional)',
          partes: {
            texto: 'El texto', portada: 'La portada', lomo: 'El lomo', imagenes: 'Las imágenes',
            video: 'El video', voz: 'La voz', musica: 'La música', codigo: 'El código'
          }
        },
        libros: {
          nuevo: 'Nuevo libro',
          tituloNuevo: 'Nuevo libro',
          tituloEditar: 'Editar libro',
          vacio: 'Todavía no hay libros del panel. Los de siempre siguen en la web.',
          titulo: 'Título',
          subtitulo: 'Subtítulo (opcional)',
          tema: 'Tema',
          tipo: 'Tipo',
          tipos: { 'tapa-dura': 'Tapa dura', revista: 'Revista', comic: 'Cómic' },
          tipoAyuda: 'La portada es la primera página del PDF. Cada página, de este tamaño:',
          pdf: 'El PDF',
          elegirPdf: 'Elegir el PDF',
          elegirLomo: 'Elegir el PNG',
          pdfAyuda: 'Hasta 50 MB.',
          pdfYa: 'Ya tiene PDF. Elige otro solo si quieres cambiarlo.',
          grosor: 'Grosor del lomo',
          grosores: { auto: 'Automático', fino: 'Fino', medio: 'Medio', grueso: 'Grueso' },
          grosorAuto: 'Sale de las páginas del PDF.',
          lomo: 'Lomo dibujado (opcional)',
          lomoAyuda: 'PNG, lleno de borde a borde: sin sombra, marco ni transparencia. Si no subes uno, se dibuja solo.',
          lomoMide: 'Mide {w} × {h} px. Está bien.',
          lomoMal: 'Mide {w} × {h} px. Un lomo {grosor} mide {ew} × {eh} px (o el doble).',
          lomoMalAuto: 'Mide {w} × {h} px. Un lomo mide 240, 300 o 375 × 1200 px (fino, medio o grueso; o el doble).',
          lomoPequeno: 'Mide {w} × {h} px: muy pequeño, se vería borroso. Mínimo 600 px de alto.',
          lomoIlegible: 'No pude leer su tamaño. ¿Es un PNG?',
          lomoYa: 'Ya tiene lomo. Elige otro solo si quieres cambiarlo.',
          tono: 'Color del lomo dibujado',
          tonoAuto: 'Automático',
          tonos: { ocre: 'Ocre', salvia: 'Salvia', pizarra: 'Pizarra', tierra: 'Tierra', niebla: 'Niebla', arena: 'Arena' }
        },
        camino: {
          nuevo: 'Nueva etapa',
          tituloNuevo: 'Nueva etapa',
          tituloEditar: 'Editar etapa',
          vacio: 'Todavía no hay etapas del panel. Las de siempre siguen en la web.',
          cuando: 'Año',
          cuandoAyuda: 'Cuatro cifras. Se pone en su año, antes de «Hoy».',
          titulo: 'Título',
          tituloAyuda: 'Lo que pasó, no dónde.',
          texto: 'Texto',
          textoAyuda: 'Una o dos frases, para un niño que acaba de aprender a leer.'
        },
        /* Trabajos y Proyectos: los mismos campos que una tarjeta de la web, y su pagina */
        casas: {
          trabajos: { nuevo: 'Nueva empresa', tituloNuevo: 'Nueva empresa', tituloEditar: 'Editar empresa', vacio: 'Todavía no hay empresas del panel. Las de siempre siguen en la web.' },
          proyectos: { nuevo: 'Nuevo proyecto', tituloNuevo: 'Nuevo proyecto', tituloEditar: 'Editar proyecto', vacio: 'Todavía no hay proyectos del panel. Los de siempre siguen en la web.' },
          nombre: 'Nombre',
          nombreAyuda: 'El de la marca: no se traduce.',
          que: 'Qué es, en una línea',
          descripcion: 'Descripción de la tarjeta',
          descripcionAyuda: 'Dos renglones, más o menos del largo de las demás.',
          logo: 'Logo',
          logoAyuda: 'PNG o WebP, claro sobre transparente: pasa por la cinta oscura.',
          elegirLogo: 'Elegir el logo',
          logoMide: 'Mide {w} × {h} px.',
          avatar: 'Logo para el círculo (opcional)',
          avatarAyuda: '512 px el lado largo, transparente y recortado al dibujo. Si no, se usa el logo.',
          elegirAvatar: 'Elegir la imagen',
          cabecera: 'Foto de cabecera (opcional)',
          cabeceraAyuda: '1600 × 420 px. Lo importante, en los 300 px del centro.',
          elegirCabecera: 'Elegir la foto',
          mide: 'Mide {w} × {h} px. Está bien.',
          mideMal: 'Mide {w} × {h} px. Tiene que ser {ew} × {eh} px (o el doble).',
          mideChica: 'Mide {w} × {h} px: muy pequeña, se vería borrosa.',
          ilegible: 'No pude leer su tamaño.',
          yaTiene: 'Ya tiene uno. Elige otro solo si quieres cambiarlo.',
          trabajos2: 'Lo que hice con ellos',
          trabajo: 'Un trabajo',
          trabajoTitulo: 'Qué fue',
          trabajoAno: 'Año',
          trabajoEnlace: 'Enlace (opcional)',
          otroTrabajo: 'Añadir un trabajo',
          quitarTrabajo: 'Quitar este trabajo',
          pagina: 'Su página',
          paginaLinea: 'Lo que se lee al entrar a su página, debajo de la descripción. Bloques como en Notion.',
          paginaIdioma: 'Escribiendo la página en'
        },
        /* El editor de bloques (panel/dev/EditorBloques.js) */
        bloques: {
          anadir: 'Añadir un bloque',
          anadirAqui: 'Elige el bloque',
          vacio: 'La página está vacía. Añade un bloque, o escribe / en un párrafo.',
          subir: 'Subir',
          bajar: 'Bajar',
          quitar: 'Quitar',
          negrita: 'Negrita',
          cursiva: 'Cursiva',
          enlace: 'Enlace',
          enlacePon: 'Poner el enlace',
          enlaceQuita: 'Quitar el enlace',
          enlaceCampo: 'https://, mailto: o /es/…',
          enlaceMalo: 'Ese enlace no vale.',
          tipos: {
            parrafo: { nombre: 'Párrafo', linea: 'Texto corrido.' },
            titulo: { nombre: 'Título', linea: 'Para partir la página en partes.' },
            subtitulo: { nombre: 'Subtítulo', linea: 'Un título más pequeño.' },
            lista: { nombre: 'Lista', linea: 'Una cosa por línea.' },
            cita: { nombre: 'Cita', linea: 'Una frase de alguien.' },
            imagen: { nombre: 'Imagen', linea: 'Una foto, con su texto para quien no ve.' },
            video: { nombre: 'Video de YouTube', linea: 'Pega su enlace.' },
            columnas: { nombre: 'Columnas', linea: 'Dos o tres, una al lado de la otra.' },
            boton: { nombre: 'Botón', linea: 'Lleva a otra página.' },
            separador: { nombre: 'Separador', linea: 'Una raya.' }
          },
          escribe: 'Escribe aquí…',
          escribeBarra: 'Escribe, o / para elegir otro bloque',
          movido: '{bloque}: {n} de {total}.',
          arriba: 'Ya está arriba del todo.',
          abajo: 'Ya está abajo del todo.',
          quitado: 'Bloque quitado.',
          listaAyuda: 'Una cosa por línea.',
          conNumeros: 'Con números',
          citaAutor: 'De quién es (opcional)',
          imagenElegir: 'Elegir la imagen',
          imagenAlt: 'Qué se ve (para quien no ve)',
          imagenDecorativa: 'Es solo de adorno',
          imagenPie: 'Pie de foto (opcional)',
          hechaIA: 'Hecha con IA',
          videoEnlace: 'Enlace de YouTube',
          videoTitulo: 'De qué es el video',
          videoMalo: 'No encuentro el video en ese enlace.',
          columnas: 'Cuántas columnas',
          columna: 'Columna {n}',
          botonTexto: 'Qué dice',
          botonEnlace: 'A dónde lleva',
          botonEstilo: 'Cómo se ve',
          botonLleno: 'Lleno',
          botonSuave: 'Solo el borde'
        },
        /* Lo que se dice cuando algo no pasa sus reglas (clave → texto) */
        errores: {
          falta: 'Falta esto.',
          formato: 'Así no vale. Mira la ayuda.',
          reservado: 'Ese nombre ya lo usa la web. Elige otro.',
          noExiste: 'Elige uno de la lista.',
          ruta: 'Este archivo no vale.',
          ajeno: 'Este archivo es de otra cosa.',
          enlace: 'Ese enlace no vale: usa https://, mailto: o una página de la web.',
          original: 'El idioma en que está escrito no es una traducción.',
          grande: 'Es demasiado largo para guardarlo.',
          sinMedidas: 'Faltan sus medidas.',
          tituloLargo: 'Es largo: en el lomo dibujado puede quedar cortado.',
          pocas: 'Hacen falta al menos dos columnas.',
          repetido: 'Ya hay uno con ese nombre corto. Elige otro (si no, se borraría el que ya existe).',
          idiomaRepetido: 'Ese idioma ya está. Elige otro.',
          descartados: 'Algunos bloques no se entendían y se quitaron.',
          textoLargo: 'Es largo para una etapa: mejor una o dos frases.'
        }
      },
      /* El Tablero de Fraterni (Self-Mode; panel/Tablero.js). Una vez por semana: ¿cargué mi cruz? */
      tablero: {
        anterior: 'Semana anterior',
        siguiente: 'Semana siguiente',
        estaSemana: 'Esta semana',
        semanaDel: 'Semana del {fecha}',
        ruedaAlt: 'La rueda de la vida de Fraterni: cuatro ejes, doce áreas y sesenta dominios',
        ayudaRueda: 'Elige un dominio. Con las flechas te mueves de uno en uno.',
        lista: 'O elígelo de la lista',
        listaVacia: 'Elegir un dominio…',
        sinElegir: 'Elige un dominio en la rueda.',
        estados: { cargue: 'Cargué mi cruz', noCargue: 'No cargué mi cruz', sin: 'Sin revisar' },
        resumen: '{c} con la cruz cargada · {n} sin cargarla · {s} por revisar',
        ficha: {
          mide: 'Mide:',
          pregunta: '¿Cargaste tu cruz en esto esta semana?',
          cargue: 'Cargué mi cruz',
          noCargue: 'No cargué mi cruz',
          sin: 'Sin revisar',
          nota: '¿Qué moviste?',
          notaAyuda: 'Lo que hiciste o lo que no, y qué aprendiste. Hasta 500 letras.',
          guardar: 'Guardar',
          guardado: 'Guardado.',
          cerrar: 'Cerrar',
          historial: 'Las últimas semanas',
          historialVacio: 'Todavía no hay semanas anteriores.',
          historialCargando: 'Buscando las semanas…',
          semana: 'Semana del {fecha}',
          sinNota: 'Sin nota.',
          donde: '{eje} · {area}'
        },
        dios: {
          titulo: 'Dios, en el centro de todo',
          linea: 'Él es amor. Sostiene los cuatro ejes, las doce áreas y los sesenta dominios: por eso la cruz está en medio.'
        },
        piedras: {
          titulo: 'La piedra angular de cada eje',
          linea: 'Es el área que hoy sostiene al eje, y cambia con la etapa y con la persona: en el Lazo puede ser Lo Íntimo o La Raíz (tu pareja o tus padres). Se elige, no se escribe.',
          cargando: 'Buscando…',
          ninguna: 'Sin elegir todavía',
          desde: 'Desde el {fecha}',
          anteriores: 'Las de antes',
          campo: 'Piedra angular de {eje}',
          elegir: 'Elegir un área…',
          cambiar: 'Cambiar',
          cambiada: 'Listo: ahora la piedra angular de este eje es «{piedra}».',
          marca: 'Piedra angular'
        },
        principios: { titulo: 'Los cuatro principios', linea: 'No son casillas: pasan por las sesenta.' },
        permanentes: { titulo: 'Los tres permanentes', linea: 'Tampoco son casillas. El Amor es el filtro final sobre todo el tablero.' },
        errores: {
          cargar: 'No pude traer esta semana. Revisa tu internet e intenta otra vez.',
          guardar: 'No se guardó. Lo que escribiste sigue aquí: intenta otra vez.',
          piedra: 'No pude cambiar la piedra. Intenta otra vez.'
        }
      },
      pronto: 'Pronto. Esta sección ya existe y está lista para llenarse.',
      prontoCorto: 'pronto',
      privado: 'Nadie más lo ve: solo se abre con tu cuenta.',
      /* La pantalla que pide el codigo de la app antes de abrir el panel del admin */
      codigo: {
        titulo: 'Escribe tu código',
        linea: 'Abre tu app de códigos y escribe los 6 números de The Alef Code.',
        campo: 'Código',
        boton: 'Entrar',
        salir: 'Salir'
      },
      /* La seccion «Seguridad» (solo el admin) */
      seguridad: {
        activo: 'Tu cuenta pide el código al entrar.',
        inactivo: 'Tu cuenta todavía no pide código. Añade tu celular y, mejor, un segundo dispositivo de respaldo.',
        dispositivos: 'Dispositivos',
        agregado: 'Añadido el',
        unico: 'Es tu único dispositivo: para quitarlo, primero añade otro.',
        quitar: 'Quitar',
        agregar: 'Añadir un dispositivo',
        pasoQr: 'Escanea este código con tu app (Google Authenticator, Authy o la de tu gestor de contraseñas).',
        pasoClave: 'Si no puedes escanear, escribe esta clave en la app:',
        copiar: 'Copiar la clave',
        copiada: 'Clave copiada.',
        qr: 'Código QR para tu app',
        campo: 'Los 6 números que muestra la app',
        confirmar: 'Confirmar',
        cancelar: 'Cancelar',
        listo: 'Listo. Este dispositivo ya sirve para entrar.',
        quitado: 'Quitado.',
        sesiones: 'Si tu cuenta quedó abierta en otro navegador, ciérrala desde aquí.',
        cerrarOtras: 'Cerrar mis otras sesiones',
        otrasCerradas: 'Listo. Solo queda abierta esta.'
      },
      inicio: {
        primerPaso: { titulo: 'Dar el primer paso', linea: 'Cuéntame dónde estás.' },
        cuadremos: { titulo: 'Cuadremos un rato', linea: 'Una conversación, sin afán.' }
      },
      accesos: {
        pendientes: 'Esperando',
        aprobados: 'Con acceso',
        rechazados: 'Sin acceso',
        invitar: 'Invitar',
        invitarLinea: 'Escribe su correo. Cuando entre con Google con ese correo, queda aprobado solo.',
        invitarCorreo: 'Correo',
        invitarBoton: 'Invitar',
        invitaciones: 'Invitaciones',
        hayMas: 'Hay más. Aquí se ven 100.',
        nadiePendientes: 'Nadie esperando.',
        nadieAprobados: 'Nadie todavía.',
        nadieRechazados: 'Nadie.',
        nadieInvitaciones: 'Ninguna.',
        aprobar: 'Aprobar',
        rechazar: 'Rechazar',
        quitar: 'Quitar acceso',
        quitarInvitacion: 'Quitar',
        sinMotivo: 'No dejó motivo.',
        sinNombre: 'Sin nombre',
        tu: 'Eres tú',
        pedido: 'Pidió',
        usada: 'Usada',
        caducada: 'Caducada',
        esperando: 'Esperando',
        hasta: 'hasta',
        listoAprobado: 'Aprobado.',
        listoRechazado: 'Rechazado.',
        listoInvitado: 'Invitación lista.',
        listoQuitado: 'Quitada.',
        cargando: 'Un momento…'
      }
    },
    errores: {
      credenciales: 'El correo o la contraseña no coinciden.',
      correoInvalido: 'Escribe un correo que funcione.',
      claveCorta: 'La contraseña necesita al menos 10 letras o números.',
      claveLarga: 'Esa contraseña es muy larga (máximo 72).',
      nombreVacio: 'Escribe tu nombre.',
      demasiados: 'Demasiados intentos. Espera un momento.',
      red: 'No pude conectar. Intenta otra vez.',
      claveDebil: 'Esa contraseña es muy fácil. Prueba otra.',
      claveIgual: 'Esa ya es tu contraseña. Elige otra.',
      sinConfirmar: 'Si tu correo ya está aquí, revisa si te llegó el enlace para confirmarlo.',
      google: 'No pude entrar con Google. Intenta otra vez.',
      enlaceCaducado: 'Ese enlace no sirve aquí. Pide uno nuevo y ábrelo en este mismo navegador.',
      codigoMalo: 'Ese código no es. Escribe el que muestra ahora tu app.',
      codigoCaducado: 'Ese código ya cambió. Escribe el nuevo.',
      invalido: 'Hay algo que no pasa las reglas. Revisa lo marcado.',
      permiso: 'No tienes permiso para esto. Sal y vuelve a entrar con tu código.',
      conflicto: 'Otra pestaña cambió esto.',
      tallerLleno: 'Este capítulo es demasiado grande. No lo guardé. Divídelo en dos.',
      pdfNoAbre: 'No pude abrir ese PDF.',
      tamanoFuera: 'La hoja debe medir entre 50 y 420 mm por lado.',
      pdfViejoFalta: 'Un PDF antiguo de este libro ya no está. Sus páginas no saldrán.',
      objetosMax: 'Esta página ya no admite más piezas.',
      cuadroLargo: 'Ese cuadro solo guarda 5.000 letras. Lo demás no cupo.',
      vistaFallo: 'No pude armar las páginas. Intenta otra vez.',
      margenes: 'Con esos márgenes no queda espacio para escribir.',
      fuenteMala: 'Ese nombre de fuente no vale. Usa solo letras y números.',
      fuenteNoEsta: 'No encontré esa fuente en Google Fonts.',
      tamanoMalo: 'Escribe un tamaño entre 1 y 999.',
      enlaceMalo: 'Ese enlace no sirve. Debe empezar con https://',
      columnasMalas: 'Escribe de 2 a 6 números, entre 1 y 12.',
      formulaNoCarga: 'No pude abrir las fórmulas. Intenta otra vez.',
      columnasDentro: 'No se pueden poner columnas dentro de otras.',
      noGuardado: 'Aún no pude guardar. Lo escrito sigue aquí.',
      copiaFallo: 'No pude guardar la copia. No seguí, para no perder nada.',
      copiaGrande: 'Este libro ya es muy grande para guardar copias. Bájalo en Copias.',
      copiaIncompleta: 'Algunos archivos no se pudieron incluir en la copia.',
      imagenFalta: 'No pude traer todas las imágenes. No saqué el PDF para que no salga con huecos.',
      pdfLargo: 'Ese PDF tiene más de 200 páginas. Divídelo en dos.',
      campoVacio: 'Ese campo no puede quedar vacío.',
      repetido: 'Ya hay algo con ese nombre. Elige otro.',
      noExiste: 'Eso ya no existe. Recarga la lista.',
      subida: 'No pude subir el archivo. Intenta otra vez.',
      archivoRuta: 'Ese archivo no vale aquí.',
      archivoFalta: 'Falta el archivo.',
      archivoGrande: 'El archivo pesa demasiado.',
      archivoTipo: 'El archivo no es del tipo que dice ser.',
      redCambio: 'Cambiaste de red a mitad. Empieza otra vez desde la misma conexión.',
      faltaCodigo: 'Para esto hace falta el código de tu app. Sal y vuelve a entrar.',
      tableroSemana: 'Esa semana no vale. Recarga la página.',
      tableroPiedraVacia: 'Elige un área.',
      generico: 'Algo no salió bien. Intenta otra vez.'
    }
  }
};

/* El idioma que toca, puesto sobre el español: lo que falte, sale en español. */
function mezclar(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  const salida = { ...base };
  for (const k of Object.keys(extra)) {
    salida[k] = (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) ? mezclar(base[k], extra[k]) : extra[k];
  }
  return salida;
}
export const tp = (lang) => mezclar(PORTAL_TEXTOS.es, Object.prototype.hasOwnProperty.call(PORTAL_TEXTOS, lang) ? PORTAL_TEXTOS[lang] : null);

/* JSON para meter dentro de un <script type="application/json">: el `<` se
   escapa para que ningun texto pueda cerrar la etiqueta. */
export const jsonSeguro = (obj) => JSON.stringify(obj)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

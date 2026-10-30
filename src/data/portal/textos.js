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
        accesos: { titulo: 'Compartir', linea: 'Tú decides quién pasa.' },
        seguridad: { titulo: 'Configuración', linea: 'Un código de tu celular para entrar como admin.' }
      },
      /* La barra de abajo del telefono (como la de una app) y su boton «Más» */
      barra: 'Secciones principales',
      mas: 'Más',
      /* Brand Assets (panel/dev/Marca.js): elegir una pieza, su color, su fondo y su tamaño, y bajarla */
      marca: {
        pista: 'Elige una pieza. Verás cómo queda y la bajas en SVG o en PNG.',
        animaciones: 'Animaciones',
        animacionesLinea: 'La lluvia de The Alef Code, en un video MP4 (con sonido, si quieres).',
        /* Las animaciones en video (panel/dev/MarcaVideo.js; las opciones, en data/portal/animaciones.js) */
        video: {
          vista: 'Así se ve un cuadro, a los 3 segundos.',
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
        margen: 'Con un poco de aire alrededor',
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
      repetido: 'Ya hay algo con ese nombre. Elige otro.',
      noExiste: 'Eso ya no existe. Recarga la lista.',
      subida: 'No pude subir el archivo. Intenta otra vez.',
      archivoRuta: 'Ese archivo no vale aquí.',
      archivoFalta: 'Falta el archivo.',
      archivoGrande: 'El archivo pesa demasiado.',
      archivoTipo: 'El archivo no es del tipo que dice ser.',
      redCambio: 'Cambiaste de red a mitad. Empieza otra vez desde la misma conexión.',
      faltaCodigo: 'Para esto hace falta el código de tu app. Sal y vuelve a entrar.',
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

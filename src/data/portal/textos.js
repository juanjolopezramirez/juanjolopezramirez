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
      saludo: 'Hola',
      menu: 'Secciones',
      salir: 'Salir',
      sinJavascript: 'Para entrar hace falta JavaScript.',
      problema: 'No pude conectar. Revisa tu internet e intenta otra vez.',
      reintentar: 'Intentar otra vez',
      grupos: {
        miembros: 'Tú',
        sitio: 'Lo que publico',
        accesos: 'Quién entra',
        privado: 'Solo para mí'
      },
      secciones: {
        inicio: { titulo: 'Inicio', linea: 'Esto es lo que puedes hacer aquí.' },
        escribir: { titulo: 'Escribir', linea: 'Las entradas del blog.' },
        libros: { titulo: 'Libros', linea: 'Los libros de la biblioteca.' },
        proyectos: { titulo: 'Proyectos', linea: 'Las tarjetas de Proyectos.' },
        trabajos: { titulo: 'Trabajos', linea: 'Las tarjetas de Trabajos.' },
        videos: { titulo: 'Videos', linea: 'Los videos, públicos o solo para miembros.' },
        accesos: { titulo: 'Quién entra', linea: 'Tú decides quién pasa.' },
        seguridad: { titulo: 'Seguridad', linea: 'Un código de tu celular para entrar como admin.' },
        diario: { titulo: 'Diario', linea: 'Lo que escribo para mí.' },
        habitos: { titulo: 'Hábitos', linea: 'Lo que repito para crecer.' },
        crecimiento: { titulo: 'Crecimiento', linea: 'A dónde voy y cómo voy.' }
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

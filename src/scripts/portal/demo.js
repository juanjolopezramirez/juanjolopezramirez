/* El portal DE PRUEBA: todo en memoria, sin red y sin guardar nada (al recargar,
   vuelve a empezar). Solo existe con `npm run dev`: backend.js lo llama detras de
   `import.meta.env.DEV`, y Vite se lleva este archivo al compilar para publicar.

   Sirve para ver y probar TODAS las pantallas sin tener Supabase:

     ?demo=entrar      (por defecto) sin sesion
     ?demo=pendiente   ya entraste, falta mi aprobacion
     ?demo=rechazado   ya entraste y te dije que no
     ?demo=miembro     aprobado, sin ser admin
     ?demo=admin       aprobado y admin (ve la seccion «Accesos»)

   Y al escribir en el formulario de entrar, el correo decide quien eres:
     admin@…      entras como admin          miembro@…     como miembro
     rechazado@…  como rechazado             error@…       «correo o contraseña no coinciden»
     lento@…      tarda 3 segundos           cualquier otro: pendiente
   «Continuar con Google» entra como pendiente.

   El formulario de «Pedir acceso» siempre contesta «revisa tu correo». */
import { correoValido, errorDeClave, limpiar } from './estado.js';

const PRESETS = ['entrar', 'pendiente', 'rechazado', 'miembro', 'admin'];
const RETRASO = 450;                      // para que se vea el «un momento»
const espera = (ms = RETRASO) => new Promise((r) => setTimeout(r, ms));

export function abrirDemo() {
  const q = new URLSearchParams(window.location.search).get('demo');
  const preset = PRESETS.includes(q) ? q : 'entrar';

  const perfiles = new Map();             // id → perfil
  const oyentes = new Set();
  let sesion = null;

  const personas = {
    pendiente: { id: 'u-pendiente', correo: 'ana@ejemplo.com', nombre: 'Ana', estado: 'pendiente', esAdmin: false },
    rechazado: { id: 'u-rechazado', correo: 'rosa@ejemplo.com', nombre: 'Rosa', estado: 'rechazado', esAdmin: false },
    miembro: { id: 'u-miembro', correo: 'mario@ejemplo.com', nombre: 'Mario', estado: 'aprobado', esAdmin: false },
    admin: { id: 'u-admin', correo: 'admin@ejemplo.com', nombre: 'Juanjo', estado: 'aprobado', esAdmin: true }
  };
  const poner = (p) => {
    perfiles.set(p.id, { motivo: '', ...p });
    sesion = { id: p.id, correo: p.correo };
    return sesion;
  };
  const avisar = (evento) => oyentes.forEach((cb) => setTimeout(() => cb(evento, sesion), 0));

  if (preset !== 'entrar') poner(personas[preset]);

  /* Gente que pide entrar, para el panel «Accesos» */
  const gente = [
    { id: 'g1', correo: 'lucia@ejemplo.com', nombre: 'Lucía', motivo: 'Vi tu video y quiero seguir leyéndote.', estado: 'pendiente', creado: '2026-10-22T15:00:00Z', decidido_en: null },
    { id: 'g2', correo: 'pedro@ejemplo.com', nombre: 'Pedro', motivo: '', estado: 'pendiente', creado: '2026-10-20T09:30:00Z', decidido_en: null },
    { id: 'g3', correo: 'marta@ejemplo.com', nombre: 'Marta', motivo: 'Me recomendó un amigo.', estado: 'aprobado', creado: '2026-10-10T18:10:00Z', decidido_en: '2026-10-11T08:00:00Z' }
  ];
  const invitaciones = [
    { correo: 'camila@ejemplo.com', creada: '2026-10-18T10:00:00Z', caduca: '2026-12-17T10:00:00Z', usada_en: null }
  ];

  return {
    modo: 'demo',
    async sesion() { await espera(120); return sesion; },
    async perfil(id) {
      await espera(120);
      const p = perfiles.get(id);
      return p ? { ...p } : null;
    },
    async reclamarInvitacion() {
      const p = sesion && perfiles.get(sesion.id);
      return p ? p.estado : 'pendiente';
    },

    async entrar(correo, clave) {
      await espera();
      if (!correoValido(correo)) return { error: 'correoInvalido' };
      if (!clave) return { error: 'credenciales' };
      const c = correo.trim().toLowerCase();
      if (c.startsWith('error@')) return { error: 'credenciales' };
      if (c.startsWith('lento@')) await espera(3000);
      const cual = c.startsWith('admin@') ? 'admin' : c.startsWith('miembro@') ? 'miembro'
        : c.startsWith('rechazado@') ? 'rechazado' : 'pendiente';
      poner({ ...personas[cual], correo: c });
      avisar('SIGNED_IN');
      return { ok: true };
    },

    async registrar({ nombre, correo, clave }) {
      await espera();
      if (!limpiar(nombre, 80)) return { error: 'nombreVacio' };
      if (!correoValido(correo)) return { error: 'correoInvalido' };
      const mala = errorDeClave(clave);
      if (mala) return { error: mala };
      return { ok: true, necesitaCorreo: true };
    },

    async google() {
      await espera();
      poner(personas.pendiente);
      avisar('SIGNED_IN');
      return { ok: true };
    },

    async recuperar(correo) {
      await espera();
      return correoValido(correo) ? { ok: true } : { error: 'correoInvalido' };
    },

    async nuevaClave(clave) {
      await espera();
      const mala = errorDeClave(clave);
      return mala ? { error: mala } : { ok: true };
    },

    async guardarMotivo(id, texto) {
      await espera();
      const p = perfiles.get(id);
      if (p) p.motivo = limpiar(texto, 300).replace(/[<>]/g, '');
      return { ok: true };
    },

    async salir() {
      sesion = null;
      avisar('SIGNED_OUT');
      return { ok: true };
    },

    alCambiar(cb) {
      oyentes.add(cb);
      return () => oyentes.delete(cb);
    },

    accesos: {
      async listarPerfiles() {
        await espera(200);
        const cuenta = (e) => gente.filter((g) => g.estado === e).length;
        return {
          ok: true,
          filas: gente.map((g) => ({ ...g })),
          totales: { pendiente: cuenta('pendiente'), aprobado: cuenta('aprobado'), rechazado: cuenta('rechazado') }
        };
      },
      async decidir(id, estado) {
        await espera(200);
        const g = gente.find((x) => x.id === id);
        if (!g) return { error: 'generico' };
        g.estado = estado;
        g.decidido_en = new Date().toISOString();
        return { ok: true };
      },
      async listarInvitaciones() { await espera(200); return { ok: true, filas: invitaciones.map((i) => ({ ...i })) }; },
      async invitar(correo) {
        await espera(200);
        if (!correoValido(correo)) return { error: 'correoInvalido' };
        const c = correo.trim().toLowerCase();
        const antes = invitaciones.findIndex((i) => i.correo === c);
        if (antes >= 0) invitaciones.splice(antes, 1);
        const ahora = Date.now();
        invitaciones.unshift({ correo: c, creada: new Date(ahora).toISOString(), caduca: new Date(ahora + 60 * 864e5).toISOString(), usada_en: null });
        return { ok: true };
      },
      async borrarInvitacion(correo) {
        await espera(200);
        const i = invitaciones.findIndex((x) => x.correo === correo);
        if (i >= 0) invitaciones.splice(i, 1);
        return { ok: true };
      }
    }
  };
}

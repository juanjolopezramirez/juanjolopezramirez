/* El portal hablando con Supabase de VERDAD. La forma de lo que devuelve esta
   descrita en backend.js; aqui se cumple.

   Tres reglas que se mantienen en cada funcion:
     1. NADA lanza hacia fuera: todo devuelve `{ ok }` o `{ error: '<clave>' }`,
        y la clave es una de las de textos.js → errores. Jamas se enseña el
        mensaje del servidor.
     2. NADA deja adivinar si un correo existe: pedir acceso y «olvide mi
        contraseña» responden igual exista o no el correo.
     3. Lo que se manda a las funciones SQL y a las tablas es lo minimo, y el
        servidor lo vuelve a comprobar todo (supabase/*.sql). Que esta pagina
        lo valide es cortesia, no seguridad. */
import { crearCliente } from './cliente.js';
import { claveDeError, correoValido, errorDeClave, idiomaDe, limpiar, urlPortal } from './estado.js';

const ESTADOS = ['pendiente', 'aprobado', 'rechazado'];
const sinAngulos = (t) => t.replace(/[<>]/g, '');
const PERFIL_VISTO = 'estado,nombre,motivo,correo';

export async function abrirReal(cfg, lang) {
  const sb = await crearCliente({ url: cfg.url, clave: cfg.clave });
  const L = idiomaDe(lang);
  /* A donde vuelve Google o el enlace del correo: SIEMPRE esta misma pagina. */
  const volver = () => urlPortal(window.location.origin, L);
  const quien = (s) => (s && s.user ? { id: s.user.id, correo: s.user.email || '' } : null);
  /* Un error que dejaria adivinar si el correo existe se trata como «todo bien». */
  const ya = (e) => !!e && (e.code === 'user_already_exists' || e.code === 'email_exists');

  return {
    modo: 'real',

    async sesion() {
      try {
        const { data, error } = await sb.auth.getSession();
        /* Con el token vencido y sin red, el refresco falla pero la sesion SIGUE guardada:
           eso es «no se pudo saber» (undefined), no «no has entrado» (null). */
        if (error) return error.name === 'AuthRetryableFetchError' ? undefined : null;
        return quien(data.session);
      } catch (e) {
        return null;
      }
    },

    /* undefined = no se pudo saber (red); null = no hay perfil; objeto = lo que hay.
       Es el SERVIDOR quien contesta aqui: la regla (RLS) solo deja ver el perfil
       propio, asi que una sesion inventada no obtiene nada. */
    async perfil(id) {
      try {
        const [p, a] = await Promise.all([
          sb.from('perfiles').select(PERFIL_VISTO).eq('id', id).maybeSingle(),
          sb.from('admins').select('user_id').eq('user_id', id).maybeSingle()
        ]);
        if (p.error) return undefined;
        if (!p.data) return null;
        const estado = ESTADOS.includes(p.data.estado) ? p.data.estado : 'pendiente';
        return { ...p.data, estado, esAdmin: !a.error && !!a.data };
      } catch (e) {
        return undefined;
      }
    },

    async reclamarInvitacion() {
      try {
        const { data, error } = await sb.rpc('reclamar_invitacion');
        return !error && ESTADOS.includes(data) ? data : 'pendiente';
      } catch (e) {
        return 'pendiente';
      }
    },

    async entrar(correo, clave) {
      if (!correoValido(correo)) return { error: 'correoInvalido' };
      if (typeof clave !== 'string' || !clave) return { error: 'credenciales' };
      try {
        const { error } = await sb.auth.signInWithPassword({ email: correo.trim(), password: clave });
        return error ? { error: claveDeError(error) } : { ok: true };
      } catch (e) {
        return { error: 'red' };
      }
    },

    async registrar({ nombre, correo, clave, motivo }) {
      const n = sinAngulos(limpiar(nombre, 80));
      if (!n) return { error: 'nombreVacio' };
      if (!correoValido(correo)) return { error: 'correoInvalido' };
      const malaClave = errorDeClave(clave);
      if (malaClave) return { error: malaClave };
      try {
        const { data, error } = await sb.auth.signUp({
          email: correo.trim(),
          password: clave,
          options: {
            emailRedirectTo: volver(),
            data: { nombre: n, motivo: sinAngulos(limpiar(motivo, 300)) }
          }
        });
        if (ya(error)) return { ok: true, necesitaCorreo: true };
        if (error) return { error: claveDeError(error) };
        return { ok: true, necesitaCorreo: !data.session };
      } catch (e) {
        return { error: 'red' };
      }
    },

    async google() {
      try {
        const { error } = await sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: volver(), queryParams: { prompt: 'select_account' } }
        });
        return error ? { error: claveDeError(error) === 'generico' ? 'google' : claveDeError(error) } : { ok: true };
      } catch (e) {
        return { error: 'google' };
      }
    },

    async recuperar(correo) {
      if (!correoValido(correo)) return { error: 'correoInvalido' };
      try {
        const { error } = await sb.auth.resetPasswordForEmail(correo.trim(), { redirectTo: volver() });
        const clave = error ? claveDeError(error) : null;
        return clave === 'demasiados' || clave === 'red' ? { error: clave } : { ok: true };
      } catch (e) {
        return { error: 'red' };
      }
    },

    async nuevaClave(clave) {
      const mala = errorDeClave(clave);
      if (mala) return { error: mala };
      try {
        const { error } = await sb.auth.updateUser({ password: clave });
        return error ? { error: claveDeError(error) } : { ok: true };
      } catch (e) {
        return { error: 'red' };
      }
    },

    async guardarMotivo(id, texto) {
      try {
        const { error } = await sb.from('perfiles').update({ motivo: sinAngulos(limpiar(texto, 300)) }).eq('id', id);
        return error ? { error: 'generico' } : { ok: true };
      } catch (e) {
        return { error: 'red' };
      }
    },

    async salir() {
      try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* ya no hay sesion que cerrar */ }
      return { ok: true };
    },

    /* El cambio se avisa en el turno siguiente (setTimeout 0): lo pide la
       documentacion de Supabase, porque dentro de la funcion no se puede esperar a
       otras llamadas de auth sin trabar el cliente. */
    alCambiar(cb) {
      const { data } = sb.auth.onAuthStateChange((evento, sesion) => {
        setTimeout(() => cb(evento, quien(sesion)), 0);
      });
      return () => data.subscription.unsubscribe();
    },

    /* ---- Para el panel del admin. Cada una la protege el SERVIDOR (RLS y
       decidir_acceso): si quien llama no es admin, vuelve vacio o con error. ---- */
    accesos: {
      /* Una consulta POR ESTADO, con su total: si alguien inunda la cola de pendientes, lo
         ya decidido no se sale de la lista, y el panel dice cuantas hay de mas. */
      async listarPerfiles() {
        try {
          /* Los que esperan, en orden de llegada (el primero que pidio, primero); lo ya
             decidido, lo mas reciente arriba. */
          const una = (estado) => sb.from('perfiles')
            .select('id,correo,nombre,motivo,estado,creado,decidido_en', { count: 'exact' })
            .eq('estado', estado)
            .order('creado', { ascending: estado === 'pendiente' }).limit(100);
          const [p, a, r] = await Promise.all([una('pendiente'), una('aprobado'), una('rechazado')]);
          if (p.error || a.error || r.error) return { error: 'generico' };
          return {
            ok: true,
            filas: [...(p.data || []), ...(a.data || []), ...(r.data || [])],
            totales: { pendiente: p.count || 0, aprobado: a.count || 0, rechazado: r.count || 0 }
          };
        } catch (e) { return { error: 'red' }; }
      },
      async decidir(id, estado) {
        if (!ESTADOS.includes(estado)) return { error: 'generico' };
        try {
          const { error } = await sb.rpc('decidir_acceso', { p_usuario: id, p_estado: estado });
          return error ? { error: 'generico' } : { ok: true };
        } catch (e) { return { error: 'red' }; }
      },
      async listarInvitaciones() {
        try {
          const { data, error } = await sb.from('invitaciones')
            .select('correo,creada,caduca,usada_en')
            .order('creada', { ascending: false }).limit(200);
          return error ? { error: 'generico' } : { ok: true, filas: data || [] };
        } catch (e) { return { error: 'red' }; }
      },
      /* Re-invitar a alguien: se borra la invitacion anterior (usada o caducada) y
         se crea una nueva; la tabla no deja «cambiar», solo crear y borrar. */
      async invitar(correo) {
        if (!correoValido(correo)) return { error: 'correoInvalido' };
        const c = correo.trim().toLowerCase();
        try {
          const borrar = await sb.from('invitaciones').delete().eq('correo', c);
          if (borrar.error) return { error: 'generico' };
          const { error } = await sb.from('invitaciones').insert({ correo: c });
          return error ? { error: 'generico' } : { ok: true };
        } catch (e) { return { error: 'red' }; }
      },
      async borrarInvitacion(correo) {
        try {
          const { error } = await sb.from('invitaciones').delete().eq('correo', String(correo).toLowerCase());
          return error ? { error: 'generico' } : { ok: true };
        } catch (e) { return { error: 'red' }; }
      }
    }
  };
}

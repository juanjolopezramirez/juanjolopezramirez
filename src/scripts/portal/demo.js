/* El portal DE PRUEBA: todo en memoria, sin red y sin guardar nada (al recargar,
   vuelve a empezar). Solo existe con `npm run dev`: backend.js lo llama detras de
   `import.meta.env.DEV`, y Vite se lleva este archivo al compilar para publicar.

   Sirve para ver y probar TODAS las pantallas sin tener Supabase:

     ?demo=entrar      (por defecto) sin sesion
     ?demo=pendiente   ya entraste, falta mi aprobacion
     ?demo=rechazado   ya entraste y te dije que no
     ?demo=miembro     aprobado, sin ser admin
     ?demo=admin       aprobado y admin (ve la seccion «Accesos»), aun sin codigo de app
     ?demo=admin2fa    admin con codigo de app: el panel pide el codigo (es 123456)

   Y al escribir en el formulario de entrar, el correo decide quien eres:
     admin@…      entras como admin          miembro@…     como miembro
     rechazado@…  como rechazado             error@…       «correo o contraseña no coinciden»
     lento@…      tarda 3 segundos           cualquier otro: pendiente
   «Continuar con Google» entra como pendiente.

   El formulario de «Pedir acceso» siempre contesta «revisa tu correo». */
import { codigoValido, correoValido, errorDeClave, limpiar, soloNumeros } from './estado.js';
import { RepositorioMemoria } from '../contenido/Repositorio.js';
import { SEMANAS_HISTORIA, semanaDe, sumarSemanas, validarLectura, validarPiedra } from './tablero.js';
import { IDS_DOMINIOS } from '../../data/portal/tablero.js';
import { revisarArchivo } from './archivos.js';

const PRESETS = ['entrar', 'pendiente', 'rechazado', 'miembro', 'admin', 'admin2fa'];
const CODIGO_DEMO = '123456';
/* Un QR de mentira (un cuadro con una א): en la demo no hay app que lo lea. */
const QR_DEMO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1z" fill="none" stroke="#000" stroke-width="1.2"/><text x="14" y="18" font-size="7">א</text></svg>');
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

  if (preset !== 'entrar') poner(personas[preset === 'admin2fa' ? 'admin' : preset]);

  /* El codigo de la app: los dispositivos confirmados y el nivel de esta sesion. */
  const factores = preset === 'admin2fa' ? [{ id: 'f-demo', nombre: 'The Alef Code · teléfono', creado: '2026-10-26T21:00:00Z' }] : [];
  let nivelActual = 'aal1';
  let pendienteId = null;

  /* Gente que pide entrar, para el panel «Accesos» */
  const gente = [
    { id: 'g1', correo: 'lucia@ejemplo.com', nombre: 'Lucía', motivo: 'Vi tu video y quiero seguir leyéndote.', estado: 'pendiente', creado: '2026-10-22T15:00:00Z', decidido_en: null },
    { id: 'g2', correo: 'pedro@ejemplo.com', nombre: 'Pedro', motivo: '', estado: 'pendiente', creado: '2026-10-20T09:30:00Z', decidido_en: null },
    { id: 'g3', correo: 'marta@ejemplo.com', nombre: 'Marta', motivo: 'Me recomendó un amigo.', estado: 'aprobado', creado: '2026-10-10T18:10:00Z', decidido_en: '2026-10-11T08:00:00Z' }
  ];
  const invitaciones = [
    { correo: 'camila@ejemplo.com', creada: '2026-10-18T10:00:00Z', caduca: '2026-12-17T10:00:00Z', usada_en: null }
  ];
  /* Developer-Mode: un repositorio en memoria por tipo (las casas comparten filas) */
  const repos = new Map();
  const casasCompartidas = { filas: new Map(), borradores: new Map() };
  const subidos = new Map();               // ruta → archivo (solo en memoria)
  /* Tablero en memoria (como supabase/009): una lectura por semana y dominio, y las piedras con su fecha */
  const hoy = semanaDe();
  const lecturas = new Map([
    [sumarSemanas(hoy, -1) + '|identity', { semana: sumarSemanas(hoy, -1), clave: 'identity', cargue: true, nota: 'Dije que no a una reunión que no era mía.' }],
    [sumarSemanas(hoy, -1) + '|sleep', { semana: sumarSemanas(hoy, -1), clave: 'sleep', cargue: false, nota: 'Me dormí tarde tres noches.' }],
    [hoy + '|identity', { semana: hoy, clave: 'identity', cargue: true, nota: '' }]
  ]);
  const piedras = [{ eje: 'bond', piedra: 'Mis padres', desde: '2026-01-05' }];

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

    mfa: {
      async nivel() { await espera(80); return { actual: nivelActual, siguiente: factores.length ? 'aal2' : 'aal1' }; },
      async factores() { await espera(150); return { ok: true, lista: factores.map((f) => ({ ...f })) }; },
      async inscribir() {
        await espera();
        pendienteId = `f-${Date.now()}`;
        return { ok: true, id: pendienteId, qr: QR_DEMO, secreto: 'DEMODEMODEMODEMO' };
      },
      async confirmar(id, codigo) {
        await espera();
        if (!codigoValido(codigo) || soloNumeros(codigo) !== CODIGO_DEMO) return { error: 'codigoMalo' };
        if (id !== pendienteId) return { error: 'generico' };
        factores.push({ id, nombre: `The Alef Code · ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, creado: new Date().toISOString() });
        pendienteId = null;
        nivelActual = 'aal2';
        return { ok: true };
      },
      async verificar(codigo) {
        await espera();
        if (!codigoValido(codigo) || soloNumeros(codigo) !== CODIGO_DEMO) return { error: 'codigoMalo' };
        nivelActual = 'aal2';
        return { ok: true };
      },
      async quitar(id) {
        await espera(200);
        const i = factores.findIndex((f) => f.id === id);
        if (i >= 0) factores.splice(i, 1);
        return { ok: true };
      },
      async cerrarOtras() { await espera(200); return { ok: true }; }
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
    },

    /* Tablero en memoria: la misma forma que el de verdad (real.js), con las mismas validaciones */
    tablero: {
      async lecturas(semana) {
        await espera(150);
        const v = validarLectura({ semana, clave: IDS_DOMINIOS[0], cargue: true });
        if (v.error) return v;
        return { ok: true, filas: [...lecturas.values()].filter((l) => l.semana === semana).map(({ clave, cargue, nota }) => ({ clave, cargue, nota })) };
      },
      async historial(clave) {
        await espera(120);
        if (!IDS_DOMINIOS.includes(clave)) return { error: 'generico' };
        return { ok: true, filas: [...lecturas.values()].filter((l) => l.clave === clave).sort((a, b) => (a.semana < b.semana ? 1 : -1)).slice(0, SEMANAS_HISTORIA).map(({ semana, cargue, nota }) => ({ semana, cargue, nota })) };
      },
      async marcar(lectura) {
        await espera(200);
        const v = validarLectura(lectura);
        if (v.error) return v;
        lecturas.set(v.valor.semana + '|' + v.valor.clave, v.valor);
        return { ok: true };
      },
      async quitar(semana, clave) {
        await espera(150);
        const v = validarLectura({ semana, clave, cargue: true });
        if (v.error) return v;
        lecturas.delete(semana + '|' + clave);
        return { ok: true };
      },
      async piedras() { await espera(120); return { ok: true, filas: piedras.map((p) => ({ ...p })) }; },
      async ponerPiedra(p) {
        await espera(200);
        const v = validarPiedra(p);
        if (v.error) return v;
        const i = piedras.findIndex((x) => x.eje === v.valor.eje && x.desde === v.valor.desde);
        if (i >= 0) piedras[i] = v.valor; else piedras.push(v.valor);
        return { ok: true };
      }
    },

    /* Developer-Mode en memoria: guarda y publica de mentira (al recargar se va). Los
       archivos se revisan igual que en el de verdad, pero no se suben a ningun sitio. */
    contenido: {
      repositorio(Tipo) {
        const clave = Tipo.tabla + ':' + (Tipo.clase || '');
        /* Trabajos y Proyectos comparten tabla (y borradores), como en la base */
        if (!repos.has(clave)) repos.set(clave, new RepositorioMemoria(Tipo, Tipo.clase ? casasCompartidas : null));
        return repos.get(clave);
      },
      async subir(ruta, archivo) {
        await espera(300);
        const r = await revisarArchivo(ruta, archivo);
        if (r.error) return r;
        subidos.set(ruta, archivo);               // para enseñarlo luego, como si estuviera en el almacen
        return { ok: true };
      },
      async descargar(ruta) {
        await espera(120);
        return subidos.has(ruta) ? { ok: true, blob: subidos.get(ruta) } : { error: 'red' };
      }
    }
  };
}

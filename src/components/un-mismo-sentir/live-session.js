import { createClient } from '@supabase/supabase-js';

const messages = {
  alias_taken: 'Ese alias ya está en la sala.',
  invalid_alias: 'Escribe un alias de 2 a 24 caracteres.',
  room_unavailable: 'La sala ya no está disponible para esta sesión.',
  leader_required: 'Solo el anfitrión puede realizar esa acción.',
  roster_too_small: 'Hace falta que entren al menos dos parejas.',
  players_not_ready: 'Todos los participantes deben estar en línea y listos.',
  invalid_groups: 'Completa dos o más parejas antes de jugar.',
  pair_required: 'Confirma primero con quién vas a jugar.',
  pair_unavailable: 'Esa persona ya tiene pareja o no está disponible.',
  pair_offer_unavailable: 'La invitación ya no está disponible.',
  pairing_locked: 'Las parejas se fijaron al iniciar la partida.',
  wrong_phase: 'Esa acción aún no está disponible en esta fase.',
  stale_phase: 'La ronda cambió. Revisa el estado actualizado.',
  invalid_category: 'Escribe una categoría de entre 2 y 60 caracteres.',
  category_used: 'Esa categoría ya salió.',
  invalid_words: 'El servidor necesita tres respuestas distintas en el formato admitido.',
  invalid_vote: 'Elige a un participante distinto de ti.',
  already_submitted: 'Ya entregaste para esta fase.',
  anonymous_provider_disabled: 'El acceso de invitados todavía no está habilitado.',
};

export function gameMessage(error) {
  return messages[error?.code] ?? 'No pudimos completar la acción. Comprueba tu conexión e inténtalo de nuevo.';
}

export function liveSession(url, key) {
  const client = createClient(url, key, { auth: { storageKey: 'ums-live-auth', detectSessionInUrl: false } });
  async function guest() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      const { error: signInError } = await client.auth.signInAnonymously();
      if (signInError) throw signInError;
    }
  }

  async function rpc(name, params) {
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    if (!data?.ok) throw Object.assign(new Error(data?.error), { code: data?.error });
    return data;
  }

  function action(room, actionName, payload = {}, requestId = crypto.randomUUID()) {
    return rpc('ums_action', { p_room: room, p_action: actionName, p_payload: payload, p_request: requestId });
  }

  return { client, guest, rpc, action };
}

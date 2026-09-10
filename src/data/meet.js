/* La agenda.

   POR QUE UN ENLACE Y NO LA API DE GOOGLE. Este sitio es estatico y no hay
   servidor detras. Leer un calendario privado con la API pide OAuth, y OAuth
   pide un secreto que no puede vivir en una pagina publica; una clave suelta
   solo lee calendarios publicos, queda a la vista de cualquiera y gasta la
   cuota de quien la ponga. Los «horarios de citas» de Google resuelven lo
   mismo por el otro lado: Google guarda las franjas, publica una direccion y
   la invitacion cae sola en el calendario. Aqui solo se guarda esa direccion.

   MIENTRAS `reserva` ESTE VACIA la pagina no se rompe ni miente: enseña las
   franjas y manda a escribir. Es la misma idea que el «pronto» del resto del
   sitio — no se anuncia un boton que no lleva a ningun sitio. En cuanto haya
   direccion, el boton aparece solo.

   LAS FRANJAS SE ESCRIBEN A MANO y no salen del calendario: son la promesa
   general, no la disponibilidad real de esta semana. Eso lo dice el sistema
   de reservas, que si mira el calendario de verdad. */

export const AGENDA = {
  /* Pegar aqui la direccion del horario de citas de Google. */
  reserva: '',

  /* Cuanto dura la primera. Media hora basta para saber si hay algo. */
  minutos: 30,

  /* El huso importa mas de lo que parece: la mitad de las reuniones que se
     tuercen se tuercen por esto. */
  huso: 'GMT−5 · Colombia',

  franjas: {
    es: 'Lunes a viernes, de 7:00 a 12:00 y de 14:00 a 18:00',
    en: 'Monday to Friday, 7:00 to 12:00 and 14:00 to 18:00',
    pt: 'Segunda a sexta, das 7:00 às 12:00 e das 14:00 às 18:00',
    fr: 'Du lundi au vendredi, de 7h00 à 12h00 et de 14h00 à 18h00',
    it: 'Dal lunedì al venerdì, dalle 7:00 alle 12:00 e dalle 14:00 alle 18:00'
  }
};

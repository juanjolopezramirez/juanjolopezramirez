import { ICONS } from './icons.js';

/* Las pantallas de «algo no salio bien»: la de una pagina que llego a medias
   (el guardian de Base.astro) y la de una direccion que no existe (404.astro).

   TIENEN QUE VERSE SIN NADA MAS. Salen justo cuando puede faltar la hoja de
   estilos o el guion de la pagina, asi que no pueden pedir nada a ninguno de
   los dos: el estilo va aqui en texto y se pega en linea, los colores van
   escritos a mano y no en variables, la marca va dibujada dentro y las
   letras de la casa se usan si ya estan y, si no, su respaldo.

   Y NO TIENEN QUE PARECER UN FALLO. Mismo suelo que el telon —la diagonal
   del pinar—, la marca respirando, el titular en la serif y un boton de
   hueso. Dicen lo que paso sin echarle la culpa a nadie y ofrecen el
   siguiente paso, que es lo unico que le importa a quien llega. */

export const AVISO_MARCA = ICONS.mark;

/* Una flecha que vuelve sobre si misma: volver a cargar. */
export const AVISO_RECARGA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12a8 8 0 1 1-2.35-5.65"/><path d="M20 4v5h-5"/></svg>';

export const AVISO_CSS = `
.aviso{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow-y:auto;
  padding:1.5rem 1.5rem 3.5rem;box-sizing:border-box;margin:0;
  background:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.3)),
    linear-gradient(to top left,#A5CF4D 0%,#7D9B4E 27%,#678345 38%,#526B3B 48%,#3C5332 63%,#31472D 71%,#263B28 78%,#263B28 95%),#263B28;
  color:#F1EFE9;text-align:center;
  font-family:"Bricolage Grotesque",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
.aviso *,.aviso *::before,.aviso *::after{box-sizing:border-box}
.aviso__cuerpo{width:min(100%,26rem);display:grid;justify-items:center;
  animation:avisoEntra .8s cubic-bezier(.16,1,.3,1) both}
.aviso__marca{display:block;width:2.3rem;margin:0 0 1.7rem;color:#F1EFE9;
  animation:avisoRespira 3.4s ease-in-out infinite}
.aviso__marca svg{display:block;width:100%;height:auto}
.aviso__numero{margin:0 0 1.1rem;font-family:"Young Serif",Georgia,"Times New Roman",serif;
  font-size:clamp(4.6rem,24vw,7.5rem);line-height:.9;letter-spacing:-.03em;
  color:rgba(241,239,233,.1);-webkit-text-stroke:1px rgba(241,239,233,.42)}
.aviso__rotulo{margin:0;font-size:.68rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#A9C47F}
.aviso__titulo{margin:.75rem 0 0;font-family:"Young Serif",Georgia,"Times New Roman",serif;font-weight:400;
  font-size:clamp(1.7rem,7.2vw,2.35rem);line-height:1.12;letter-spacing:-.015em;text-wrap:balance}
.aviso__texto{margin:1rem 0 0;font-size:.95rem;line-height:1.65;color:#C9D6C6;text-wrap:pretty}
.aviso__botones{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.7rem 1.3rem;margin-top:2rem}
.aviso__boton{display:inline-flex;align-items:center;gap:.55rem;padding:.82rem 1.4rem;border:0;border-radius:999px;
  background:#F1EFE9;color:#263B28;font:inherit;font-size:.92rem;font-weight:600;line-height:1.2;
  text-decoration:none;cursor:pointer;box-shadow:0 14px 28px -14px rgba(11,20,13,.85);
  transition:scale .25s cubic-bezier(.22,.61,.36,1)}
.aviso__boton:hover{scale:1.04}
.aviso__boton:active{scale:.97}
.aviso__boton:focus-visible,.aviso__enlace:focus-visible{outline:2px solid #A9C47F;outline-offset:3px}
.aviso__boton svg{width:1rem;height:1rem;transition:rotate .7s cubic-bezier(.16,1,.3,1)}
.aviso__boton:hover svg{rotate:-360deg}
.aviso__enlace{padding:.3rem 0;border:0;background:none;color:#F1EFE9;font:inherit;font-size:.88rem;font-weight:500;cursor:pointer;
  text-decoration:underline;text-decoration-color:rgba(241,239,233,.35);text-underline-offset:.32em;
  transition:text-decoration-color .25s}
.aviso__enlace:hover{text-decoration-color:#A9C47F}
.aviso__enlace[hidden]{display:none}
.aviso__firma{position:absolute;left:0;right:0;bottom:max(1.2rem,env(safe-area-inset-bottom));margin:0;
  font-size:.66rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(241,239,233,.45)}
@keyframes avisoEntra{from{opacity:0;translate:0 16px}}
@keyframes avisoRespira{50%{translate:0 -5px;opacity:.82}}
@media (prefers-reduced-motion:reduce){.aviso__cuerpo,.aviso__marca{animation:none}.aviso__boton svg{transition:none}}
`;

export const AVISO_TEXTOS = {
  es: {
    rotulo: 'Una pausa en el camino',
    titulo: 'La página llegó a medias.',
    texto: 'Parte de lo que la hace funcionar se quedó en el camino. Pasa con una conexión inestable o justo después de una actualización, y se arregla volviendo a cargarla.',
    boton: 'Volver a cargar',
    inicio: 'Ir al inicio',
    rotuloRed: 'Sin conexión',
    tituloRed: 'Se cortó la conexión.',
    textoRed: 'En cuanto vuelva, la página se carga sola. También puedes intentarlo tú.',
    rotulo404: 'Fuera del camino',
    titulo404: 'Este camino no lleva a ningún sitio.',
    texto404: 'La dirección cambió o nunca existió. Lo que buscabas sigue en casa.',
    boton404: 'Volver al inicio',
    atras: 'Página anterior',
    doc404: 'Página no encontrada — Juan José López Ramírez'
  },
  en: {
    rotulo: 'A pause on the way',
    titulo: 'The page arrived halfway.',
    texto: 'Part of what makes it work got lost on the way. It happens on a shaky connection or right after an update, and reloading fixes it.',
    boton: 'Reload',
    inicio: 'Go to home',
    rotuloRed: 'Offline',
    tituloRed: 'The connection dropped.',
    textoRed: 'As soon as it comes back, the page will reload by itself. You can also try now.',
    rotulo404: 'Off the path',
    titulo404: 'This path doesn’t lead anywhere.',
    texto404: 'The address changed or never existed. What you were looking for is still at home.',
    boton404: 'Back to home',
    atras: 'Previous page',
    doc404: 'Page not found — Juan José López Ramírez'
  },
  pt: {
    rotulo: 'Uma pausa no caminho',
    titulo: 'A página chegou a meio.',
    texto: 'Parte do que a faz funcionar ficou pelo caminho. Acontece com uma ligação instável ou logo depois de uma atualização, e resolve-se voltando a carregá-la.',
    boton: 'Voltar a carregar',
    inicio: 'Ir para o início',
    rotuloRed: 'Sem ligação',
    tituloRed: 'A ligação caiu.',
    textoRed: 'Assim que voltar, a página carrega sozinha. Também podes tentar tu.',
    rotulo404: 'Fora do caminho',
    titulo404: 'Este caminho não leva a lado nenhum.',
    texto404: 'O endereço mudou ou nunca existiu. O que procuravas continua em casa.',
    boton404: 'Voltar ao início',
    atras: 'Página anterior',
    doc404: 'Página não encontrada — Juan José López Ramírez'
  },
  fr: {
    rotulo: 'Une pause en chemin',
    titulo: 'La page n’est arrivée qu’à moitié.',
    texto: 'Une partie de ce qui la fait fonctionner s’est perdue en route. Cela arrive avec une connexion instable ou juste après une mise à jour, et il suffit de la recharger.',
    boton: 'Recharger',
    inicio: 'Aller à l’accueil',
    rotuloRed: 'Hors ligne',
    tituloRed: 'La connexion s’est coupée.',
    textoRed: 'Dès qu’elle reviendra, la page se rechargera toute seule. Vous pouvez aussi réessayer.',
    rotulo404: 'Hors du chemin',
    titulo404: 'Ce chemin ne mène nulle part.',
    texto404: 'L’adresse a changé ou n’a jamais existé. Ce que vous cherchiez est toujours à la maison.',
    boton404: 'Retour à l’accueil',
    atras: 'Page précédente',
    doc404: 'Page introuvable — Juan José López Ramírez'
  },
  it: {
    rotulo: 'Una pausa lungo il cammino',
    titulo: 'La pagina è arrivata a metà.',
    texto: 'Una parte di ciò che la fa funzionare si è persa per strada. Succede con una connessione instabile o subito dopo un aggiornamento, e si risolve ricaricandola.',
    boton: 'Ricarica',
    inicio: 'Vai all’inizio',
    rotuloRed: 'Offline',
    tituloRed: 'La connessione è caduta.',
    textoRed: 'Appena torna, la pagina si ricarica da sola. Puoi anche riprovare tu.',
    rotulo404: 'Fuori strada',
    titulo404: 'Questa strada non porta da nessuna parte.',
    texto404: 'L’indirizzo è cambiato o non è mai esistito. Quello che cercavi è ancora a casa.',
    boton404: 'Torna all’inizio',
    atras: 'Pagina precedente',
    doc404: 'Pagina non trovata — Juan José López Ramírez'
  }
};

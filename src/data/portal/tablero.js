/* EL TABLERO DE FRATERNI (Self-Mode → «Tablero»).

   4 ejes × 3 áreas × 5 dominios = 60. Los nombres son los de las dos páginas del vault:
   «tablero-de-los-sesenta» (los nombres originales, en inglés: de ahí salen los `id`, y si los dos
   difieren en NOMBRES, manda esta) y «fraterni-tablero-bilingue» (la edición en español, legible: los
   nombres y los «qué mide» que se ven en pantalla salen de ella; unas pocas definiciones tienen otra
   palabra que la original, p. ej. «Coherencia» y no «Correspondencia»). AQUÍ NO SE INVENTA NADA: todo está
   copiado de ellas.

   Lo que NO es una casilla (y por eso no está en las 60):
     · los 4 PRINCIPIOS (Propósito, Carácter, Presencia, Conciencia) se califican «en todos los
       dominios, áreas y ejes»: miden el patrón sobre las sesenta, no una casilla;
     · los 3 PERMANENTES (Fe, Esperanza, Amor): el Amor es el filtro final sobre el tablero entero
       (se calcula SOBRE las 60, no DENTRO de ellas).

   Cómo se califica (lo decidió el fundador, 2026-10-30): un interruptor por dominio y por SEMANA,
   sin medios: «cargué mi cruz» o «no cargué mi cruz». Quien no carga su cruz no es un fracaso: lo que
   importa es ver qué se movió y cómo evaluarlo (cada lectura lleva su nota).

   La clave de arco no es fija: la PIEDRA ANGULAR de cada eje cambia con la etapa y con la persona
   (para uno, en el Lazo, puede ser su pareja; para otro, sus padres). Se guarda con su fecha
   (supabase/009_tablero.sql). Y por encima de todas está Dios: Él es amor, y sostiene los cuatro ejes.

   El orden de los 5 dominios de cada área es el de las tablas (de adentro hacia afuera en la rueda). */

const D = (id, nombre, mide) => ({ id, nombre, mide });

export const EJES = [
  {
    id: 'center', nombre: 'El Centro', color: '#4E5B35', icono: '/assets/fraterni/ejes/centro.svg',
    gobierna: 'La soberanía interna: alineación del ser, dirección estratégica y vida espiritual.',
    areas: [
      { id: 'essence', nombre: 'Esencia', linea: 'El carácter y la estructura interna del individuo.', dominios: [
        D('identity', 'Identidad', 'Operar desde el diseño original o desde la validación externa'),
        D('paradigms', 'Paradigmas', 'Modelos mentales y sesgos que limitan la toma de decisiones'),
        D('non-negotiables', 'Innegociables', 'Principios absolutos que no se venden por conveniencia'),
        D('consistency', 'Coherencia', 'Correspondencia entre lo que se profesa en público y se ejecuta en privado'),
        D('transparency', 'Transparencia', 'Vivir sin personajes ni máscaras para complacer al entorno')
      ] },
      { id: 'course', nombre: 'El Rumbo', linea: 'El sistema de navegación macro y micro, a corto y a largo plazo.', dominios: [
        D('direction', 'Dirección', 'Claridad sobre el frente de batalla y la asignación actual'),
        D('milestones', 'Hitos', 'Objetivos métricos específicos para los próximos 90 días'),
        D('horizon', 'Horizonte', 'Mirar el largo plazo sin ser cegado por la crisis del día'),
        D('filters', 'Filtros', 'Saber decir «no» a lo que no te corresponde'),
        D('execution', 'Ejecución', 'Decidir bajo presión sin congelarse')
      ] },
      { id: 'meaning', nombre: 'El Sentido', linea: 'La mística y la profundidad de la vida interior.', dominios: [
        D('core-meaning', 'Sentido Nuclear', 'Conexión con la trascendencia de las acciones diarias'),
        D('solitude', 'Soledad', 'Aislarse del ruido para calibrar el pensamiento'),
        D('vigilance', 'Vigilancia', 'Sobriedad y atención para no vivir anestesiado'),
        D('legacy', 'Legado', 'Valor que sobrevive a la vida de quien lo creó'),
        D('foundation', 'Cimiento', 'La certeza en el orden superior y la fe que sostiene el tablero')
      ] }
    ]
  },
  {
    id: 'bond', nombre: 'El Lazo', color: '#B68915', icono: '/assets/fraterni/ejes/lazo.svg',
    gobierna: 'Calidad, lealtad y diseño de los círculos concéntricos de relación.',
    areas: [
      { id: 'intimate', nombre: 'Lo Íntimo', linea: 'La alianza primaria: pareja o matrimonio. Primer círculo.', dominios: [
        D('alignment', 'Alineación', 'Unidad de visión y destino con el compañero de vida'),
        D('fidelity', 'Fidelidad', 'Protección de los acuerdos y la exclusividad del pacto'),
        D('vulnerability', 'Vulnerabilidad', 'Desarmarse ante el otro sin temor al juicio'),
        D('physical-honor', 'Honra Física', 'Respeto y santidad en la dimensión corporal'),
        D('convergence', 'Convergencia', 'Donde los talentos de ambos potencian el diseño del otro')
      ] },
      { id: 'root', nombre: 'La Raíz', linea: 'El núcleo sanguíneo: padres, hijos, hermanos. Segundo círculo.', dominios: [
        D('jurisdiction', 'Jurisdicción', 'Entender el rol y el límite de autoridad dentro de la familia'),
        D('kinship-connection', 'Vínculo de Sangre', 'Salud y sanidad de los lazos sanguíneos directos'),
        D('sovereignty', 'Soberanía', 'Independencia del núcleo frente a opiniones de terceros'),
        D('resolution', 'Resolución', 'Cerrar conflictos históricos y traumas del pasado'),
        D('lineage-culture', 'Cultura de Linaje', 'Valores y mitos familiares que se heredan')
      ] },
      { id: 'tribe', nombre: 'La Tribu', linea: 'Aliados, negocios y comunidad. Tercer círculo.', dominios: [
        D('circle-depth', 'Profundidad del Círculo', 'Calidad y peso estratégico de los amigos cercanos'),
        D('allegiance', 'Lealtad', 'Compromiso mutuo de defensa en crisis'),
        D('asymmetry-balance', 'Equilibrio Asimétrico', 'Relaciones con mentores (arriba) y aprendices (abajo)'),
        D('the-council', 'El Consejo', 'La mesa de asesores que valida tus pasos'),
        D('synergy', 'Sinergia', 'Co-crear valor exponencial con la comunidad')
      ] }
    ]
  },
  {
    id: 'terrain', nombre: 'El Entorno', color: '#A80E0E', icono: '/assets/fraterni/ejes/entorno.svg',
    gobierna: 'El estado del cuerpo y el orden del hábitat inmediato.',
    areas: [
      { id: 'pulse', nombre: 'El Pulso', linea: 'El estado biológico del soporte humano.', dominios: [
        D('fuel', 'Combustible', 'Calidad de nutrientes e hidratación'),
        D('motion', 'Movimiento', 'Actividad física regular'),
        D('sleep', 'Sueño', 'Calidad del descanso y ciclos circadianos'),
        D('stress-load', 'Carga de Estrés', 'Tolerancia neurológica y física a la presión'),
        D('maintenance', 'Mantenimiento', 'Cuidado médico preventivo')
      ] },
      { id: 'figure', nombre: 'La Estampa', linea: 'La proyección visual, estética y postural.', dominios: [
        D('grooming', 'Aseo Personal', 'Higiene y pulimiento básico del cuerpo'),
        D('presentation', 'Presentación', 'Códigos de vestimenta que proyectan identidad'),
        D('posture', 'Postura', 'Lenguaje corporal y posición ante el entorno'),
        D('vessel-respect', 'Respeto a la Vasija', 'Relación objetiva de cuidado con la estructura física'),
        D('projection', 'Proyección', 'Magnetismo, autoridad y seguridad al exponerse')
      ] },
      { id: 'refuge', nombre: 'El Refugio', linea: 'El orden y la sanidad del micro-entorno físico.', dominios: [
        D('order', 'Orden', 'Organización visual del espacio para optimizar el enfoque'),
        D('cleanliness', 'Limpieza', 'Sanidad física del hábitat'),
        D('habitat', 'Hábitat', 'Calidad de luz, ventilación y espacio arquitectónico'),
        D('aesthetics', 'Estética', 'Belleza del entorno para estimular la creatividad'),
        D('ergonomics', 'Ergonomía', 'Herramientas físicas optimizadas contra la fatiga')
      ] }
    ]
  },
  {
    id: 'base', nombre: 'La Base', color: '#2D4962', icono: '/assets/fraterni/ejes/base.svg',
    gobierna: 'Recursos tangibles, tiempo y oficio: existe para dar sustento físico al Centro.',
    areas: [
      { id: 'vocation', nombre: 'El Oficio', linea: 'Posicionamiento y sofisticación de la actividad productiva.', dominios: [
        D('positioning', 'Posicionamiento', 'Ubicación en el mercado según ventajas competitivas'),
        D('mastery', 'Maestría', 'Sofisticación y filo de las habilidades técnicas'),
        D('drive', 'Empuje', 'La fuerza interna que impulsa la ejecución diaria'),
        D('fulfillment', 'Realización', 'El gozo que produce el trabajo de tus manos'),
        D('contribution', 'Contribución', 'Impacto real y medible del oficio en la sociedad')
      ] },
      { id: 'reserve', nombre: 'La Reserva', linea: 'El gobierno de la salud y el almacenamiento financiero.', dominios: [
        D('inflow', 'Flujo de Entrada', 'Flujo constante y diversificado de ingresos'),
        D('retention', 'Retención', 'Administrar el recurso sin filtraciones pasivas'),
        D('multiplication', 'Multiplicación', 'Excedentes colocados en activos productivos'),
        D('liabilities', 'Pasivos', 'Control y desmantelamiento de deudas que quitan autonomía'),
        D('stability', 'Estabilidad', 'Fondo de contingencia para inviernos económicos')
      ] },
      { id: 'rhythm', nombre: 'El Ritmo', linea: 'Tiempo, energía y ciclos biológicos.', dominios: [
        D('allocation', 'Asignación', 'Distribución deliberada del tiempo según prioridades'),
        D('immersion', 'Inmersión', 'Concentración profunda y enfoque radical sin distracciones'),
        D('cadence', 'Cadencia', 'Ritmo constante que evite el agotamiento crónico'),
        D('vitality', 'Vitalidad', 'Energía disponible para ejecutar el día'),
        D('recovery', 'Recuperación', 'Descanso estratégico para reiniciar el sistema cognitivo')
      ] }
    ]
  }
];
/* (El orden de los ejes es el de la RUEDA, en el sentido del reloj desde arriba a la izquierda:
   Centro, Lazo, Entorno, Base: así lo dibujó el fundador en su rueda de la vida.) */

/* Los 60, en el orden de la rueda, cada uno con su eje y su área */
export const DOMINIOS = EJES.flatMap((e) => e.areas.flatMap((a) => a.dominios.map((d) => ({ ...d, eje: e.id, area: a.id }))));
export const IDS_DOMINIOS = DOMINIOS.map((d) => d.id);
export const dominioDe = (id) => DOMINIOS.find((d) => d.id === id) || null;
export const ejeDe = (id) => EJES.find((e) => e.id === id) || null;
export const areaDe = (id) => { for (const e of EJES) { const a = e.areas.find((x) => x.id === id); if (a) return a; } return null; };

/* Lo que NO son casillas: se muestran aparte, con lo que dice su símbolo (iconografia-del-sistema) */
export const PRINCIPIOS = [
  { id: 'proposito', nombre: 'Propósito', simbolo: 'El Yugo', linea: 'Unifica fuerzas en una dirección.', icono: '/assets/fraterni/principios/proposito.svg' },
  { id: 'caracter', nombre: 'Carácter', simbolo: 'La Montaña', linea: 'Encuentro, prueba y revelación.', icono: '/assets/fraterni/principios/caracter.svg' },
  { id: 'presencia', nombre: 'Presencia', simbolo: 'La Lámpara de Aceite', linea: 'Vigilancia: el aceite se consume.', icono: '/assets/fraterni/principios/presencia.svg' },
  { id: 'conciencia', nombre: 'Conciencia', simbolo: 'El Pozo de Agua', linea: 'Extracción de lo profundo.', icono: '/assets/fraterni/principios/conciencia.svg' }
];
export const PERMANENTES = [
  { id: 'fe', nombre: 'Fe', simbolo: 'La Cruz', linea: 'Sacrificio y cimiento absoluto.', icono: '/assets/fraterni/permanentes/fe.svg' },
  { id: 'esperanza', nombre: 'Esperanza', simbolo: 'El Ancla', linea: 'Amarre tras el velo: tracción, no freno.', icono: '/assets/fraterni/permanentes/esperanza.svg' },
  { id: 'amor', nombre: 'Amor', simbolo: 'El Corazón Monolítico', linea: 'Motor inamovible: el filtro final sobre las sesenta.', icono: '/assets/fraterni/permanentes/amor.svg' }
];

/* Las dos piezas del interruptor (del fundador): la cruz (cargué mi cruz) y la moneda (no la cargué) */
export const FICHAS = {
  cargue: '/assets/fraterni/tablero/cruz.svg',
  noCargue: '/assets/fraterni/tablero/moneda.svg'
};

/* LA RUEDA (sistema del dibujo: 720 × 720, el centro en 360, 360). Cada eje ocupa un cuarto; cada área, un
   tercio de su cuarto (30°); cada dominio, un anillo (de adentro hacia afuera). Los grados van en el sentido
   del reloj desde las 12 en punto (0 = arriba): el Centro es el cuarto de arriba a la izquierda (270°–360°). */
export const RUEDA = { lado: 720, centro: 360, hueco: 82, borde: 344, separacion: 3, anillos: 5 };
export const INICIO_EJE = { center: 270, bond: 0, terrain: 90, base: 180 };

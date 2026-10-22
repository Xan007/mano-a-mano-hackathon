export type Capsule = {
  slug: string;
  kind: "true_false" | "channel" | "fact";
  title: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
  sourceDate: string;
};

export const CAPSULES: Capsule[] = [
  {
    slug: "linea-106-costo",
    kind: "true_false",
    title: "¿Verdadero o mito?",
    prompt: "Llamar a la línea 106 cuesta dinero.",
    options: ["Verdadero", "Mito"],
    answer: "Mito",
    explanation: "La línea 106 es gratuita y atiende 24/7. No tienes que dar tu nombre.",
    source: "Directorio de salud mental y prevención del suicidio, MinSalud",
    sourceDate: "2026-10-19",
  },
  {
    slug: "yo-te-escucho-canal",
    kind: "channel",
    title: "Elige el canal",
    prompt: "Camila entra a primer semestre y quiere hablar con alguien hoy, sin dar sus datos. ¿Cuál canal le sirve?",
    options: ["Línea 106", "Yo Te Escucho (WhatsApp)", "Un grupo público de redes"],
    answer: "Yo Te Escucho (WhatsApp)",
    explanation: "Yo Te Escucho atiende por llamada y WhatsApp, 24/7, sin pedirte datos personales. Un grupo público no protege lo que cuentas.",
    source: "Alcaldía de Villavicencio",
    sourceDate: "2026-10-19",
  },
  {
    slug: "ayudar-a-un-amigo",
    kind: "fact",
    title: "Dato rápido",
    prompt: "¿Qué puedes hacer si un amigo te cuenta que la está pasando mal?",
    options: ["Escucharlo sin juzgar y compartirle la línea 106", "Decirle que no es para tanto", "Contarlo en el grupo del curso"],
    answer: "Escucharlo sin juzgar y compartirle la línea 106",
    explanation: "Escuchar sin juzgar y ofrecer un canal verificado es la forma más segura de acompañar.",
    source: "Directorio de salud mental y prevención del suicidio, MinSalud",
    sourceDate: "2026-10-19",
  },
  {
    slug: "linea-nacional",
    kind: "fact",
    title: "Dato rápido",
    prompt: "¿Existe una línea nacional gratuita de salud mental además del 106?",
    options: ["Sí, 01 8000 931 089", "No, solo el 106", "Solo en Bogotá"],
    answer: "Sí, 01 8000 931 089",
    explanation: "El Ministerio de Salud publica la línea nacional 01 8000 931 089 junto a la línea 106.",
    source: "Directorio de salud mental y prevención del suicidio, MinSalud",
    sourceDate: "2026-10-19",
  },
];

export const DEFAULT_CAPSULE = CAPSULES[0];

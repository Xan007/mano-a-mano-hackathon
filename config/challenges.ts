export type Challenge = {
  id: string;
  category: string;
  format: "mito" | "canal" | "pasos" | "caso" | "privacidad" | "costo";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
  sourceDate: string;
  difficulty: 1 | 2 | 3;
};

export const CHALLENGES: Challenge[] = [
  {
    id: "mito-hablar",
    category: "Mitos",
    format: "mito",
    prompt: "Hablar del suicidio con cuidado aumenta el riesgo. ¿Verdadero o mito?",
    options: ["Verdadero", "Mito"],
    answer: "Mito",
    explanation:
      "Preguntar y escuchar sin juzgar no aumenta el riesgo; puede abrir la puerta para pedir ayuda.",
    source: "Organización Mundial de la Salud",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "canal-106",
    category: "Líneas y canales",
    format: "canal",
    prompt: "Necesitas orientación en salud mental ahora y no quieres dar tus datos. ¿Qué canal sirve?",
    options: ["Línea 106", "Un grupo público de redes", "La cartelera del barrio"],
    answer: "Línea 106",
    explanation:
      "La Línea 106 atiende 24/7, es gratuita y no exige identificarte para orientarte.",
    source: "MinSalud",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "canal-whatsapp",
    category: "Líneas y canales",
    format: "canal",
    prompt: "Una persona prefiere escribir por WhatsApp en vez de llamar. ¿Qué servicio de Villavicencio le sirve?",
    options: ["Yo Te Escucho", "Línea 106", "Ninguno, solo hay llamadas"],
    answer: "Yo Te Escucho",
    explanation:
      "Yo Te Escucho atiende por llamada y WhatsApp las 24 horas, sin pedir datos personales.",
    source: "Alcaldía de Villavicencio",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "pasos-amigo",
    category: "Cómo acompañar",
    format: "pasos",
    prompt: "Ordena el primer paso si un amigo te cuenta que lo está pasando mal.",
    options: [
      "Escuchar sin juzgar y preguntar cómo se siente",
      "Contarle a todo el curso",
      "Decirle que no es para tanto",
    ],
    answer: "Escuchar sin juzgar y preguntar cómo se siente",
    explanation:
      "Escuchar es el primer paso. Después puedes acompañarlo a buscar un canal verificado.",
    source: "Organización Panamericana de la Salud",
    sourceDate: "2026-10-19",
    difficulty: 2,
  },
  {
    id: "privacidad-datos",
    category: "Privacidad",
    format: "privacidad",
    prompt: "¿Qué dato NO necesitas dar para recibir orientación en una línea de ayuda?",
    options: ["Tu nombre completo", "Lo que sientes", "Tu edad, si quieres"],
    answer: "Tu nombre completo",
    explanation:
      "El nombre no es obligatorio. Puedes contar lo que sientes sin identificarte.",
    source: "MinSalud",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "mito-debilidad",
    category: "Mitos",
    format: "mito",
    prompt: "Pedir ayuda es una señal de debilidad. ¿Verdadero o mito?",
    options: ["Verdadero", "Mito"],
    answer: "Mito",
    explanation:
      "Pedir ayuda es una señal de fortaleza y puede evitar que el malestar crezca.",
    source: "Organización Mundial de la Salud",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "costo-106",
    category: "Líneas y canales",
    format: "costo",
    prompt: "¿Cuánto cuesta llamar a la Línea 106?",
    options: ["Tiene costo según el plan", "Es gratis"],
    answer: "Es gratis",
    explanation:
      "Las líneas de salud mental del país son gratuitas. No necesitas saldo ni plan de datos.",
    source: "MinSalud",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "caso-secreto",
    category: "Cómo acompañar",
    format: "caso",
    prompt: "Una amiga te pide guardar en secreto que quiere hacerse daño. ¿Qué haces?",
    options: [
      "Guardar el secreto y no decir nada",
      "Escucharla y buscar ayuda con ella, aunque se enoje",
      "Contarlo en el grupo",
    ],
    answer: "Escucharla y buscar ayuda con ella, aunque se enoje",
    explanation:
      "Si hay riesgo, acompañar a buscar ayuda importa más que el secreto. No la dejes sola.",
    source: "Organización Panamericana de la Salud",
    sourceDate: "2026-10-19",
    difficulty: 3,
  },
  {
    id: "pasos-preguntar",
    category: "Señales",
    format: "pasos",
    prompt: "¿Cuál es una forma segura de preguntar si alguien piensa en hacerse daño?",
    options: [
      "Preguntar directo y con calma si está pensando en eso",
      "No preguntar para no darle ideas",
      "Preguntarle solo a sus amigos",
    ],
    answer: "Preguntar directo y con calma si está pensando en eso",
    explanation:
      "Preguntar de forma directa y tranquila puede ayudar a que la persona hable y reciba apoyo.",
    source: "Organización Mundial de la Salud",
    sourceDate: "2026-10-19",
    difficulty: 2,
  },
  {
    id: "privacidad-whatsapp",
    category: "Privacidad",
    format: "privacidad",
    prompt: "¿Qué es lo más seguro si necesitas ayuda y no quieres que otras personas se enteren?",
    options: [
      "Escribir a un canal de ayuda confidencial",
      "Publicarlo en una historia pública",
      "Contarlo en un grupo grande",
    ],
    answer: "Escribir a un canal de ayuda confidencial",
    explanation:
      "Los canales de ayuda manejan la conversación de forma reservada; una red pública no protege lo que cuentas.",
    source: "Alcaldía de Villavicencio",
    sourceDate: "2026-10-19",
    difficulty: 2,
  },
  {
    id: "mito-datos",
    category: "Mitos",
    format: "mito",
    prompt: "Para llamar a una línea de ayuda te obligan a dar tu dirección. ¿Verdadero o mito?",
    options: ["Verdadero", "Mito"],
    answer: "Mito",
    explanation:
      "No necesitas dar tu dirección para recibir orientación. Puedes dar solo lo que quieras.",
    source: "MinSalud",
    sourceDate: "2026-10-19",
    difficulty: 1,
  },
  {
    id: "caso-escuchar",
    category: "Cómo acompañar",
    format: "caso",
    prompt: "Un compañero está pasando por un duelo y se aísla. ¿Qué gesto ayuda más?",
    options: [
      "Invitarlo a caminar y escucharlo sin aconsejar",
      "Decirle que ya debería superarlo",
      "Evitarlo para no incomodarlo",
    ],
    answer: "Invitarlo a caminar y escucharlo sin aconsejar",
    explanation:
      "Acompañar sin apurar el duelo ayuda. No hace falta tener las palabras perfectas.",
    source: "Organización Mundial de la Salud",
    sourceDate: "2026-10-19",
    difficulty: 2,
  },
];

export function challengesForDay(day: string): Challenge[] {
  const stamp = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const total = CHALLENGES.length;
  const start = ((stamp * 3) % total + total) % total;
  return [0, 1, 2].map((offset) => CHALLENGES[(start + offset) % total]);
}

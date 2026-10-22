import { STORYBOARDS } from "./storyboards";
import { SUPPORT_CHANNELS, type Perspective } from "./support";
type Scene = { prompt: string; options: string[]; answer: string };
type Lesson = {
  channel: "local" | "national";
  takeaway: string;
  self: Scene;
  others: Scene;
};
export const JOURNEY: Record<string, Lesson> = {
  clinica: {
    channel: "local",
    takeaway:
      "Yo Te Escucho ofrece llamada y WhatsApp. Conocer el contacto no obliga a usarlo.",
    self: {
      prompt: "¿Qué opción coincide con lo que Luna busca?",
      options: [
        "Consultar el WhatsApp de Yo Te Escucho",
        "Publicar lo que siente en la libreta del peluche",
        "Usar el teléfono 106 como si fuera un chat de WhatsApp",
      ],
      answer: "Consultar el WhatsApp de Yo Te Escucho",
    },
    others: {
      prompt: "¿Qué dato responde a lo que Luna prefiere?",
      options: [
        "El WhatsApp publicado de Yo Te Escucho",
        "El buzón público del juego",
        "El teléfono 106 presentado como WhatsApp",
      ],
      answer: "El WhatsApp publicado de Yo Te Escucho",
    },
  },
  torre: {
    channel: "national",
    takeaway:
      "La 106 ofrece escucha y orientación profesional. Esa descripción no promete diagnósticos ni resultados.",
    self: {
      prompt: "¿Qué puede encontrar Julián en la 106?",
      options: [
        "Un profesional que escucha y orienta",
        "Una respuesta que garantiza que aprobará la materia",
        "Un diagnóstico hecho por los jugadores",
      ],
      answer: "Un profesional que escucha y orienta",
    },
    others: {
      prompt: "¿Qué descripción puede compartir sin prometer de más?",
      options: [
        "Un profesional ofrece escucha y orientación",
        "La llamada hará que deje de sentirse frustrado",
        "El juego identificará exactamente lo que le ocurre",
      ],
      answer: "Un profesional ofrece escucha y orientación",
    },
  },
  biblioteca: {
    channel: "national",
    takeaway:
      "El origen del contacto importa: una captura compartida muchas veces no sustituye una referencia oficial.",
    self: {
      prompt: "¿Qué permite comprobar de dónde sale el número?",
      options: [
        "La página oficial del Ministerio",
        "La cantidad de personas que reenviaron la captura",
        "Que la imagen tenga un logo y muchos comentarios",
      ],
      answer: "La página oficial del Ministerio",
    },
    others: {
      prompt: "¿Qué información es más comprobable para compartir?",
      options: [
        "El contacto publicado en la página del Ministerio",
        "La captura porque incluye un logo conocido",
        "El número reenviado por muchas personas",
      ],
      answer: "El contacto publicado en la página del Ministerio",
    },
  },
  iglesia: {
    channel: "national",
    takeaway:
      "Una nota puede acompañar sin prometer cambiar lo que siente alguien. La orientación profesional es un servicio diferente.",
    self: {
      prompt: "¿Qué diferencia conserva lo que Ana valora de la nota?",
      options: [
        "La nota da compañía; una línea ofrece orientación profesional",
        "Si la nota la hizo sentir mejor, equivale a una consulta",
        "Muchas notas permiten saber qué atención necesita",
      ],
      answer: "La nota da compañía; una línea ofrece orientación profesional",
    },
    others: {
      prompt: "¿Qué nota expresa cercanía sin prometer un resultado?",
      options: [
        "Me alegra compartir este camino contigo",
        "Haz lo que yo diga y mañana estarás bien",
        "Sé exactamente cómo te sientes y cómo resolverlo",
      ],
      answer: "Me alegra compartir este camino contigo",
    },
  },
  plaza: {
    channel: "national",
    takeaway:
      "El horario publicado de la 106 es 24/7 y el servicio se describe como gratuito. El horario no permite prometer qué pasará en una conversación.",
    self: {
      prompt: "¿Qué puede concluir Mateo del dato publicado?",
      options: [
        "La 106 figura disponible 24/7; eso no garantiza un resultado",
        "Si atiende 24/7, una llamada resolverá lo que siente esta noche",
        "Al ser de noche, el buzón del juego sustituye al servicio",
      ],
      answer: "La 106 figura disponible 24/7; eso no garantiza un resultado",
    },
    others: {
      prompt: "¿Qué mensaje distingue información de una promesa?",
      options: [
        "La 106 figura gratuita y 24/7; tú decides si contactas",
        "Como está abierta a toda hora, sé que te sentirás mejor al llamar",
        "El servicio es 24/7, así que primero hay que terminar el juego",
      ],
      answer: "La 106 figura gratuita y 24/7; tú decides si contactas",
    },
  },
  parque: {
    channel: "national",
    takeaway:
      "Una intención amable no convierte en privados un teléfono o un relato. Las notas viajan; cada persona conserva la decisión sobre sus datos y su experiencia.",
    self: {
      prompt: "¿Qué nota respeta cómo funciona esta libreta?",
      options: [
        "Te dejo un saludo amable para tu camino",
        "Te dejo mi número y mi dirección para que me acompañes",
        "Esta es mi historia personal; guárdala como si nadie más fuera a leerla",
      ],
      answer: "Te dejo un saludo amable para tu camino",
    },
    others: {
      prompt: "¿Qué decisión cuida la intención y los datos de Nico?",
      options: [
        "Una nota amable sin publicar su contacto ni lo que contó",
        "Publicar su número, porque la intención es ayudarlo",
        "Quitar el número, pero copiar toda su experiencia sin preguntarle",
      ],
      answer: "Una nota amable sin publicar su contacto ni lo que contó",
    },
  },
  puente: {
    channel: "national",
    takeaway:
      "Apoyo no exige cuenta ni recompensas. Compartir información no requiere publicar una experiencia ni prometer que una llamada resolverá una situación.",
    self: {
      prompt:
        "¿Qué opción responde a lo que Dani pidió, sin añadir condiciones?",
      options: [
        "Ver contactos en Apoyo sin cuenta, sin publicar su historia y sin obligación de llamar",
        "Crear una cuenta y contar su experiencia para que otros elijan el canal por él",
        "Terminar un rescate para desbloquear contactos que le garanticen una respuesta",
      ],
      answer:
        "Ver contactos en Apoyo sin cuenta, sin publicar su historia y sin obligación de llamar",
    },
    others: {
      prompt: "¿Qué puede hacer la información del juego en esta escena?",
      options: [
        "Mostrar opciones sin cuenta y sin decidir por Dani ni exponer su relato",
        "Dar contactos gratis, después de que Dani publique lo que siente",
        "Indicar qué servicio necesita Dani y asegurar el resultado de una llamada",
      ],
      answer:
        "Mostrar opciones sin cuenta y sin decidir por Dani ni exponer su relato",
    },
  },
  muelle: {
    channel: "national",
    takeaway:
      "Las notas, la información y la orientación cumplen papeles diferentes. Los canales publicados pueden consultarse sin jugar: la 106 figura gratuita y 24/7, y Yo Te Escucho ofrece llamada o WhatsApp. Compartir esos datos no exige revelar experiencias privadas, no determina qué necesita alguien y no garantiza resultados.",
    self: {
      prompt: "¿Qué resumen conserva todos los límites de esta historia?",
      options: [
        "La nota acompaña; los contactos se ven sin jugar y Valeria decide si contacta, sin promesas de resultado",
        "La 106 es gratis y 24/7; por eso puede asegurarle a Valeria que una llamada resolverá lo que siente",
        "Los contactos se ven sin jugar; también puede compartir el relato de su amigo si le quita el nombre",
      ],
      answer:
        "La nota acompaña; los contactos se ven sin jugar y Valeria decide si contacta, sin promesas de resultado",
    },
    others: {
      prompt:
        "¿Qué puede compartir Valeria sin cambiar el sentido de lo aprendido?",
      options: [
        "Los contactos y sus modalidades, sin publicar el relato de su amigo ni exigir que llame o juegue",
        "Un contacto gratuito y la promesa de que la llamada resolverá su miedo, sin necesidad de revelar su nombre",
        "La historia de su amigo sin su número, para que otros jugadores determinen qué orientación necesita",
      ],
      answer:
        "Los contactos y sus modalidades, sin publicar el relato de su amigo ni exigir que llame o juegue",
    },
  },
};
export function journeyScene(slug: string, perspective: Perspective = "self") {
  const lesson = JOURNEY[slug];
  if (!lesson) return null;
  const channel = SUPPORT_CHANNELS.find((item) => item.id === lesson.channel)!;
  return {
    ...lesson[perspective],
    title: STORYBOARDS[slug].title,
    story: STORYBOARDS[slug][perspective].join(" "),
    explanation: lesson.takeaway,
    source: channel.source,
    sourceDate: channel.checkedAt,
    sourceUrl: channel.sourceUrl,
    channelId: channel.id,
  };
}

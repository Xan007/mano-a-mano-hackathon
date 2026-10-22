export const OWNER_EMAIL = "sierrasander29@gmail.com";
export const LIVE_HOLD_MS = 60 * 60 * 1000;
export const DEMO_HOLD_MS = 3 * 60 * 1000;
export const DEMO_PASS_MS = 18_000;
export const DEMO_MAILBOX_COOLDOWN_MS = 60_000;
export const DELIVERY_WAIT_MS = 48 * 60 * 60 * 1000;
export const DELIVERY_RETRY_MIN_MS = 5 * 60 * 1000;
export const DELIVERY_RETRY_MAX_MS = 60 * 60 * 1000;
export const NOTE_MAX_CHARS = 360;

export const DEMO_PEOPLE = [
  { alias: "Nube de mango", companion: "chiguiro", cover: "cerezo", effect: "corazones" },
  { alias: "Cometa violeta", companion: "garza", cover: "noche", effect: "estrellas" },
  { alias: "Pan de canela", companion: "charapa", cover: "fogata", effect: "fuego" },
  { alias: "Luna de bolsillo", companion: "armadillo", cover: "lluvia", effect: "lluvia" },
  { alias: "Menta lunar", companion: "delfin-rosado", cover: "flores", effect: "aurora" },
  { alias: "Sol de domingo", companion: "venado", cover: "llano", effect: "brillos" },
] as const;

// Editorial messages for the isolated presentation environment, never live traffic.
export const DEMO_MESSAGES = [
  "A veces un día pesado ocupa tanto espacio que parece que no hubo nada más. Te dejo este pequeño rincón de papel: aquí caben tus intentos, incluso los que nadie vio. Tu valor no depende de que hoy todo haya salido bien.",
  "Este peluche salió con una nota y ya lleva varias voces en su mochila. No conocemos nuestras historias completas, pero por un momento coincidimos aquí. Me gusta pensar que una frase amable puede hacer menos frío el camino de alguien.",
  "Hay personas que iluminan un lugar sin darse cuenta: quien guarda un puesto, quien pregunta cómo estuvo el examen, quien escucha sin competir con la tristeza. Hoy quise dejar algo de esa compañía en esta libreta. Un saludo suave para ti.",
  "Me gustan los atardeceres porque no necesitan salir iguales para ser bonitos. Esta nota tampoco busca una respuesta perfecta. Es solamente un recordatorio de que tu voz merece un lugar y tus emociones merecen respeto, incluso cuando cuesta explicarlas.",
  "Entre el ruido del bus, los trabajos pendientes y los mensajes sin contestar, este peluche encontró una pausa. Aquí va un abrazo de papel, sin preguntas difíciles y sin promesas enormes. Ojalá este pequeño encuentro te deje una sonrisa.",
  "No sé qué fue lo más difícil de tu semana. Sí sé que detrás de cada apodo hay una persona con días distintos. Por eso dejo estas palabras con cariño: no hace falta ganar una carrera invisible para merecer un trato amable.",
  "Esta libreta no conoce tus notas del colegio ni cuántas cosas resolviste hoy. Aquí no hay una clasificación de quién merece más compañía. Hay un peluche viajero y una persona que quiso escribirte algo bonito. Ese es todo el motivo de este mensaje.",
  "Una estrella pequeña también se ve cuando el cielo está oscuro. Me gusta esa imagen para los gestos que parecen mínimos: un saludo, un gracias, una conversación sin burlas. Esta nota quiere ser uno de esos gestos, aunque solo nos crucemos un momento.",
  "Hoy este amigo de tela pasó por mis manos y pensé en todas las personas que todavía va a conocer. Cada una dejará algo diferente. Tu forma de sentir y de contar las cosas también tiene espacio en este mundo, sin tener que parecerse a la de nadie más.",
  "Hay días en que celebramos algo grande y otros en que apenas llegamos al final. Ambos días forman parte de la misma persona. Te mando una frase sencilla, con estrellas de fondo: tu historia es más amplia que el momento que estás viviendo.",
  "Este mensaje viene con flores porque las palabras también pueden tener un jardín. Dejé sitio para el cansancio, para la ilusión y para esas emociones que no tienen un nombre fácil. No espero que respondas: quería que encontraras algo amable al abrir el buzón.",
  "Afuera puede seguir el tráfico y adentro puede haber mil pensamientos. Durante estos segundos hay una libreta abierta y un saludo para ti. Gracias por formar parte de este recorrido de pequeñas notas que viajan de una persona a otra.",
] as const;

export const OWNER_EMAIL = "sierrasander29@gmail.com";
export const LIVE_HOLD_MS = 60 * 60 * 1000;
export const DEMO_HOLD_MS = 3 * 60 * 1000;
export const DEMO_PASS_MS = 18_000;
export const DEMO_MAILBOX_COOLDOWN_MS = 60_000;
export const PUBLIC_DEMO_MAILBOX_COOLDOWN_MS = 24 * 60 * 60_000;
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

// Editorial messages for the demo characters, never presented as real participants.
export const DEMO_MESSAGES = [
  "Hola, recuerda que la vida no tiene que resolverse toda hoy. Espero que encuentres un ratito tranquilo para respirar y seguir a tu manera.",
  "Si estás pasándola mal, recuerda que no tienes que fingir que todo está bien. Ojalá hoy puedas darte un poco de paciencia y hablar con alguien de confianza cuando te nazca.",
  "Hola, espero que este día te esté tratando con un poquito de cariño. A veces una pausa pequeña alcanza para recuperar fuerzas y volver a intentarlo sin exigirte tanto.",
  "Si hoy te salió todo al revés, no significa que hayas fallado en todo. Hay días pesados y aun así mereces descansar, recibir cariño y empezar de nuevo cuando puedas.",
  "Recuerda que no tienes que tener las palabras perfectas para decir que necesitas compañía. Espero que encuentres a alguien con quien puedas sentirte escuchado y estar tranquilo.",
  "Hola, pasaba por aquí para desearte un momento bonito. Ojalá algo sencillo te saque una sonrisa hoy, aunque sea una canción, una conversación o un paseo corto.",
  "Si estás cansado de hacer como si nada, puedes bajar el ritmo un momento. Espero que puedas tratarte con la misma paciencia que tendrías con alguien que quieres mucho.",
  "A veces el día se siente demasiado largo y cuesta explicar por qué. No tienes que explicarlo todo ahora. Espero que encuentres un espacio seguro para descansar y ser tú.",
  "Hola, no sé cómo estuvo tu día, pero espero que aquí encuentres un poquito de calma. Lo que sientes merece ser escuchado sin burlas y sin tener que justificarlo todo.",
  "Si algo te preocupa, no tienes que cargarlo en silencio para demostrar que puedes. Ojalá puedas acercarte a alguien de confianza y permitirte pedir compañía cuando la necesites.",
  "Espero que mañana te encuentre con un poco más de aire. Y si no pasa así, también está bien. Puedes avanzar despacio, descansar y volver a intentarlo sin castigarte.",
  "Hola, recuerda que tu valor no depende de cuánto logres ni de qué tan productivo fue tu día. Espero que hoy puedas reconocer al menos una cosa pequeña que sí hiciste bien.",
] as const;

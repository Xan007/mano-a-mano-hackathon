export const STARTING_KEYS = 3;
export const KEYS_PER_LEVEL = 2;
export const DEFAULT_THEME = "papel";
export const DEFAULT_LAYOUT = "mosaico";

export const XP_PER_ACTION = {
  send: 15,
  pass: 10,
  note: 4,
  box: 8,
  capsule: 5,
  expedition: 12,
  daily: 5,
} as const;

export function levelProgress(xp: number) {
  let level = 1;
  let needed = 80;
  let remaining = Math.max(0, xp);

  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = Math.round(needed * 1.32);
  }

  return {
    level,
    current: remaining,
    needed,
    ratio: needed === 0 ? 1 : remaining / needed,
  };
}

export type MissionMetric =
  | "send_plush"
  | "notes_written"
  | "expedition_claim"
  | "box_open"
  | "plush_passed"
  | "capsule_complete";

export type MissionDef = {
  id: string;
  metric: MissionMetric;
  title: string;
  description: string;
  target: number;
  keys: number;
  xp: number;
};

export const MISSION_POOL: MissionDef[] = [
  {
    id: "send-two",
    metric: "send_plush",
    title: "Dos peluches de viaje",
    description: "Envía 2 peluches desde tu colección.",
    target: 2,
    keys: 1,
    xp: 20,
  },
  {
    id: "three-notes",
    metric: "notes_written",
    title: "Tres notas hoy",
    description: "Deja 3 notas en peluches que pasen por tus manos.",
    target: 3,
    keys: 1,
    xp: 15,
  },
  {
    id: "one-expedition",
    metric: "expedition_claim",
    title: "Una expedición",
    description: "Manda a tu mascota al mapa y reclama su tarjeta.",
    target: 1,
    keys: 1,
    xp: 20,
  },
  {
    id: "one-box",
    metric: "box_open",
    title: "Abrir una caja",
    description: "Abre una caja de peluches.",
    target: 1,
    keys: 1,
    xp: 15,
  },
  {
    id: "one-pass",
    metric: "plush_passed",
    title: "Pasar un peluche",
    description: "Recibe un peluche en el buzón y pásalo.",
    target: 1,
    keys: 1,
    xp: 15,
  },
  {
    id: "one-capsule",
    metric: "capsule_complete",
    title: "Una cápsula",
    description: "Lee y responde una cápsula antes de volver a tirar.",
    target: 1,
    keys: 1,
    xp: 10,
  },
];

export function missionsForDay(day: string): MissionDef[] {
  const stamp = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000);
  const total = MISSION_POOL.length;
  const start = ((stamp % total) + total) % total;

  return [0, 1, 2].map((offset) => MISSION_POOL[(start + offset) % total]);
}

export const DUNGEON_START_CALMA = 3;

export type DungeonOption = {
  label: string;
  wise: boolean;
  reply: string;
};

export type DungeonStep = {
  prompt: string;
  options: DungeonOption[];
};

export type DungeonStage = {
  id: string;
  name: string;
  dungeon: string;
  place: string;
  order: number;
  blurb: string;
  unlockAfter: string | null;
  keyCost: number;
  tokens: number;
  xp: number;
  keys: number;
  coverId?: string;
  mapX: number;
  mapY: number;
  steps: DungeonStep[];
};

export const DUNGEON_STAGES: DungeonStage[] = [
  {
    id: "guejar-paso",
    name: "Paso del río",
    dungeon: "Cañón del Güejar",
    place: "Cañón del Güejar",
    order: 0,
    blurb: "El primer tramo del cañón. Agua, piedras y una garza curiosa.",
    unlockAfter: null,
    keyCost: 0,
    tokens: 4,
    xp: 25,
    keys: 1,
    mapX: 0.16,
    mapY: 0.2,
    steps: [
      {
        prompt: "El río bajó crecido y las piedras del paso quedaron bajo el agua.",
        options: [
          {
            label: "Cruzar por las piedras, despacio",
            wise: true,
            reply: "Paso a paso, la mascota cruza sin mojar la mochila. El río suena fuerte, pero el camino aguanta.",
          },
          {
            label: "Cruzar por las piedras mojadas, corriendo",
            wise: false,
            reply:
              "Una piedra cede y la mascota cae al agua. La libreta se salva de milagro, pero el susto gasta calma.",
          },
        ],
      },
      {
        prompt: "Una garza se queda mirando la mochila. Hay fruta y una libreta.",
        options: [
          {
            label: "Compartir la fruta",
            wise: true,
            reply: "La garza picotea tranquila y se queda cerca un rato. Nadie se va con hambre.",
          },
          {
            label: "Dejar la mochila sola para explorar",
            wise: false,
            reply:
              "La garza curiosea la fruta y la mochila queda abierta. Recogen todo con prisa y con menos calma.",
          },
        ],
      },
      {
        prompt: "Cae la noche y una luciérnaga marca un camino entre las rocas.",
        options: [
          {
            label: "Seguir la luz sin prisa",
            wise: true,
            reply: "La luciérnaga guía hasta un claro seguro. La mascota duerme con la mochila de almohada.",
          },
          {
            label: "Apagar la luciérnaga para dormir",
            wise: false,
            reply:
              "La luz se apaga y el camino desaparece. Amanecen buscando la salida entre las rocas, con la calma corta.",
          },
        ],
      },
    ],
  },
  {
    id: "guejar-cueva",
    name: "Cueva de los vientos",
    dungeon: "Cañón del Güejar",
    place: "Cañón del Güejar",
    order: 1,
    blurb: "Una grieta que silba. Aquí las notas vuelan si no se sujetan bien.",
    unlockAfter: "guejar-paso",
    keyCost: 2,
    tokens: 5,
    xp: 30,
    keys: 1,
    coverId: "flores",
    mapX: 0.82,
    mapY: 0.16,
    steps: [
      {
        prompt: "El viento entra por la grieta y se lleva las notas de la mochila.",
        options: [
          {
            label: "Guardarlas dentro de la ruana",
            wise: true,
            reply: "Las notas quedan pegadas al pecho, a salvo. El viento se queda con las hojas secas.",
          },
          {
            label: "Perseguirlas por la cueva",
            wise: false,
            reply:
              "Una nota se cuela en un hueco y la buscan a ciegas. La rescatan, pero el viento les gasta calma.",
          },
        ],
      },
      {
        prompt: "Hay un eco que repite todo lo que dices.",
        options: [
          {
            label: "Decirle algo amable al eco",
            wise: true,
            reply: "El eco devuelve un 'gracias' que retumba bonito. La cueva se siente menos sola.",
          },
          {
            label: "Gritar para oír el eco",
            wise: false,
            reply:
              "El grito retumba en la grieta y los deja sordos un rato. El eco devuelve el susto, no la calma.",
          },
        ],
      },
      {
        prompt: "La salida está detrás de una cortina de agua.",
        options: [
          {
            label: "Cruzar juntos, tomados de la mano",
            wise: true,
            reply: "Salen empapados y riéndose. La luz de afuera pinta la cueva de colores.",
          },
          {
            label: "Cruzar la cortina de agua a ciegas",
            wise: false,
            reply:
              "Salen empapados y con el mapa hecho papilla. La salida aparece, pero la calma se queda atrás.",
          },
        ],
      },
    ],
  },
  {
    id: "recherche-bosque",
    name: "Bosque inundado",
    dungeon: "Laguna de la Recherche",
    place: "Laguna de la Recherche",
    order: 2,
    blurb: "Raíces, agua tibia y un pato carretero que siempre aparece.",
    unlockAfter: "guejar-cueva",
    keyCost: 2,
    tokens: 6,
    xp: 35,
    keys: 1,
    coverId: "lluvia",
    mapX: 0.84,
    mapY: 0.56,
    steps: [
      {
        prompt: "El agua llega a las rodillas y hay raíces por todas partes.",
        options: [
          {
            label: "Ir despacio, agarrados",
            wise: true,
            reply: "Nadie se tropieza. El bosque huele a tierra mojada y a algo dulce.",
          },
          {
            label: "Correr para salir rápido",
            wise: false,
            reply:
              "Un chapuzón inesperado y la libreta se moja. Llegan restando calma y revisando cada nota.",
          },
        ],
      },
      {
        prompt: "Un pato carretero se ofrece a llevar la mochila en su tronco.",
        options: [
          {
            label: "Aceptar el paseo",
            wise: true,
            reply: "El pato rema orgulloso. La mochila viaja seca y la mascota va mirando el reflejo de las nubes.",
          },
          {
            label: "Nadar contra la corriente para ganar tiempo",
            wise: false,
            reply:
              "La corriente los empuja y la mochila pesa. El pato los alcanza y les recuerda que no hay prisa.",
          },
        ],
      },
      {
        prompt: "En el centro hay una isla con una caja y una nota vieja.",
        options: [
          {
            label: "Abrirla con calma",
            wise: true,
            reply: "Dentro hay una tela para notas y un mensaje: 'lo que escribas también te cuida'.",
          },
          {
            label: "Forzar la caja para abrirla ya",
            wise: false,
            reply:
              "La tapa se rompe y una nota vieja casi se rasga. La abren, pero el susto les quita calma.",
          },
        ],
      },
    ],
  },
  {
    id: "serrania-filo",
    name: "Filo de la niebla",
    dungeon: "Serranía del Llano",
    place: "Serranía del Llano",
    order: 3,
    blurb: "La subida más alta. Niebla, piedra y un amanecer que se ve entero.",
    unlockAfter: "recherche-bosque",
    keyCost: 3,
    tokens: 8,
    xp: 40,
    keys: 2,
    coverId: "noche",
    mapX: 0.2,
    mapY: 0.78,
    steps: [
      {
        prompt: "La niebla tapa el sendero y no se ve más allá de tres pasos.",
        options: [
          {
            label: "Marcar el camino con piedras",
            wise: true,
            reply: "Cada piedra es una migaja. Aunque la niebla se cierre, el regreso está asegurado.",
          },
          {
            label: "Avanzar a tientas",
            wise: false,
            reply:
              "La mascota avanza sin referencias y pierde el sendero dos veces. La roca está tibia, pero la calma no.",
          },
        ],
      },
      {
        prompt: "Se oye un aullido lejos, entre las peñas.",
        options: [
          {
            label: "Responder con un silbido tranquilo",
            wise: true,
            reply: "El aullido contesta y se aleja. No era un peligro: era otro paseante de la niebla.",
          },
          {
            label: "Correr hacia el aullido",
            wise: false,
            reply:
              "Corren hacia el sonido y tropiezan con una raíz. El aullido era un perro pastor; el susto les gasta calma.",
          },
        ],
      },
      {
        prompt: "Amanece y el Llano aparece entero abajo, como un mapa de verdad.",
        options: [
          {
            label: "Sacar la libreta y escribir",
            wise: true,
            reply: "La nota queda escrita con luz de amanecer. Es la que más ganas da de regalar.",
          },
          {
            label: "Bajar corriendo antes de que cierre la niebla",
            wise: false,
            reply:
              "Bajan deprisa, sin anclar el camino. La niebla se cierra y pierden la ruta; la calma también se va.",
          },
        ],
      },
    ],
  },
];

export type NoteThemeDef = {
  id: string;
  name: string;
  description: string;
  cost: number;
};

export const NOTE_THEMES: NoteThemeDef[] = [
  { id: "papel", name: "Papel", description: "Crema y tinta azul, como una carta.", cost: 0 },
  { id: "noche", name: "Noche llanera", description: "Fondo azul profundo y letra clara.", cost: 2 },
  { id: "menta", name: "Menta", description: "Verde suave para notas tranquilas.", cost: 2 },
  { id: "oro", name: "Oro", description: "Papel dorado de las expediciones altas.", cost: 3 },
];

export type NoteLayoutDef = {
  id: string;
  name: string;
  description: string;
  cost: number;
};

export const NOTE_LAYOUTS: NoteLayoutDef[] = [
  { id: "mosaico", name: "Mosaico", description: "Dos columnas de tarjetas de color.", cost: 0 },
  { id: "postits", name: "Post-its", description: "Notas sueltas y giradas, como en una mesa.", cost: 0 },
  { id: "lista", name: "Lista", description: "Una nota debajo de otra, fácil de leer.", cost: 1 },
];

export function stageById(id: string) {
  return DUNGEON_STAGES.find((stage) => stage.id === id) ?? null;
}

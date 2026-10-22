import type { Rarity } from "./game";

export type Companion = {
  id: string;
  name: string;
  imagePath: string;
  blurb: string;
};

export const COMPANIONS: Companion[] = [
  { id: "chiguiro", name: "Chigüiro", imagePath: "/plush/chiguiro.webp", blurb: "Tranquilo, siempre con hambre" },
  { id: "garza", name: "Garza blanca", imagePath: "/plush/garza.webp", blurb: "Elegante y observadora" },
  { id: "charapa", name: "Tortuga charapa", imagePath: "/plush/charapa.webp", blurb: "Paciente, va sin prisa" },
  { id: "armadillo", name: "Armadillo", imagePath: "/plush/armadillo.webp", blurb: "Tímido pero curioso" },
  { id: "pato-carretero", name: "Pato carretero", imagePath: "/plush/pato-carretero.webp", blurb: "Pícaro y conversador" },
  { id: "venado", name: "Venado", imagePath: "/plush/venado.webp", blurb: "Dulce y atento" },
  { id: "delfin-rosado", name: "Delfín rosado", imagePath: "/plush/delfin-rosado.webp", blurb: "Coqueto y juguetón" },
  { id: "araguato", name: "Araguato", imagePath: "/plush/araguato.webp", blurb: "Alegre, nunca calla" },
];

export const COMPANION_IDS = COMPANIONS.map((companion) => companion.id);

export type CatalogEntry = {
  slug: string;
  species: string;
  rarity: Rarity;
  outfit: string;
  imagePath: string;
};

export const PLUSH_CATALOG: CatalogEntry[] = [
  { slug: "chiguiro", species: "Chigüiro", rarity: "comun", outfit: "Sombrero llanero, medio sonriente y tranquilo", imagePath: "/plush/chiguiro.webp" },
  { slug: "garza", species: "Garza blanca", rarity: "comun", outfit: "Pañuelo rojo, elegante", imagePath: "/plush/garza.webp" },
  { slug: "charapa", species: "Tortuga charapa", rarity: "comun", outfit: "Mochila tejida, paciente", imagePath: "/plush/charapa.webp" },
  { slug: "armadillo", species: "Armadillo", rarity: "comun", outfit: "Ruana pequeña, tímido", imagePath: "/plush/armadillo.webp" },
  { slug: "pato-carretero", species: "Pato carretero", rarity: "comun", outfit: "Botas amarillas, pícaro", imagePath: "/plush/pato-carretero.webp" },
  { slug: "venado", species: "Venado", rarity: "comun", outfit: "Corona de flores, dulce", imagePath: "/plush/venado.webp" },
  { slug: "delfin-rosado", species: "Delfín rosado", rarity: "raro", outfit: "Gafas y collar de flores, coqueto", imagePath: "/plush/delfin-rosado.webp" },
  { slug: "araguato", species: "Araguato", rarity: "raro", outfit: "Sombrero y maracas, alegre", imagePath: "/plush/araguato.webp" },
  { slug: "corocora", species: "Corocora", rarity: "raro", outfit: "Gafas de aviador, dramático", imagePath: "/plush/corocora.webp" },
  { slug: "nutria", species: "Nutria gigante", rarity: "raro", outfit: "Bufanda de pescador, travieso", imagePath: "/plush/nutria.webp" },
  { slug: "guacamaya", species: "Guacamaya roja", rarity: "raro", outfit: "Cuatro llanero en miniatura, hablador", imagePath: "/plush/guacamaya.webp" },
  { slug: "danta", species: "Danta", rarity: "epico", outfit: "Ruana bordada, soñadora", imagePath: "/plush/danta.webp" },
  { slug: "caiman", species: "Caimán llanero", rarity: "epico", outfit: "Chaleco de joropo, seguro", imagePath: "/plush/caiman.webp" },
  { slug: "anaconda", species: "Anaconda verde", rarity: "epico", outfit: "Pañuelo con adornos, misteriosa", imagePath: "/plush/anaconda.webp" },
  { slug: "puma", species: "Puma", rarity: "epico", outfit: "Capa de coleador de satín, enfocado", imagePath: "/plush/puma.webp" },
  { slug: "oso-palmero", species: "Oso palmero", rarity: "legendario", outfit: "Liquiliqui dorado, noble", imagePath: "/plush/oso-palmero.webp" },
  { slug: "jaguar", species: "Jaguar", rarity: "legendario", outfit: "Capa bordada en oro y corona de plumas", imagePath: "/plush/jaguar.webp" },
  { slug: "chiguiro-rey", species: "Chigüiro rey", rarity: "legendario", outfit: "Corona, capa de terciopelo y trono, orgulloso", imagePath: "/plush/chiguiro-rey.webp" },
];

export const NPC_PLAYERS = [
  { alias: "Luna del Llano", companion: "nutria" },
  { alias: "Camilo del Güejar", companion: "garza" },
  { alias: "Salomé de la Vega", companion: "chiguiro" },
  { alias: "Manuel del Caney", companion: "venado" },
  { alias: "Isabela de la Sierra", companion: "charapa" },
  { alias: "Tomás de Arauca", companion: "araguato" },
  { alias: "Mariana del Río", companion: "pato-carretero" },
  { alias: "Nicolás de Agua Verde", companion: "delfin-rosado" },
  { alias: "Antonia de la Selva", companion: "armadillo" },
  { alias: "Emilio del Amanecer", companion: "garza" },
];

export const NPC_NOTES = [
  "Ojalá hoy te trates con cariño.",
  "No tienes que poder con todo hoy. Aquí sigo.",
  "Gracias por pasar este peluche. Te mando un abrazo.",
  "Si hoy pesa, habla con alguien. La línea 106 es gratis.",
  "Me gustó leerte. No estás solo en esto.",
  "Un día a la vez también cuenta.",
  "Descansa cuando lo necesites, no es rendirse.",
  "Que esta nota te encuentre bien.",
  "Pedir ayuda también es de valientes.",
  "Tu mascota llanera te manda fuerzas.",
];

export function companionById(id: string | undefined) {
  return COMPANIONS.find((companion) => companion.id === id) ?? null;
}

export function catalogBySlug(slug: string | undefined) {
  return PLUSH_CATALOG.find((entry) => entry.slug === slug) ?? null;
}

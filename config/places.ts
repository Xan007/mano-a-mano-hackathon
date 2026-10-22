import { CITY_TERRITORIES } from "./cityMap";
import { journeyScene } from "./journey";
import { SUPPORT_CHANNELS } from "./support";

export type PlaceCapsule = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
  sourceDate: string;
};

export type PlaceSeed = {
  slug: string;
  name: string;
  kind: string;
  whatItIs: string;
  cost: string;
  howToContact: string;
  hours: string;
  whatHappens: string;
  source: string;
  sourceDate: string;
  story: string;
  challengeLabel: string;
  phone?: string;
  whatsapp?: string;
  mapX: number;
  mapY: number;
  anchorX: number;
  anchorY: number;
  sortOrder: number;
  capsule: PlaceCapsule;
};

export const PLACE_CAPSULE_MIN_READ_MS = 3000;
export const PLACE_FIRST_TOKENS = 3;
export const PLACE_REPEAT_TOKENS = 1;
export const PLACE_REPEAT_REWARD_LIMIT = 3;

const LOCATIONS = CITY_TERRITORIES;

export const PLACES: PlaceSeed[] = LOCATIONS.map((place, sortOrder) => {
  const scene = journeyScene(place.slug)!;
  const channel = SUPPORT_CHANNELS.find((item) => item.id === scene.channelId)!;
  const realChannel = false; // Lugares de una ficción urbana, nunca sedes de los canales.
  return {
    slug: place.slug,
    name: place.name,
    kind: realChannel ? "linea" : "capsula",
    story: scene.story,
    challengeLabel: scene.title,
    whatItIs: realChannel ? channel.description : scene.explanation,
    whatHappens: realChannel ? channel.offers : scene.explanation,
    cost: realChannel ? channel.cost : "Gratis",
    hours: realChannel ? channel.hours : "Historia disponible en el juego",
    howToContact: realChannel ? channel.contact : "Explorar la historia",
    source: channel.source,
    sourceDate: channel.checkedAt,
    ...(realChannel
      ? {
          phone: channel.phone,
          ...(channel.whatsapp ? { whatsapp: channel.whatsapp } : {}),
        }
      : {}),
    mapX: place.x,
    mapY: place.y,
    anchorX: place.ax,
    anchorY: place.ay,
    sortOrder,
    capsule: {
      prompt: scene.prompt,
      options: scene.options,
      answer: scene.answer,
      explanation: scene.explanation,
      source: scene.source,
      sourceDate: scene.sourceDate,
    },
  };
});

export function placeBySlug(slug: string): PlaceSeed | null {
  return PLACES.find((place) => place.slug === slug) ?? null;
}

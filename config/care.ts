export const NOTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const NOTE_PERMANENT_COST = 0;
export const NOTE_MIN_COMMUNITY_CHARS = 10;

export type EvolutionStage = 1 | 2 | 3;

export const EVOLUTION_STAGES: Record<EvolutionStage, { name: string; blurb: string }> = {
  1: { name: "Criollo", blurb: "Recién llegado a la vitrina." },
  2: { name: "Llanero", blurb: "Ya conoce el camino y aguanta un salto más." },
  3: { name: "Leyenda", blurb: "Su libreta es parte del Llano." },
};

export const EVOLUTION_COSTS: Record<2 | 3, { duplicates: number; hops: number }> = {
  2: { duplicates: 3, hops: 1 },
  3: { duplicates: 4, hops: 1 },
};

export type PotionKind = "shiny" | "secret";

export const POTIONS: Record<
  PotionKind,
  {
    name: string;
    cost: number;
    chance: number;
    guarantee: number;
    description: string;
    minStage: EvolutionStage;
  }
> = {
  shiny: {
    name: "Poción brillante",
    cost: 15,
    chance: 8,
    guarantee: 12,
    description: "Aura de chispas y nombre dorado. No cambia la foto.",
    minStage: 1,
  },
  secret: {
    name: "Poción secreta",
    cost: 40,
    chance: 2,
    guarantee: 30,
    description: "Marco secreto y una cápsula de historia. Solo para etapa Leyenda.",
    minStage: 3,
  },
};

export const GIFT_DAILY_LIMIT = 3;
export const NOTE_RATE_PER_HOUR = 5;

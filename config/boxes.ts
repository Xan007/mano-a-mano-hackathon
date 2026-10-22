import type { Rarity } from "./game";

export type BoxId = "comun" | "epica" | "legendaria";

export type BoxDef = {
  id: BoxId;
  name: string;
  cost: number;
  tagline: string;
  description: string;
  weights: Record<Rarity, number>;
  accent: string;
};

export const BOXES: BoxDef[] = [
  {
    id: "comun",
    name: "Caja común",
    cost: 5,
    tagline: "Para empezar la vitrina",
    description: "Casi siempre sale un peluche común, con suerte uno raro.",
    weights: { epico: 0, comun: 78, raro: 19, legendario: 3 },
    accent: "bg-mist",
  },
  {
    id: "epica",
    name: "Caja épica",
    cost: 10,
    tagline: "Más raros, más emoción",
    description: "Sube la chance de un raro y todavía puede salir legendario.",
    weights: { epico: 0, comun: 42, raro: 48, legendario: 10 },
    accent: "bg-blush",
  },
  {
    id: "legendaria",
    name: "Caja legendaria",
    cost: 18,
    tagline: "La mejor de las tres",
    description: "La probabilidad más alta de legendario, sin perder los demás.",
    weights: { epico: 0, comun: 18, raro: 47, legendario: 35 },
    accent: "bg-mango",
  },
];

export function boxById(id: string | undefined | null): BoxDef {
  return BOXES.find((box) => box.id === id) ?? BOXES[0];
}

export const CHEAPEST_BOX_COST = Math.min(...BOXES.map((box) => box.cost));

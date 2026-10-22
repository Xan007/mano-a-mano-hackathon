import type { Rarity } from "./game";
export const RESCUE_STAGES: {
  placeId: string;
  level: string;
  weights: Record<Rarity, number>;
}[] = [
  { placeId: "clinica", level: "Primeros pasos", weights: { comun: 100, raro: 0, epico: 0, legendario: 0 } },
  { placeId: "torre", level: "Primeros pasos", weights: { comun: 94, raro: 6, epico: 0, legendario: 0 } },
  { placeId: "biblioteca", level: "Primeros pasos", weights: { comun: 84, raro: 15, epico: 1, legendario: 0 } },
  { placeId: "iglesia", level: "Leer entre líneas", weights: { comun: 72, raro: 25, epico: 2, legendario: 1 } },
  { placeId: "plaza", level: "Leer entre líneas", weights: { comun: 60, raro: 29, epico: 9, legendario: 2 } },
  { placeId: "parque", level: "Decisiones con matices", weights: { comun: 49, raro: 30, epico: 17, legendario: 4 } },
  { placeId: "puente", level: "Decisiones con matices", weights: { comun: 39, raro: 29, epico: 24, legendario: 8 } },
  {
    placeId: "muelle",
    level: "Una historia que se queda",
    weights: { comun: 30, raro: 25, epico: 30, legendario: 15 },
  },
];
export function rescueStage(placeId: string) {
  return RESCUE_STAGES.find((stage) => stage.placeId === placeId)!;
}

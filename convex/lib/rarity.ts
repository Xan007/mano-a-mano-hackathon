import { RARITIES, RARITY_ORDER, RARITY_WEIGHTS, type Rarity } from "../../config/game";

type Weights = Record<Rarity, number>;

export function drawRarityFrom(
  weights: Weights,
  random: () => number = Math.random
): Rarity {
  let roll = random() * 100;
  for (const rarity of RARITIES) {
    if (roll < weights[rarity]) return rarity;
    roll -= weights[rarity];
  }
  return RARITIES.at(-1)!;
}

export function drawRarity(random: () => number = Math.random): Rarity {
  return drawRarityFrom(RARITY_WEIGHTS, random);
}

export function bestRarity(a: Rarity, b: Rarity): Rarity {
  return RARITY_ORDER[b] > RARITY_ORDER[a] ? b : a;
}

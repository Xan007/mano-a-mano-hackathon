import { describe, it, expect } from "vitest";
import { drawRarity, bestRarity } from "../convex/lib/rarity";
import { RARITY_WEIGHTS } from "../config/game";

describe("Sorteo de rarezas", () => {
  it("reparte 1000 aperturas cerca de 65/30/5", () => {
    const counts = { comun: 0, raro: 0, epico: 0, legendario: 0 };
    for (let index = 0; index < 2000; index += 1) {
      counts[drawRarity()] += 1;
    }

    expect(counts.comun / 20).toBeGreaterThan(59);
    expect(counts.comun / 20).toBeLessThan(71);
    expect(counts.raro / 20).toBeGreaterThan(24);
    expect(counts.legendario / 20).toBeLessThan(9);
  });

  it("respeta los cortes del generador", () => {
    expect(drawRarity(() => 0)).toBe("comun");
    expect(drawRarity(() => 0.6499)).toBe("comun");
    expect(drawRarity(() => 0.65)).toBe("raro");
    expect(drawRarity(() => 0.9499)).toBe("raro");
    expect(drawRarity(() => 0.95)).toBe("legendario");
    expect(drawRarity(() => 0.9999)).toBe("legendario");
  });

  it("las probabilidades suman 100", () => {
    const total = Object.values(RARITY_WEIGHTS).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(100);
  });
});

describe("Mejor de dos tiradas", () => {
  it("conserva la rareza más alta", () => {
    expect(bestRarity("comun", "raro")).toBe("raro");
    expect(bestRarity("raro", "comun")).toBe("raro");
    expect(bestRarity("legendario", "raro")).toBe("legendario");
    expect(bestRarity("comun", "comun")).toBe("comun");
  });
});

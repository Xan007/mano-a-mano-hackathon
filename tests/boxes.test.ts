import { describe, expect, it } from "vitest";
import { BOXES, CHEAPEST_BOX_COST, boxById } from "../config/boxes";

describe("box tiers", () => {
  it("offers three boxes ordered by price", () => {
    expect(BOXES).toHaveLength(3);
    const costs = BOXES.map((box) => box.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(CHEAPEST_BOX_COST).toBe(costs[0]);
  });

  it("keeps every probability distribution at 100 percent", () => {
    for (const box of BOXES) {
      const total = box.weights.comun + box.weights.raro + box.weights.legendario;
      expect(total).toBe(100);
    }
  });

  it("raises the legendary chance with each tier", () => {
    const [common, epic, legendary] = BOXES;
    expect(common.weights.legendario).toBeLessThan(epic.weights.legendario);
    expect(epic.weights.legendario).toBeLessThan(legendary.weights.legendario);
    expect(legendary.weights.comun).toBeLessThan(common.weights.comun);
    expect(epic.weights.raro).toBeGreaterThan(common.weights.raro);
  });

  it("falls back to the common box for unknown ids", () => {
    expect(boxById("nope").id).toBe("comun");
    expect(boxById(undefined).id).toBe("comun");
    expect(boxById("epica").id).toBe("epica");
  });
});

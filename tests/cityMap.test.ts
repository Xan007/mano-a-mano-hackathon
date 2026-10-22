import { describe, expect, it } from "vitest";
import { CITY_TERRITORIES } from "../config/cityMap";
import { RESCUE_STAGES } from "../config/rescueStages";

const regions = CITY_TERRITORIES.map(region => ({ ...region,
  points: region.polygon.split(" ").map(pair => pair.split(",").map(Number)),
}));
function contains(points: number[][], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

describe("territorios de la ciudad ilustrada", () => {
  it("asigna una zona a cada rescate y mantiene sus puntos y rótulos dentro", () => {
    expect(regions.map(r => r.slug)).toEqual(RESCUE_STAGES.map(s => s.placeId));
    for (const region of regions) {
      expect(contains(region.points, region.x * 1000, region.y * 500), region.slug).toBe(true);
      expect(contains(region.points, region.ax * 1000, region.ay * 500), region.slug).toBe(true);
    }
  });
  it("cubre el lienzo completo sin huecos ni zonas superpuestas", () => {
    const area = regions.reduce((total, { points }) => total + Math.abs(points.reduce((sum, p, i) => {
      const next = points[(i + 1) % points.length];
      return sum + p[0] * next[1] - next[0] * p[1];
    }, 0)) / 2, 0);
    expect(area).toBe(1000 * 500);
    for (let x = 2.31; x < 1000; x += 7.13) {
      for (let y = 1.79; y < 500; y += 7.17) {
        expect(regions.filter(r => contains(r.points, x, y)), `${x},${y}`).toHaveLength(1);
      }
    }
  });
});

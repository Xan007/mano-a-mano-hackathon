import { describe, expect, it } from "vitest";
import { PLACES } from "../config/places";

describe("places", () => {
  it("has the eight places of the city map", () => {
    expect(PLACES).toHaveLength(8);
    expect(new Set(PLACES.map((place) => place.slug)).size).toBe(8);
  });

  it("keeps every place inside the illustrated map", () => {
    for (const place of PLACES) {
      for (const value of [
        place.mapX,
        place.mapY,
        place.anchorX,
        place.anchorY,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("has a story, a challenge and three options per place", () => {
    for (const place of PLACES) {
      expect(place.story.length).toBeGreaterThan(20);
      expect(place.challengeLabel.length).toBeGreaterThan(0);
      expect(place.capsule.options).toContain(place.capsule.answer);
      expect(place.capsule.options).toHaveLength(3);
      expect(place.capsule.explanation.length).toBeGreaterThan(0);
      expect(place.source.length).toBeGreaterThan(0);
    }
  });

  it("no presenta los lugares urbanos como sedes de los servicios", () => {
    expect(PLACES.every((place) => !place.phone && !place.whatsapp)).toBe(true);
    expect(PLACES.map((place) => place.name)).toContain("VIVA");
    expect(PLACES.map((place) => place.name)).toContain("Unicentro");
    expect(PLACES.map((place) => place.name)).toContain("Éxito");
  });
});

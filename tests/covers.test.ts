import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_COVER, NOTE_COVERS, STARTER_COVERS, coverById } from "../config/covers";

describe("note covers", () => {
  it("starts with the no-cover option and a free photo", () => {
    expect(DEFAULT_COVER).toBe("ninguno");
    expect(STARTER_COVERS).toContain(DEFAULT_COVER);
    expect(STARTER_COVERS).toContain("cerezo");
    expect(NOTE_COVERS.find((cover) => cover.id === "cerezo")?.cost).toBe(0);
  });

  it("ships a local image for every photo cover", () => {
    for (const cover of NOTE_COVERS) {
      if (!cover.image) continue;
      expect(cover.image.startsWith("/covers/")).toBe(true);
      const file = join(process.cwd(), "public", cover.image.replace(/^\//, ""));
      expect(existsSync(file)).toBe(true);
    }
  });

  it("falls back to the plain cover for unknown ids", () => {
    expect(coverById("missing").id).toBe("ninguno");
    expect(coverById(null).id).toBe("ninguno");
  });
});

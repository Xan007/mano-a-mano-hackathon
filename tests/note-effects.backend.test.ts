// @vitest-environment edge-runtime
import { expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import { effectById } from "../config/noteEffects";

const modules = import.meta.glob("../convex/**/*.ts");

it("persists new note effects and rejects unknown or unauthenticated changes", async () => {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    const playerId = await ctx.db.insert("players", { companion: "charapa", tokens: 0, isNpc: false });
    await ctx.db.insert("sessions", { token: "effects-test", playerId, createdAt: Date.now() });
  });
  for (const effectId of ["petalos", "confeti", "burbujas", "orbita", "ninguno"]) {
    await t.mutation(api.noteStyles.selectEffect, { token: "effects-test", effectId });
    const styles = await t.query(api.noteStyles.list, { token: "effects-test" });
    expect(styles?.effect).toBe(effectId);
    expect(styles?.effects.filter(effect => effect.selected).map(effect => effect.id)).toEqual([effectId]);
  }
  await expect(t.mutation(api.noteStyles.selectEffect, { token: "effects-test", effectId: "invalid" })).rejects.toThrow();
  expect((await t.query(api.noteStyles.list, { token: "effects-test" }))?.effect).toBe("ninguno");
  await expect(t.mutation(api.noteStyles.selectEffect, { token: "invalid", effectId: "orbita" })).rejects.toThrow();
  expect(effectById(null).id).toBe("ninguno");
  expect(effectById("old-unknown-effect").id).toBe("ninguno");
});

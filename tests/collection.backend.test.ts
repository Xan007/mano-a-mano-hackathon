// @vitest-environment edge-runtime
import { expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");

it("counts only received, visible notes and hides counts during travel", async () => {
  const t = convexTest(schema, modules);
  const plushId = await t.run(async ctx => {
    const owner = await ctx.db.insert("players", { companion: "charapa", tokens: 0, isNpc: false });
    const author = await ctx.db.insert("players", { companion: "charapa", tokens: 0, isNpc: false });
    const npc = await ctx.db.insert("players", { companion: "charapa", tokens: 0, isNpc: true });
    await ctx.db.insert("sessions", { token: "collection-test", playerId: owner, createdAt: Date.now() });
    const catalogId = await ctx.db.insert("plushCatalog", { slug: "charapa", species: "Charapa", rarity: "comun", outfit: "", imagePath: "/plush/charapa.webp" });
    const id = await ctx.db.insert("plushItems", { catalogId, originId: owner, status: "returned", hopCount: 3, hopsTarget: 3, createdAt: Date.now() });
    const note = { plushId: id, authorId: author, body: "Un abrazo", hopIndex: 1, hidden: false, createdAt: Date.now() };
    await ctx.db.insert("notes", note);
    await ctx.db.insert("notes", { ...note, authorId: owner });
    await ctx.db.insert("notes", { ...note, hidden: true });
    await ctx.db.insert("notes", { ...note, moderationStatus: "pending" });
    await ctx.db.insert("notes", { ...note, moderationStatus: "removed" });
    await ctx.db.insert("notes", { ...note, expiresAt: Date.now() - 1000 });
    await ctx.db.insert("notes", { ...note, authorId: npc });
    await ctx.db.insert("notes", { ...note, isDemo: true });
    return id;
  });
  expect((await t.query(api.plush.getMyPlushes, { token: "collection-test" }))[0].receivedNoteCount).toBe(1);
  await t.run(ctx => ctx.db.patch(plushId, { status: "traveling" }));
  expect((await t.query(api.plush.getMyPlushes, { token: "collection-test" }))[0].receivedNoteCount).toBe(0);
  expect(await t.query(api.plush.getMyPlushes, { token: "invalid" })).toEqual([]);
});

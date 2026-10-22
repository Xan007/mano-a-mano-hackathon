import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { DEMO_MESSAGES, DEMO_PEOPLE, DEMO_HOLD_MS } from "../../config/operations";
import { PLUSH_CATALOG } from "../../config/catalog";
import { RESCUE_STAGES } from "../../config/rescueStages";

export async function demoNote(ctx: MutationCtx, plushId: Id<"plushItems">, author: Doc<"players">, hopIndex: number, variation = 0) {
  const style = DEMO_PEOPLE[(hopIndex + variation) % DEMO_PEOPLE.length];
  return await ctx.db.insert("notes", {
    plushId, authorId: author._id, body: DEMO_MESSAGES[(hopIndex + variation) % DEMO_MESSAGES.length], hopIndex,
    hidden: false, permanent: true, createdAt: Date.now() - (7 - hopIndex) * 60_000,
    theme: "papel", cover: style.cover, effect: style.effect, isDemo: true, demoOwnerId: author.demoOwnerId,
    moderationStatus: "published",
  });
}

export async function createDemoWorld(ctx: MutationCtx, owner: Doc<"players">) {
  const previous = await ctx.db.query("players").withIndex("by_demo_owner", q => q.eq("demoOwnerId", owner._id)).collect();
  const existing = previous.find(p => !p.isNpc);
  if (existing) return existing._id;
  const catalogs: Id<"plushCatalog">[] = [];
  for (const entry of PLUSH_CATALOG) {
    const present = await ctx.db.query("plushCatalog").withIndex("by_slug", q => q.eq("slug", entry.slug)).first();
    catalogs.push(present?._id ?? await ctx.db.insert("plushCatalog", entry));
  }
  const now = Date.now();
  const demoId = await ctx.db.insert("players", { alias: `Mi presentación ${owner._id.slice(-5)}`, companion: owner.companion || "chiguiro", firstJourneyAt: now,
    tokens: 0, xp: 0, keys: 0, isNpc: false, isDemo: true, demoOwnerId: owner._id, lastSeenAt: now,
    noteTheme: "papel", noteCover: "noche", noteEffect: "estrellas" });
  const people: Doc<"players">[] = [];
  for (const person of DEMO_PEOPLE) {
    const id = await ctx.db.insert("players", { alias: person.alias, companion: person.companion, tokens: 0, isNpc: true, isDemo: true, demoOwnerId: owner._id,
      noteCover: person.cover, noteEffect: person.effect, firstJourneyAt: now });
    people.push((await ctx.db.get(id))!);
  }
  const demo = (await ctx.db.get(demoId))!;
  const featuredCatalogs = [0, 2, 6, 5, 11, 16, 9, 13, 15];
  // Three available companions, three complete books, three actual moving trips.
  for (let i = 0; i < 9; i++) {
    const status = i < 3 ? "collection" : i < 6 ? "returned" : "traveling";
    const hops = status === "returned" ? 7 : status === "traveling" ? 1 + (i % 3) : 0;
    const plushId = await ctx.db.insert("plushItems", { catalogId: catalogs[featuredCatalogs[i]], originId: demoId,
      status, hopCount: hops, hopsTarget: 7, createdAt: now - (i + 1) * 60_000 });
    if (status !== "collection") {
      await demoNote(ctx, plushId, demo, 0, i);
      for (let hop = 1; hop <= hops; hop++) await demoNote(ctx, plushId, people[(hop + i) % people.length], hop, i);
    }
    if (status === "traveling") {
      const transitId = await ctx.db.insert("transits", { plushId, holderId: people[i % people.length]._id, receivedAt: now, dueAt: now + DEMO_HOLD_MS, hopIndex: hops + 1, state: "holding" });
      await ctx.scheduler.runAfter(18_000 + i * 1000, internal.plush.npcPass, { transitId });
    }
    if (i < 5) await ctx.db.insert("placeRescues", { playerId: demoId, placeId: RESCUE_STAGES[i].placeId, day: "presentation", plushId, createdAt: now });
  }
  for (let i = 0; i < 2; i++) {
    const plushId = await ctx.db.insert("plushItems", { catalogId: catalogs[i + 8], originId: people[i]._id, status: "traveling", hopCount: 3, hopsTarget: 7, createdAt: now });
    for (let hop = 0; hop < 4; hop++) await demoNote(ctx, plushId, people[(hop + i) % people.length], hop, i + 3);
    const transitId = await ctx.db.insert("transits", { plushId, holderId: demoId, receivedAt: now, dueAt: now + DEMO_HOLD_MS, hopIndex: 4, state: "holding" });
    await ctx.scheduler.runAt(now + DEMO_HOLD_MS, internal.plush.autoPass, { transitId });
  }
  // One clearly synthetic report exercises the same moderation queue.
  const reviewBook = await ctx.db.query("plushItems").withIndex("by_origin", q => q.eq("originId", demoId)).filter(q => q.eq(q.field("status"), "returned")).first();
  const reviewId = reviewBook ? await ctx.db.query("notes").withIndex("by_plush", q => q.eq("plushId", reviewBook._id)).filter(q => q.neq(q.field("authorId"), demoId)).first() : null;
  if (reviewId) {
    await ctx.db.patch(reviewId._id, { hidden: true, moderationStatus: "pending", moderationReason: "Escenario ficticio para mostrar revisión humana." });
    await ctx.db.insert("reports", { noteId: reviewId._id, reporterId: demoId, status: "pending", createdAt: now });
  }
  await ctx.db.insert("channelReports", { channelId: "local", reason: "contact", createdAt: now, status: "pending", synthetic: true });
  return demoId;
}

export async function resetDemoWorld(ctx: MutationCtx, owner: Doc<"players">) {
  const people = await ctx.db.query("players").withIndex("by_demo_owner", q => q.eq("demoOwnerId", owner._id)).collect();
  for (const person of people) {
    if (!person.isDemo) continue;
    for (const item of await ctx.db.query("plushItems").withIndex("by_origin", q => q.eq("originId", person._id)).collect()) {
      for (const note of await ctx.db.query("notes").withIndex("by_plush", q => q.eq("plushId", item._id)).collect()) {
        for (const like of await ctx.db.query("noteLikes").withIndex("by_note", q => q.eq("noteId", note._id)).collect()) await ctx.db.delete(like._id);
        for (const report of await ctx.db.query("reports").withIndex("by_note", q => q.eq("noteId", note._id)).collect()) await ctx.db.delete(report._id);
        await ctx.db.delete(note._id);
      }
      for (const transit of await ctx.db.query("transits").withIndex("by_plush", q => q.eq("plushId", item._id)).collect()) await ctx.db.delete(transit._id);
      await ctx.db.delete(item._id);
    }
    for (const rescue of await ctx.db.query("placeRescues").withIndex("by_player", q => q.eq("playerId", person._id)).collect()) await ctx.db.delete(rescue._id);
    for (const visit of await ctx.db.query("placeVisits").withIndex("by_player_day", q => q.eq("playerId", person._id)).collect()) await ctx.db.delete(visit._id);
    for (const session of await ctx.db.query("placeSessions").withIndex("by_player", q => q.eq("playerId", person._id)).collect()) await ctx.db.delete(session._id);
    await ctx.db.delete(person._id);
  }
  for (const report of await ctx.db.query("channelReports").filter(q => q.and(q.eq(q.field("synthetic"), true), q.eq(q.field("status"), "pending"))).collect()) {
    await ctx.db.patch(report._id, { status: "dismissed", resolvedAt: Date.now(), resolvedBy: owner._id, resolution: "Escenario ficticio reiniciado para presentación." });
  }
  return await createDemoWorld(ctx, owner);
}

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { DEMO_PEOPLE } from "../../config/operations";

const PUBLIC_DEMO_KEY = "public_demo";

export async function publicDemoEnabled(ctx: QueryCtx | MutationCtx) {
  const setting = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q) => q.eq("key", PUBLIC_DEMO_KEY))
    .unique();
  return setting?.enabled ?? true;
}

export async function ensurePublicDemoNpcs(ctx: MutationCtx) {
  const current = await ctx.db
    .query("players")
    .withIndex("by_public_npc", (q) => q.eq("isPublicNpc", true))
    .take(DEMO_PEOPLE.length);
  if (current.length > 0) return current.length;

  const now = Date.now();
  for (const person of DEMO_PEOPLE) {
    await ctx.db.insert("players", {
      alias: person.alias,
      companion: person.companion,
      tokens: 0,
      isNpc: true,
      isDemo: true,
      isPublicNpc: true,
      firstJourneyAt: now,
      lastSeenAt: now,
      noteCover: person.cover,
      noteEffect: person.effect,
    });
  }
  return DEMO_PEOPLE.length;
}

export async function setPublicDemoSetting(
  ctx: MutationCtx,
  enabled: boolean,
  updatedBy: Doc<"players">,
) {
  const current = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q) => q.eq("key", PUBLIC_DEMO_KEY))
    .unique();
  const value = { key: PUBLIC_DEMO_KEY, enabled, updatedAt: Date.now(), updatedBy: updatedBy._id };
  if (current) await ctx.db.patch(current._id, value);
  else await ctx.db.insert("appSettings", value);
}

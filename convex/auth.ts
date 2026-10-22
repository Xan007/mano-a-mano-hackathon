import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateAlias } from "./lib/alias";
import { getPlayer, sessionIdentity, roleFor } from "./lib/auth";
import { randomHex } from "./lib/hash";
import { DEFAULT_LAYOUT, DEFAULT_THEME } from "../config/progression";
import { DEFAULT_COVER, STARTER_COVERS } from "../config/covers";
import { publicDemoEnabled } from "./lib/publicDemo";

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .collect();

    for (const session of sessions) await ctx.db.delete(session._id);
    return { ok: true };
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await sessionIdentity(ctx, token);
    const player = identity?.actor.bannedAt ? identity.actor : await getPlayer(ctx, token);
    if (!player) return null;
    return {
      _id: player._id,
      publicDemo: await publicDemoEnabled(ctx),
      staffRole: identity ? await roleFor(ctx, identity.actor) : null,
      isDemo: Boolean(player.isDemo),
      verifiedEmail: identity?.actor.verifiedEmail ?? null,
      identityVerifiedAt: identity?.actor.identityVerifiedAt ?? null,
      bannedAt: identity?.actor.bannedAt ?? null,
      banReason: identity?.actor.banReason ?? null,
      firstJourneyAt: player.firstJourneyAt ?? null,
      quickTourCompletedAt: player.quickTourCompletedAt ?? null,
      journeyPerspective: player.journeyPerspective ?? "self",
      username: player.username ?? null,
      loginName: player.passwordHash ? player.username ?? null : null,
      hasPassword: Boolean(player.passwordHash),
      hasGoogle: Boolean(player.clerkUserId),
      alias: player.alias ?? null,
      companion: player.companion,
      tokens: player.tokens,
      xp: player.xp ?? 0,
      keys: player.keys ?? 0,
      noteTheme: player.noteTheme ?? DEFAULT_THEME,
      noteLayout: player.noteLayout ?? DEFAULT_LAYOUT,
      lastFreeTokenDay: player.lastFreeTokenDay ?? null,
    };
  },
});

export const publicDemoStatus = query({
  args: {},
  handler: async (ctx) => ({ enabled: await publicDemoEnabled(ctx) }),
});



export const createGuest = mutation({
  args: {},
  handler: async (ctx) => {
    const playerId = await ctx.db.insert("players", {
      username: `guest_${randomHex(6)}`, companion: "", tokens: 0, isNpc: false,
      xp: 0, keys: 0, noteTheme: DEFAULT_THEME, noteLayout: DEFAULT_LAYOUT,
      noteCover: DEFAULT_COVER, ownedCovers: STARTER_COVERS,
    });
    await ctx.db.patch(playerId, { alias: await generateAlias(ctx, playerId) });
    const token = randomHex(24);
    await ctx.db.insert("sessions", { token, playerId, createdAt: Date.now() });
    return { token };
  },
});

// Compatibility for existing browser bundles; this creates an ordinary guest.
export const createDemo = createGuest;

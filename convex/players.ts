import { v, ConvexError } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { requirePlayer, getPlayer } from "./lib/auth";
import { aliasProblem, aliasTaken, generateAlias } from "./lib/alias";
import { internal } from "./_generated/api";
import { reviewAlias } from "./lib/aliasReview";
import { COMPANION_IDS } from "../config/catalog";
import { TOKENS } from "../config/game";

export const reserveGuide = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requirePlayer(ctx, token);
    const now = Date.now();
    const fresh = now - (me.guideWindowAt ?? 0) >= 60_000;
    const count = fresh ? 0 : (me.guideCount ?? 0);
    if (count >= 8)
      throw new ConvexError("Espera un momento antes de intentar de nuevo.");
    await ctx.db.patch(me._id, {
      guideWindowAt: fresh ? now : me.guideWindowAt,
      guideCount: count + 1,
    });
    return null;
  },
});

export const reserveAlias = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requirePlayer(ctx, token);
    const now = Date.now();
    const fresh = now - (me.aliasWindowAt ?? 0) >= 60_000;
    const count = fresh ? 0 : (me.aliasReviewCount ?? 0);
    if (count >= 8)
      throw new ConvexError("Espera un momento antes de intentar otro apodo.");
    await ctx.db.patch(me._id, {
      aliasWindowAt: fresh ? now : me.aliasWindowAt,
      aliasReviewCount: count + 1,
    });
    return null;
  },
});

export const setCompanion = action({
  args: { token: v.string(), companion: v.string(), alias: v.string() },
  handler: async (ctx, args): Promise<{ alias: string }> => {
    if (!COMPANION_IDS.includes(args.companion))
      throw new ConvexError("Mascota inválida");
    await ctx.runMutation(internal.players.reserveAlias, { token: args.token });
    const alias = await reviewAlias(args.alias);
    return await ctx.runMutation(internal.players.commitIdentity, {
      ...args,
      alias,
    });
  },
});

export const updateAlias = action({
  args: { token: v.string(), alias: v.string() },
  handler: async (ctx, args): Promise<{ alias: string }> => {
    await ctx.runMutation(internal.players.reserveAlias, { token: args.token });
    const alias = await reviewAlias(args.alias);
    return await ctx.runMutation(internal.players.commitIdentity, {
      token: args.token,
      alias,
    });
  },
});

export const commitIdentity = internalMutation({
  args: {
    token: v.string(),
    alias: v.string(),
    companion: v.optional(v.string()),
  },
  handler: async (ctx, { token, alias, companion }) => {
    const me = await requirePlayer(ctx, token);
    const problem = aliasProblem(alias);
    if (problem) throw new ConvexError(problem);
    if (await aliasTaken(ctx, alias, me._id))
      throw new ConvexError("Ese apodo ya está en uso. Prueba otro.");
    if (companion !== undefined) {
      if (me.companion !== "") throw new ConvexError("Ya elegiste tu mascota");
      if (!COMPANION_IDS.includes(companion))
        throw new ConvexError("Mascota inválida");
    }
    await ctx.db.patch(me._id, {
      alias,
      ...(companion !== undefined ? { companion } : {}),
    });
    return { alias };
  },
});

export const claimDailyToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requirePlayer(ctx, token);
    const today = new Date().toISOString().slice(0, 10);

    if (me.lastFreeTokenDay === today)
      return { claimed: false, tokens: me.tokens };

    const tokens = me.tokens + TOKENS.FREE_DAILY;
    await ctx.db.patch(me._id, { tokens, lastFreeTokenDay: today });
    return { claimed: true, tokens };
  },
});

export const touch = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requirePlayer(ctx, token);
    const patch: { lastSeenAt: number; alias?: string } = {
      lastSeenAt: Date.now(),
    };

    if (!me.alias || me.alias.trim().length < 2) {
      patch.alias = await generateAlias(ctx, me._id);
    }

    await ctx.db.patch(me._id, patch);
    return null;
  },
});

export const searchByAlias = query({
  args: { token: v.string(), query: v.string() },
  handler: async (ctx, { token, query }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return [];

    const text = query.trim().toLowerCase();
    if (text.length < 2) return [];

    const players = await ctx.db.query("players").collect();

    return players
      .filter(
        (player) =>
          !player.isNpc &&
          !player.bannedAt &&
          Boolean(player.isDemo) === Boolean(me.isDemo) &&
          (!me.isDemo || player.demoOwnerId === me.demoOwnerId) &&
          player._id !== me._id &&
          player.alias &&
          player.alias.toLowerCase().includes(text),
      )
      .slice(0, 6)
      .map((player) => ({
        alias: player.alias ?? "",
        companion: player.companion,
      }));
  },
});

export const getMe = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return null;
    const { passwordHash: _hash, passwordSalt: _salt, tokenIdentifier: _identifier, ...safe } = me;
    return safe;
  },
});

export const finishJourney = mutation({
  args: {
    token: v.string(),
    perspective: v.union(v.literal("self"), v.literal("others")),
  },
  handler: async (ctx, { token, perspective }) => {
    const me = await requirePlayer(ctx, token);
    const rescue = await ctx.db
      .query("placeRescues")
      .withIndex("by_player_place", (q) =>
        q.eq("playerId", me._id).eq("placeId", "clinica"),
      )
      .first();
    if (!rescue)
      throw new ConvexError("Completa primero el rescate de Yo Te Escucho.");
    await ctx.db.patch(me._id, {
      firstJourneyAt: me.firstJourneyAt ?? Date.now(),
      journeyPerspective: perspective,
    });
    return { ok: true };
  },
});

export const finishQuickTour = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requirePlayer(ctx, token);
    if (!me.firstJourneyAt) throw new ConvexError("Completa tu primera historia.");
    if (!me.quickTourCompletedAt) {
      await ctx.db.patch(me._id, { quickTourCompletedAt: Date.now() });
    }
    return { ok: true };
  },
});

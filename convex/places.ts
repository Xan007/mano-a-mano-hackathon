import { ConvexError, v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { getPlayer, requirePlayer } from "./lib/auth";
import { dayKey } from "./lib/actions";
import { RESCUE_STAGES, rescueStage } from "../config/rescueStages";
import type { Rarity } from "../config/game";
import { drawRarityFrom } from "./lib/rarity";
import {
  PLACE_CAPSULE_MIN_READ_MS,
  PLACE_FIRST_TOKENS,
  PLACE_REPEAT_REWARD_LIMIT,
  PLACE_REPEAT_TOKENS,
  PLACES,
  placeBySlug,
} from "../config/places";
import { journeyScene } from "../config/journey";
import { PLUSH } from "../config/game";
import { publicDemoEnabled } from "./lib/publicDemo";

const RESCUE_COOLDOWN_PRODUCTION_MS = 30 * 60 * 1000;
const RESCUE_COOLDOWN_DEMO_MS = 5 * 60 * 1000;

export const reportChannel = mutation({
  args: {
    channelId: v.union(v.literal("local"), v.literal("national")),
    reason: v.union(
      v.literal("contact"),
      v.literal("hours"),
      v.literal("source"),
    ),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const player = args.token ? await getPlayer(ctx, args.token) : null;
    await ctx.db.insert("channelReports", {
      channelId: args.channelId,
      reason: args.reason,
      createdAt: Date.now(),
      status: "pending",
      synthetic: Boolean(player?.isDemo),
    });
    return { recorded: true };
  },
});

// Solo el equipo operador puede consultar la cola; no se expone al cliente.
export const pendingChannelReports = internalQuery({
  args: {},
  handler: (ctx) => ctx.db.query("channelReports").collect(),
});

function shuffled(options: string[]) {
  const result = [...options];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function sortOrderOf(slug: string) {
  return RESCUE_STAGES.findIndex((stage) => stage.placeId === slug);
}

async function pickCatalog(ctx: MutationCtx, rarity: Rarity) {
  const options = await ctx.db
    .query("plushCatalog")
    .withIndex("by_rarity", (q) => q.eq("rarity", rarity))
    .collect();

  if (options.length === 0)
    throw new ConvexError("No hay peluches de esa rareza");
  return options[Math.floor(Math.random() * options.length)];
}

async function pickStageCatalog(ctx: MutationCtx, placeId: string, level = 1) {
  const base = rescueStage(placeId).weights;
  const boosted = level <= 1 ? base : {
    comun: Math.max(0, base.comun - (level - 1) * 8),
    raro: base.raro + (level - 1) * 4,
    epico: base.epico + (level - 1) * 3,
    legendario: base.legendario + (level - 1),
  };
  const rarity = drawRarityFrom(boosted);
  return pickCatalog(ctx, rarity);
}

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return null;

    const day = dayKey(Date.now());
    const demoMode = await publicDemoEnabled(ctx);
    const cooldownMs = demoMode ? RESCUE_COOLDOWN_DEMO_MS : RESCUE_COOLDOWN_PRODUCTION_MS;
    const places = PLACES;
    const active = [...places].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    const rescues = await ctx.db
      .query("placeRescues")
      .withIndex("by_player", (q) => q.eq("playerId", me._id))
      .collect();
    rescues.sort((a, b) => a.createdAt - b.createdAt);

    const visits = await ctx.db
      .query("placeVisits")
      .withIndex("by_player_day", (q) =>
        q.eq("playerId", me._id).eq("day", day),
      )
      .collect();

    const rescuedAt = new Map(
      rescues.map((rescue) => [rescue.placeId, rescue]),
    );
    const order = new Map(
      rescues.map((rescue, index) => [rescue.placeId, index]),
    );

    const entries = active.map((place) => {
      const visitsHere = visits.filter((visit) => visit.placeId === place.slug);
      const rewardedToday = visitsHere.filter((visit) => visit.rewarded).length;
      const rescued = rescuedAt.has(place.slug);

      return {
        id: place.slug,
        name: place.name,
        kind: place.kind,
        whatItIs: place.whatItIs,
        cost: place.cost ?? "",
        hours: place.hours ?? "",
        howToContact: place.howToContact,
        whatHappens: place.whatHappens ?? "",
        story: place.story ?? "",
        challengeLabel: place.challengeLabel ?? "Reto",
        source: place.source,
        sourceDate: place.sourceDate,
        phone: place.phone ?? null,
        whatsapp: place.whatsapp ?? null,
        mapX: place.mapX,
        mapY: place.mapY,
        anchorX: place.anchorX ?? place.mapX,
        anchorY: place.anchorY ?? place.mapY,
        rescued,
        unlocked:
          rescued ||
          sortOrderOf(place.slug) === 0 ||
          rescuedAt.has(RESCUE_STAGES[sortOrderOf(place.slug) - 1].placeId),
        order: order.get(place.slug) ?? null,
        rewardedToday,
        rewardCapReached: rewardedToday >= PLACE_REPEAT_REWARD_LIMIT,
        rescueLevel: rescuedAt.get(place.slug)?.rescueLevel ?? 1,
        nextRescueAt: rescuedAt.get(place.slug)?.nextRescueAt ?? (rescuedAt.has(place.slug) ? (rescuedAt.get(place.slug)!.createdAt + cooldownMs) : null),
      };
    });

    const route = entries
      .filter((place) => place.rescued)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((place) => ({
        id: place.id,
        name: place.name,
        x: place.mapX,
        y: place.mapY,
      }));

    return {
      day,
      places: entries,
      route,
      rescuedCount: rescues.length,
      rescuedToday: new Set(
        visits.filter((visit) => visit.correct).map((visit) => visit.placeId),
      ).size,
      legendaryToday: me.lastLegendaryDay === day,
      legendaryKeys: me.legendaryKeys ?? 0,
      totalPlaces: active.length,
      minReadMs: PLACE_CAPSULE_MIN_READ_MS,
    };
  },
});

export const startVisit = mutation({
  args: {
    token: v.string(),
    placeId: v.string(),
    perspective: v.optional(v.union(v.literal("self"), v.literal("others"))),
  },
  handler: async (ctx, { token, placeId, perspective = "self" }) => {
    const me = await requirePlayer(ctx, token);
    const place = placeBySlug(placeId);
    if (!place) throw new ConvexError("Ese lugar no existe");

    const capsule = journeyScene(placeId, perspective);
    if (!capsule) throw new ConvexError("Historia no disponible");

    const previous = await ctx.db
      .query("placeRescues")
      .withIndex("by_player_place", (q) =>
        q.eq("playerId", me._id).eq("placeId", placeId),
      )
      .first();
    const stageIndex = sortOrderOf(placeId);
    if (!previous && stageIndex > 0) {
      const required = RESCUE_STAGES[stageIndex - 1].placeId;
      const prior = await ctx.db
        .query("placeRescues")
        .withIndex("by_player_place", (q) =>
          q.eq("playerId", me._id).eq("placeId", required),
        )
        .first();
      if (!prior)
        throw new ConvexError(
          `Primero completa la historia de ${placeBySlug(required)!.name}.`,
        );
    }
    if (previous?.nextRescueAt && previous.nextRescueAt > Date.now()) {
      throw new ConvexError("Este territorio todavía se está recuperando.");
    }
    const pending = previous
      ? null
      : (await ctx.db
          .query("placeSessions")
          .withIndex("by_player", (q) => q.eq("playerId", me._id))
          .collect())
          .filter((session) => session.placeId === placeId && !session.answeredAt && session.rewardCatalogId)
          .sort((a, b) => a.startedAt - b.startedAt)[0] ?? null;
    const pendingCatalog = pending?.rewardCatalogId
      ? await ctx.db.get(pending.rewardCatalogId)
      : null;
    const rescueLevel = (previous?.rescueLevel ?? 1) + (previous ? 1 : 0);
    const reward = previous
      ? await pickStageCatalog(ctx, placeId, rescueLevel)
      : pendingCatalog ?? await pickStageCatalog(ctx, placeId, 1);
    if (!reward) throw new ConvexError("No pudimos preparar el peluche.");
    const sessionId = await ctx.db.insert("placeSessions", {
      playerId: me._id,
      placeId,
      capsuleSlug: place.slug,
      capsuleKind: "place",
      rewardCatalogId: reward._id,
      perspective,
      startedAt: Date.now(),
    });

    return {
      sessionId,
      reward: {
        species: reward.species,
        imagePath: reward.imagePath,
        rarity: reward.rarity,
      },
      minReadMs: PLACE_CAPSULE_MIN_READ_MS,
      challengeLabel: capsule.title,
      capsule: {
        prompt: capsule.prompt,
        options: shuffled(capsule.options),
      },
    };
  },
});

export const answer = mutation({
  args: {
    token: v.string(),
    sessionId: v.id("placeSessions"),
    option: v.string(),
  },
  handler: async (ctx, { token, sessionId, option }) => {
    const me = await requirePlayer(ctx, token);
    const session = await ctx.db.get(sessionId);

    if (!session || session.playerId !== me._id) {
      throw new ConvexError("Esa cápsula no es tuya");
    }
    if (session.answeredAt)
      throw new ConvexError("Esa cápsula ya se respondió");

    const elapsed = Date.now() - session.startedAt;
    if (elapsed < PLACE_CAPSULE_MIN_READ_MS) {
      throw new ConvexError("Lee la cápsula completa antes de responder");
    }

    const place = placeBySlug(session.placeId);
    if (!place) throw new ConvexError("Ese lugar no existe");

    const capsule = journeyScene(
      session.placeId,
      session.perspective ?? "self",
    );
    if (!capsule) throw new ConvexError("Esa historia no existe");

    if (option !== capsule.answer) {
      return {
        correct: false,
        explanation: capsule.explanation,
        source: capsule.source,
        sourceDate: capsule.sourceDate,
      };
    }

    await ctx.db.patch(sessionId, { answeredAt: Date.now(), correct: true });

    const day = dayKey(Date.now());
    const existingRescue = await ctx.db
      .query("placeRescues")
      .withIndex("by_player_place", (q) =>
        q.eq("playerId", me._id).eq("placeId", place.slug),
      )
      .first();
    const firstRescue = !existingRescue;
    const rescueLevel = (existingRescue?.rescueLevel ?? 1) + (existingRescue ? 1 : 0);
    const demoMode = await publicDemoEnabled(ctx);

    const visitsToday = await ctx.db
      .query("placeVisits")
      .withIndex("by_player_day", (q) =>
        q.eq("playerId", me._id).eq("day", day),
      )
      .collect();
    const rewardedToday = visitsToday.filter(
      (visit) => visit.placeId === place.slug && visit.rewarded,
    ).length;

    let tokensEarned = 0;
    let rewarded = false;
    const cooldownMs = demoMode ? RESCUE_COOLDOWN_DEMO_MS : RESCUE_COOLDOWN_PRODUCTION_MS;
    const nextRescueAt = Date.now() + cooldownMs;
    if (firstRescue) {
      tokensEarned = PLACE_FIRST_TOKENS;
      rewarded = true;
    } else if (rewardedToday < PLACE_REPEAT_REWARD_LIMIT) {
      tokensEarned = PLACE_REPEAT_TOKENS;
      rewarded = true;
    }

    let plush: {
      rarity: Rarity;
      species: string;
      outfit: string;
      imagePath: string;
    } | null = null;

    if (firstRescue) {
      const catalog = session.rewardCatalogId
        ? await ctx.db.get(session.rewardCatalogId)
        : await pickStageCatalog(ctx, session.placeId);
      if (!catalog)
        throw new ConvexError("No encontramos el peluche de esta historia.");
      const rarity = catalog.rarity;
      const plushId = await ctx.db.insert("plushItems", {
        catalogId: catalog._id,
        originId: me._id,
        status: "collection",
        hopCount: 0,
        hopsTarget: PLUSH.HOPS_TARGET,
        createdAt: Date.now(),
      });

      await ctx.db.insert("placeRescues", {
        playerId: me._id,
        placeId: place.slug,
        day,
        plushId,
        createdAt: Date.now(),
        rescueLevel: 1,
        nextRescueAt,
      });

      plush = {
        rarity,
        species: catalog.species,
        outfit: catalog.outfit,
        imagePath: catalog.imagePath,
      };
    } else {
      const catalog = session.rewardCatalogId ? await ctx.db.get(session.rewardCatalogId) : null;
      if (!catalog) throw new ConvexError("No encontramos el peluche de esta historia.");
      const plushId = await ctx.db.insert("plushItems", {
        catalogId: catalog._id,
        originId: me._id,
        status: "collection",
        hopCount: 0,
        hopsTarget: PLUSH.HOPS_TARGET,
        createdAt: Date.now(),
      });
      await ctx.db.patch(existingRescue!._id, { plushId, day, createdAt: Date.now(), rescueLevel, nextRescueAt });
      plush = { rarity: catalog.rarity, species: catalog.species, outfit: catalog.outfit, imagePath: catalog.imagePath };
    }

    await ctx.db.insert("placeVisits", {
      playerId: me._id,
      placeId: place.slug,
      day,
      rewarded: !firstRescue && rewarded,
      correct: true,
      createdAt: Date.now(),
    });

    const rescuedTodayPlaces = new Set(
      visitsToday
        .filter((visit) => visit.correct)
        .map((visit) => visit.placeId),
    );
    rescuedTodayPlaces.add(place.slug);
    const rescuedToday = rescuedTodayPlaces.size;
    const totalPlaces = PLACES.length;
    let legendaryAwarded = false;

    if (rescuedToday >= totalPlaces && me.lastLegendaryDay !== day) {
      legendaryAwarded = true;
    }

    const legendaryKeys = (me.legendaryKeys ?? 0) + (legendaryAwarded ? 1 : 0);

    await ctx.db.patch(me._id, {
      tokens: me.tokens + tokensEarned,
      legendaryKeys,
      ...(legendaryAwarded ? { lastLegendaryDay: day } : {}),
    });

    return {
      correct: true,
      firstRescue,
      plush,
      stamp: firstRescue,
      tokensEarned,
      rewarded,
      rewardCapReached: !firstRescue && !rewarded,
      explanation: capsule.explanation,
      source: capsule.source,
      sourceDate: capsule.sourceDate,
      rescuedToday,
      totalPlaces,
      nextRescueAt,
      rescueCooldownMs: cooldownMs,
      legendaryAwarded,
      legendaryKeys,
    };
  },
});

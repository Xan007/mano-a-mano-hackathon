import { v, ConvexError } from "convex/values";
import {
  action,
  mutation,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requirePlayer, getPlayer } from "./lib/auth";
import { scaled } from "./lib/time";
import { pickNextHolder } from "./lib/travel";
import { recordAction } from "./lib/actions";
import { PLUSH } from "../config/game";
import {
  DELIVERY_RETRY_MAX_MS,
  DELIVERY_RETRY_MIN_MS,
  DELIVERY_WAIT_MS,
  DEMO_PASS_MS,
  LIVE_HOLD_MS,
} from "../config/operations";
import { demoNote } from "./lib/demo";
import { noteIsFresh } from "./lib/community";
import {
  EVOLUTION_COSTS,
  NOTE_LIFETIME_MS,
  POTIONS,
} from "../config/care";

const noteValidator = v.string();

async function assertNoteRate(ctx: MutationCtx, authorId: Id<"players">) {
  const since = Date.now() - 60 * 60 * 1000;
  const recent = await ctx.db
    .query("notes")
    .withIndex("by_author", (q) =>
      q.eq("authorId", authorId).gt("createdAt", since),
    )
    .collect();

  if (recent.length >= PLUSH.MAX_NOTES_PER_HOUR) {
    throw new ConvexError(
      "Demasiadas notas seguidas. Descansa un momento y vuelve.",
    );
  }
}

async function insertNote(
  ctx: MutationCtx,
  plushId: Id<"plushItems">,
  authorId: Id<"players">,
  body: string,
  hopIndex: number,
) {
  const clean = body.trim();
  if (!clean) return;
  if (clean.length > PLUSH.NOTE_MAX_CHARS)
    throw new ConvexError("La nota es muy larga");

  await assertNoteRate(ctx, authorId);
  const author = await ctx.db.get(authorId);
  await ctx.db.insert("notes", {
    plushId,
    authorId,
    body: clean,
    hopIndex,
    hidden: false,
    theme: "papel",
    cover: author?.noteCover,
    effect: author?.noteEffect ?? "ninguno",
    permanent: true,
    createdAt: Date.now(),
    moderationStatus: "published",
    isDemo: Boolean(author?.isDemo),
    demoOwnerId: author?.demoOwnerId,
  });

}

async function markReturned(
  ctx: MutationCtx,
  itemId: Id<"plushItems">,
  now: number,
) {
  await ctx.db.patch(itemId, { status: "returned", waitingSince: undefined, retryScheduledAt: undefined });
  const notes = await ctx.db
    .query("notes")
    .withIndex("by_plush", (q) => q.eq("plushId", itemId))
    .collect();

  for (const note of notes) {
    if (note.permanent || note.expiresAt) continue;
    await ctx.db.patch(note._id, { expiresAt: now + NOTE_LIFETIME_MS });
  }
}

async function advance(
  ctx: MutationCtx,
  item: Doc<"plushItems">,
  completedHop: number,
): Promise<{ returned: boolean; transitId?: Id<"transits"> }> {
  const now = Date.now();
  await ctx.db.patch(item._id, { hopCount: completedHop });

  if (completedHop >= item.hopsTarget) {
    await markReturned(ctx, item._id, now);
    return { returned: true };
  }

  const nextId = await pickNextHolder(ctx, item._id, item.originId);
  if (!nextId) {
    if (completedHop > 0 || now - (item.waitingSince ?? now) >= DELIVERY_WAIT_MS) {
      await markReturned(ctx, item._id, now);
      return { returned: true };
    }
    // Back off retries when no recipient is available. This keeps a quiet
    // network from scheduling a mutation every minute for two days.
    const waitedMs = now - (item.waitingSince ?? now);
    const retryMs = Math.min(
      DELIVERY_RETRY_MAX_MS,
      DELIVERY_RETRY_MIN_MS * 2 ** Math.floor(waitedMs / (30 * 60 * 1000)),
    );
    const retryAt = Math.min(
      (item.waitingSince ?? now) + DELIVERY_WAIT_MS,
      now + retryMs,
    );
    await ctx.db.patch(item._id, { waitingSince: item.waitingSince ?? now, retryScheduledAt: retryAt });
    await ctx.scheduler.runAt(retryAt, internal.plush.retryDelivery, { plushId: item._id });
    return { returned: false };
  }

  const origin = await ctx.db.get(item.originId);
  await ctx.db.patch(item._id, { waitingSince: undefined, retryScheduledAt: undefined });
  const dueAt = now + scaled(LIVE_HOLD_MS, Boolean(origin?.isDemo));
  const transitId = await ctx.db.insert("transits", {
    plushId: item._id,
    holderId: nextId,
    receivedAt: now,
    dueAt,
    hopIndex: completedHop + 1,
    state: "holding",
  });

  await ctx.scheduler.runAt(dueAt, internal.plush.autoPass, { transitId });

  const holder = await ctx.db.get(nextId);
  if (holder?.isNpc && holder.isDemo && origin?.isDemo && holder.demoOwnerId === origin.demoOwnerId) {
    await ctx.scheduler.runAt(now + DEMO_PASS_MS, internal.plush.npcPass, {
      transitId,
    });
  }

  return { returned: false, transitId };
}

export const commitSend = internalMutation({
  args: {
    token: v.string(),
    plushId: v.id("plushItems"),
    note: noteValidator,
    finishJourneyPerspective: v.optional(
      v.union(v.literal("self"), v.literal("others")),
    ),
  },
  handler: async (ctx, { token, plushId, note, finishJourneyPerspective }) => {
    const me = await requirePlayer(ctx, token);
    const item = await ctx.db.get(plushId);

    if (!item || item.originId !== me._id)
      throw new ConvexError("Ese peluche no es tuyo");
    if (item.status !== "collection")
      throw new ConvexError("Ese peluche ya salió de viaje");
    if (!note.trim()) throw new ConvexError("Escribe una nota antes de enviar");

    if (finishJourneyPerspective) {
      const rescue = await ctx.db
        .query("placeRescues")
        .withIndex("by_player_place", (q) =>
          q.eq("playerId", me._id).eq("placeId", "clinica"),
        )
        .first();
      if (!rescue)
        throw new ConvexError("Completa primero la historia de Yo Te Escucho.");
      await ctx.db.patch(me._id, {
        firstJourneyAt: me.firstJourneyAt ?? Date.now(),
        journeyPerspective: finishJourneyPerspective,
      });
    }
    await insertNote(ctx, plushId, me._id, note, 0);
    await ctx.db.patch(plushId, { status: "traveling" });
    await recordAction(ctx, me._id, "send_plush");
    await recordAction(ctx, me._id, "notes_written");

    return await advance(ctx, item, 0);
  },
});

export const retryDelivery = internalMutation({
  args: { plushId: v.id("plushItems") },
  handler: async (ctx, { plushId }) => {
    const item = await ctx.db.get(plushId);
    if (!item || item.status !== "traveling" || item.waitingSince === undefined) return;
    const origin = await ctx.db.get(item.originId);
    if (!origin || origin.bannedAt) { await markReturned(ctx, item._id, Date.now()); return; }
    const holding = await ctx.db.query("transits").withIndex("by_plush", q => q.eq("plushId", plushId)).filter(q => q.eq(q.field("state"), "holding")).first();
    if (!holding) await advance(ctx, item, item.hopCount);
  },
});

export const commitPass = internalMutation({
  args: {
    token: v.string(),
    transitId: v.id("transits"),
    note: v.optional(noteValidator),
  },
  handler: async (ctx, { token, transitId, note }) => {
    const me = await requirePlayer(ctx, token);
    const transit = await ctx.db.get(transitId);

    if (!transit || transit.holderId !== me._id)
      throw new ConvexError("Ese peluche no está contigo");
    if (transit.state !== "holding")
      throw new ConvexError("Ese peluche ya siguió su camino");

    const item = await ctx.db.get(transit.plushId);
    if (!item) throw new ConvexError("Peluche no encontrado");

    if (note) await insertNote(ctx, item._id, me._id, note, transit.hopIndex);

    await ctx.db.patch(transitId, { state: "passed" });
    await ctx.db.patch(me._id, { tokens: me.tokens + 1 });
    await recordAction(ctx, me._id, "plush_passed");
    if (note) await recordAction(ctx, me._id, "notes_written");

    return await advance(ctx, item, transit.hopIndex);
  },
});

export const autoPass = internalMutation({
  args: { transitId: v.id("transits"), force: v.optional(v.boolean()) },
  handler: async (ctx, { transitId, force }) => {
    const transit = await ctx.db.get(transitId);
    if (!transit || transit.state !== "holding") return;
    if (!force && Date.now() < transit.dueAt) return;

    const item = await ctx.db.get(transit.plushId);
    if (!item) return;

    await ctx.db.patch(transitId, { state: "auto_passed" });
    await advance(ctx, item, transit.hopIndex);
  },
});

export const npcPass = internalMutation({
  args: { transitId: v.id("transits") },
  handler: async (ctx, { transitId }) => {
    const transit = await ctx.db.get(transitId);
    if (!transit || transit.state !== "holding") return;

    const item = await ctx.db.get(transit.plushId);
    if (!item) return;

    const holder = await ctx.db.get(transit.holderId);
    const origin = await ctx.db.get(item.originId);
    if (!holder?.isNpc || !holder.isDemo || !origin?.isDemo || holder.demoOwnerId !== origin.demoOwnerId || holder.bannedAt) return;
    await demoNote(ctx, item._id, holder, transit.hopIndex, item._id.charCodeAt(0));

    await ctx.db.patch(transitId, { state: "passed" });
    await advance(ctx, item, transit.hopIndex);
  },
});

export const getMyPlushes = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return [];

    const items = await ctx.db
      .query("plushItems")
      .withIndex("by_origin", (q) => q.eq("originId", me._id))
      .collect();

    const withCatalog = await Promise.all(
      items.map(async (item) => {
        const catalog = await ctx.db.get(item.catalogId);
        let receivedNoteCount = 0;
        if (item.status === "returned") {
          const notes = await ctx.db.query("notes").withIndex("by_plush", (q) => q.eq("plushId", item._id)).collect();
          for (const note of notes) {
            if (note.authorId === me._id || !noteIsFresh(note, Date.now()) || note.moderationStatus === "pending" || note.moderationStatus === "removed") continue;
            const author = await ctx.db.get(note.authorId);
            if (!author) continue;
            if (me.isDemo ? author.demoOwnerId !== me.demoOwnerId : note.isDemo || author.isDemo || author.isNpc) continue;
            receivedNoteCount++;
          }
        }
        return { ...item, catalog, receivedNoteCount };
      }),
    );

    return withCatalog.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getOne = query({
  args: { token: v.string(), plushId: v.id("plushItems") },
  handler: async (ctx, { token, plushId }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return null;

    const item = await ctx.db.get(plushId);
    if (!item) return null;
    if (item.originId !== me._id) return null;

    const catalog = await ctx.db.get(item.catalogId);
    const holder = await ctx.db
      .query("transits")
      .withIndex("by_plush", (q) => q.eq("plushId", plushId))
      .filter((q) => q.eq(q.field("state"), "holding"))
      .first();

    const holderPlayer = holder ? await ctx.db.get(holder.holderId) : null;

    const owned = await ctx.db
      .query("plushItems")
      .withIndex("by_origin", (q) => q.eq("originId", me._id))
      .collect();
    const duplicateCount = owned.filter(
      (entry) =>
        entry._id !== item._id &&
        entry.catalogId === item.catalogId &&
        entry.status === "collection",
    ).length;

    return {
      ...item,
      evolution: item.evolution ?? 1,
      duplicateCount,
      catalog,
      holderAlias: holderPlayer?.alias ?? null,
      holderCompanion: holderPlayer?.companion ?? null,
      holderIsNpc: holderPlayer?.isNpc ?? false,
    };
  },
});

export const evolve = mutation({
  args: { token: v.string(), plushId: v.id("plushItems") },
  handler: async (ctx, { token, plushId }) => {
    const me = await requirePlayer(ctx, token);
    const item = await ctx.db.get(plushId);
    if (!item || item.originId !== me._id)
      throw new ConvexError("Ese peluche no es tuyo");
    if (item.status === "traveling") {
      throw new ConvexError("Espera a que regrese para evolucionarlo");
    }

    const current = item.evolution ?? 1;
    if (current >= 3) throw new ConvexError("Tu peluche ya es Leyenda");
    const next = (current + 1) as 2 | 3;
    const cost = EVOLUTION_COSTS[next];

    const owned = await ctx.db
      .query("plushItems")
      .withIndex("by_origin", (q) => q.eq("originId", me._id))
      .collect();
    const duplicates = owned
      .filter(
        (entry) =>
          entry._id !== item._id &&
          entry.catalogId === item.catalogId &&
          entry.status === "collection",
      )
      .sort((a, b) => a.createdAt - b.createdAt);

    if (duplicates.length < cost.duplicates) {
      throw new ConvexError(
        `Necesitas ${cost.duplicates} repetidos de esta especie para evolucionar`,
      );
    }
    if (me.tokens < cost.tokens) {
      throw new ConvexError(`Necesitas ${cost.tokens} fichas para evolucionar`);
    }

    for (const duplicate of duplicates.slice(0, cost.duplicates)) {
      await ctx.db.delete(duplicate._id);
    }

    const tokens = me.tokens - cost.tokens;
    const hopsTarget = item.hopsTarget + cost.hops;
    await ctx.db.patch(plushId, { evolution: next, hopsTarget });
    await ctx.db.patch(me._id, { tokens });

    return {
      evolution: next,
      hopsTarget,
      tokens,
      consumed: cost.duplicates,
    };
  },
});

export const usePotion = mutation({
  args: {
    token: v.string(),
    plushId: v.id("plushItems"),
    kind: v.union(v.literal("shiny"), v.literal("secret")),
  },
  handler: async (ctx, { token, plushId, kind }) => {
    const me = await requirePlayer(ctx, token);
    const item = await ctx.db.get(plushId);
    if (!item || item.originId !== me._id)
      throw new ConvexError("Ese peluche no es tuyo");

    const potion = POTIONS[kind];
    const stage = item.evolution ?? 1;
    if (stage < potion.minStage) {
      throw new ConvexError(
        "Ese peluche todavía no está listo para esta poción",
      );
    }
    if (item.variant === kind) {
      throw new ConvexError("Tu peluche ya tiene esa variante");
    }
    if (kind === "shiny" && item.variant === "secret") {
      throw new ConvexError("Tu peluche secreto ya es más raro que shiny");
    }

    const inventory =
      kind === "shiny" ? (me.shinyPotions ?? 0) : (me.secretPotions ?? 0);
    let tokens = me.tokens;
    let spentTokens = 0;
    let usedInventory = false;

    if (inventory > 0) {
      usedInventory = true;
    } else {
      if (me.tokens < potion.cost) {
        throw new ConvexError(
          `Necesitas ${potion.cost} fichas para esa poción`,
        );
      }
      tokens -= potion.cost;
      spentTokens = potion.cost;
    }

    const pity = kind === "shiny" ? (me.shinyPity ?? 0) : (me.secretPity ?? 0);
    const roll = Math.random() * 100;
    const success = roll < potion.chance || pity + 1 >= potion.guarantee;
    const nextPity = success ? 0 : pity + 1;
    const nextVariant = success ? kind : item.variant;

    await ctx.db.patch(me._id, {
      tokens,
      ...(kind === "shiny"
        ? {
            shinyPity: nextPity,
            shinyPotions: usedInventory
              ? inventory - 1
              : (me.shinyPotions ?? 0),
          }
        : {
            secretPity: nextPity,
            secretPotions: usedInventory
              ? inventory - 1
              : (me.secretPotions ?? 0),
          }),
    });

    if (success) {
      await ctx.db.patch(plushId, { variant: nextVariant });
    }

    return {
      success,
      variant: nextVariant ?? null,
      pity: nextPity,
      chance: potion.chance,
      guarantee: potion.guarantee,
      spentTokens,
      usedInventory,
      tokens,
    };
  },
});

export const authorizeNote = internalQuery({
  args: {
    token: v.string(),
    plushId: v.optional(v.id("plushItems")),
    transitId: v.optional(v.id("transits")),
  },
  handler: async (ctx, { token, plushId, transitId }) => {
    const me = await requirePlayer(ctx, token);
    if (plushId) {
      const item = await ctx.db.get(plushId);
      if (!item || item.originId !== me._id || item.status !== "collection")
        throw new ConvexError("Ese peluche no está disponible para enviar.");
    } else if (transitId) {
      const transit = await ctx.db.get(transitId);
      if (
        !transit ||
        transit.holderId !== me._id ||
        transit.state !== "holding"
      )
        throw new ConvexError("Ese peluche ya no está en tu buzón.");
    } else throw new ConvexError("Falta el peluche.");
    return null;
  },
});

function moderationError(result: { decision: string; reasonCode: string }) {
  if (result.decision === "unavailable")
    throw new ConvexError(
      "No pudimos revisar tu nota ahora. No se envió ni se gastó nada; conserva tu texto e intenta de nuevo.",
    );
  if (result.decision === "block")
    throw new ConvexError(
      result.reasonCode === "PII"
        ? "Tu nota parece incluir datos personales o de contacto. Quítalos antes de enviar."
        : "Revisa tu nota: escribe un mensaje amable, sin insultos, consejos de tratamiento ni datos personales.",
    );
}

type TravelResult = { returned: boolean; transitId?: Id<"transits"> };
export const send = action({
  args: {
    token: v.string(),
    plushId: v.id("plushItems"),
    note: v.string(),
    finishJourneyPerspective: v.optional(
      v.union(v.literal("self"), v.literal("others")),
    ),
  },
  handler: async (ctx, args): Promise<TravelResult> => {
    await ctx.runQuery(internal.plush.authorizeNote, {
      token: args.token,
      plushId: args.plushId,
    });
    const clean = args.note.trim().normalize("NFKC");
    if (!clean || clean.length > PLUSH.NOTE_MAX_CHARS)
      throw new ConvexError(`Escribe una nota de 1 a ${PLUSH.NOTE_MAX_CHARS} caracteres.`);
    const review = await ctx.runAction(internal.moderation.check, {
      text: clean,
    });
    moderationError(review);
    return await ctx.runMutation(internal.plush.commitSend, {
      ...args,
      note: clean,
    });
  },
});
export const pass = action({
  args: {
    token: v.string(),
    transitId: v.id("transits"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<TravelResult> => {
    await ctx.runQuery(internal.plush.authorizeNote, {
      token: args.token,
      transitId: args.transitId,
    });
    const clean = args.note?.trim().normalize("NFKC");
    if (clean) {
      if (clean.length > PLUSH.NOTE_MAX_CHARS)
        throw new ConvexError(`La nota puede tener hasta ${PLUSH.NOTE_MAX_CHARS} caracteres.`);
      moderationError(
        await ctx.runAction(internal.moderation.check, { text: clean }),
      );
    }
    return await ctx.runMutation(internal.plush.commitPass, {
      ...args,
      note: clean || undefined,
    });
  },
});

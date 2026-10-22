import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requirePlayer, getPlayer } from "./lib/auth";
import { likeState } from "./lib/likes";
import { noteIsFresh } from "./lib/community";
import { NOTE_PERMANENT_COST } from "../config/care";
import { publicDemoEnabled } from "./lib/publicDemo";

async function authorInfo(ctx: QueryCtx, authorId: Id<"players">) {
  const author = await ctx.db.get(authorId);
  return {
    authorId: author?._id ?? null,
    alias: author?.alias ?? null,
    companion: author?.companion ?? null,
    isNpc: author?.isNpc ?? false,
  };
}

export const byPlush = query({
  args: { token: v.string(), plushId: v.id("plushItems") },
  handler: async (ctx, { token, plushId }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return [];
    const [demoIsOpen, item] = await Promise.all([
      publicDemoEnabled(ctx),
      ctx.db.get(plushId),
    ]);
    if (!item) return [];

    const isOwner = item.originId === me._id;
    if (isOwner && item.status === "traveling") return [];

    const holding = await ctx.db
      .query("transits")
      .withIndex("by_plush", (q) => q.eq("plushId", plushId))
      .filter((q) => q.eq(q.field("state"), "holding"))
      .first();

    const isHolder = holding?.holderId === me._id;
    if (!isOwner && !isHolder) return [];

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_plush", (q) => q.eq("plushId", plushId))
      .filter((q) => q.eq(q.field("hidden"), false))
      .collect();

    const visible = (isOwner
      ? notes
      : notes.filter((note) => note.hopIndex < (holding?.hopIndex ?? 0))
    ).filter((note) => noteIsFresh(note, Date.now()));

    const safe = [];
    for (const note of visible) {
      const author = await ctx.db.get(note.authorId);
      if (!author || note.moderationStatus === "pending" || note.moderationStatus === "removed") continue;
      if (me.isDemo
        ? author.demoOwnerId !== me.demoOwnerId
        : author.isPublicNpc ? !(demoIsOpen && note.isPublicDemo) : note.isDemo || author.isDemo || author.isNpc) continue;
      safe.push(note);
    }

    return await Promise.all(
      safe
        .sort((a, b) => a.hopIndex - b.hopIndex)
        .map(async (note) => ({
          ...note,
          author: await authorInfo(ctx, note.authorId),
          ...(await likeState(ctx, note._id, me._id)),
        }))
    );
  },
});

export const report = mutation({
  args: { token: v.string(), noteId: v.id("notes") },
  handler: async (ctx, { token, noteId }) => {
    const me = await requirePlayer(ctx, token);
    const note = await ctx.db.get(noteId);
    if (!note) throw new ConvexError("Esa nota no existe");

    const item = await ctx.db.get(note.plushId);
    const holding = await ctx.db.query("transits").withIndex("by_plush", q => q.eq("plushId", note.plushId)).filter(q => q.eq(q.field("state"), "holding")).first();
    if (item?.originId !== me._id && holding?.holderId !== me._id) throw new ConvexError("No puedes reportar esa nota");

    const already = await ctx.db
      .query("reports")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .filter((q) => q.and(q.eq(q.field("reporterId"), me._id), q.neq(q.field("status"), "resolved")))
      .first();

    if (already) return { ok: true, hidden: true };

    await ctx.db.insert("reports", {
      noteId,
      reporterId: me._id,
      createdAt: Date.now(),
      status: "pending",
    });
    await ctx.db.patch(noteId, { hidden: true, moderationStatus: "pending", moderationReason: "Reportada por un participante." });

    return { ok: true, hidden: true };
  },
});

export const makePermanent = mutation({
  args: { token: v.string(), noteId: v.id("notes") },
  handler: async (ctx, { token, noteId }) => {
    const me = await requirePlayer(ctx, token);
    const note = await ctx.db.get(noteId);
    if (!note) throw new ConvexError("Esa nota no existe");

    const item = await ctx.db.get(note.plushId);
    if (!item || item.originId !== me._id) {
      throw new ConvexError("Solo el dueño del peluche puede conservar sus notas");
    }
    if (item.status === "traveling") {
      throw new ConvexError("Espera a que el peluche regrese para conservar sus notas");
    }
    if (note.permanent) return { ok: true, tokens: me.tokens, permanent: true };
    if (note.expiresAt && note.expiresAt <= Date.now()) {
      throw new ConvexError("Esa nota ya venció");
    }
    if (me.tokens < NOTE_PERMANENT_COST) {
      throw new ConvexError(`Necesitas ${NOTE_PERMANENT_COST} fichas para conservarla`);
    }

    const tokens = me.tokens - NOTE_PERMANENT_COST;
    await ctx.db.patch(noteId, { permanent: true });
    await ctx.db.patch(me._id, { tokens });

    return { ok: true, tokens, permanent: true };
  },
});

export const remove = mutation({
  args: { token: v.string(), noteId: v.id("notes") },
  handler: async (ctx, { token, noteId }) => {
    const me = await requirePlayer(ctx, token);
    const note = await ctx.db.get(noteId);
    if (!note) throw new ConvexError("Esa nota no existe");

    const item = await ctx.db.get(note.plushId);
    if (!item || item.originId !== me._id) {
      throw new ConvexError("Solo el dueño del peluche puede borrar sus notas");
    }
    if (item.status === "traveling") {
      throw new ConvexError("Espera a que el peluche regrese para borrar sus notas");
    }

    const likes = await ctx.db
      .query("noteLikes")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .collect();
    for (const like of likes) await ctx.db.delete(like._id);

    await ctx.db.delete(noteId);

    return { ok: true };
  },
});

export const toggleLike = mutation({
  args: { token: v.string(), noteId: v.id("notes"), vote: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { token, noteId, vote }) => {
    const me = await requirePlayer(ctx, token);
    const note = await ctx.db.get(noteId);
    if (!note) throw new ConvexError("Esa nota no existe");
    const item = await ctx.db.get(note.plushId);
    const holding = await ctx.db.query("transits").withIndex("by_plush", q => q.eq("plushId", note.plushId)).filter(q => q.eq(q.field("state"), "holding")).first();
    if (note.hidden || (item?.originId !== me._id && holding?.holderId !== me._id)) throw new ConvexError("No puedes dar corazón a esa nota");
    if (note.authorId === me._id) {
      throw new ConvexError("No puedes darle corazón a tu propia nota");
    }

    const existing = await ctx.db
      .query("noteLikes")
      .withIndex("by_note_player", (q) => q.eq("noteId", noteId).eq("playerId", me._id))
      .first();

    if (existing?.vote === vote || (existing && existing.vote === undefined && vote === "up")) {
      await ctx.db.delete(existing._id);
    } else if (existing) {
      await ctx.db.patch(existing._id, { vote });
    } else {
      await ctx.db.insert("noteLikes", {
        noteId,
        playerId: me._id,
        vote,
        createdAt: Date.now(),
      });
    }

    const state = await likeState(ctx, noteId, me._id);
    await ctx.db.patch(noteId, { reputationHidden: state.autoHidden });
    return { ok: true, ...state };
  },
});



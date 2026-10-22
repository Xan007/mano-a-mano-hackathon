import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getPlayer, requirePlayer } from "./lib/auth";
import { likeState } from "./lib/likes";
import { noteIsFresh } from "./lib/community";
import { scaled } from "./lib/time";
import { LIVE_HOLD_MS } from "../config/operations";
import { DEMO_MESSAGES as NPC_NOTES, DEMO_MAILBOX_COOLDOWN_MS, PUBLIC_DEMO_MAILBOX_COOLDOWN_MS } from "../config/operations";
import { PLUSH } from "../config/game";
import { publicDemoEnabled } from "./lib/publicDemo";
import { ensurePublicDemoNpcs } from "./lib/publicDemo";
import { demoNote } from "./lib/demo";

async function mailboxItem(
  ctx: QueryCtx,
  me: Doc<"players">,
  transit: Doc<"transits">,
) {
  const item = await ctx.db.get(transit.plushId);
  if (!item) return null;

  const [catalog, origin, notes, demoIsOpen] = await Promise.all([
    ctx.db.get(item.catalogId),
    ctx.db.get(item.originId),
    ctx.db
      .query("notes")
      .withIndex("by_plush", (q) => q.eq("plushId", item._id))
      .filter((q) => q.eq(q.field("hidden"), false))
      .collect(),
    publicDemoEnabled(ctx),
  ]);
  if (!origin || (me.isDemo
    ? origin.demoOwnerId !== me.demoOwnerId
    : origin.isPublicNpc ? !demoIsOpen : origin.isNpc || origin.isDemo)) return null;
  const visible = (await Promise.all(notes.map(async (note) => ({ note, author: await ctx.db.get(note.authorId) }))))
    .filter(({ note, author }) =>
      note.hopIndex < transit.hopIndex && noteIsFresh(note, Date.now()) &&
      note.moderationStatus !== "pending" && note.moderationStatus !== "removed" &&
      (me.isDemo
        ? note.demoOwnerId === me.demoOwnerId
        : author?.isPublicNpc ? demoIsOpen && note.isPublicDemo : !note.isDemo),
    )
    .sort((a, b) => a.note.hopIndex - b.note.hopIndex || a.note.createdAt - b.note.createdAt);

  const allNotes = await Promise.all(
    visible.map(async ({ note, author }) => {
      return {
        _id: note._id,
        body: note.body,
        hopIndex: note.hopIndex,
        theme: note.theme ?? null,
        cover: note.cover ?? null,
        effect: note.effect ?? null,
        authorId: note.authorId,
        alias: author?.alias ?? "Alguien del Llano",
        companion: author?.companion ?? null,
        isNpc: author?.isNpc ?? false,
        ...(await likeState(ctx, note._id, me._id)),
      };
    }),
  );

  const firstNote = allNotes.find((note) => note.hopIndex === 0) ?? null;

  return {
    transitId: transit._id,
    dueAt: transit.dueAt,
    hopIndex: transit.hopIndex,
    plush: { ...item, catalog },
    origin: {
      alias: origin?.alias ?? "Alguien del Llano",
      companion: origin?.companion ?? null,
      isNpc: origin?.isNpc ?? false,
    },
    firstNote,
    handsCount: Math.max(0, transit.hopIndex - 1),
    notes: allNotes.filter((note) => note.hopIndex > 0),
    allNotes,
  };
}

async function heldByPlayer(ctx: QueryCtx, playerId: Doc<"players">["_id"]) {
  return await ctx.db
    .query("transits")
    .withIndex("by_holder_state", (q) =>
      q.eq("holderId", playerId).eq("state", "holding"),
    )
    .collect();
}

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return [];

    const holding = (await heldByPlayer(ctx, me._id))
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, PLUSH.INBOX_CAPACITY);
    const items = await Promise.all(
      holding.map((transit) => mailboxItem(ctx, me, transit)),
    );
    return items.filter((item) => item !== null);
  },
});

// Lightweight reactive data for the always-visible inbox badge and arrival toast.
export const arrivals = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return [];

    const holding = (await heldByPlayer(ctx, me._id))
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, PLUSH.INBOX_CAPACITY);
    const items = await Promise.all(holding.map(async (transit) => {
      const item = await ctx.db.get(transit.plushId);
      if (!item) return null;
      const [catalog, origin, demoIsOpen] = await Promise.all([
        ctx.db.get(item.catalogId),
        ctx.db.get(item.originId),
        publicDemoEnabled(ctx),
      ]);
      if (!origin || (me.isDemo
        ? origin.demoOwnerId !== me.demoOwnerId
        : origin.isPublicNpc ? !demoIsOpen : origin.isNpc || origin.isDemo)) return null;
      return {
        transitId: transit._id,
        species: catalog?.species ?? "peluche viajero",
        receivedAt: transit.receivedAt,
      };
    }));
    return items.filter((item) => item !== null);
  },
});

// Home and navigation only need the visit whose time runs out first.
export const today = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await getPlayer(ctx, token);
    if (!me) return null;
    const transit = (await heldByPlayer(ctx, me._id)).sort(
      (a, b) => a.dueAt - b.dueAt,
    )[0];
    return transit ? await mailboxItem(ctx, me, transit) : null;
  },
});

export const ensureDaily = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requirePlayer(ctx, token);
    const privateDemo = Boolean(me.isDemo && me.demoOwnerId);
    const publicDemo = !me.isDemo && await publicDemoEnabled(ctx);
    if (!privateDemo && !publicDemo) return { created: false };
    if (publicDemo) await ensurePublicDemoNpcs(ctx);
    const holding = await ctx.db
      .query("transits")
      .withIndex("by_holder_state", (q) =>
        q.eq("holderId", me._id).eq("state", "holding"),
      )
      .take(PLUSH.INBOX_CAPACITY);

    // Older synthetic visits were created at hop 2 with only the origin note.
    // Repair that exact legacy shape so current inboxes show the missing stop.
    for (const transit of privateDemo ? holding : []) {
      const item = await ctx.db.get(transit.plushId);
      if (
        !item ||
        item.hopCount !== 1 ||
        transit.hopIndex !== 2 ||
        Math.abs(item.createdAt - transit.receivedAt) > 1_000
      ) {
        continue;
      }
      const origin = await ctx.db.get(item.originId);
      if (!origin?.isNpc) continue;
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_plush", (q) => q.eq("plushId", item._id))
        .collect();
      if (
        notes.length !== 1 ||
        notes[0].hopIndex !== 0 ||
        notes.some((note) => note.hopIndex === 1)
      ) {
        continue;
      }
      const body =
        NPC_NOTES.find((candidate) => candidate !== notes[0].body) ??
        NPC_NOTES[0];
      await ctx.db.insert("notes", {
        plushId: item._id,
        authorId: origin._id,
        body,
        hopIndex: 1,
        hidden: false,
        permanent: true,
        createdAt: transit.receivedAt + 1,
        isDemo: true, demoOwnerId: me.demoOwnerId, cover: origin.noteCover, effect: origin.noteEffect, moderationStatus: "published",
      });
    }

    if (holding.length >= PLUSH.INBOX_CAPACITY) {
      return { created: false };
    }

    const cooldownMs = privateDemo ? DEMO_MAILBOX_COOLDOWN_MS : PUBLIC_DEMO_MAILBOX_COOLDOWN_MS;
    const now = Date.now();

    if (me.lastMailboxAt && now - me.lastMailboxAt < cooldownMs) {
      return { created: false };
    }

    const senders = privateDemo
      ? (await ctx.db.query("players").withIndex("by_demo_owner", q => q.eq("demoOwnerId", me.demoOwnerId!)).take(100)).filter(player => player.isNpc && player.isDemo && !player.bannedAt)
      : (await ctx.db.query("players").withIndex("by_public_npc", q => q.eq("isPublicNpc", true)).take(100)).filter(player => !player.bannedAt);
    if (senders.length === 0) return { created: false };

    const sender = senders[Math.floor(Math.random() * senders.length)];
    const previousHolder =
      senders.find((candidate) => candidate._id !== sender._id) ?? sender;
    const catalog = await ctx.db.query("plushCatalog").collect();
    if (catalog.length === 0) return { created: false };
    const picked = catalog[Math.floor(Math.random() * catalog.length)];
    const firstBody = NPC_NOTES[Math.floor(Math.random() * NPC_NOTES.length)];
    const otherNotes = NPC_NOTES.filter((body) => body !== firstBody);
    const secondBody =
      otherNotes[Math.floor(Math.random() * otherNotes.length)] ?? firstBody;

    const plushId = await ctx.db.insert("plushItems", {
      catalogId: picked._id,
      originId: sender._id,
      status: "traveling",
      hopCount: 1,
      hopsTarget: PLUSH.HOPS_TARGET,
      createdAt: now,
    });

    if (privateDemo) {
      await ctx.db.insert("notes", {
        plushId, authorId: sender._id, body: firstBody, hopIndex: 0, hidden: false, permanent: true,
        createdAt: now, isDemo: true, demoOwnerId: me.demoOwnerId, cover: sender.noteCover, effect: sender.noteEffect, moderationStatus: "published",
      });
      await ctx.db.insert("notes", {
        plushId, authorId: previousHolder._id, body: secondBody, hopIndex: 1, hidden: false, permanent: true,
        createdAt: now + 1, isDemo: true, demoOwnerId: me.demoOwnerId, cover: previousHolder.noteCover, effect: previousHolder.noteEffect, moderationStatus: "published",
      });
    } else {
      await demoNote(ctx, plushId, sender, 0, Math.floor(Math.random() * 20), true);
      await demoNote(ctx, plushId, previousHolder, 1, Math.floor(Math.random() * 20), true);
    }

    const dueAt = now + scaled(LIVE_HOLD_MS, true);
    const transitId = await ctx.db.insert("transits", {
      plushId,
      holderId: me._id,
      receivedAt: now,
      dueAt,
      hopIndex: 2,
      state: "holding",
    });

    await ctx.scheduler.runAt(dueAt, internal.plush.autoPass, { transitId });
    await ctx.db.patch(me._id, { lastMailboxAt: now });

    return { created: true, transitId };
  },
});

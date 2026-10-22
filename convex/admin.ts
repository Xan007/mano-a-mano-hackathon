import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requirePanelViewer, requireStaff, roleFor } from "./lib/auth";
import { createDemoWorld, resetDemoWorld } from "./lib/demo";
import { OWNER_EMAIL, LIVE_HOLD_MS, DEMO_HOLD_MS } from "../config/operations";
import { SUPPORT_CHANNELS } from "../config/support";
import { internal } from "./_generated/api";
import { ensurePublicDemoNpcs, publicDemoEnabled, setPublicDemoSetting } from "./lib/publicDemo";

function reasonText(reason: string) {
  const clean = reason.trim();
  if (clean.length < 3 || clean.length > 300) throw new ConvexError("Escribe un motivo de 3 a 300 caracteres.");
  return clean;
}
function safePlayer(p: Doc<"players">) {
  return { _id: p._id, createdAt: p._creationTime, alias: p.alias ?? "Sin apodo", companion: p.companion, email: p.verifiedEmail ?? null,
    isDemo: Boolean(p.isDemo || p.isNpc), isNpc: p.isNpc, bannedAt: p.bannedAt ?? null, banReason: p.banReason ?? null,
    lastSeenAt: p.lastSeenAt ?? null, hasGoogle: Boolean(p.clerkUserId), hasPassword: Boolean(p.passwordHash), firstJourneyAt: p.firstJourneyAt ?? null };
}
async function audit(ctx: MutationCtx, actor: Doc<"players">, action: string, target: string, reason: string, demo = false) {
  await ctx.db.insert("adminAudit", { actorId: actor._id, actorEmail: actor.verifiedEmail!, action, target, reason, demo, createdAt: Date.now() });
}

export const access = query({ args: { token: v.string() }, handler: async (ctx, { token }) => {
  try { const { actor, role, session } = await requirePanelViewer(ctx, token); return { role, email: actor.verifiedEmail ?? actor.alias ?? "Participante", demo: Boolean(session.demoPlayerId), publicDemo: await publicDemoEnabled(ctx) }; }
  catch { return null; }
} });

export const setPublicDemo = mutation({ args: { token: v.string(), enabled: v.boolean() }, handler: async (ctx, { token, enabled }) => {
  const { actor } = await requireStaff(ctx, token, true);
  if (enabled) await ensurePublicDemoNpcs(ctx);
  await setPublicDemoSetting(ctx, enabled, actor);
  await audit(ctx, actor, enabled ? "public-demo.enabled" : "public-demo.disabled", "public-demo", enabled ? "Modo compartido con personajes ficticios" : "Solo viajes entre participantes reales", true);
  return { enabled };
} });

export const setDemo = mutation({ args: { token: v.string(), enabled: v.boolean() }, handler: async (ctx, { token, enabled }) => {
  const { actor, session } = await requireStaff(ctx, token, true);
  const demoPlayerId = enabled ? await createDemoWorld(ctx, actor) : undefined;
  await ctx.db.patch(session._id, { demoPlayerId });
  await audit(ctx, actor, enabled ? "demo.enabled" : "demo.disabled", actor._id, "Cambio del entorno personal de presentación", true);
  return { enabled };
} });

export const resetDemo = mutation({ args: { token: v.string() }, handler: async (ctx, { token }) => {
  const { actor, session } = await requireStaff(ctx, token, true);
  if (!session.demoPlayerId) throw new ConvexError("Activa la demo antes de reiniciar la presentación.");
  const demoPlayerId = await resetDemoWorld(ctx, actor);
  await ctx.db.patch(session._id, { demoPlayerId });
  await audit(ctx, actor, "demo.reset", demoPlayerId, "Escenario ficticio reiniciado para el pitch", true);
  return { ok: true };
} });

export const overview = query({ args: { token: v.string() }, handler: async (ctx, { token }) => {
  const { actor, session, role } = await requirePanelViewer(ctx, token);
  const demo = Boolean(session.demoPlayerId);
  const shared = role === "viewer";
  const [players, notes, reports] = await Promise.all([ctx.db.query("players").take(2001), ctx.db.query("notes").order("desc").take(2001), ctx.db.query("channelReports").order("desc").take(1001)]);
  const people = players.filter(p => shared ? p.isPublicNpc === true : demo ? p.demoOwnerId === actor._id : !p.isDemo && !p.isNpc);
  const messages = notes.filter(n => shared ? n.isPublicDemo === true : demo ? n.demoOwnerId === actor._id : !n.isDemo || n.isPublicDemo);
  const visibleReports = reports.filter(r => shared ? r.synthetic : r.synthetic === demo);
  return { people: people.length, banned: people.filter(p => p.bannedAt).length, notes: messages.length,
    pendingNotes: messages.filter(n => n.moderationStatus === "pending" || (n.hidden && !n.moderationStatus)).length,
    pendingChannels: visibleReports.filter(r => r.status === "pending").length,
    bounded: players.length > 2000 || notes.length > 2000 || reports.length > 1000, demo, publicDemo: await publicDemoEnabled(ctx),
    holdMs: demo ? DEMO_HOLD_MS : LIVE_HOLD_MS };
} });

export const users = query({ args: { token: v.string(), paginationOpts: paginationOptsValidator }, handler: async (ctx, { token, paginationOpts }) => {
  const { actor, session, role } = await requirePanelViewer(ctx, token);
  const result = await ctx.db.query("players").filter(q => role === "viewer" ? q.eq(q.field("isPublicNpc"), true) : session.demoPlayerId ? q.eq(q.field("demoOwnerId"), actor._id) : q.and(q.neq(q.field("isDemo"), true), q.eq(q.field("isNpc"), false))).order("desc").paginate(paginationOpts);
  return { ...result, page: result.page.map(safePlayer) };
} });

export const userDetail = query({ args: { token: v.string(), playerId: v.id("players") }, handler: async (ctx, { token, playerId }) => {
  const { role } = await requirePanelViewer(ctx, token);
  const p = await ctx.db.get(playerId); if (!p) return null;
  if (role === "viewer" && !p.isPublicNpc) return null;
  const [items, notes] = await Promise.all([ctx.db.query("plushItems").withIndex("by_origin", q => q.eq("originId", p._id)).take(101), ctx.db.query("notes").withIndex("by_author", q => q.eq("authorId", p._id)).order("desc").take(101)]);
  return { player: safePlayer(p), plushes: await Promise.all(items.slice(0,100).map(async item => ({ ...item, catalog: await ctx.db.get(item.catalogId) }))), notes: notes.slice(0,100), truncated: items.length > 100 || notes.length > 100 };
} });

export const banUser = mutation({ args: { token: v.string(), playerId: v.id("players"), banned: v.boolean(), reason: v.string() }, handler: async (ctx, args): Promise<{ok:boolean}> => {
  const { actor } = await requireStaff(ctx, args.token); const reason = reasonText(args.reason);
  const target = await ctx.db.get(args.playerId); if (!target) throw new ConvexError("No encontramos a esa persona.");
  if (target._id === actor._id || target.verifiedEmail === OWNER_EMAIL || await roleFor(ctx, target)) throw new ConvexError("Retira primero el permiso del equipo. Tu cuenta administradora está protegida.");
  await ctx.db.patch(target._id, { bannedAt: args.banned ? Date.now() : undefined, bannedBy: args.banned ? actor._id : undefined, banReason: args.banned ? reason : undefined });
  if (args.banned) for (const transit of await ctx.db.query("transits").withIndex("by_holder_state", q => q.eq("holderId", target._id).eq("state", "holding")).collect()) await ctx.scheduler.runAfter(0, internal.plush.autoPass, { transitId: transit._id, force: true });
  await audit(ctx, actor, args.banned ? "user.banned" : "user.restored", target._id, reason, Boolean(target.isDemo));
  return { ok: true };
} });

export const notes = query({ args: { token: v.string(), status: v.union(v.literal("all"), v.literal("pending"), v.literal("published"), v.literal("removed")), paginationOpts: paginationOptsValidator }, handler: async (ctx, { token, status, paginationOpts }) => {
  const { actor, session, role } = await requirePanelViewer(ctx, token);
  const result = await ctx.db.query("notes").filter(q => q.and(
    role === "viewer" ? q.eq(q.field("isPublicDemo"), true) : session.demoPlayerId ? q.eq(q.field("demoOwnerId"), actor._id) : q.or(q.neq(q.field("isDemo"), true), q.eq(q.field("isPublicDemo"), true)),
    status === "all" ? q.eq(true, true) : status === "pending" ? q.or(q.eq(q.field("moderationStatus"), "pending"), q.and(q.eq(q.field("hidden"), true), q.eq(q.field("moderationStatus"), undefined))) : status === "published" ? q.and(q.eq(q.field("hidden"), false), q.neq(q.field("moderationStatus"), "removed")) : q.eq(q.field("moderationStatus"), "removed")
  )).order("desc").paginate(paginationOpts);
  return { ...result, page: await Promise.all(result.page.map(async note => ({ ...note, author: safePlayer((await ctx.db.get(note.authorId))!), reports: (await ctx.db.query("reports").withIndex("by_note", q => q.eq("noteId", note._id)).take(100)).length }))) };
} });

export const moderateNote = mutation({ args: { token: v.string(), noteId: v.id("notes"), status: v.union(v.literal("published"), v.literal("pending"), v.literal("removed")), reason: v.string() }, handler: async (ctx, { token, noteId, status, reason: raw }) => {
  const { actor } = await requireStaff(ctx, token); const reason = reasonText(raw);
  const note = await ctx.db.get(noteId); if (!note) throw new ConvexError("La nota ya no existe.");
  await ctx.db.patch(noteId, { hidden: status !== "published", moderationStatus: status, moderationReason: reason, moderatedBy: actor._id, moderatedAt: Date.now() });
  if (status !== "pending") for (const report of await ctx.db.query("reports").withIndex("by_note", q => q.eq("noteId", noteId)).collect()) await ctx.db.patch(report._id, { status: "resolved", resolvedAt: Date.now(), resolvedBy: actor._id });
  await audit(ctx, actor, `note.${status}`, noteId, reason, Boolean(note.isDemo));
  return { ok: true };
} });

export const channelReports = query({ args: { token: v.string(), paginationOpts: paginationOptsValidator }, handler: async (ctx, { token, paginationOpts }) => {
  const { session, role } = await requirePanelViewer(ctx, token);
  return await ctx.db.query("channelReports").filter(q => q.eq(q.field("synthetic"), role === "viewer" ? true : Boolean(session.demoPlayerId))).order("desc").paginate(paginationOpts);
} });

export const resolveChannelReport = mutation({ args: { token: v.string(), reportId: v.id("channelReports"), status: v.union(v.literal("resolved"), v.literal("dismissed")), reason: v.string() }, handler: async (ctx, { token, reportId, status, reason: raw }) => {
  const { actor } = await requireStaff(ctx, token); const reason = reasonText(raw);
  const report = await ctx.db.get(reportId); if (!report) throw new ConvexError("El reporte ya no existe.");
  await ctx.db.patch(reportId, { status, resolution: reason, resolvedBy: actor._id, resolvedAt: Date.now() });
  await audit(ctx, actor, `channel-report.${status}`, reportId, reason, report.synthetic); return { ok: true };
} });

export const team = query({ args: { token: v.string() }, handler: async (ctx, { token }) => {
  await requireStaff(ctx, token, true); return await ctx.db.query("staffMembers").take(100);
} });
export const setModerator = mutation({ args: { token: v.string(), email: v.string(), active: v.boolean() }, handler: async (ctx, { token, email: raw, active }) => {
  const { actor } = await requireStaff(ctx, token, true); const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ConvexError("Escribe un correo válido.");
  if (email === OWNER_EMAIL) throw new ConvexError("La cuenta administradora no se puede modificar aquí.");
  const previous = await ctx.db.query("staffMembers").withIndex("by_email", q => q.eq("email", email)).unique();
  const fields = { email, active, grantedBy: actor._id, grantedAt: Date.now(), revokedAt: active ? undefined : Date.now() };
  if (previous) await ctx.db.patch(previous._id, fields); else await ctx.db.insert("staffMembers", fields);
  await audit(ctx, actor, active ? "moderator.granted" : "moderator.revoked", email, "Gestión de permisos del equipo"); return { ok: true };
} });

export const activity = query({ args: { token: v.string(), paginationOpts: paginationOptsValidator }, handler: async (ctx, { token, paginationOpts }) => {
  const { role } = await requirePanelViewer(ctx, token);
  const audit = ctx.db.query("adminAudit");
  return role === "viewer"
    ? await audit.filter(q => q.eq(q.field("demo"), true)).order("desc").paginate(paginationOpts)
    : await audit.order("desc").paginate(paginationOpts);
} });

export const updateChannel = mutation({ args: { token: v.string(), channelId: v.union(v.literal("local"), v.literal("national")), phone: v.string(), whatsapp: v.string(), hours: v.string(), cost: v.string(), paused: v.boolean(), sourceUrl: v.string(), verifiedAt: v.string(), reason: v.string() }, handler: async (ctx, { token, reason: raw, ...fields }) => {
  const { actor, session } = await requireStaff(ctx, token, true); const reason = reasonText(raw);
  if (session.demoPlayerId) throw new ConvexError("Vuelve a producción para editar contactos reales. La demo solo permite ensayar reportes.");
  if (!SUPPORT_CHANNELS.some(c => c.id === fields.channelId) || !/^\d{3,15}$/.test(fields.phone) || (fields.whatsapp && !/^\d{10,15}$/.test(fields.whatsapp)) || !fields.hours.trim() || fields.hours.length > 120 || !fields.cost.trim() || fields.cost.length > 80 || !/^\d{4}-\d{2}-\d{2}$/.test(fields.verifiedAt)) throw new ConvexError("Revisa número, horario, costo y fecha.");
  try { if (new URL(fields.sourceUrl).protocol !== "https:") throw Error(); } catch { throw new ConvexError("Añade una fuente https verificable."); }
  const previous = await ctx.db.query("supportOverrides").withIndex("by_channel", q => q.eq("channelId", fields.channelId)).unique();
  const data = { ...fields, whatsapp: fields.whatsapp || undefined, updatedBy: actor._id, updatedAt: Date.now() };
  if (previous) await ctx.db.patch(previous._id, data); else await ctx.db.insert("supportOverrides", data);
  await audit(ctx, actor, "channel.updated", fields.channelId, reason); return { ok: true };
} });

// Archives pre-panel NPC traffic without deleting participants or their progress.
export const archiveLegacySynthetic = internalMutation({ args: {}, handler: async ctx => {
  const npcs = (await ctx.db.query("players").collect()).filter(p => p.isNpc && !p.isDemo);
  let hidden = 0, closed = 0;
  for (const npc of npcs) {
    await ctx.db.patch(npc._id, { isDemo: true });
    for (const note of await ctx.db.query("notes").withIndex("by_author", q => q.eq("authorId", npc._id)).collect()) { await ctx.db.patch(note._id, { isDemo: true }); hidden++; }
    for (const transit of await ctx.db.query("transits").withIndex("by_holder_state", q => q.eq("holderId", npc._id).eq("state", "holding")).collect()) {
      await ctx.db.patch(transit._id, { state: "auto_passed" }); const item = await ctx.db.get(transit.plushId);
      if (item) await ctx.db.patch(item._id, { status: "returned" }); closed++;
    }
    for (const item of await ctx.db.query("plushItems").withIndex("by_origin", q => q.eq("originId", npc._id)).collect()) {
      await ctx.db.patch(item._id, { status: "returned" });
      for (const transit of await ctx.db.query("transits").withIndex("by_plush", q => q.eq("plushId", item._id)).collect()) if (transit.state === "holding") { await ctx.db.patch(transit._id, { state: "auto_passed" }); closed++; }
    }
  }
  let rescheduled = 0;
  const holding = await ctx.db.query("transits").filter(q => q.eq(q.field("state"), "holding")).collect();
  for (const transit of holding) {
    const holder = await ctx.db.get(transit.holderId);
    const item = await ctx.db.get(transit.plushId);
    const origin = item && await ctx.db.get(item.originId);
    if (!holder || holder.isNpc || holder.isDemo || !origin || origin.isNpc || origin.isDemo) continue;
    const dueAt = transit.receivedAt + LIVE_HOLD_MS;
    if (transit.dueAt !== dueAt) {
      await ctx.db.patch(transit._id, { dueAt });
      await ctx.scheduler.runAt(Math.max(Date.now(), dueAt), internal.plush.autoPass, { transitId: transit._id });
      rescheduled++;
    }
  }
  return { archived: npcs.length, hidden, closed, rescheduled };
} });

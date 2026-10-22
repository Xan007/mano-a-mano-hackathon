import { v, ConvexError } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { getPlayer, sessionIdentity } from "./lib/auth";
import { aliasTaken } from "./lib/alias";
import { DEFAULT_COVER, STARTER_COVERS } from "../config/covers";
import { DEFAULT_LAYOUT, DEFAULT_THEME } from "../config/progression";

export const reserveAttempt = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const now = Date.now();
    const row = await ctx.db.query("authAttempts").withIndex("by_key", q=>q.eq("key", key)).unique();
    if (row && now - row.windowAt < 600_000) {
      if (row.count >= 8) return false;
      await ctx.db.patch(row._id, { count: row.count + 1 });
    } else if (row) await ctx.db.patch(row._id, { windowAt: now, count: 1 });
    else await ctx.db.insert("authAttempts", { key, windowAt: now, count: 1 });
    return true;
  },
});

export const findCredential = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const player = await ctx.db.query("players").withIndex("by_username", q=>q.eq("username", username)).unique();
    if (!player || player.isNpc || player.isDemo || player.bannedAt || !player.passwordHash || !player.passwordSalt) return null;
    return { id: player._id, hash: player.passwordHash, salt: player.passwordSalt };
  },
});

export const register = internalMutation({
  args: { username: v.string(), alias: v.string(), hash: v.string(), salt: v.string(), guestToken: v.optional(v.string()), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const guest = args.guestToken ? await getPlayer(ctx, args.guestToken) : null;
    if (args.guestToken && (!guest || guest.isNpc || guest.isDemo)) throw new ConvexError("Vuelve al entorno real antes de guardar una cuenta.");
    if (guest?.passwordHash) throw new ConvexError("Tu cuenta ya tiene contraseña. Puedes entrar con tu apodo.");
    const existing = await ctx.db.query("players").withIndex("by_username", q=>q.eq("username", args.username)).unique();
    if (existing && existing._id !== guest?._id) throw new ConvexError("Ese apodo de acceso ya está en uso.");
    if (guest && await aliasTaken(ctx, args.alias, guest._id)) throw new ConvexError("Ese apodo ya está en uso.");
    if (!guest && await ctx.db.query("players").withIndex("by_alias", q=>q.eq("alias", args.alias)).first()) throw new ConvexError("Ese apodo ya está en uso.");
    const identity = { username: args.username, alias: args.alias, passwordHash: args.hash, passwordSalt: args.salt };
    if (guest) {
      await ctx.db.patch(guest._id, identity);
      return { token: args.guestToken!, linked: true };
    }
    const playerId = await ctx.db.insert("players", { ...identity, companion: "", isNpc: false, tokens: 0, xp: 0, keys: 0, noteTheme: DEFAULT_THEME, noteLayout: DEFAULT_LAYOUT, noteCover: DEFAULT_COVER, ownedCovers: STARTER_COVERS });
    await ctx.db.insert("sessions", { token: args.sessionToken, playerId, createdAt: Date.now() });
    return { token: args.sessionToken, linked: false };
  },
});

export const finishLogin = internalMutation({
  args: { playerId: v.id("players"), expectedHash: v.string(), sessionToken: v.string(), upgradedHash: v.optional(v.string()), upgradedSalt: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player || player.isNpc || player.isDemo || player.bannedAt || player.passwordHash !== args.expectedHash) throw new ConvexError("No pudimos entrar. Intenta de nuevo.");
    if (args.upgradedHash) await ctx.db.patch(player._id, { passwordHash: args.upgradedHash, passwordSalt: args.upgradedSalt });
    await ctx.db.insert("sessions", { token: args.sessionToken, playerId: player._id, createdAt: Date.now() });
    return { token: args.sessionToken };
  },
});

export const google = internalMutation({
  args: { subject: v.string(), verifiedEmail: v.optional(v.string()), guestToken: v.optional(v.string()), sessionToken: v.string() },
  handler: async (ctx, { subject, verifiedEmail, guestToken, sessionToken }) => {
    const existing = await ctx.db.query("players").withIndex("by_clerk", q=>q.eq("clerkUserId", subject)).unique();
    const guest = guestToken ? await getPlayer(ctx, guestToken) : null;
    if (guestToken && (!guest || guest.isNpc || guest.isDemo)) throw new ConvexError("Vuelve al entorno real antes de vincular una cuenta.");
    if (existing) {
      if (existing.isNpc || existing.isDemo || existing.bannedAt) throw new ConvexError("Esta cuenta no está disponible.");
      await ctx.db.patch(existing._id, { verifiedEmail, identityVerifiedAt: Date.now() });
      if (guest?._id === existing._id) return { token: guestToken!, linked: true };
      await ctx.db.insert("sessions", { token: sessionToken, playerId: existing._id, createdAt: Date.now() });
      return { token: sessionToken, linked: false };
    }
    if (guest) {
      if (guest.clerkUserId) throw new ConvexError("Este recorrido ya está vinculado a otra cuenta de Google.");
      await ctx.db.patch(guest._id, { clerkUserId: subject, verifiedEmail, identityVerifiedAt: Date.now() });
      return { token: guestToken!, linked: true };
    }
    const playerId = await ctx.db.insert("players", { clerkUserId: subject, verifiedEmail, identityVerifiedAt: Date.now(), companion: "", isNpc: false, tokens: 0, xp: 0, keys: 0, noteTheme: DEFAULT_THEME, noteLayout: DEFAULT_LAYOUT, noteCover: DEFAULT_COVER, ownedCovers: STARTER_COVERS });
    await ctx.db.insert("sessions", { token: sessionToken, playerId, createdAt: Date.now() });
    return { token: sessionToken, linked: false };
  },
});

export const refreshIdentity = internalMutation({
  args: { token: v.string(), subject: v.string(), verifiedEmail: v.optional(v.string()) },
  handler: async (ctx, { token, subject, verifiedEmail }) => {
    const identity = await sessionIdentity(ctx, token);
    if (!identity || identity.actor.clerkUserId !== subject || identity.actor.bannedAt) throw new ConvexError("La cuenta de Google no coincide con tu sesión.");
    await ctx.db.patch(identity.actor._id, { verifiedEmail, identityVerifiedAt: Date.now() });
    return { ok: true };
  },
});

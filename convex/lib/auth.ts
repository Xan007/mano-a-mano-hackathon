import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { OWNER_EMAIL } from "../../config/operations";
import { publicDemoEnabled } from "./publicDemo";

type AnyCtx = QueryCtx | MutationCtx;

export async function sessionIdentity(ctx: AnyCtx, token: string) {
  if (!token) return null;

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) return null;
  const actor = await ctx.db.get(session.playerId);
  if (!actor) return null;
  return { session, actor };
}

export async function roleFor(ctx: AnyCtx, player: { verifiedEmail?: string; bannedAt?: number }) {
  if (player.bannedAt || !player.verifiedEmail) return null;
  if (player.verifiedEmail === OWNER_EMAIL) return "admin" as const;
  const membership = await ctx.db.query("staffMembers").withIndex("by_email", q => q.eq("email", player.verifiedEmail!)).unique();
  return membership?.active ? "moderator" as const : null;
}

export async function requireStaff(ctx: AnyCtx, token: string, ownerOnly = false) {
  const identity = await sessionIdentity(ctx, token);
  const role = identity && await roleFor(ctx, identity.actor);
  if (!identity || !role || (ownerOnly && role !== "admin")) throw new ConvexError("No tienes permisos para esta acción.");
  return { ...identity, role };
}

// Read-only access for participants while the shared demo is active. Mutations
// continue to use requireStaff, so viewers cannot change environments or data.
export async function requirePanelViewer(ctx: AnyCtx, token: string) {
  const identity = await sessionIdentity(ctx, token);
  if (!identity || identity.actor.bannedAt) throw new ConvexError("No tienes permisos para ver el panel.");
  const role = await roleFor(ctx, identity.actor);
  if (role) return { ...identity, role };
  if (await publicDemoEnabled(ctx)) return { ...identity, role: "viewer" as const };
  throw new ConvexError("No tienes permisos para ver el panel.");
}

export async function getPlayer(ctx: AnyCtx, token: string) {
  const identity = await sessionIdentity(ctx, token);
  if (!identity || identity.actor.bannedAt) return null;
  if (identity.session.demoPlayerId) {
    if (await roleFor(ctx, identity.actor) !== "admin") return identity.actor;
    const demo = await ctx.db.get(identity.session.demoPlayerId);
    if (demo?.isDemo && demo.demoOwnerId === identity.actor._id && !demo.bannedAt) return demo;
  }
  return identity.actor;
}

export async function requirePlayer(ctx: AnyCtx, token: string) {
  const player = await getPlayer(ctx, token);
  if (!player) throw new ConvexError("Tu sesión expiró. Vuelve a entrar.");
  return player;
}


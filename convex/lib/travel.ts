import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { PLUSH } from "../../config/game";
import { ensurePublicDemoNpcs, publicDemoEnabled } from "./publicDemo";

const RECENT_PLAYER_SAMPLE = 256;
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
const CANDIDATE_WINDOW_MS = 48 * 60 * 60 * 1000;

export async function pickNextHolder(
  ctx: MutationCtx,
  plushId: Id<"plushItems">,
  originId: Id<"players">,
): Promise<Id<"players"> | null> {
  const transits = await ctx.db
    .query("transits")
    .withIndex("by_plush", (q) => q.eq("plushId", plushId))
    .collect();

  const excluded = new Set<string>([originId]);
  for (const transit of transits) excluded.add(transit.holderId);

  const origin = await ctx.db.get(originId);
  if (!origin || origin.bannedAt) return null;
  const now = Date.now();
  // Bound the candidate scan. Demo users are scoped to their owner's small demo
  // environment; live traffic uses the last-seen index and a recent sample.
  const demoIsOpen = await publicDemoEnabled(ctx);
  if (demoIsOpen && !origin.isDemo) await ensurePublicDemoNpcs(ctx);
  const livePlayers = origin.isDemo && origin.demoOwnerId
    ? await ctx.db.query("players")
      .withIndex("by_demo_owner", q => q.eq("demoOwnerId", origin.demoOwnerId))
      .take(RECENT_PLAYER_SAMPLE)
    : await ctx.db.query("players")
      .withIndex("by_last_seen", q => q.gte("lastSeenAt", now - CANDIDATE_WINDOW_MS))
      .order("desc")
      .take(RECENT_PLAYER_SAMPLE);
  const publicNpcs = (!origin.isDemo || origin.isPublicNpc) && demoIsOpen
    ? await ctx.db.query("players")
      .withIndex("by_public_npc", q => q.eq("isPublicNpc", true))
      .take(RECENT_PLAYER_SAMPLE)
    : [];
  const players = [...livePlayers, ...publicNpcs];
  const pool = players.filter(
    (player) => player.companion !== "" && !player.bannedAt && !excluded.has(player._id) &&
      (origin.isPublicNpc
        ? player.isPublicNpc
        : origin.isDemo
          ? player.isDemo && player.demoOwnerId === origin.demoOwnerId
          : player.isPublicNpc ? demoIsOpen : !player.isDemo && !player.isNpc),
  );
  const occupancy = await Promise.all(
    pool.map(async (player) => ({
      player,
      holding: await ctx.db
        .query("transits")
        .withIndex("by_holder_state", (q) =>
          q.eq("holderId", player._id).eq("state", "holding"),
        )
        .take(PLUSH.INBOX_CAPACITY),
    })),
  );
  const available = occupancy
    .filter(({ holding }) => holding.length < PLUSH.INBOX_CAPACITY)
    .map(({ player }) => player);
  const activePeople = available.filter(
    (player) =>
      !player.isNpc &&
      Boolean(player.firstJourneyAt) &&
      (player.lastSeenAt ?? 0) > now - ACTIVE_WINDOW_MS,
  );
  const publicNpcsAvailable = available.filter(player => player.isPublicNpc);
  const candidates = origin.isDemo
    ? activePeople.length ? activePeople : available.filter(player => player.isNpc)
    : demoIsOpen
      ? activePeople.length && publicNpcsAvailable.length
        // Keep shared journeys visibly alive even when other people have the
        // app open. A 50/50 choice between groups prevents idle accounts from
        // starving the automatic demo characters.
        ? Math.random() < 0.5 ? activePeople : publicNpcsAvailable
        : activePeople.length
          ? activePeople
          : publicNpcsAvailable.length
            ? publicNpcsAvailable
            : available.filter(player => !player.isNpc && player.firstJourneyAt)
      : activePeople.length ? activePeople : available.filter(player => !player.isNpc && player.firstJourneyAt);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]._id;
}

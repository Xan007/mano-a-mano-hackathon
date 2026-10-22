import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  DEFAULT_LAYOUT,
  DEFAULT_THEME,
  KEYS_PER_LEVEL,
  XP_PER_ACTION,
  levelProgress,
  type MissionMetric,
} from "../../config/progression";

const XP_BY_METRIC: Record<MissionMetric, number> = {
  send_plush: XP_PER_ACTION.send,
  notes_written: XP_PER_ACTION.note,
  expedition_claim: XP_PER_ACTION.expedition,
  box_open: XP_PER_ACTION.box,
  plush_passed: XP_PER_ACTION.pass,
  capsule_complete: XP_PER_ACTION.capsule,
};

export function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function metricXp(metric: MissionMetric): number {
  return XP_BY_METRIC[metric];
}

export function ownedThemesOf(player: Doc<"players">): string[] {
  const stored = player.ownedThemes ?? [];
  return stored.includes(DEFAULT_THEME) ? stored : [DEFAULT_THEME, ...stored];
}

export function ownedLayoutsOf(player: Doc<"players">): string[] {
  const stored = player.ownedLayouts ?? [];
  return stored.includes(DEFAULT_LAYOUT) ? stored : [DEFAULT_LAYOUT, ...stored];
}

export async function grantXp(
  ctx: MutationCtx,
  playerId: Id<"players">,
  amount: number
): Promise<{ xp: number; keys: number; levelsGained: number }> {
  const player = await ctx.db.get(playerId);
  if (!player) return { xp: 0, keys: 0, levelsGained: 0 };

  const xp = (player.xp ?? 0) + Math.max(0, Math.round(amount));
  const before = levelProgress(player.xp ?? 0).level;
  const after = levelProgress(xp).level;
  const levelsGained = Math.max(0, after - before);
  const keys = (player.keys ?? 0) + levelsGained * KEYS_PER_LEVEL;

  await ctx.db.patch(playerId, { xp, keys });
  return { xp, keys, levelsGained };
}

export async function recordAction(
  ctx: MutationCtx,
  playerId: Id<"players">,
  metric: MissionMetric
): Promise<void> {
  const player = await ctx.db.get(playerId);
  if (!player || player.isNpc) return;

  await grantXp(ctx, playerId, metricXp(metric));
}

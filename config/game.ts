import { LIVE_HOLD_MS, NOTE_MAX_CHARS } from "./operations";

export const TOKENS = {
  FREE_DAILY: 3,
  WELCOME: 5,
  EXPEDITION_SHORT: 2,
  EXPEDITION_MEDIUM: 4,
  EXPEDITION_LONG: 6,
  CAPSULE_REWARD: 1,
  PASS_REWARD: 1,
  BOX_COST: 5,
} as const;

export const RARITY_WEIGHTS = {
  comun: 65,
  raro: 30,
  epico: 0,
  legendario: 5,
} as const;

export type Rarity = keyof typeof RARITY_WEIGHTS;

export const RARITIES: Rarity[] = ["comun", "raro", "epico", "legendario"];

export const RARITY_ORDER: Record<Rarity, number> = {
  comun: 0,
  raro: 1,
  epico: 2,
  legendario: 3,
};

export const RARITY_LABELS: Record<Rarity, string> = {
  comun: "común",
  raro: "raro",
  epico: "épico",
  legendario: "legendario",
};

export const MAX_REROLLS = 2;

export const PLUSH = {
  HOPS_TARGET: 7,
  HOLD_HOURS: LIVE_HOLD_MS / (60 * 60 * 1000),
  INBOX_CAPACITY: 2,
  NOTE_MAX_CHARS,
  MAX_NOTES_PER_HOUR: 20,
} as const;

export const CAPSULE_MIN_READ_MS = 5_000;

export const EXPEDITION_READY_GRACE_MS = 1_500;

export const NPC_PASS_DELAY_MS = 15_000;

export const EXPEDITIONS = {
  short: { durationMs: 30 * 60 * 1000, tokens: TOKENS.EXPEDITION_SHORT, label: "Corta" },
  medium: { durationMs: 2 * 60 * 60 * 1000, tokens: TOKENS.EXPEDITION_MEDIUM, label: "Media" },
  long: { durationMs: 4 * 60 * 60 * 1000, tokens: TOKENS.EXPEDITION_LONG, label: "Larga" },
} as const;

export type ExpeditionKind = keyof typeof EXPEDITIONS;

export const EXPEDITION_KINDS: ExpeditionKind[] = ["short", "medium", "long"];

export const TIME = {
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
} as const;

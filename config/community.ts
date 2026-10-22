export type CommunityMilestone = {
  id: number;
  percent: number;
  tokens: number;
  shinyPotions: number;
  secretPotions: number;
  keys: number;
};

export const COMMUNITY_TARGET = 1200;
export const COMMUNITY_BASELINE = 300;
export const COMMUNITY_NOTE_POINTS = 10;
export const COMMUNITY_HEART_POINTS = 5;
export const COMMUNITY_MAX_HEARTS_PER_NOTE = 5;
export const COMMUNITY_MAX_NOTES_PER_DAY = 5;
export const COMMUNITY_MAX_POINTS_PER_DAY = 200;
export const COMMUNITY_MIN_CHARS = 10;

export const COMMUNITY_MILESTONES: CommunityMilestone[] = [
  { id: 1, percent: 25, tokens: 10, shinyPotions: 1, secretPotions: 0, keys: 0 },
  { id: 2, percent: 50, tokens: 20, shinyPotions: 0, secretPotions: 0, keys: 1 },
  { id: 3, percent: 75, tokens: 30, shinyPotions: 0, secretPotions: 1, keys: 1 },
  { id: 4, percent: 100, tokens: 50, shinyPotions: 1, secretPotions: 0, keys: 2 },
];

export function milestoneTarget(percent: number): number {
  return Math.ceil((COMMUNITY_TARGET * percent) / 100);
}

export function seasonStart(now: number): number {
  const date = new Date(now);
  const day = date.getUTCDay();
  const daysFromMonday = (day + 6) % 7;
  const start = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - daysFromMonday
  );
  return start;
}

export function seasonKey(now: number): string {
  return new Date(seasonStart(now)).toISOString().slice(0, 10);
}

export function seasonEnd(now: number): number {
  return seasonStart(now) + 7 * 24 * 60 * 60 * 1000;
}

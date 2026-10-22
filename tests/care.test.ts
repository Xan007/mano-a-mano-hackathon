import { describe, expect, it } from "vitest";
import {
  EVOLUTION_COSTS,
  NOTE_LIFETIME_MS,
  NOTE_PERMANENT_COST,
  POTIONS,
} from "../config/care";
import {
  COMMUNITY_MILESTONES,
  COMMUNITY_TARGET,
  milestoneTarget,
  seasonKey,
  seasonStart,
} from "../config/community";
import { challengesForDay } from "../config/challenges";

describe("care", () => {
  it("keeps evolution costs increasing", () => {
    expect(EVOLUTION_COSTS[2].duplicates).toBeLessThan(EVOLUTION_COSTS[3].duplicates);
    expect(EVOLUTION_COSTS[2].hops).toBe(EVOLUTION_COSTS[3].hops);
    expect(NOTE_PERMANENT_COST).toBe(0);
  });

  it("expires notes after seven real days by default", () => {
    expect(NOTE_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("has transparent potion odds and guarantees", () => {
    for (const potion of Object.values(POTIONS)) {
      expect(potion.chance).toBeGreaterThan(0);
      expect(potion.chance).toBeLessThan(100);
      expect(potion.guarantee).toBeGreaterThan(1);
      expect(potion.cost).toBeGreaterThan(0);
    }
  });
});

describe("community", () => {
  it("has four ordered milestones within the target", () => {
    expect(COMMUNITY_MILESTONES).toHaveLength(4);
    const percents = COMMUNITY_MILESTONES.map((milestone) => milestone.percent);
    expect(percents).toEqual([...percents].sort((a, b) => a - b));
    expect(percents[percents.length - 1]).toBe(100);
    expect(milestoneTarget(100)).toBe(COMMUNITY_TARGET);
  });

  it("starts seasons on Monday UTC", () => {
    const starts = seasonStart(Date.parse("2026-10-21T15:00:00Z"));
    const date = new Date(starts);
    expect(date.getUTCDay()).toBe(1);
    expect(seasonKey(Date.parse("2026-10-21T15:00:00Z"))).toBe("2026-10-19");
  });
});

describe("daily challenges", () => {
  it("returns three different challenges per day with valid answers", () => {
    const challenges = challengesForDay("2026-10-21");
    expect(challenges).toHaveLength(3);
    expect(new Set(challenges.map((challenge) => challenge.id)).size).toBe(3);

    for (const challenge of challenges) {
      expect(challenge.options).toContain(challenge.answer);
      expect(challenge.options.length).toBeGreaterThanOrEqual(2);
      expect(challenge.source.length).toBeGreaterThan(0);
    }
  });

  it("rotates at least one challenge the next day", () => {
    const today = challengesForDay("2026-10-21").map((challenge) => challenge.id);
    const tomorrow = challengesForDay("2026-10-22").map((challenge) => challenge.id);
    expect(tomorrow).not.toEqual(today);
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT,
  DEFAULT_THEME,
  DUNGEON_STAGES,
  MISSION_POOL,
  NOTE_LAYOUTS,
  NOTE_THEMES,
  levelProgress,
  missionsForDay,
  stageById,
} from "../config/progression";

describe("levelProgress", () => {
  it("starts at level 1 with 80 xp needed", () => {
    expect(levelProgress(0)).toEqual({ level: 1, current: 0, needed: 80, ratio: 0 });
  });

  it("levels up exactly at the threshold", () => {
    const result = levelProgress(80);
    expect(result.level).toBe(2);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(106);
  });

  it("never loses progress as xp grows", () => {
    let previousLevel = 1;
    for (let xp = 0; xp <= 2000; xp += 25) {
      const { level, current, needed, ratio } = levelProgress(xp);
      expect(level).toBeGreaterThanOrEqual(previousLevel);
      expect(current).toBeLessThan(needed);
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThan(1);
      previousLevel = level;
    }
  });
});

describe("missionsForDay", () => {
  it("always returns three different missions", () => {
    const missions = missionsForDay("2026-10-22");
    expect(missions).toHaveLength(3);
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(3);
  });

  it("is stable for the same day and rotates across days", () => {
    const first = missionsForDay("2026-10-22").map((mission) => mission.id);
    const again = missionsForDay("2026-10-22").map((mission) => mission.id);
    const next = missionsForDay("2026-10-23").map((mission) => mission.id);

    expect(again).toEqual(first);
    expect(next).not.toEqual(first);
  });

  it("only uses missions from the pool with positive targets", () => {
    const ids = new Set(MISSION_POOL.map((mission) => mission.id));
    for (const mission of missionsForDay("2026-11-02")) {
      expect(ids.has(mission.id)).toBe(true);
      expect(mission.target).toBeGreaterThan(0);
      expect(mission.keys).toBeGreaterThan(0);
    }
  });
});

describe("dungeon stages", () => {
  it("chains stages in order with resolvable unlocks", () => {
    DUNGEON_STAGES.forEach((stage, index) => {
      expect(stage.order).toBe(index);
      if (index === 0) {
        expect(stage.unlockAfter).toBeNull();
      } else {
        expect(stage.unlockAfter).toBe(DUNGEON_STAGES[index - 1].id);
        expect(stageById(stage.unlockAfter ?? "")?.id).toBe(stage.unlockAfter);
      }
    });
  });

  it("gives every step two options with at least one wise choice", () => {
    for (const stage of DUNGEON_STAGES) {
      expect(stage.steps).toHaveLength(3);
      for (const step of stage.steps) {
        expect(step.options).toHaveLength(2);
        expect(step.options.some((option) => option.wise)).toBe(true);
        for (const option of step.options) {
          expect(option.label.length).toBeGreaterThan(0);
          expect(option.reply.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("rewards a key back so the chain keeps moving", () => {
    for (const stage of DUNGEON_STAGES) {
      expect(stage.tokens).toBeGreaterThan(0);
      expect(stage.xp).toBeGreaterThan(0);
      expect(stage.keys).toBeGreaterThan(0);
      expect(stage.mapX).toBeGreaterThanOrEqual(0);
      expect(stage.mapX).toBeLessThanOrEqual(1);
      expect(stage.mapY).toBeGreaterThanOrEqual(0);
      expect(stage.mapY).toBeLessThanOrEqual(1);
    }
  });
});

describe("note styles", () => {
  it("includes the free defaults", () => {
    expect(NOTE_THEMES.some((theme) => theme.id === DEFAULT_THEME && theme.cost === 0)).toBe(true);
    expect(NOTE_LAYOUTS.some((layout) => layout.id === DEFAULT_LAYOUT && layout.cost === 0)).toBe(
      true
    );
  });

  it("keeps paid styles purchasable with tokens", () => {
    for (const style of [...NOTE_THEMES, ...NOTE_LAYOUTS]) {
      expect(style.cost).toBeGreaterThanOrEqual(0);
      expect(style.name.length).toBeGreaterThan(0);
    }
  });
});

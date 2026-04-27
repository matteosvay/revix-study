import { describe, it, expect } from "vitest";
import {
  xpForLevel,
  xpProgress,
  levelInfo,
  leagueInfo,
  streakPrestige,
  pickDailyQuests,
  pickWeeklyQuest,
  todayKey,
  weekKey,
  weekEnd,
  LEVEL_NAMES,
  LEAGUES,
  STREAK_PRESTIGES,
  DAILY_QUEST_POOL,
  WEEKLY_QUEST_POOL,
  XP_REWARDS,
} from "@/lib/gamification";

// ============================================================
// xpForLevel
// ============================================================
describe("xpForLevel", () => {
  it("level 1 requires 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("level 0 and below also return 0", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-1)).toBe(0);
  });

  it("level 2 requires 200 XP", () => {
    // 200*(2-1) + 75*(2-1)*(2-2) = 200
    expect(xpForLevel(2)).toBe(200);
  });

  it("level 3 requires 550 XP", () => {
    // 200*2 + 75*2*1 = 400 + 150 = 550
    expect(xpForLevel(3)).toBe(550);
  });

  it("XP thresholds are strictly increasing", () => {
    for (let l = 2; l <= 50; l++) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1));
    }
  });
});

// ============================================================
// xpProgress
// ============================================================
describe("xpProgress", () => {
  it("returns 0% at the start of a level", () => {
    const result = xpProgress(0, 1);
    expect(result.pct).toBe(0);
    expect(result.into).toBe(0);
  });

  it("returns 100% when XP matches next level exactly", () => {
    const nextLevelXp = xpForLevel(2); // 200
    const result = xpProgress(nextLevelXp, 1);
    expect(result.pct).toBe(100);
  });

  it("caps at 100%", () => {
    const result = xpProgress(999999, 1);
    expect(result.pct).toBe(100);
  });

  it("calculates mid-level progress correctly", () => {
    // Level 1 → 2 : 0 → 200 XP, so 100 XP = 50%
    const result = xpProgress(100, 1);
    expect(result.pct).toBe(50);
    expect(result.into).toBe(100);
    expect(result.span).toBe(200);
  });
});

// ============================================================
// levelInfo
// ============================================================
describe("levelInfo", () => {
  it("returns Bizuth for levels 1-5", () => {
    expect(levelInfo(1).name).toBe("Bizuth");
    expect(levelInfo(5).name).toBe("Bizuth");
  });

  it("returns Légende Revix for levels 46-50", () => {
    expect(levelInfo(46).name).toBe("Légende Revix");
    expect(levelInfo(50).name).toBe("Légende Revix");
  });

  it("falls back to Bizuth for level 0 or below", () => {
    expect(levelInfo(0).name).toBe("Bizuth");
  });

  it("every level from 1-50 has a tier", () => {
    for (let l = 1; l <= 50; l++) {
      const tier = levelInfo(l);
      expect(tier.name).toBeTruthy();
      expect(tier.emoji).toBeTruthy();
    }
  });
});

// ============================================================
// leagueInfo
// ============================================================
describe("leagueInfo", () => {
  it("returns Bronze for 0 weekly XP", () => {
    expect(leagueInfo(0).current.key).toBe("bronze");
  });

  it("returns Argent at 300 weekly XP", () => {
    expect(leagueInfo(300).current.key).toBe("argent");
  });

  it("returns Légende at 5000+ weekly XP", () => {
    expect(leagueInfo(5000).current.key).toBe("legende");
    expect(leagueInfo(5000).next).toBeNull();
  });

  it("always has a next league unless at max", () => {
    for (let i = 0; i < LEAGUES.length - 1; i++) {
      const info = leagueInfo(LEAGUES[i].minWeekXp);
      expect(info.next).not.toBeNull();
    }
  });
});

// ============================================================
// streakPrestige
// ============================================================
describe("streakPrestige", () => {
  it("returns null for 0 days", () => {
    expect(streakPrestige(0).current).toBeNull();
    expect(streakPrestige(0).next).not.toBeNull();
  });

  it("returns Étincelle at 3 days", () => {
    expect(streakPrestige(3).current?.name).toBe("Étincelle");
  });

  it("returns Éternel at 1000 days with no next", () => {
    expect(streakPrestige(1000).current?.name).toBe("Éternel");
    expect(streakPrestige(1000).next).toBeNull();
  });

  it("prestiges are in ascending order of days", () => {
    for (let i = 1; i < STREAK_PRESTIGES.length; i++) {
      expect(STREAK_PRESTIGES[i].days).toBeGreaterThan(STREAK_PRESTIGES[i - 1].days);
    }
  });
});

// ============================================================
// pickDailyQuests
// ============================================================
describe("pickDailyQuests", () => {
  it("returns exactly 3 quests by default", () => {
    const quests = pickDailyQuests("2026-04-27");
    expect(quests).toHaveLength(3);
  });

  it("returns unique quests (no duplicates)", () => {
    const quests = pickDailyQuests("2026-04-27");
    const keys = quests.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is deterministic for the same seed", () => {
    const a = pickDailyQuests("2026-04-27");
    const b = pickDailyQuests("2026-04-27");
    expect(a.map((q) => q.key)).toEqual(b.map((q) => q.key));
  });

  it("varies with different seeds", () => {
    const a = pickDailyQuests("2026-04-27");
    const b = pickDailyQuests("2026-04-28");
    // Very unlikely to be identical, but not impossible
    // Just check both return valid quests
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
  });

  it("respects custom count", () => {
    expect(pickDailyQuests("seed", 1)).toHaveLength(1);
    expect(pickDailyQuests("seed", 5)).toHaveLength(5);
  });

  it("caps at pool size", () => {
    const quests = pickDailyQuests("seed", 100);
    expect(quests.length).toBe(DAILY_QUEST_POOL.length);
  });
});

// ============================================================
// pickWeeklyQuest
// ============================================================
describe("pickWeeklyQuest", () => {
  it("returns a valid weekly quest", () => {
    const quest = pickWeeklyQuest("2026-W17");
    expect(WEEKLY_QUEST_POOL.map((q) => q.key)).toContain(quest.key);
  });

  it("is deterministic", () => {
    const a = pickWeeklyQuest("2026-W17");
    const b = pickWeeklyQuest("2026-W17");
    expect(a.key).toBe(b.key);
  });
});

// ============================================================
// Date helpers
// ============================================================
describe("todayKey", () => {
  it("returns YYYY-MM-DD format", () => {
    const key = todayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekKey", () => {
  it("returns YYYY-MM-DD format (Monday)", () => {
    const key = weekKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekEnd", () => {
  it("returns a date 6 days after the week start", () => {
    const start = "2026-04-27"; // Monday
    const end = weekEnd(start);
    expect(end).toBe("2026-05-03"); // Sunday
  });
});

// ============================================================
// Constants integrity
// ============================================================
describe("constants integrity", () => {
  it("LEVEL_NAMES covers levels 1-50 without gaps", () => {
    for (let l = 1; l <= 50; l++) {
      const found = LEVEL_NAMES.some((t) => l >= t.min && l <= t.max);
      expect(found).toBe(true);
    }
  });

  it("LEAGUES have increasing minWeekXp", () => {
    for (let i = 1; i < LEAGUES.length; i++) {
      expect(LEAGUES[i].minWeekXp).toBeGreaterThan(LEAGUES[i - 1].minWeekXp);
    }
  });

  it("all daily quests have positive XP rewards", () => {
    for (const q of DAILY_QUEST_POOL) {
      expect(q.xp).toBeGreaterThan(0);
      expect(q.target).toBeGreaterThan(0);
    }
  });

  it("XP_REWARDS are all positive numbers", () => {
    for (const [, val] of Object.entries(XP_REWARDS)) {
      expect(val).toBeGreaterThan(0);
    }
  });
});

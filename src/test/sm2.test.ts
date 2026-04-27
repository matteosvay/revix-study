import { describe, it, expect } from "vitest";
import { sm2, DEFAULT_EASE, booleanToGrade, scoreToGrade } from "@/lib/sm2";

describe("SM-2 algorithm", () => {
  const newCard = { ease: DEFAULT_EASE, intervalDays: 0, repetitions: 0, lapses: 0 };

  // ============================================================
  // Successful recalls
  // ============================================================
  describe("successful recall (grade ≥ 3)", () => {
    it("first correct answer → interval = 1 day", () => {
      const result = sm2({ ...newCard, grade: 4 });
      expect(result.intervalDays).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.lapses).toBe(0);
    });

    it("second correct answer → interval = 6 days", () => {
      const result = sm2({ ease: 2.5, intervalDays: 1, repetitions: 1, lapses: 0, grade: 4 });
      expect(result.intervalDays).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("third correct answer → interval = 6 * ease", () => {
      const result = sm2({ ease: 2.5, intervalDays: 6, repetitions: 2, lapses: 0, grade: 4 });
      expect(result.intervalDays).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });

    it("perfect grade (5) increases ease", () => {
      const result = sm2({ ...newCard, ease: 2.5, grade: 5 });
      expect(result.ease).toBeGreaterThan(2.5);
    });

    it("grade 3 (hard) decreases ease slightly", () => {
      const result = sm2({ ...newCard, ease: 2.5, grade: 3 });
      expect(result.ease).toBeLessThan(2.5);
    });
  });

  // ============================================================
  // Failed recalls
  // ============================================================
  describe("failed recall (grade < 3)", () => {
    it("resets repetitions to 0", () => {
      const result = sm2({ ease: 2.5, intervalDays: 30, repetitions: 5, lapses: 0, grade: 1 });
      expect(result.repetitions).toBe(0);
    });

    it("increments lapses", () => {
      const result = sm2({ ease: 2.5, intervalDays: 30, repetitions: 5, lapses: 2, grade: 0 });
      expect(result.lapses).toBe(3);
    });

    it("sets short interval (1-3 days depending on lapses)", () => {
      // First lapse → 1 day
      const r1 = sm2({ ease: 2.5, intervalDays: 30, repetitions: 5, lapses: 0, grade: 1 });
      expect(r1.intervalDays).toBe(1);

      // Many lapses → 3 days (avoids frustration)
      const r2 = sm2({ ease: 2.2, intervalDays: 10, repetitions: 3, lapses: 6, grade: 1 });
      expect(r2.intervalDays).toBe(3);
    });

    it("decreases ease but not below 1.3", () => {
      const result = sm2({ ease: 1.3, intervalDays: 1, repetitions: 0, lapses: 5, grade: 0 });
      expect(result.ease).toBe(1.3);
    });
  });

  // ============================================================
  // Edge cases
  // ============================================================
  describe("edge cases", () => {
    it("ease never goes below 1.3", () => {
      let card = { ...newCard, ease: 1.5 };
      for (let i = 0; i < 20; i++) {
        const result = sm2({ ...card, grade: 0 });
        expect(result.ease).toBeGreaterThanOrEqual(1.3);
        card = { ease: result.ease, intervalDays: result.intervalDays, repetitions: result.repetitions, lapses: result.lapses };
      }
    });

    it("interval never exceeds 365 days", () => {
      const result = sm2({ ease: 3.0, intervalDays: 200, repetitions: 10, lapses: 0, grade: 5 });
      expect(result.intervalDays).toBeLessThanOrEqual(365);
    });

    it("interval is always at least 1 day", () => {
      const result = sm2({ ...newCard, grade: 5 });
      expect(result.intervalDays).toBeGreaterThanOrEqual(1);
    });

    it("dueAt is a valid YYYY-MM-DD string", () => {
      const result = sm2({ ...newCard, grade: 4 });
      expect(result.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("grade is clamped to [0, 5]", () => {
      const r1 = sm2({ ...newCard, grade: -1 });
      expect(r1.repetitions).toBe(0); // treated as grade 0

      const r2 = sm2({ ...newCard, grade: 10 });
      expect(r2.repetitions).toBe(1); // treated as grade 5
    });
  });

  // ============================================================
  // Long-term progression simulation
  // ============================================================
  describe("realistic progression", () => {
    it("intervals grow over consecutive correct answers", () => {
      let card = { ...newCard };
      const intervals: number[] = [];

      for (let i = 0; i < 8; i++) {
        const result = sm2({ ...card, grade: 4 });
        intervals.push(result.intervalDays);
        card = { ease: result.ease, intervalDays: result.intervalDays, repetitions: result.repetitions, lapses: result.lapses };
      }

      // Intervals should be non-decreasing
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
      }

      // After 8 correct reviews, interval should be at least 30 days
      expect(intervals[intervals.length - 1]).toBeGreaterThanOrEqual(30);
    });
  });
});

// ============================================================
// Helper functions
// ============================================================
describe("booleanToGrade", () => {
  it("correct → 4, correct+hard → 3, incorrect → 1", () => {
    expect(booleanToGrade(true)).toBe(4);
    expect(booleanToGrade(true, true)).toBe(3);
    expect(booleanToGrade(false)).toBe(1);
  });
});

describe("scoreToGrade", () => {
  it("maps score percentages to grades", () => {
    expect(scoreToGrade(100)).toBe(5);
    expect(scoreToGrade(95)).toBe(5);
    expect(scoreToGrade(85)).toBe(4);
    expect(scoreToGrade(70)).toBe(3);
    expect(scoreToGrade(50)).toBe(2);
    expect(scoreToGrade(25)).toBe(1);
    expect(scoreToGrade(10)).toBe(0);
  });
});

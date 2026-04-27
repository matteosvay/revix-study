import { describe, it, expect } from "vitest";
import { localDateKey, parseLocalDateKey, addDays, startOfLocalWeek } from "@/lib/date";

describe("localDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(localDateKey(new Date(2026, 3, 27))).toBe("2026-04-27"); // April = month 3
  });

  it("pads single-digit months and days", () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("parseLocalDateKey", () => {
  it("parses YYYY-MM-DD into a Date", () => {
    const d = parseLocalDateKey("2026-04-27");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // April
    expect(d.getDate()).toBe(27);
  });

  it("roundtrips with localDateKey", () => {
    const original = new Date(2026, 11, 31); // Dec 31
    const key = localDateKey(original);
    const parsed = parseLocalDateKey(key);
    expect(localDateKey(parsed)).toBe(key);
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    const d = new Date(2026, 3, 27);
    const result = addDays(d, 5);
    expect(result.getDate()).toBe(2); // May 2
    expect(result.getMonth()).toBe(4); // May
  });

  it("subtracts with negative days", () => {
    const d = new Date(2026, 3, 3);
    const result = addDays(d, -5);
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBe(29);
  });

  it("does not mutate the original date", () => {
    const d = new Date(2026, 3, 27);
    const original = d.getTime();
    addDays(d, 10);
    expect(d.getTime()).toBe(original);
  });
});

describe("startOfLocalWeek", () => {
  it("returns Monday for a Wednesday input", () => {
    // April 29, 2026 is a Wednesday
    const wed = new Date(2026, 3, 29, 15, 30);
    const monday = startOfLocalWeek(wed);
    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getDate()).toBe(27);
    expect(monday.getHours()).toBe(0);
  });

  it("returns same day for a Monday input", () => {
    // April 27, 2026 is a Monday
    const mon = new Date(2026, 3, 27, 10, 0);
    const result = startOfLocalWeek(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(27);
  });

  it("returns previous Monday for a Sunday input", () => {
    // May 3, 2026 is a Sunday
    const sun = new Date(2026, 4, 3);
    const result = startOfLocalWeek(sun);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(27);
    expect(result.getMonth()).toBe(3); // April
  });
});

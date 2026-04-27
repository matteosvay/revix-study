/**
 * SM-2 Algorithm — Spaced Repetition Scheduling
 *
 * Implementation based on the SuperMemo SM-2 algorithm by P.A. Woźniak,
 * with adaptations for Revix (French student context).
 *
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Grade scale (0-5):
 *   5 — Perfect response, instant recall
 *   4 — Correct after slight hesitation
 *   3 — Correct but with significant effort
 *   2 — Incorrect, but close / partially correct
 *   1 — Incorrect, vague memory
 *   0 — Complete blackout
 *
 * For Revix quiz context:
 *   - QCM correct on first try → grade 5
 *   - QCM correct after hesitation → grade 4
 *   - Open question marked "correct" by AI → grade 4
 *   - Open question marked "partially correct" → grade 3
 *   - Incorrect but close → grade 2
 *   - Incorrect → grade 1
 *   - No attempt / skip → grade 0
 */

export type SM2Input = {
  /** Current ease factor (default 2.5 for new cards). */
  ease: number;
  /** Current interval in days (0 for new cards). */
  intervalDays: number;
  /** Number of consecutive successful repetitions (grade ≥ 3). */
  repetitions: number;
  /** Number of times the card "lapsed" (went from known → forgotten). */
  lapses: number;
  /** User's grade for this review (0-5). */
  grade: number;
};

export type SM2Output = {
  /** New ease factor (min 1.3). */
  ease: number;
  /** New interval in days until next review. */
  intervalDays: number;
  /** Updated repetition count. */
  repetitions: number;
  /** Updated lapse count. */
  lapses: number;
  /** ISO date string for the next review (due_at). */
  dueAt: string;
};

/** Minimum ease factor — prevents cards from becoming unmovable. */
const MIN_EASE = 1.3;

/** Default ease for brand-new cards. */
export const DEFAULT_EASE = 2.5;

/**
 * Computes the next review schedule using SM-2.
 */
export function sm2(input: SM2Input): SM2Output {
  const { ease, intervalDays, repetitions, grade } = input;
  let { lapses } = input;

  // Clamp grade to [0, 5]
  const g = Math.max(0, Math.min(5, Math.round(grade)));

  let newEase: number;
  let newInterval: number;
  let newReps: number;

  if (g >= 3) {
    // ✅ Successful recall
    newEase = Math.max(
      MIN_EASE,
      ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02)),
    );

    if (repetitions === 0) {
      // First successful review
      newInterval = 1;
    } else if (repetitions === 1) {
      // Second successful review
      newInterval = 6;
    } else {
      // Subsequent reviews — multiply by ease factor
      newInterval = Math.round(intervalDays * newEase);
    }

    newReps = repetitions + 1;
  } else {
    // ❌ Failed recall — reset repetitions, short interval
    newEase = Math.max(MIN_EASE, ease - 0.2);
    newReps = 0;
    lapses += 1;

    // After a lapse, review again soon.
    // More lapses → slightly longer initial interval (avoid frustration loops).
    if (lapses <= 2) {
      newInterval = 1; // Tomorrow
    } else if (lapses <= 5) {
      newInterval = 2; // In 2 days — give a bit more breathing room
    } else {
      // Chronic lapse: the student might need to re-study the material,
      // but we don't want to spam them daily. 3 days minimum.
      newInterval = 3;
    }
  }

  // Safety: cap maximum interval at 365 days
  newInterval = Math.min(newInterval, 365);
  // Safety: ensure at least 1 day
  newInterval = Math.max(newInterval, 1);

  // Compute due date
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(now);
  due.setDate(due.getDate() + newInterval);
  const dueAt = due.toISOString().slice(0, 10);

  return {
    ease: Math.round(newEase * 100) / 100, // 2 decimal places
    intervalDays: newInterval,
    repetitions: newReps,
    lapses,
    dueAt,
  };
}

/**
 * Maps a simple boolean "correct" result to a SM-2 grade.
 * For more nuanced grading, use the grade directly.
 */
export function booleanToGrade(correct: boolean, wasHard = false): number {
  if (correct) {
    return wasHard ? 3 : 4;
  }
  return 1;
}

/**
 * Maps quiz score percentage to a SM-2 grade.
 * Useful for grading an entire quiz attempt on a chapter.
 */
export function scoreToGrade(scorePercent: number): number {
  if (scorePercent >= 95) return 5;
  if (scorePercent >= 80) return 4;
  if (scorePercent >= 60) return 3;
  if (scorePercent >= 40) return 2;
  if (scorePercent >= 20) return 1;
  return 0;
}

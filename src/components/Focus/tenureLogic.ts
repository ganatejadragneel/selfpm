// How long the seeker has been at this, and how much of that time they logged.
//
// Deliberately a RATE, not a streak. A streak makes a single missed day maximally
// visible and turns it into a loss — which is precisely the dynamic this product
// exists to interrupt. A rate absorbs a miss: one blank day moves 72% to 71% and
// the number keeps meaning the same thing tomorrow.
//
// Pure. No dates are read from the clock here — `today` is passed in, so the
// seeker's local day governs and the tests are deterministic.

export interface Tenure {
  /** First day with any recorded activity. null when there is none yet. */
  firstDate: string | null;
  /** 1-indexed day number, counting the first active day as day 1. */
  dayNumber: number;
  /** Distinct days with any activity. */
  activeDays: number;
  /** Days elapsed since the first, inclusive of today. */
  totalDays: number;
  /** activeDays / totalDays as a whole percentage. 0 when there is no span. */
  pct: number;
}

export const EMPTY_TENURE: Tenure = {
  firstDate: null,
  dayNumber: 0,
  activeDays: 0,
  totalDays: 0,
  pct: 0,
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Whole days between two ISO dates, inclusive of both ends. */
export function daysBetweenInclusive(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.floor((b - a) / 86_400_000) + 1;
}

/**
 * @param activeDates any dates with activity — duplicates, unsorted, and
 *   malformed entries are all tolerated, because they come from three different
 *   tables whose columns are dates, dates, and timestamps.
 * @param today the seeker's local date.
 */
export function computeTenure(activeDates: readonly string[], today: string): Tenure {
  if (!ISO.test(today)) return EMPTY_TENURE;

  const days = new Set<string>();
  for (const d of activeDates) {
    if (typeof d !== 'string') continue;
    const iso = d.slice(0, 10);
    // A date after today would inflate the span — clock skew, or a row written
    // from a different timezone. Ignore rather than let it distort the rate.
    if (ISO.test(iso) && iso <= today) days.add(iso);
  }
  if (days.size === 0) return EMPTY_TENURE;

  const firstDate = [...days].sort()[0];
  const totalDays = daysBetweenInclusive(firstDate, today);
  const activeDays = days.size;

  return {
    firstDate,
    dayNumber: totalDays,
    activeDays,
    totalDays,
    // activeDays can never exceed totalDays (future dates are filtered above),
    // so this stays within 0–100 without clamping.
    pct: totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0,
  };
}

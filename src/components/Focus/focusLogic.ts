// Deterministic logic for the Focus-ORE dashboard (build step 3).
// Pure functions, no AI. These are the numbers the strip + target box read.
// When Supabase is wired, only `getWindow` changes — everything below is reusable.

import { subDays, format } from 'date-fns';
import { charter, type FocusDay } from './sampleData';

export interface WindowDay {
  date: Date;
  offset: number;
  hours: number;
  note?: string;
  isToday: boolean;
  isYesterday: boolean;
  /** true on the day a new ISO week begins (Monday) → draw a boundary marker. */
  weekBoundary: boolean;
  weekdayLabel: string; // 'M', 'T', ...
}

/**
 * Read the rolling-N-day window ending today (newest last), mapping the
 * offset-based sample store onto real calendar dates.
 */
export function getWindow(focusDays: FocusDay[], days = 7, now: Date = new Date()): WindowDay[] {
  const byOffset = new Map<number, FocusDay>(focusDays.map((d) => [d.offset, d]));
  const out: WindowDay[] = [];

  // oldest → newest so the strip reads left-to-right
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = subDays(now, offset);
    const rec = byOffset.get(offset);
    out.push({
      date,
      offset,
      hours: rec?.hours ?? 0,
      note: rec?.note,
      isToday: offset === 0,
      isYesterday: offset === 1,
      weekBoundary: date.getDay() === 1, // Monday
      weekdayLabel: format(date, 'EEEEE'), // single-letter weekday
    });
  }
  return out;
}

export interface FocusMetrics {
  window: WindowDay[];
  /** sum of hours over the window (today included). */
  total: number;
  /** total ÷ window length. */
  average: number;
  /** the weekly-average goal from charter. */
  goal: number;
  /** sum of every day in the window EXCEPT today. */
  priorTotal: number;
  /**
   * Raw hours needed TODAY to make the window average hit the goal.
   * Shown even when unreachable (> remaining hours in the day): the raw need
   * is itself the signal. Can be 0 (already on track) — never clamped negative
   * in `raw`, but `metGoal` flags the already-there case.
   */
  targetToday: number;
  rawTargetToday: number; // unclamped (may be negative → already ahead)
  metGoal: boolean;
  /** true when the target exceeds what's physically left in a day. */
  unreachable: boolean;
  max: number; // tallest bar, for scaling the strip
  yesterday?: WindowDay;
}

export function computeMetrics(focusDays: FocusDay[], days = 7, now: Date = new Date()): FocusMetrics {
  const window = getWindow(focusDays, days, now);
  const goal = charter.weeklyAverageGoal;

  const total = round1(window.reduce((s, d) => s + d.hours, 0));
  const average = round1(total / window.length);

  const today = window.find((d) => d.isToday);
  const priorTotal = round1(
    window.filter((d) => !d.isToday).reduce((s, d) => s + d.hours, 0)
  );

  // To hold an average of `goal` across the whole window, the window total must
  // reach goal * length. Whatever the prior days didn't supply must come today.
  const neededTotal = goal * window.length;
  const rawTargetToday = round1(neededTotal - priorTotal);
  const targetToday = Math.max(0, rawTargetToday);
  const metGoal = rawTargetToday <= (today?.hours ?? 0);

  // crude "hours left in the day" gate so we can flag an impossible ask
  const hoursLeftInDay = 24 - (now.getHours() + now.getMinutes() / 60);
  const unreachable = targetToday > hoursLeftInDay;

  const max = Math.max(goal, ...window.map((d) => d.hours));

  return {
    window,
    total,
    average,
    goal,
    priorTotal,
    targetToday,
    rawTargetToday,
    metGoal,
    unreachable,
    max: round1(max),
    yesterday: window.find((d) => d.isYesterday),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

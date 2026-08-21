// Deterministic logic for the Focus-ORE dashboard (build step 3).
// Pure functions, no AI. These are the numbers the strip + target box read.
// When Supabase is wired, only `getWindow` changes — everything below is reusable.

import { subDays, format, startOfWeek, differenceInCalendarDays } from 'date-fns';
import { type FocusDay } from './sampleData';
import { DEFAULT_CHARTER } from './charterConfig';

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
  /** a day later this week that hasn't happened yet — rendered as an empty slot. */
  isFuture?: boolean;
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

export function computeMetrics(
  focusDays: FocusDay[],
  days = 7,
  now: Date = new Date(),
  goal: number = DEFAULT_CHARTER.weeklyAverageGoal,
): FocusMetrics {
  const window = getWindow(focusDays, days, now);

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


// ─────────────────────── Calendar-week stats (Mon–Sun) ───────────────────────
// The headline number. Deliberately NOT the rolling-7 average above: "this week"
// means the calendar week, so on a Wednesday it averages Mon–Wed, not the last
// seven days. The two disagree on every day except Sunday.

export interface WeekStats {
  /** hours/day averaged over the ELAPSED days of this Mon–Sun week. */
  average: number;
  total: number;
  /** how many days of this week have happened (Mon = 1 … Sun = 7). */
  daysElapsed: number;
  /**
   * Last week averaged over the SAME number of elapsed days — Mon–Wed vs Mon–Wed,
   * never Mon–Wed vs a full Mon–Sun. Comparing a partial week against a complete
   * one makes the delta negative every Monday for reasons that aren't behavioral.
   */
  lastWeekAverage: number;
  lastWeekTotal: number;
  /** average − lastWeekAverage. Positive = better than the same point last week. */
  delta: number;
  /** null when last week's comparable days were all zero (no meaningful base). */
  deltaPct: number | null;
  goal: number;
  metGoal: boolean;
  /** Mon → Sun of the current week; days after today carry isFuture. */
  weekDays: WindowDay[];
  /** tallest value in the week, for scaling the strip. */
  max: number;
  /** hours needed TODAY to hold the goal across the week so far. */
  targetToday: number;
  /** true when today's logged hours already clear the ask. */
  targetMet: boolean;
  /** the ask exceeds what is physically left in the day. */
  unreachable: boolean;
}

/** Sum the hours of the N days starting at `start` (inclusive), by offset from `now`. */
function sumSpan(byOffset: Map<number, FocusDay>, start: Date, days: number, now: Date): number {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const offset = differenceInCalendarDays(now, d);
    total += byOffset.get(offset)?.hours ?? 0;
  }
  return round1(total);
}

export function computeWeekStats(
  focusDays: FocusDay[],
  now: Date = new Date(),
  goal: number = DEFAULT_CHARTER.weeklyAverageGoal,
): WeekStats {
  const byOffset = new Map<number, FocusDay>(focusDays.map((d) => [d.offset, d]));

  const thisMonday = startOfWeek(now, { weekStartsOn: 1 });
  const daysElapsed = differenceInCalendarDays(now, thisMonday) + 1; // Mon = 1 … Sun = 7

  const lastMonday = subDays(thisMonday, 7);

  const total = sumSpan(byOffset, thisMonday, daysElapsed, now);
  const lastWeekTotal = sumSpan(byOffset, lastMonday, daysElapsed, now); // same elapsed span

  const average = round1(total / daysElapsed);
  const lastWeekAverage = round1(lastWeekTotal / daysElapsed);
  const delta = round1(average - lastWeekAverage);

  const weekDays: WindowDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(thisMonday);
    date.setDate(date.getDate() + i);
    const offset = differenceInCalendarDays(now, date);
    weekDays.push({
      date,
      offset,
      hours: offset >= 0 ? byOffset.get(offset)?.hours ?? 0 : 0,
      note: offset >= 0 ? byOffset.get(offset)?.note : undefined,
      isToday: offset === 0,
      isYesterday: offset === 1,
      weekBoundary: i === 0,
      weekdayLabel: format(date, 'EEEEE'),
      isFuture: offset < 0,
    });
  }

  return {
    average,
    total,
    daysElapsed,
    lastWeekAverage,
    lastWeekTotal,
    delta,
    deltaPct: lastWeekAverage > 0 ? Math.round((delta / lastWeekAverage) * 100) : null,
    goal,
    metGoal: average >= goal,
    weekDays,
    max: round1(Math.max(goal, ...weekDays.map((d) => d.hours))),
    ...weekTarget(weekDays, daysElapsed, goal, now),
  };
}

/**
 * Today's ask, measured against the CALENDAR week rather than a rolling window —
 * otherwise the target card and the week hero quote different arithmetic and
 * disagree on screen.
 */
function weekTarget(weekDays: WindowDay[], daysElapsed: number, goal: number, now: Date) {
  const todayHours = weekDays.find((d) => d.isToday)?.hours ?? 0;
  const priorTotal = round1(
    weekDays.filter((d) => !d.isToday && !d.isFuture).reduce((s, d) => s + d.hours, 0),
  );
  const rawTarget = round1(goal * daysElapsed - priorTotal);
  const targetToday = Math.max(0, rawTarget);
  const hoursLeftInDay = 24 - (now.getHours() + now.getMinutes() / 60);
  return {
    targetToday,
    targetMet: todayHours >= rawTarget,
    unreachable: targetToday > hoursLeftInDay,
  };
}

// ─────────────────────── Trend series (for the line chart) ───────────────────────

export type TrendRange = '1w' | '1m' | '3m';

export interface TrendPoint {
  /** the day, or the Monday of the week for an aggregated bucket. */
  date: Date;
  /** hours for the day, or the daily average across the week bucket. */
  value: number;
  label: string;
  /** true when this bucket covers more than one day. */
  aggregated: boolean;
}

export const RANGE_DAYS: Record<TrendRange, number> = { '1w': 7, '1m': 30, '3m': 91 };

/**
 * Build the chart series. 1w/1m plot one point per day; 3m aggregates to weekly
 * means — ninety daily points is a noise field, and the weekly mean keeps the
 * same unit (hours/day) so the goal line still reads against it.
 */
export function buildTrend(
  focusDays: FocusDay[],
  range: TrendRange,
  now: Date = new Date(),
): TrendPoint[] {
  const byOffset = new Map<number, FocusDay>(focusDays.map((d) => [d.offset, d]));
  const days = RANGE_DAYS[range];
  const daily: { date: Date; value: number }[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    daily.push({ date: subDays(now, offset), value: byOffset.get(offset)?.hours ?? 0 });
  }

  if (range !== '3m') {
    return daily.map((d) => ({
      date: d.date,
      value: round1(d.value),
      label: format(d.date, 'MMM d'),
      aggregated: false,
    }));
  }

  // bucket by ISO week, oldest first
  const buckets = new Map<string, { date: Date; sum: number; n: number }>();
  for (const d of daily) {
    const monday = startOfWeek(d.date, { weekStartsOn: 1 });
    const key = format(monday, 'yyyy-MM-dd');
    const b = buckets.get(key) ?? { date: monday, sum: 0, n: 0 };
    b.sum += d.value;
    b.n += 1;
    buckets.set(key, b);
  }
  return [...buckets.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((b) => ({
      date: b.date,
      value: round1(b.sum / b.n),
      label: `Week of ${format(b.date, 'MMM d')}`,
      aggregated: true,
    }));
}

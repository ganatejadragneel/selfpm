// SEEK-GEN Phase 1 — assemble the behavioral window for a report period.
//
// Implements the metric rules in cpo-report-manuscript.md §4. Same split as
// reportContext.ts: pure aggregation above the I/O banner, thin Supabase shell
// below. All the math here is unit-tested; none of it touches the network.

import { parseTaskValue } from '../../utils/taskValueUtils';
import type { CharterConfig } from '../Focus/charterConfig';
import { normalizeName } from '../Focus/charterConfig';

// ── contracts ────────────────────────────────────────────────────────────────

export interface DayValue {
  date: string; // ISO
  value: number;
  logged: boolean; // false = no entry at all (distinct from a logged zero)
  numeric: boolean; // the logged value parsed as a number (false for dropdown OREs)
}

export interface OreSummary {
  taskId: string;
  name: string;
  isFocusOre: boolean;
  /** Days with any entry, over days in the window. */
  daysLogged: number;
  daysInWindow: number;
  /** Sum of numeric values; null for an ORE whose values aren't numeric. */
  total: number | null;
}

export interface DatedNote {
  date: string;
  source: 'ore' | 'quick';
  /** ORE name for `source: 'ore'`, the matched tag for `source: 'quick'`. */
  label: string;
  text: string;
}

export interface FocusMetrics {
  days: DayValue[];
  total: number;
  average: number;
  /** % change vs the preceding window of equal length. null when incomparable. */
  deltaPct: number | null;
  priorTotal: number | null;
  goal: number;
}

export interface PlannedGoal {
  date: string;
  label: string;
  status: string;
}

export interface Adherence {
  done: number;
  attempted: number;
  pct: number;
  deltaPct: number | null;
  /**
   * The goals themselves, oldest-first. Manuscript Move 1 (plan-vs-actual
   * diffing) needs the INTENDED action, not just the count — a bare "1/2" gives
   * the model nothing to hold the outcome against.
   */
  goals: PlannedGoal[];
}

export interface ReportPayload {
  periodStart: string;
  periodEnd: string;
  /** Median day of the window — the report's filing date (brief §B5). */
  periodDate: string;
  days: number;
  focus: FocusMetrics;
  ores: OreSummary[];
  notes: DatedNote[];
  adherence: Adherence;
}

// ── row shapes (as returned by Supabase) ─────────────────────────────────────

export interface TaskRow { id: string; name: string }
export interface CompletionRow { custom_task_id: string; completion_date: string; value: unknown }
export interface TaskNoteRow { custom_task_id: string; note_date: string; note_text: string }
export interface QuickNoteRow { content: string; created_at: string; tags?: string[] | null }
export interface DailyGoalRow { goal_date: string; status: string; label?: string | null }

// ── pure ─────────────────────────────────────────────────────────────────────

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Inclusive list of ISO dates from start to end. UTC math — no timezone drift. */
export function datesInRange(periodStart: string, periodEnd: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = periodStart.split('-').map(Number);
  const [ye, me, de] = periodEnd.split('-').map(Number);
  const cur = new Date(Date.UTC(ys, ms - 1, ds));
  const end = new Date(Date.UTC(ye, me - 1, de));
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** Median day of the window (brief §B5: "period value = median day, as a date"). */
export function medianDate(dates: string[]): string {
  if (dates.length === 0) return '';
  return dates[Math.floor((dates.length - 1) / 2)];
}

/**
 * A completion's numeric value.
 *
 * Takes the `main` component via the app's shared parser BEFORE parsing digits:
 * completions are stored as "main|alt", so a blind strip of non-numerics would
 * turn "3.5|2" into 3.52. Non-numeric values (dropdown / multi-select OREs)
 * return null and are excluded from sums rather than silently counted as zero.
 */
export function toNumericValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const main = parseTaskValue(String(raw)).main;
  const cleaned = main.replace(/[^0-9.]/g, '');
  if (!/\d/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Per-day values for one ORE across the window. Missing days are logged:false. */
export function daySeries(rows: CompletionRow[], taskId: string, dates: string[]): DayValue[] {
  const byDate = new Map<string, unknown>();
  for (const r of rows) {
    if (r.custom_task_id !== taskId) continue;
    if (!dates.includes(r.completion_date)) continue; // window boundary is inclusive on both ends
    byDate.set(r.completion_date, r.value);
  }
  return dates.map((date) => {
    const has = byDate.has(date);
    const n = has ? toNumericValue(byDate.get(date)) : null;
    return { date, value: n ?? 0, logged: has, numeric: n !== null };
  });
}

/** Manuscript §4.1. `priorDays` is the preceding window of equal length. */
export function computeFocusMetrics(days: DayValue[], priorDays: DayValue[] | null, goal: number): FocusMetrics {
  const total = round1(days.reduce((s, d) => s + d.value, 0));
  const average = days.length ? round1(total / days.length) : 0;

  const priorTotal = priorDays ? round1(priorDays.reduce((s, d) => s + d.value, 0)) : null;
  // A 0 → n change has no defined percentage; report it as incomparable rather
  // than as Infinity or a fabricated 100%.
  const deltaPct =
    priorTotal === null || priorTotal === 0 ? null : Math.round(((total - priorTotal) / priorTotal) * 100);

  return { days, total, average, deltaPct, priorTotal, goal };
}

/** Manuscript §4.2. `in_progress` counts as NOT done. */
export function computeAdherence(rows: DailyGoalRow[], priorRows: DailyGoalRow[] | null = null): Adherence {
  const tally = (list: DailyGoalRow[]) => {
    const attempted = list.length;
    const done = list.filter((g) => g.status === 'done').length;
    return { done, attempted, pct: attempted === 0 ? 0 : Math.round((done / attempted) * 100) };
  };
  const cur = tally(rows);
  const prior = priorRows ? tally(priorRows) : null;
  // No goals last period ⇒ nothing to compare against, not a 0% baseline.
  const deltaPct = prior && prior.attempted > 0 ? cur.pct - prior.pct : null;

  const goals: PlannedGoal[] = rows
    .map((g) => ({ date: g.goal_date, label: (g.label ?? '').trim(), status: g.status }))
    .filter((g) => g.label)
    .sort((a, b) => (a.date === b.date ? a.label.localeCompare(b.label) : a.date.localeCompare(b.date)));

  return { ...cur, deltaPct, goals };
}

export function buildOreSummaries(
  tasks: TaskRow[],
  completions: CompletionRow[],
  dates: string[],
  focusOreName: string,
): OreSummary[] {
  const target = normalizeName(focusOreName);
  return tasks.map((t) => {
    const series = daySeries(completions, t.id, dates);
    const logged = series.filter((d) => d.logged);
    const numeric = series.filter((d) => d.numeric);
    return {
      taskId: t.id,
      name: t.name.trim(),
      isFocusOre: normalizeName(t.name) === target,
      daysLogged: logged.length,
      daysInWindow: dates.length,
      total: numeric.length ? round1(numeric.reduce((s, d) => s + d.value, 0)) : null,
    };
  });
}

/**
 * ORE notes + tagged quick notes, merged and ordered oldest-first. Report length
 * scales with note density (manuscript §8), so this is the substance of the
 * payload — not the ORE counts.
 */
export function collectNotes(
  taskNotes: TaskNoteRow[],
  quickNotes: QuickNoteRow[],
  tasks: TaskRow[],
  dates: string[],
  notesTag: string,
): DatedNote[] {
  const nameById = new Map(tasks.map((t) => [t.id, t.name.trim()]));
  const inWindow = new Set(dates);

  const fromOres: DatedNote[] = taskNotes
    .filter((n) => inWindow.has(n.note_date) && (n.note_text ?? '').trim())
    .map((n) => ({
      date: n.note_date,
      source: 'ore' as const,
      label: nameById.get(n.custom_task_id) ?? 'Unknown ORE',
      text: n.note_text.trim(),
    }));

  const fromQuick: DatedNote[] = quickNotes
    .filter((n) => inWindow.has((n.created_at ?? '').slice(0, 10)) && (n.content ?? '').trim())
    .map((n) => ({
      date: n.created_at.slice(0, 10),
      source: 'quick' as const,
      label: notesTag,
      text: n.content.trim(),
    }));

  return [...fromOres, ...fromQuick].sort((a, b) =>
    a.date === b.date ? a.source.localeCompare(b.source) : a.date.localeCompare(b.date),
  );
}

export interface BuildPayloadInput {
  periodStart: string;
  periodEnd: string;
  charter: CharterConfig;
  tasks: TaskRow[];
  completions: CompletionRow[];
  priorCompletions?: CompletionRow[];
  taskNotes: TaskNoteRow[];
  quickNotes: QuickNoteRow[];
  dailyGoals: DailyGoalRow[];
  priorDailyGoals?: DailyGoalRow[];
}

export function buildReportPayload(input: BuildPayloadInput): ReportPayload {
  const dates = datesInRange(input.periodStart, input.periodEnd);
  const ores = buildOreSummaries(input.tasks, input.completions, dates, input.charter.focusOreName);
  const focusOre = ores.find((o) => o.isFocusOre);

  const focusDays = focusOre
    ? daySeries(input.completions, focusOre.taskId, dates)
    : dates.map((date) => ({ date, value: 0, logged: false, numeric: false }));

  let priorDays: DayValue[] | null = null;
  if (focusOre && input.priorCompletions) {
    const priorEnd = shiftIso(input.periodStart, -1);
    const priorStart = shiftIso(priorEnd, -(dates.length - 1));
    priorDays = daySeries(input.priorCompletions, focusOre.taskId, datesInRange(priorStart, priorEnd));
  }

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    periodDate: medianDate(dates),
    days: dates.length,
    focus: computeFocusMetrics(focusDays, priorDays, input.charter.weeklyAverageGoal),
    ores,
    notes: collectNotes(input.taskNotes, input.quickNotes, input.tasks, dates, input.charter.notesTag),
    adherence: computeAdherence(
      input.dailyGoals.filter((g) => dates.includes(g.goal_date)),
      input.priorDailyGoals ?? null,
    ),
  };
}

export function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

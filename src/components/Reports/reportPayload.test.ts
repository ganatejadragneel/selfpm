import { describe, it, expect } from 'vitest';
import {
  buildOreSummaries,
  buildReportPayload,
  collectNotes,
  computeAdherence,
  computeFocusMetrics,
  datesInRange,
  daySeries,
  medianDate,
  toNumericValue,
  type CompletionRow,
  type DailyGoalRow,
  type TaskRow,
} from './reportPayload';
import { DEFAULT_CHARTER } from '../Focus/charterConfig';

const FOCUS: TaskRow = { id: 't-focus', name: 'Hard Focus Hours' };
const GYM: TaskRow = { id: 't-gym', name: 'Gym' };

const comp = (taskId: string, date: string, value: unknown): CompletionRow => ({
  custom_task_id: taskId,
  completion_date: date,
  value,
});

const WEEK = datesInRange('2026-08-14', '2026-08-20');

describe('datesInRange / medianDate', () => {
  it('is inclusive on both ends', () => {
    expect(WEEK).toHaveLength(7);
    expect(WEEK[0]).toBe('2026-08-14');
    expect(WEEK[6]).toBe('2026-08-20');
  });

  it('crosses a month and a leap-year boundary without drift', () => {
    expect(datesInRange('2026-01-30', '2026-02-02')).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
    expect(datesInRange('2028-02-27', '2028-03-01')).toEqual(['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01']);
  });

  it('handles a single-day window', () => {
    expect(datesInRange('2026-08-20', '2026-08-20')).toEqual(['2026-08-20']);
  });

  it('takes the median day as the report date', () => {
    expect(medianDate(WEEK)).toBe('2026-08-17');
    expect(medianDate(datesInRange('2026-08-19', '2026-08-20'))).toBe('2026-08-19');
    expect(medianDate([])).toBe('');
  });
});

describe('toNumericValue', () => {
  it('parses plain and unit-suffixed numbers', () => {
    expect(toNumericValue('3.5')).toBe(3.5);
    expect(toNumericValue('6 hrs')).toBe(6);
    expect(toNumericValue(4)).toBe(4);
    expect(toNumericValue('0')).toBe(0);
  });

  it('takes the main component of a combined value, not the digits of both', () => {
    // A blind strip of non-numerics would read "3.5|2" as 3.52.
    expect(toNumericValue('3.5|2')).toBe(3.5);
    expect(toNumericValue('6|Done')).toBe(6);
  });

  it('returns null for non-numeric ORE values rather than zero', () => {
    expect(toNumericValue('Done')).toBeNull();
    expect(toNumericValue('Done|Done')).toBeNull();
    expect(toNumericValue('')).toBeNull();
    expect(toNumericValue(null)).toBeNull();
    expect(toNumericValue(undefined)).toBeNull();
    expect(toNumericValue(NaN)).toBeNull();
  });
});

describe('daySeries — window boundaries', () => {
  const rows = [
    comp(FOCUS.id, '2026-08-13', 99), // one day BEFORE the window
    comp(FOCUS.id, '2026-08-14', 5), // exactly on periodStart
    comp(FOCUS.id, '2026-08-17', 6),
    comp(FOCUS.id, '2026-08-20', 4), // exactly on periodEnd
    comp(FOCUS.id, '2026-08-21', 99), // one day AFTER the window
    comp(GYM.id, '2026-08-15', 1), // another ORE entirely
  ];

  it('includes both boundary days and excludes the days either side', () => {
    const s = daySeries(rows, FOCUS.id, WEEK);
    expect(s).toHaveLength(7);
    expect(s.find((d) => d.date === '2026-08-14')).toMatchObject({ value: 5, logged: true });
    expect(s.find((d) => d.date === '2026-08-20')).toMatchObject({ value: 4, logged: true });
    expect(s.some((d) => d.value === 99)).toBe(false);
  });

  it('distinguishes an unlogged day from a logged zero', () => {
    const s = daySeries([comp(FOCUS.id, '2026-08-15', 0)], FOCUS.id, WEEK);
    expect(s.find((d) => d.date === '2026-08-15')).toMatchObject({ value: 0, logged: true });
    expect(s.find((d) => d.date === '2026-08-16')).toMatchObject({ value: 0, logged: false });
  });

  it('does not mix in other OREs', () => {
    expect(daySeries(rows, FOCUS.id, WEEK).reduce((s, d) => s + d.value, 0)).toBe(15);
  });
});

describe('computeFocusMetrics (manuscript §4.1)', () => {
  const days = daySeries(
    [comp(FOCUS.id, '2026-08-14', 5), comp(FOCUS.id, '2026-08-17', 6), comp(FOCUS.id, '2026-08-20', 4)],
    FOCUS.id,
    WEEK,
  );

  it('totals and averages over days in the window, not days logged', () => {
    const m = computeFocusMetrics(days, null, 6);
    expect(m.total).toBe(15);
    expect(m.average).toBe(2.1); // 15 / 7 — missing days count as zero
  });

  it('computes % change against the prior window', () => {
    const prior = daySeries([comp(FOCUS.id, '2026-08-07', 10)], FOCUS.id, datesInRange('2026-08-07', '2026-08-13'));
    expect(computeFocusMetrics(days, prior, 6).deltaPct).toBe(50); // 15 vs 10
  });

  it('reports an incomparable delta rather than Infinity when the prior window is empty', () => {
    const emptyPrior = daySeries([], FOCUS.id, datesInRange('2026-08-07', '2026-08-13'));
    const m = computeFocusMetrics(days, emptyPrior, 6);
    expect(m.priorTotal).toBe(0);
    expect(m.deltaPct).toBeNull();
  });

  it('handles a period with no entries at all without dividing by zero', () => {
    const none = daySeries([], FOCUS.id, WEEK);
    expect(computeFocusMetrics(none, null, 6)).toMatchObject({ total: 0, average: 0, deltaPct: null });
    expect(computeFocusMetrics([], null, 6).average).toBe(0);
  });
});

describe('computeAdherence (manuscript §4.2)', () => {
  const goals = (...statuses: string[]): DailyGoalRow[] =>
    statuses.map((status, i) => ({ goal_date: WEEK[i % 7], status }));

  it('counts in_progress as NOT done', () => {
    expect(computeAdherence(goals('done', 'in_progress', 'not_done', 'done'))).toMatchObject({
      done: 2,
      attempted: 4,
      pct: 50,
    });
  });

  it('does not divide by zero when there are no goals', () => {
    expect(computeAdherence([])).toMatchObject({ done: 0, attempted: 0, pct: 0, deltaPct: null });
  });

  it('handles all-done', () => {
    expect(computeAdherence(goals('done', 'done'))).toMatchObject({ done: 2, attempted: 2, pct: 100 });
  });

  it('carries the goal LABELS through for plan-vs-actual diffing (Move 1)', () => {
    const a = computeAdherence([
      { goal_date: '2026-08-15', status: 'not_done', label: 'Draft the answer doc' },
      { goal_date: '2026-08-14', status: 'done', label: 'Finish P-Card flow' },
    ]);
    expect(a.goals).toEqual([
      { date: '2026-08-14', label: 'Finish P-Card flow', status: 'done' },
      { date: '2026-08-15', label: 'Draft the answer doc', status: 'not_done' },
    ]);
  });

  it('drops unlabelled goals from the list but still counts them in the tally', () => {
    const a = computeAdherence([
      { goal_date: '2026-08-14', status: 'done' },
      { goal_date: '2026-08-14', status: 'done', label: '  ' },
      { goal_date: '2026-08-15', status: 'not_done', label: 'Real goal' },
    ]);
    expect(a.goals).toEqual([{ date: '2026-08-15', label: 'Real goal', status: 'not_done' }]);
    expect(a).toMatchObject({ done: 2, attempted: 3 });
  });

  it('gives a delta in percentage points, and null when the prior period had no goals', () => {
    expect(computeAdherence(goals('done', 'done'), goals('done', 'not_done')).deltaPct).toBe(50);
    expect(computeAdherence(goals('done'), []).deltaPct).toBeNull();
  });
});

describe('buildOreSummaries', () => {
  const rows = [
    comp(FOCUS.id, '2026-08-14', '5'),
    comp(FOCUS.id, '2026-08-15', '6 hrs'),
    comp(GYM.id, '2026-08-15', 'Done'),
    comp(GYM.id, '2026-08-17', 'Done'),
  ];

  it('flags the focus ORE by loose name match', () => {
    const out = buildOreSummaries([FOCUS, GYM], rows, WEEK, 'hard focus hours  ');
    expect(out.find((o) => o.isFocusOre)?.name).toBe('Hard Focus Hours');
    expect(out.filter((o) => o.isFocusOre)).toHaveLength(1);
  });

  it('totals numeric OREs and returns null (not 0) for a non-numeric one', () => {
    const out = buildOreSummaries([FOCUS, GYM], rows, WEEK, FOCUS.name);
    expect(out.find((o) => o.taskId === FOCUS.id)).toMatchObject({ total: 11, daysLogged: 2, daysInWindow: 7 });
    expect(out.find((o) => o.taskId === GYM.id)).toMatchObject({ total: null, daysLogged: 2 });
  });

  it("does not corrupt the focus total when another ORE's value is non-numeric", () => {
    expect(buildOreSummaries([FOCUS, GYM], rows, WEEK, FOCUS.name).find((o) => o.isFocusOre)?.total).toBe(11);
  });
});

describe('collectNotes', () => {
  const taskNotes = [
    { custom_task_id: FOCUS.id, note_date: '2026-08-17', note_text: 'deep block held' },
    { custom_task_id: FOCUS.id, note_date: '2026-08-13', note_text: 'outside window' },
    { custom_task_id: FOCUS.id, note_date: '2026-08-15', note_text: '   ' },
  ];
  const quickNotes = [
    { content: 'morning routine landed', created_at: '2026-08-15T07:30:00Z', tags: ['focus log'] },
    { content: 'out of window', created_at: '2026-08-25T07:30:00Z', tags: ['focus log'] },
  ];

  it('merges both sources, orders oldest-first, and drops empties and out-of-window rows', () => {
    const out = collectNotes(taskNotes, quickNotes, [FOCUS], WEEK, 'focus log');
    expect(out.map((n) => n.date)).toEqual(['2026-08-15', '2026-08-17']);
    expect(out[0]).toMatchObject({ source: 'quick', label: 'focus log' });
    expect(out[1]).toMatchObject({ source: 'ore', label: 'Hard Focus Hours', text: 'deep block held' });
  });

  it('labels a note whose ORE is unknown rather than dropping it', () => {
    const out = collectNotes([{ custom_task_id: 'gone', note_date: '2026-08-16', note_text: 'orphan' }], [], [FOCUS], WEEK, 'focus log');
    expect(out[0].label).toBe('Unknown ORE');
  });
});

describe('buildReportPayload', () => {
  const base = {
    periodStart: '2026-08-14',
    periodEnd: '2026-08-20',
    charter: { ...DEFAULT_CHARTER, focusOreName: 'Hard Focus Hours', weeklyAverageGoal: 6, notesTag: 'focus log' },
    tasks: [FOCUS, GYM],
    completions: [comp(FOCUS.id, '2026-08-14', '5'), comp(FOCUS.id, '2026-08-20', '4'), comp(GYM.id, '2026-08-15', 'Done')],
    taskNotes: [{ custom_task_id: FOCUS.id, note_date: '2026-08-14', note_text: 'good start' }],
    quickNotes: [{ content: 'log', created_at: '2026-08-16T09:00:00Z', tags: ['focus log'] }],
    dailyGoals: [
      { goal_date: '2026-08-14', status: 'done' },
      { goal_date: '2026-08-15', status: 'not_done' },
      { goal_date: '2026-08-30', status: 'done' }, // outside the window
    ],
  };

  it('assembles a complete payload', () => {
    const p = buildReportPayload(base);
    expect(p).toMatchObject({ periodStart: '2026-08-14', periodEnd: '2026-08-20', periodDate: '2026-08-17', days: 7 });
    expect(p.focus.total).toBe(9);
    expect(p.ores).toHaveLength(2);
    expect(p.notes).toHaveLength(2);
  });

  it('scopes adherence to the window', () => {
    expect(buildReportPayload(base).adherence).toMatchObject({ done: 1, attempted: 2, pct: 50 });
  });

  it('computes the prior-window delta from priorCompletions', () => {
    const p = buildReportPayload({
      ...base,
      priorCompletions: [comp(FOCUS.id, '2026-08-07', '6'), comp(FOCUS.id, '2026-08-13', '6')],
    });
    expect(p.focus.priorTotal).toBe(12);
    expect(p.focus.deltaPct).toBe(-25); // 9 vs 12
  });

  it('degrades to zeros when the charter names an ORE the seeker does not have', () => {
    const p = buildReportPayload({ ...base, charter: { ...base.charter, focusOreName: 'Nonexistent ORE' } });
    expect(p.focus.total).toBe(0);
    expect(p.focus.days).toHaveLength(7);
    expect(p.ores.some((o) => o.isFocusOre)).toBe(false);
  });
});

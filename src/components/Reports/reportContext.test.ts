import { describe, it, expect } from 'vitest';
import {
  buildReportContext,
  parseCommitments,
  priorReportDate,
  resolveHistory,
  selectPriorReports,
} from './reportContext';
import type { KbDocumentRow } from './types';

const row = (id: string, metadata: Record<string, unknown> | null, title = `Report ${id}`): KbDocumentRow => ({
  id,
  title,
  content: `body of ${id}`,
  source: 'cbo',
  metadata,
});

const dated = (id: string, period_date: string) => row(id, { period_date });

describe('priorReportDate', () => {
  it('prefers period_end over period_date', () => {
    expect(priorReportDate({ period_end: '2026-08-20', period_date: '2026-08-16' })).toBe('2026-08-20');
  });

  it('falls back to period_date (the imported reports carry only this)', () => {
    expect(priorReportDate({ period_date: '2026-06-18' })).toBe('2026-06-18');
  });

  it('returns null for missing, null, or malformed dates', () => {
    expect(priorReportDate(null)).toBeNull();
    expect(priorReportDate({})).toBeNull();
    expect(priorReportDate({ period_date: null })).toBeNull();
    expect(priorReportDate({ period_date: 'June 18, 2026' })).toBeNull();
    expect(priorReportDate({ period_date: 20260618 })).toBeNull();
  });
});

describe('parseCommitments', () => {
  it('reads well-formed commitments', () => {
    const out = parseCommitments({
      commitments: [
        { id: 'c1', text: 'Protect the morning block', measure: 'hours logged before 11am' },
        { id: 'c2', text: 'Gym 3x' },
      ],
    });
    expect(out).toEqual([
      { id: 'c1', text: 'Protect the morning block', measure: 'hours logged before 11am' },
      { id: 'c2', text: 'Gym 3x' },
    ]);
  });

  it('returns [] for the imported reports, which predate the field', () => {
    expect(parseCommitments({ source_file: 'seekers/x/reports/a.md', period_date: '2026-06-18' })).toEqual([]);
    expect(parseCommitments({})).toEqual([]);
    expect(parseCommitments(null)).toEqual([]);
    expect(parseCommitments(undefined)).toEqual([]);
  });

  it('does not throw on malformed shapes, and drops unusable entries', () => {
    expect(parseCommitments({ commitments: 'not an array' })).toEqual([]);
    expect(parseCommitments({ commitments: [null, 42, 'text', { measure: 'no text field' }] })).toEqual([]);
    expect(parseCommitments({ commitments: [{ text: '   ' }] })).toEqual([]);
  });

  it('synthesizes an id when one is missing, and drops a blank measure', () => {
    const out = parseCommitments({ commitments: [{ text: 'Ship the eval' }, { text: 'Write history', measure: '  ' }] });
    expect(out).toEqual([
      { id: 'c1', text: 'Ship the eval' },
      { id: 'c2', text: 'Write history' },
    ]);
  });
});

describe('selectPriorReports', () => {
  const rows = [
    dated('a', '2026-08-20'),
    dated('b', '2026-07-01'),
    dated('c', '2026-06-28'),
    dated('d', '2026-06-18'),
    dated('e', '2026-06-11'),
    dated('f', '2026-06-06'),
  ];

  it('returns the reports before the window, newest first', () => {
    const out = selectPriorReports(rows, '2026-08-13', 4);
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'd', 'e']);
    expect(out[0].periodDate).toBe('2026-07-01');
  });

  it('excludes a report whose period ends inside the window being generated', () => {
    // 'a' closed 2026-08-20, inside a window starting 2026-08-13 — feeding it back
    // would have the model grade commitments made about this very period.
    expect(selectPriorReports(rows, '2026-08-13', 4).map((r) => r.id)).not.toContain('a');
    // ...but it qualifies for a later window.
    expect(selectPriorReports(rows, '2026-08-21', 1).map((r) => r.id)).toEqual(['a']);
  });

  it('respects the depth cap', () => {
    expect(selectPriorReports(rows, '2026-08-13', 2).map((r) => r.id)).toEqual(['b', 'c']);
    expect(selectPriorReports(rows, '2026-08-13', 0)).toEqual([]);
    expect(selectPriorReports(rows, '2026-08-13', -1)).toEqual([]);
  });

  it('picks historical neighbours, not the newest, for a back-dated window', () => {
    expect(selectPriorReports(rows, '2026-06-19', 2).map((r) => r.id)).toEqual(['d', 'e']);
  });

  it('handles the first-report case and fewer rows than the depth', () => {
    expect(selectPriorReports(rows, '2026-01-01', 4)).toEqual([]);
    expect(selectPriorReports([], '2026-08-13', 4)).toEqual([]);
    expect(selectPriorReports(rows, '2026-06-12', 4).map((r) => r.id)).toEqual(['e', 'f']);
  });

  it('skips undated rows instead of crashing', () => {
    const withJunk = [...rows, row('x', null), row('y', {}), row('z', { period_date: 'nonsense' })];
    const out = selectPriorReports(withJunk, '2026-08-13', 10);
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'd', 'e', 'f']);
  });

  it('orders ties stably (Jun 18 has both a CBO and a landmark report)', () => {
    const tied = [dated('landmark', '2026-06-18'), dated('cbo', '2026-06-18')];
    expect(selectPriorReports(tied, '2026-07-01', 2).map((r) => r.id)).toEqual(['cbo', 'landmark']);
  });

  it('carries commitments through onto the prior report', () => {
    const withCommit = [row('a', { period_date: '2026-06-18', commitments: [{ id: 'c1', text: 'Protect mornings' }] })];
    expect(selectPriorReports(withCommit, '2026-07-01', 1)[0].commitments).toEqual([
      { id: 'c1', text: 'Protect mornings' },
    ]);
  });
});

describe('resolveHistory', () => {
  const SEED = `# History (curated)

Your established patterns and arc — the prose the weekly report reads for long-range continuity.`;

  it('returns null for the untouched seed page', () => {
    expect(resolveHistory(SEED)).toBeNull();
  });

  it('returns null for blank or missing content', () => {
    expect(resolveHistory('')).toBeNull();
    expect(resolveHistory('   \n  ')).toBeNull();
    expect(resolveHistory(null)).toBeNull();
    expect(resolveHistory(undefined)).toBeNull();
  });

  it('passes through real history, including a page written around the seed line', () => {
    expect(resolveHistory('  The arc: 145 days of logging.  ')).toBe('The arc: 145 days of logging.');
    const written = `${SEED}\n\n${'Real longitudinal history. '.repeat(30)}`;
    expect(resolveHistory(written)).not.toBeNull();
  });
});

describe('buildReportContext', () => {
  const rows = [dated('a', '2026-07-01'), dated('b', '2026-06-28')];

  it('assembles prior reports, history, and charter', () => {
    const ctx = buildReportContext({
      reportRows: rows,
      historyContent: 'Ten months of logging; the slump pattern is well established.',
      charterContent: '- ore: Deep Work\n- unit: hrs\n- goal: weekly average >= 5\n- notes_tag: work log',
      periodStart: '2026-08-13',
    });
    expect(ctx.priorReports.map((r) => r.id)).toEqual(['a', 'b']);
    expect(ctx.history).toContain('Ten months');
    expect(ctx.charter.focusOreName).toBe('Deep Work');
    expect(ctx.charter.weeklyAverageGoal).toBe(5);
  });

  it('degrades cleanly when the history page is absent and the charter is unset', () => {
    const ctx = buildReportContext({ reportRows: rows, periodStart: '2026-08-13' });
    expect(ctx.history).toBeNull();
    // falls back to DEFAULT_CHARTER rather than throwing
    expect(ctx.charter.focusOreName).toBe('Hard Focus Hours');
    expect(ctx.priorReports).toHaveLength(2);
  });

  it('produces an empty, non-throwing context for a first-ever report', () => {
    const ctx = buildReportContext({ reportRows: [], periodStart: '2025-09-02' });
    expect(ctx.priorReports).toEqual([]);
    expect(ctx.history).toBeNull();
  });
});

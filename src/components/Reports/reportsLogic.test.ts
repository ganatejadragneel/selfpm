import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PERIOD_DAYS,
  MAX_PERIOD_DAYS,
  buildDocumentRow,
  formatDate,
  periodWindow,
  reportTitle,
  toGridRow,
  toGridRows,
  todayLocal,
  validatePeriodInput,
} from './reportsLogic';
import type { KbDocumentRow } from './types';

const row = (over: Partial<KbDocumentRow> = {}): KbDocumentRow => ({
  id: 'r1',
  title: 'CPO Report — Aug 17',
  content: '# body',
  source: 'cbo',
  metadata: {},
  created_at: '2026-08-21T04:00:00Z',
  ...over,
});

describe('validatePeriodInput (brief §B4)', () => {
  it('accepts a normal period', () => {
    expect(validatePeriodInput('7')).toEqual({ valid: true, days: 7, error: null });
    expect(validatePeriodInput(' 30 ')).toEqual({ valid: true, days: 30, error: null });
    expect(validatePeriodInput('1')).toMatchObject({ valid: true, days: 1 });
  });

  it('blocks zero, negatives and non-numbers, falling back to the default', () => {
    for (const bad of ['0', '-3', 'abc', '', '   ']) {
      const v = validatePeriodInput(bad);
      expect(v.valid).toBe(false);
      expect(v.error).toBeTruthy();
      expect(v.days).toBe(DEFAULT_PERIOD_DAYS);
    }
  });

  it('blocks fractions — half a day is not a period', () => {
    expect(validatePeriodInput('7.5')).toMatchObject({ valid: false });
  });

  it('clamps an absurd period to the maximum', () => {
    const v = validatePeriodInput('99999');
    expect(v).toMatchObject({ valid: false, days: MAX_PERIOD_DAYS });
    expect(v.error).toMatch(/365/);
  });
});

describe('toGridRow', () => {
  it('maps a generated report', () => {
    const r = toGridRow(row({
      metadata: {
        period_date: '2026-08-17', generated_at: '2026-08-21T10:00:00Z',
        commitments: [{ id: 'c1', text: 'x' }, { id: 'c2', text: 'y' }], notes: 'good one',
      },
    }));
    expect(r).toMatchObject({ name: 'CPO Report — Aug 17', generated: '2026-08-21', period: '2026-08-17', notes: 'good one', commitmentCount: 2, imported: false });
  });

  it('falls back to created_at when generated_at is absent', () => {
    expect(toGridRow(row({ metadata: { period_date: '2026-08-17' } })).generated).toBe('2026-08-21');
  });

  it('flags an imported report and reports zero commitments', () => {
    const r = toGridRow(row({ metadata: { period_date: '2026-06-18', source_file: 'seekers/k/reports/a.md' } }));
    expect(r).toMatchObject({ imported: true, commitmentCount: 0 });
  });

  it('survives null and malformed metadata', () => {
    expect(toGridRow(row({ metadata: null }))).toMatchObject({ period: null, notes: '', commitmentCount: 0 });
    expect(toGridRow(row({ metadata: { commitments: 'nope', notes: 42 } }))).toMatchObject({ commitmentCount: 0, notes: '' });
  });

  it('never renders an empty title', () => {
    expect(toGridRow(row({ title: '' })).name).toBe('Untitled');
  });
});

describe('toGridRows ordering', () => {
  it('sorts by the period covered, newest first — not by generation date', () => {
    const rows = [
      row({ id: 'old', title: 'old', metadata: { period_date: '2026-06-18', generated_at: '2026-08-21T00:00:00Z' } }),
      row({ id: 'new', title: 'new', metadata: { period_date: '2026-08-17', generated_at: '2026-08-18T00:00:00Z' } }),
    ];
    expect(toGridRows(rows).map((r) => r.id)).toEqual(['new', 'old']);
  });

  it('keeps undated rows visible, at the bottom', () => {
    const rows = [row({ id: 'undated', title: 'u', metadata: {} }), row({ id: 'dated', title: 'd', metadata: { period_date: '2026-01-01' } })];
    expect(toGridRows(rows).map((r) => r.id)).toEqual(['dated', 'undated']);
    expect(toGridRows(rows)).toHaveLength(2);
  });

  it('breaks same-period ties by name, stably', () => {
    const rows = [
      row({ id: 'b', title: 'B report', metadata: { period_date: '2026-06-18' } }),
      row({ id: 'a', title: 'A report', metadata: { period_date: '2026-06-18' } }),
    ];
    expect(toGridRows(rows).map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('formatDate', () => {
  it('formats ISO dates and degrades gracefully', () => {
    expect(formatDate('2026-08-17')).toBe('Aug 17, 2026');
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('not a date');
  });
});

describe('reportTitle / buildDocumentRow', () => {
  it('names by period date', () => {
    expect(reportTitle('2026-08-17')).toBe('CPO Report — Aug 17');
    expect(reportTitle('2026-12-31')).toBe('CPO Report — Dec 31');
  });

  it('builds the kb_documents row contract', () => {
    const r = buildDocumentRow({
      uid: 'u1', folderId: 'f1', body: '# report',
      payload: { periodStart: '2026-08-14', periodEnd: '2026-08-20', periodDate: '2026-08-17' },
      commitments: [{ id: 'c1', text: 'do it' }], model: 'claude-sonnet-4-6', generatedAt: '2026-08-21T00:00:00Z',
    });
    expect(r).toMatchObject({ new_user_id: 'u1', folder_id: 'f1', source: 'cbo', display_order: 0, title: 'CPO Report — Aug 17' });
    expect(r.metadata.commitments).toEqual([{ id: 'c1', text: 'do it' }]);
  });
});

describe('periodWindow / todayLocal', () => {
  it('builds an inclusive N-day window ending today', () => {
    expect(periodWindow(7, '2026-08-20')).toEqual({ periodStart: '2026-08-14', periodEnd: '2026-08-20' });
    expect(periodWindow(1, '2026-08-20')).toEqual({ periodStart: '2026-08-20', periodEnd: '2026-08-20' });
  });

  it('crosses month and year boundaries', () => {
    expect(periodWindow(7, '2026-01-03').periodStart).toBe('2025-12-28');
    expect(periodWindow(3, '2028-03-01').periodStart).toBe('2028-02-28'); // leap year
  });

  it('uses the LOCAL date, not UTC — a late-evening generate must not roll forward', () => {
    // 2026-08-20 23:30 local. toISOString() would report Aug 21 in a negative-offset zone.
    const late = new Date(2026, 7, 20, 23, 30, 0);
    expect(todayLocal(late)).toBe('2026-08-20');
  });
});

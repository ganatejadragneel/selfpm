// Drift guard for the single-file Deno port.
//
// generate-cbo-report/index.ts duplicates the pure logic from src/ because it
// deploys as one self-contained module. Duplication rots silently, so these tests
// assert the port and the originals produce IDENTICAL output on identical input.
// If you change one side, this fails until you change the other.

import { describe, it, expect } from 'vitest';
import * as fn from '../generate-cbo-report/index';

import * as srcPayload from '../../../src/components/Reports/reportPayload';
import * as srcContext from '../../../src/components/Reports/reportContext';
import * as srcPrompt from '../../../src/components/Reports/reportPrompt';
import { buildDocumentRow as srcBuildDocumentRow, reportTitle as srcReportTitle } from '../../../src/components/Reports/reportsLogic';
import { parseCharter as srcParseCharter, normalizeName as srcNormalizeName, DEFAULT_CHARTER } from '../../../src/components/Focus/charterConfig';

const CHARTER = `# Charter
- ore: <Hard Focus Hours>
- unit: hrs
- goal: weekly average >= 7
- notes_tag: <focus log>`;

const charter = srcParseCharter(CHARTER);

const payloadInput = {
  periodStart: '2026-08-14',
  periodEnd: '2026-08-20',
  charter,
  tasks: [
    { id: 't1', name: 'Hard Focus Hours' },
    { id: 't2', name: 'Sleep time and Duration' },
    { id: 't3', name: ' gym  ' },
  ],
  completions: [
    { custom_task_id: 't1', completion_date: '2026-08-14', value: '4' },
    { custom_task_id: 't1', completion_date: '2026-08-16', value: 'None' },
    { custom_task_id: 't1', completion_date: '2026-08-17', value: '7 hrs' },
    { custom_task_id: 't1', completion_date: '2026-08-19', value: '3.5|2' },
    { custom_task_id: 't2', completion_date: '2026-08-17', value: 'Done|Done' },
    { custom_task_id: 't3', completion_date: '2026-08-13', value: '1' },
  ],
  priorCompletions: [{ custom_task_id: 't1', completion_date: '2026-08-10', value: '8' }],
  taskNotes: [
    { custom_task_id: 't1', note_date: '2026-08-17', note_text: 'held the block' },
    { custom_task_id: 'gone', note_date: '2026-08-18', note_text: 'orphan note' },
  ],
  quickNotes: [{ content: 'focus log entry', created_at: '2026-08-18T09:00:00Z', tags: ['focus log'] }],
  dailyGoals: [
    { goal_date: '2026-08-14', status: 'done', label: 'Finish P-Card flow' },
    { goal_date: '2026-08-15', status: 'in_progress', label: 'Draft answer doc' },
  ],
  priorDailyGoals: [{ goal_date: '2026-08-10', status: 'done', label: 'x' }],
};

const reportRows = [
  { id: 'r1', title: 'A', content: 'body A', source: 'cbo', metadata: { period_date: '2026-07-01' } },
  { id: 'r2', title: 'B', content: 'body B', source: 'cbo', metadata: { period_date: '2026-06-28', commitments: [{ id: 'c1', text: 'Protect mornings', measure: 'before 11am' }] } },
  { id: 'r3', title: 'C', content: 'body C', source: 'cbo', metadata: { period_end: '2026-08-20', period_date: '2026-08-17' } },
  { id: 'r4', title: 'D', content: 'body D', source: 'cbo', metadata: {} },
];

// The port mirrors only the four charter fields a report reads. The app's
// CharterConfig carries more (qualitative-ORE win/watch options) which SEEK-GEN
// never consults, so comparing whole objects would couple this function to
// unrelated charter work. Compare exactly what the report pipeline depends on.
const READ = (c: Record<string, unknown>) => ({
  focusOreName: c.focusOreName, notesTag: c.notesTag, weeklyAverageGoal: c.weeklyAverageGoal, unit: c.unit,
});

describe('port parity — charter', () => {
  it('parseCharter agrees on every field a report reads', () => {
    // Numeric goals only — a "%" goal is a qualitative-ORE rate the report does
    // not consume yet, so it is deliberately outside this contract.
    for (const input of [CHARTER, null, '- ore: <your ore name>', '- goal: weekly average >= 4\n- unit: sessions', '- ore: Deep Work\n- notes_tag: <work log>']) {
      expect(READ(fn.parseCharter(input))).toEqual(READ(srcParseCharter(input)));
    }
  });

  it('DEFAULT_CHARTER agrees on those fields', () => {
    expect(READ(fn.DEFAULT_CHARTER)).toEqual(READ(DEFAULT_CHARTER));
  });

  it('normalizeName agrees', () => {
    for (const v of ['  Hard   Focus Hours ', 'GYM', 'a', 'hard  focus   hours']) {
      expect(fn.normalizeName(v)).toBe(srcNormalizeName(v));
    }
  });
});

describe('port parity — payload math', () => {
  it('toNumericValue agrees across every shape', () => {
    for (const v of ['3.5', '6 hrs', 4, '0', '3.5|2', '6|Done', 'Done', 'Done|Done', '', null, undefined, NaN, 'None']) {
      expect(fn.toNumericValue(v)).toBe(srcPayload.toNumericValue(v));
    }
  });

  it('date helpers agree', () => {
    expect(fn.datesInRange('2026-01-30', '2026-02-02')).toEqual(srcPayload.datesInRange('2026-01-30', '2026-02-02'));
    expect(fn.datesInRange('2028-02-27', '2028-03-01')).toEqual(srcPayload.datesInRange('2028-02-27', '2028-03-01'));
    expect(fn.medianDate(fn.datesInRange('2026-08-14', '2026-08-20'))).toBe(srcPayload.medianDate(srcPayload.datesInRange('2026-08-14', '2026-08-20')));
    expect(fn.shiftIso('2026-01-01', -1)).toBe(srcPayload.shiftIso('2026-01-01', -1));
  });

  it('buildReportPayload agrees exactly', () => {
    expect(fn.buildReportPayload(payloadInput)).toEqual(srcPayload.buildReportPayload(payloadInput));
  });

  it('computeAdherence agrees, labels included', () => {
    expect(fn.computeAdherence(payloadInput.dailyGoals, payloadInput.priorDailyGoals))
      .toEqual(srcPayload.computeAdherence(payloadInput.dailyGoals, payloadInput.priorDailyGoals));
    expect(fn.computeAdherence([])).toEqual(srcPayload.computeAdherence([]));
  });
});

describe('port parity — context', () => {
  it('priorReportDate / parseCommitments agree', () => {
    for (const r of reportRows) {
      expect(fn.priorReportDate(r.metadata)).toBe(srcContext.priorReportDate(r.metadata));
      expect(fn.parseCommitments(r.metadata)).toEqual(srcContext.parseCommitments(r.metadata));
    }
    expect(fn.parseCommitments({ commitments: 'nope' })).toEqual(srcContext.parseCommitments({ commitments: 'nope' }));
  });

  it('selectPriorReports agrees', () => {
    for (const start of ['2026-08-14', '2026-07-01', '2025-01-01']) {
      expect(fn.selectPriorReports(reportRows, start, 4)).toEqual(srcContext.selectPriorReports(reportRows, start, 4));
    }
  });

  it('resolveHistory agrees', () => {
    const seed = '# History (curated)\n\nYour established patterns and arc — the prose the weekly report reads for long-range continuity.';
    for (const v of [seed, '', '  ', null, undefined, 'Real history here.']) {
      expect(fn.resolveHistory(v)).toBe(srcContext.resolveHistory(v));
    }
  });
});

describe('port parity — prompt (the highest drift risk)', () => {
  const payload = srcPayload.buildReportPayload(payloadInput);
  const ctx = {
    priorReports: srcContext.selectPriorReports(reportRows, '2026-08-14', 4),
    history: 'Ten months of logging.',
    charter,
  };

  it('buildSystem produces a byte-identical prompt', () => {
    expect(fn.buildSystem(ctx)).toBe(srcPrompt.buildSystem(ctx));
  });

  it('buildUser produces a byte-identical prompt', () => {
    expect(fn.buildUser(payload, ctx)).toBe(srcPrompt.buildUser(payload, ctx));
  });

  it('stays identical with no history and no priors', () => {
    const bare = { priorReports: [], history: null, charter };
    expect(fn.buildSystem(bare)).toBe(srcPrompt.buildSystem(bare));
    expect(fn.buildUser(payload, bare)).toBe(srcPrompt.buildUser(payload, bare));
  });

  it('priorExcerpt agrees, including the tail-truncation', () => {
    const long = `${'filler '.repeat(2000)}## Top Focus\nProtect the morning.`;
    expect(fn.priorExcerpt(long)).toBe(srcPrompt.priorExcerpt(long));
    expect(fn.PRIOR_EXCERPT_CHARS).toBe(srcPrompt.PRIOR_EXCERPT_CHARS);
  });

  it('COMMITMENT_MARKER and splitReportOutput agree', () => {
    expect(fn.COMMITMENT_MARKER).toBe(srcPrompt.COMMITMENT_MARKER);
    const cases = [
      `body\n${srcPrompt.COMMITMENT_MARKER}\n[{"id":"c1","text":"do it","measure":"m"}]`,
      `body\n${srcPrompt.COMMITMENT_MARKER}\n\`\`\`json\n[{"text":"x"}]\n\`\`\``,
      `body only`,
      `body\n${srcPrompt.COMMITMENT_MARKER}\nnot json`,
    ];
    for (const c of cases) expect(fn.splitReportOutput(c)).toEqual(srcPrompt.splitReportOutput(c));
  });
});

describe('port parity — the filed row', () => {
  // Two write paths exist: the browser writes it in dev, the edge function writes
  // it in production. A report must be byte-identical whichever produced it.
  const input = {
    uid: 'u1', folderId: 'f1', body: '# report body',
    payload: { periodStart: '2026-08-14', periodEnd: '2026-08-20', periodDate: '2026-08-17' },
    commitments: [{ id: 'c1', text: 'Protect the morning', measure: 'before 11am' }],
    model: 'claude-sonnet-4-6', generatedAt: '2026-08-21T00:00:00Z',
  };

  it('buildDocumentRow agrees between the client and the edge function', () => {
    expect(fn.buildDocumentRow(input as never)).toEqual(srcBuildDocumentRow(input));
  });

  it('reportTitle agrees', () => {
    for (const d of ['2026-08-17', '2026-01-01', '2026-12-31', '2026-02-29']) {
      expect(fn.reportTitle(d)).toBe(srcReportTitle(d));
    }
  });
});

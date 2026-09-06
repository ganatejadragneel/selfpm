import { describe, it, expect } from 'vitest';
import {
  COMMITMENT_MARKER,
  buildReportMessages,
  priorExcerpt,
  splitReportOutput,
} from './reportPrompt';
import { buildReportPayload } from './reportPayload';
import { DEFAULT_CHARTER } from '../Focus/charterConfig';
import type { ReportContext, PriorReport } from './types';

const payload = buildReportPayload({
  periodStart: '2026-08-14',
  periodEnd: '2026-08-20',
  charter: { ...DEFAULT_CHARTER, focusOreName: 'Hard Focus Hours', weeklyAverageGoal: 7, unit: 'hrs' },
  tasks: [
    { id: 't1', name: 'Hard Focus Hours' },
    { id: 't2', name: 'Sleep time and Duration' },
  ],
  completions: [
    { custom_task_id: 't1', completion_date: '2026-08-14', value: '4' },
    { custom_task_id: 't1', completion_date: '2026-08-17', value: '7' },
    { custom_task_id: 't2', completion_date: '2026-08-17', value: 'Done' },
  ],
  taskNotes: [{ custom_task_id: 't1', note_date: '2026-08-17', note_text: 'held the block' }],
  quickNotes: [],
  dailyGoals: [{ goal_date: '2026-08-14', status: 'done' }],
});

const prior = (over: Partial<PriorReport> = {}): PriorReport => ({
  id: 'p1',
  title: 'CBO Report: The Consistency Build',
  periodDate: '2026-06-18',
  commitments: [],
  content: 'Prior report body. Top Focus: protect the morning.',
  ...over,
});

const ctx = (over: Partial<ReportContext> = {}): ReportContext => ({
  priorReports: [prior()],
  history: null,
  charter: { ...DEFAULT_CHARTER, focusOreName: 'Hard Focus Hours', weeklyAverageGoal: 7, unit: 'hrs' },
  ...over,
});

describe('priorExcerpt', () => {
  it('keeps short reports whole', () => {
    expect(priorExcerpt('short body', 100)).toBe('short body');
  });

  it('truncates from the FRONT so the closing Top Focus survives', () => {
    const content = `${'filler '.repeat(200)}## Top Focus\nProtect the morning block.`;
    const out = priorExcerpt(content, 60);
    expect(out).toContain('Protect the morning block.');
    expect(out).toContain('earlier sections omitted');
    expect(out.startsWith('filler')).toBe(false);
  });
});

describe('buildReportMessages — system', () => {
  const { system } = buildReportMessages(payload, ctx());

  it('states the north-star from the charter, not a hardcoded value', () => {
    expect(system).toContain('7 hrs/day average of Hard Focus Hours');
    const custom = buildReportMessages(payload, ctx({
      charter: { ...DEFAULT_CHARTER, focusOreName: 'Deep Work', weeklyAverageGoal: 4, unit: 'sessions' },
    })).system;
    expect(custom).toContain('4 sessions/day average of Deep Work');
  });

  it('requests all six sections in manuscript order', () => {
    const order = ['## Focus Hours', '## Plan Adherence', '## Wins', '## Slips & Improvements', '## Learnings', '## Top Focus'];
    const positions = order.map((s) => system.indexOf(s));
    expect(positions.every((p) => p > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('carries the anti-invention guardrail and the anti-patterns', () => {
    expect(system).toContain('NO INVENTION');
    expect(system).toMatch(/do not invent wanders/i);
    expect(system).toMatch(/more than 2 items in Top Focus/i);
    expect(system).toMatch(/clock time is not a duration/i);
  });

  it('asks for the commitments block in a parseable shape', () => {
    expect(system).toContain(COMMITMENT_MARKER);
    expect(system).toContain('"measure"');
  });
});

describe('buildReportMessages — user', () => {
  it('includes the metrics, the per-day series, and the notes', () => {
    const { user } = buildReportMessages(payload, ctx());
    expect(user).toContain('2026-08-14 → 2026-08-20');
    expect(user).toContain('2026-08-14: 4 hrs');
    expect(user).toContain('2026-08-15: not logged');
    expect(user).toContain('held the block');
  });

  it('marks the north-star ORE and suppresses totals for non-quantitative OREs', () => {
    const { user } = buildReportMessages(payload, ctx());
    expect(user).toContain('Hard Focus Hours (NORTH-STAR ORE)');
    expect(user).toContain('Sleep time and Duration: logged 1/7 days, no numeric total');
  });

  it('injects prior commitments by id so continuity can name them', () => {
    const { user } = buildReportMessages(payload, ctx({
      priorReports: [prior({ commitments: [{ id: 'c1', text: 'Protect the morning', measure: 'hours before 11am' }] })],
    }));
    expect(user).toContain('[c1] Protect the morning');
    expect(user).toContain('hours before 11am');
  });

  it('says so plainly when a prior report predates commitments', () => {
    expect(buildReportMessages(payload, ctx()).user).toContain('predates structured commitments');
  });

  it('degrades to a baseline framing with no prior reports', () => {
    const { user } = buildReportMessages(payload, ctx({ priorReports: [] }));
    expect(user).toContain('baseline report');
  });

  it('tells the model not to invent history when the page is unwritten', () => {
    expect(buildReportMessages(payload, ctx()).user).toMatch(/has not written their history page/i);
    expect(buildReportMessages(payload, ctx({ history: 'Ten months of data.' })).user).toContain('Ten months of data.');
  });

  it('renders the planned goals with their outcomes so Move 1 has something to diff', () => {
    const withGoals = buildReportPayload({
      periodStart: '2026-08-14',
      periodEnd: '2026-08-20',
      charter: { ...DEFAULT_CHARTER },
      tasks: [],
      completions: [],
      taskNotes: [],
      quickNotes: [],
      dailyGoals: [
        { goal_date: '2026-08-14', status: 'done', label: 'Finish P-Card flow' },
        { goal_date: '2026-08-15', status: 'not_done', label: 'Draft the answer doc' },
      ],
    });
    const { user } = buildReportMessages(withGoals, ctx());
    expect(user).toContain('[2026-08-14] Finish P-Card flow → done');
    expect(user).toContain('[2026-08-15] Draft the answer doc → not_done');
  });

  it('tells the model to say so rather than infer when no goal labels exist', () => {
    const { user } = buildReportMessages(payload, ctx());
    expect(user).toMatch(/no goal labels recorded/i);
    expect(user).toMatch(/rather than inferring what was planned/i);
  });

  it('reports an incomparable delta rather than a fabricated percentage', () => {
    expect(buildReportMessages(payload, ctx()).user).toContain('no comparable prior period');
  });
});

describe('splitReportOutput', () => {
  const body = '# Report\n\n## Focus Hours\n21 hrs.';

  it('splits body from commitments', () => {
    const out = splitReportOutput(
      `${body}\n${COMMITMENT_MARKER}\n[{"id":"c1","text":"Protect mornings","measure":"before 11am"}]`,
    );
    expect(out.body).toBe(body);
    expect(out.commitments).toEqual([{ id: 'c1', text: 'Protect mornings', measure: 'before 11am' }]);
    expect(out.commitmentParseFailed).toBe(false);
  });

  it('tolerates a json code fence around the array', () => {
    const out = splitReportOutput(`${body}\n${COMMITMENT_MARKER}\n\`\`\`json\n[{"text":"Ship it"}]\n\`\`\``);
    expect(out.commitments).toEqual([{ id: 'c1', text: 'Ship it' }]);
  });

  it('keeps the report when the marker is absent', () => {
    const out = splitReportOutput(body);
    expect(out.body).toBe(body);
    expect(out.commitments).toEqual([]);
    expect(out.commitmentParseFailed).toBe(false);
  });

  it('never loses the report body to malformed JSON', () => {
    const out = splitReportOutput(`${body}\n${COMMITMENT_MARKER}\nnot json at all`);
    expect(out.body).toBe(body);
    expect(out.commitments).toEqual([]);
    expect(out.commitmentParseFailed).toBe(true);
  });

  it('drops entries with no text and synthesizes missing ids', () => {
    const out = splitReportOutput(`${body}\n${COMMITMENT_MARKER}\n[{"text":""},{"text":"Real one"}]`);
    expect(out.commitments).toEqual([{ id: 'c2', text: 'Real one' }]);
  });
});

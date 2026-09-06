// Behaviour tests for the edge function's pipeline and HTTP guards.
// The Supabase client and the Anthropic call are mocked; everything else is the
// real deployed code path.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateForUser, handler, buildDocumentRow, cooldownBlocks, reportTitle, type GenerateOptions } from '../generate-cbo-report/index';

// ── a minimal chainable Supabase mock ────────────────────────────────────────
// Every query builder method returns `this`; awaiting resolves the configured
// rows for that table. Inserts are recorded so tests can assert what was filed.

interface TableData { [table: string]: unknown[] }

class Query {
  private table: string;
  private db: FakeDb;
  private insertRow: Record<string, unknown> | null = null;
  constructor(table: string, db: FakeDb) {
    this.table = table;
    this.db = db;
  }
  select() { return this; }
  eq() { return this; }
  gte() { return this; }
  lte() { return this; }
  in() { return this; }
  order() { return this; }
  limit() { return this; }
  single() { this.wantSingle = true; return this; }
  private wantSingle = false;
  insert(row: Record<string, unknown>) {
    this.insertRow = row;
    this.db.inserted.push({ table: this.table, row });
    return this;
  }
  then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) {
    const fail = this.db.failOn[this.table];
    if (fail) return Promise.resolve({ data: null, error: { message: fail } }).then(res, rej);
    if (this.insertRow) {
      const withId = { ...this.insertRow, id: `new-${this.db.inserted.length}` };
      return Promise.resolve({ data: withId, error: null }).then(res, rej);
    }
    const rows = this.db.data[this.table] ?? [];
    return Promise.resolve({ data: this.wantSingle ? rows[0] ?? null : rows, error: null }).then(res, rej);
  }
}

class FakeDb {
  data: TableData;
  failOn: Record<string, string> = {};
  inserted: { table: string; row: Record<string, unknown> }[] = [];
  constructor(data: TableData) { this.data = data; }
  from(table: string) { return new Query(table, this); }
}

const CPO_FOLDER = { id: 'folder-cpo', name: 'CPO Reports', metadata: { role: 'cpo_reports' } };
const SYS_FOLDER = { id: 'folder-sys', name: 'System', metadata: { role: 'system' } };

const CHARTER_PAGE = {
  content: '- ore: Hard Focus Hours\n- unit: hrs\n- goal: weekly average >= 7\n- notes_tag: focus log',
  metadata: { role: 'charter' },
};
const HISTORY_PAGE = { content: 'Ten months of logging; the slump pattern is established.', metadata: { role: 'history' } };

function db(over: Partial<TableData> = {}) {
  return new FakeDb({
    kb_folders: [CPO_FOLDER, SYS_FOLDER],
    kb_documents: [CHARTER_PAGE, HISTORY_PAGE],
    custom_tasks: [{ id: 't1', name: 'Hard Focus Hours' }],
    daily_task_completions: [{ custom_task_id: 't1', completion_date: '2026-08-17', value: '7' }],
    daily_task_notes: [{ custom_task_id: 't1', note_date: '2026-08-17', note_text: 'held the block' }],
    quick_notes: [],
    daily_goals: [],
    ...over,
  });
}

const OPTS: GenerateOptions = {
  periodEnd: '2026-08-20', days: 7, model: 'claude-sonnet-4-6', force: false, dryRun: false, priorDepth: 4,
};

const MODEL_TEXT = `## Focus Hours\n7 hrs.\n\n## Top Focus for Next Period\nProtect mornings.\n---COMMITMENTS---\n[{"id":"c1","text":"Protect the morning block","measure":"hours before 11am"}]`;

function mockAnthropic(text: string | null, ok = true, status = 200) {
  return vi.fn(async () => ({
    ok,
    status,
    text: async () => 'upstream detail',
    json: async () => ({ content: text === null ? [] : [{ type: 'text', text }] }),
  })) as unknown as typeof fetch;
}

beforeEach(() => { vi.stubGlobal('fetch', mockAnthropic(MODEL_TEXT)); });
afterEach(() => { vi.unstubAllGlobals(); });

// ── pure filing helpers ──────────────────────────────────────────────────────

describe('reportTitle / buildDocumentRow', () => {
  it('names the report from the period date (brief §B5)', () => {
    expect(reportTitle('2026-08-17')).toBe('CPO Report — Aug 17');
    expect(reportTitle('2026-01-01')).toBe('CPO Report — Jan 1');
    expect(reportTitle('2026-12-31')).toBe('CPO Report — Dec 31');
  });

  it('builds a kb_documents row matching the schema contract (§B6)', () => {
    const row = buildDocumentRow({
      uid: 'u1', folderId: 'f1', body: '# report',
      payload: { periodStart: '2026-08-14', periodEnd: '2026-08-20', periodDate: '2026-08-17' } as never,
      commitments: [{ id: 'c1', text: 'do it' }], model: 'claude-sonnet-4-6', generatedAt: '2026-08-21T00:00:00Z',
    });
    expect(row).toMatchObject({
      new_user_id: 'u1', folder_id: 'f1', source: 'cbo', title: 'CPO Report — Aug 17', display_order: 0,
    });
    expect(row.metadata).toMatchObject({
      period_start: '2026-08-14', period_end: '2026-08-20', period_date: '2026-08-17',
      model: 'claude-sonnet-4-6', commitments: [{ id: 'c1', text: 'do it' }],
    });
  });
});

describe('cooldownBlocks (brief §B4)', () => {
  const rows = (d: string) => [{ id: 'r', title: 't', content: '', source: 'cbo', metadata: { period_date: d } }];
  it('blocks when a report already covers within the window', () => {
    expect(cooldownBlocks(rows('2026-08-18'), '2026-08-20', 7)).toBe('2026-08-18');
  });
  it('allows once the last report is older than the cooldown', () => {
    expect(cooldownBlocks(rows('2026-08-10'), '2026-08-20', 7)).toBeNull();
  });
  it('never blocks the first-ever report', () => {
    expect(cooldownBlocks([], '2026-08-20', 7)).toBeNull();
    expect(cooldownBlocks([{ id: 'r', title: 't', content: '', source: 'cbo', metadata: {} }], '2026-08-20', 7)).toBeNull();
  });
});

// ── the pipeline ─────────────────────────────────────────────────────────────

describe('generateForUser — filing', () => {
  it('files exactly one kb_documents row with the commitments attached', async () => {
    const d = db();
    const out = await generateForUser(d, 'key', 'u1', OPTS);

    const inserts = d.inserted.filter((i) => i.table === 'kb_documents');
    expect(inserts).toHaveLength(1);
    expect(inserts[0].row).toMatchObject({ new_user_id: 'u1', folder_id: 'folder-cpo', source: 'cbo' });
    expect((inserts[0].row.metadata as Record<string, unknown>).commitments)
      .toEqual([{ id: 'c1', text: 'Protect the morning block', measure: 'hours before 11am' }]);
    expect(out).toMatchObject({ period_start: '2026-08-14', period_end: '2026-08-20', period_date: '2026-08-17' });
  });

  it('strips the commitments block out of the filed body', async () => {
    const d = db();
    await generateForUser(d, 'key', 'u1', OPTS);
    const body = d.inserted[0].row.content as string;
    expect(body).not.toContain('---COMMITMENTS---');
    expect(body).not.toContain('"measure"');
    expect(body).toContain('## Focus Hours');
  });

  it('derives the window from period_end and days', async () => {
    const d = db();
    const out = await generateForUser(d, 'key', 'u1', { ...OPTS, days: 3 });
    expect(out).toMatchObject({ period_start: '2026-08-18', period_end: '2026-08-20' });
  });

  it('creates the CPO Reports folder when the seeker has never opened Pages', async () => {
    const d = db({ kb_folders: [SYS_FOLDER] });
    await generateForUser(d, 'key', 'u1', OPTS);
    const folderInsert = d.inserted.find((i) => i.table === 'kb_folders');
    expect(folderInsert?.row).toMatchObject({ name: 'CPO Reports', is_system: true, metadata: { role: 'cpo_reports' } });
    expect(d.inserted.some((i) => i.table === 'kb_documents')).toBe(true);
  });
});

describe('generateForUser — guards', () => {
  it('respects the cooldown and files nothing', async () => {
    const d = db({ kb_documents: [CHARTER_PAGE, HISTORY_PAGE, { id: 'r1', title: 'prev', content: 'x', source: 'cbo', metadata: { period_date: '2026-08-19' } }] });
    const out = await generateForUser(d, 'key', 'u1', OPTS);
    expect(out).toHaveProperty('skipped');
    expect(d.inserted).toHaveLength(0);
  });

  it('force overrides the cooldown', async () => {
    const d = db({ kb_documents: [CHARTER_PAGE, HISTORY_PAGE, { id: 'r1', title: 'prev', content: 'x', source: 'cbo', metadata: { period_date: '2026-08-19' } }] });
    const out = await generateForUser(d, 'key', 'u1', { ...OPTS, force: true });
    expect(out).not.toHaveProperty('skipped');
    expect(d.inserted.filter((i) => i.table === 'kb_documents')).toHaveLength(1);
  });

  it('dry_run generates but files nothing', async () => {
    const d = db();
    const out = await generateForUser(d, 'key', 'u1', { ...OPTS, dryRun: true });
    expect(out).toMatchObject({ dry_run: true });
    expect(out).toHaveProperty('commitments');
    expect(d.inserted).toHaveLength(0);
  });

  it('leaves no half-written report when Anthropic fails', async () => {
    vi.stubGlobal('fetch', mockAnthropic(null, false, 529));
    const d = db();
    await expect(generateForUser(d, 'key', 'u1', OPTS)).rejects.toThrow(/Anthropic 529/);
    expect(d.inserted).toHaveLength(0);
  });

  it('files nothing when the model returns no text at all', async () => {
    vi.stubGlobal('fetch', mockAnthropic('   '));
    const d = db();
    await expect(generateForUser(d, 'key', 'u1', OPTS)).rejects.toThrow(/no text content/);
    expect(d.inserted).toHaveLength(0);
  });

  it('files nothing when the body is empty after the commitments split', async () => {
    // The model emitted only the commitments block — there is no report to file.
    vi.stubGlobal('fetch', mockAnthropic('---COMMITMENTS---\n[{"id":"c1","text":"x"}]'));
    const d = db();
    await expect(generateForUser(d, 'key', 'u1', OPTS)).rejects.toThrow(/empty report body/);
    expect(d.inserted).toHaveLength(0);
  });

  it('surfaces a DB read failure instead of filing a report built on nothing', async () => {
    const d = db();
    d.failOn.kb_folders = 'permission denied';
    await expect(generateForUser(d, 'key', 'u1', OPTS)).rejects.toThrow(/kb_folders: permission denied/);
    expect(d.inserted).toHaveLength(0);
  });

  it('surfaces an insert failure', async () => {
    const d = db();
    d.failOn.kb_documents = 'constraint violation';
    await expect(generateForUser(d, 'key', 'u1', OPTS)).rejects.toThrow(/kb_documents insert/);
  });
});

describe('generateForUser — warnings and degradation', () => {
  it('warns when history is unwritten and when there are no prior reports', async () => {
    const d = db({ kb_documents: [CHARTER_PAGE] });
    const out = await generateForUser(d, 'key', 'u1', OPTS) as { warnings: string[] };
    expect(out.warnings.join(' ')).toMatch(/history page unwritten/);
    expect(out.warnings.join(' ')).toMatch(/baseline report/);
  });

  it('warns when the charter tag matches no quick note', async () => {
    const d = db({ quick_notes: [{ content: 'a note', created_at: '2026-08-17T09:00:00Z', tags: ['other tag'] }] });
    const out = await generateForUser(d, 'key', 'u1', OPTS) as { warnings: string[] };
    expect(out.warnings.join(' ')).toMatch(/matched no quick note/);
  });

  it('still files a report when the model omits the commitments block', async () => {
    vi.stubGlobal('fetch', mockAnthropic('## Focus Hours\nJust a body, no marker.'));
    const d = db();
    const out = await generateForUser(d, 'key', 'u1', OPTS) as { commitments: unknown[] };
    expect(out.commitments).toEqual([]);
    expect(d.inserted.filter((i) => i.table === 'kb_documents')).toHaveLength(1);
  });

  it('flags an unparseable commitments block but keeps the report', async () => {
    vi.stubGlobal('fetch', mockAnthropic('## Focus Hours\nBody.\n---COMMITMENTS---\nnot json'));
    const d = db();
    const out = await generateForUser(d, 'key', 'u1', OPTS) as { warnings: string[] };
    expect(out.warnings.join(' ')).toMatch(/unparseable/);
    expect(d.inserted.filter((i) => i.table === 'kb_documents')).toHaveLength(1);
  });

  it('excludes a prior report that covers the window being generated', async () => {
    const d = db({
      kb_documents: [
        CHARTER_PAGE, HISTORY_PAGE,
        { id: 'same', title: 'same window', content: 'x', source: 'cbo', metadata: { period_date: '2026-08-20' } },
        { id: 'older', title: 'older', content: 'x', source: 'cbo', metadata: { period_date: '2026-07-01' } },
      ],
    });
    const out = await generateForUser(d, 'key', 'u1', { ...OPTS, force: true }) as { prior_reports: number };
    expect(out.prior_reports).toBe(1); // 'older' only
  });
});

// ── HTTP guards ──────────────────────────────────────────────────────────────

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://local/generate-cbo-report', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

describe('handler — request guards', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    process.env.ANTHROPIC_API_KEY = 'key';
    delete process.env.CRON_SECRET;
  });

  it('answers CORS preflight', async () => {
    const r = await handler(new Request('http://local', { method: 'OPTIONS' }));
    expect(r.status).toBe(200);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('rejects a wrong cron secret before doing any work', async () => {
    process.env.CRON_SECRET = 'expected';
    const r = await handler(req({}, { 'x-cron-secret': 'wrong' }));
    expect(r.status).toBe(401);
  });

  it('refuses to run without an Anthropic key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await handler(req({}));
    expect(r.status).toBe(500);
    expect((await r.json()).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it('validates period_end', async () => {
    const r = await handler(req({ period_end: 'Aug 20' }));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/YYYY-MM-DD/);
  });

  it('rejects a non-positive days value', async () => {
    for (const days of [0, -3, 'abc']) {
      const r = await handler(req({ period_end: '2026-08-20', days }));
      expect(r.status).toBe(400);
    }
  });

  it('clamps an absurd days value instead of failing', async () => {
    const r = await handler(req({ period_end: '2026-08-20', days: 99999, user_id: 'u1' }));
    expect((await r.json()).days).toBe(365);
  });
});

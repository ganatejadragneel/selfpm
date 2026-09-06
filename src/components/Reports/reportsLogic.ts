// SEEK-GEN Phase 5 — pure logic behind the CPO Reports tab.
// No React, no Supabase: the grid mapping, the period-input validation, and the
// row a generated report becomes. Unit-tested; the components stay dumb.

import type { KbDocumentRow, ReportCommitment } from './types';
import type { ReportPayload } from './reportPayload';

export const DEFAULT_PERIOD_DAYS = 7;
export const MAX_PERIOD_DAYS = 365;

// ── period input (brief §B4: clamp or block, default back to 7) ──────────────

export interface PeriodValidation {
  valid: boolean;
  days: number;
  /** Inline message shown under the input. null when valid. */
  error: string | null;
}

export function validatePeriodInput(raw: string): PeriodValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, days: DEFAULT_PERIOD_DAYS, error: 'Enter a number of days.' };

  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { valid: false, days: DEFAULT_PERIOD_DAYS, error: 'Days must be a number.' };
  if (!Number.isInteger(n)) return { valid: false, days: DEFAULT_PERIOD_DAYS, error: 'Days must be a whole number.' };
  if (n <= 0) return { valid: false, days: DEFAULT_PERIOD_DAYS, error: 'Days must be at least 1.' };
  if (n > MAX_PERIOD_DAYS) {
    return { valid: false, days: MAX_PERIOD_DAYS, error: `Longest period is ${MAX_PERIOD_DAYS} days.` };
  }
  return { valid: true, days: n, error: null };
}

// ── the grid ─────────────────────────────────────────────────────────────────

export interface ReportGridRow {
  id: string;
  name: string;
  /** Date the report was generated (metadata.generated_at, else created_at). */
  generated: string | null;
  /** The period this report covers (metadata.period_date). */
  period: string | null;
  notes: string;
  commitmentCount: number;
  /** Imported reports predate the commitment contract. */
  imported: boolean;
}

const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function toGridRow(row: KbDocumentRow): ReportGridRow {
  const md = row.metadata ?? {};
  const commitments = Array.isArray(md.commitments) ? (md.commitments as ReportCommitment[]) : [];
  return {
    id: row.id,
    name: row.title || 'Untitled',
    generated: asString(md.generated_at)?.slice(0, 10) ?? asString(row.created_at)?.slice(0, 10) ?? null,
    period: asString(md.period_date),
    notes: asString(md.notes) ?? '',
    commitmentCount: commitments.length,
    imported: !!asString(md.source_file),
  };
}

/**
 * Newest first, by the period the report covers — not by when it was generated.
 * A back-filled report for an old period belongs with its period, not at the top.
 * Undated rows (imported without a parseable date) sort last rather than vanish.
 */
export function toGridRows(rows: KbDocumentRow[]): ReportGridRow[] {
  return rows
    .map(toGridRow)
    .sort((a, b) => {
      if (a.period && b.period) return a.period === b.period ? a.name.localeCompare(b.name) : b.period.localeCompare(a.period);
      if (a.period) return -1;
      if (b.period) return 1;
      return a.name.localeCompare(b.name);
    });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-08-17" → "Aug 17, 2026". Passes through anything unparseable. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

// ── the row a generated report becomes ───────────────────────────────────────

const TITLE_MONTHS = MONTHS;

/** Default report name, brief §B5: `CPO Report — {period date}`. */
export function reportTitle(periodDate: string): string {
  const [, m, d] = periodDate.split('-').map(Number);
  return `CPO Report — ${TITLE_MONTHS[(m || 1) - 1]} ${d || 1}`;
}

export interface DocumentRowInput {
  uid: string;
  folderId: string;
  body: string;
  payload: Pick<ReportPayload, 'periodStart' | 'periodEnd' | 'periodDate'>;
  commitments: ReportCommitment[];
  model: string;
  generatedAt: string;
}

/**
 * MIRRORS `supabase/functions/generate-cbo-report/index.ts::buildDocumentRow`.
 * Local generation (dev) writes from the browser; production writes from the edge
 * function — both must produce an identical row. `_tests/parity.test.ts` asserts it.
 */
export function buildDocumentRow(i: DocumentRowInput) {
  return {
    new_user_id: i.uid,
    folder_id: i.folderId,
    title: reportTitle(i.payload.periodDate),
    content: i.body,
    source: 'cbo',
    display_order: 0,
    metadata: {
      period_start: i.payload.periodStart,
      period_end: i.payload.periodEnd,
      period_date: i.payload.periodDate,
      model: i.model,
      generated_at: i.generatedAt,
      commitments: i.commitments,
      report_type: 'cbo',
      notes: '',
    },
  };
}

/**
 * Today in the SEEKER'S timezone, not UTC. Generating at 11pm local must not
 * roll the window forward a day, which `toISOString()` would do west of UTC.
 */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Window end/start for "the last N days", ending today. */
export function periodWindow(days: number, today: string): { periodStart: string; periodEnd: string } {
  const [y, m, d] = today.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { periodStart: start.toISOString().slice(0, 10), periodEnd: today };
}

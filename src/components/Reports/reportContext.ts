// SEEK-GEN Phase 0 — resolve the generation context: prior reports, the curated
// history Page, and the charter.
//
// Everything above the "I/O" banner is pure and unit-tested. The Supabase reads
// below it are a thin shell, mirroring the split in Focus/focusDataStore.ts.

import { parseCharter, DEFAULT_CHARTER } from '../Focus/charterConfig';
import type { CharterConfig } from '../Focus/charterConfig';
import type { KbDocumentRow, PriorReport, ReportCommitment, ReportContext } from './types';

export const DEFAULT_PRIOR_DEPTH = 4;

// ── pure ─────────────────────────────────────────────────────────────────────

const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * The date a prior report is positioned by: the end of its period when known,
 * else its period date. Imported historical reports carry only `period_date`.
 * Returns null when neither is a usable ISO date — such a row can't be placed
 * in a continuity sequence, so it is skipped rather than guessed at.
 */
export function priorReportDate(metadata: Record<string, unknown> | null | undefined): string | null {
  const end = metadata?.period_end;
  if (isIsoDate(end)) return end;
  const date = metadata?.period_date;
  if (isIsoDate(date)) return date;
  return null;
}

/**
 * Read `metadata.commitments`. Tolerant by design: the 43 imported reports
 * predate the field entirely, and a malformed entry must never break generation
 * — a missing commitment degrades the continuity section, a thrown error kills
 * the whole report.
 */
export function parseCommitments(metadata: Record<string, unknown> | null | undefined): ReportCommitment[] {
  const raw = metadata?.commitments;
  if (!Array.isArray(raw)) return [];

  const out: ReportCommitment[] = [];
  raw.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') return;
    const e = entry as Record<string, unknown>;
    const text = typeof e.text === 'string' ? e.text.trim() : '';
    if (!text) return; // a commitment with no text is not a commitment
    out.push({
      id: typeof e.id === 'string' && e.id.trim() ? e.id.trim() : `c${i + 1}`,
      text,
      ...(typeof e.measure === 'string' && e.measure.trim() ? { measure: e.measure.trim() } : {}),
    });
  });
  return out;
}

export function toPriorReport(row: KbDocumentRow, periodDate: string): PriorReport {
  return {
    id: row.id,
    title: row.title,
    periodDate,
    commitments: parseCommitments(row.metadata),
    content: row.content ?? '',
  };
}

/**
 * Pick the reports that precede the window being generated, newest first.
 *
 * A report qualifies only if it closed BEFORE `periodStart`. A report whose
 * period ends inside the new window covers the same days we're about to analyze
 * — feeding it back would have the model assess commitments it made about the
 * very period under review.
 */
export function selectPriorReports(
  rows: KbDocumentRow[],
  periodStart: string,
  depth: number = DEFAULT_PRIOR_DEPTH,
): PriorReport[] {
  if (depth <= 0) return [];

  return rows
    .map((row) => ({ row, date: priorReportDate(row.metadata) }))
    .filter((x): x is { row: KbDocumentRow; date: string } => x.date !== null)
    .filter((x) => x.date < periodStart)
    // ISO dates sort lexicographically; id breaks ties so the order is stable
    // when two reports share a date (Jun 18 has both a CBO and a landmark report).
    .sort((a, b) => (a.date === b.date ? a.row.id.localeCompare(b.row.id) : b.date.localeCompare(a.date)))
    .slice(0, depth)
    .map((x) => toPriorReport(x.row, x.date));
}

/**
 * The seed text every new user's History Page ships with. Present verbatim, it
 * means the seeker hasn't written their history yet — so the generator should
 * see null rather than feed the model a description of what the page is for.
 */
const HISTORY_SEED_MARKER = 'the prose the weekly report reads for long-range continuity';

export function resolveHistory(content: string | null | undefined): string | null {
  const trimmed = (content ?? '').trim();
  if (!trimmed) return null;
  // Seed = the marker sentence and little else. Once real history is written
  // around it, the page is no longer seed and is passed through.
  if (trimmed.includes(HISTORY_SEED_MARKER) && trimmed.length < 400) return null;
  return trimmed;
}

export interface BuildContextInput {
  reportRows: KbDocumentRow[];
  historyContent?: string | null;
  charterContent?: string | null;
  periodStart: string;
  depth?: number;
}

export function buildReportContext({
  reportRows,
  historyContent,
  charterContent,
  periodStart,
  depth = DEFAULT_PRIOR_DEPTH,
}: BuildContextInput): ReportContext {
  return {
    priorReports: selectPriorReports(reportRows, periodStart, depth),
    history: resolveHistory(historyContent),
    charter: charterContent ? parseCharter(charterContent) : DEFAULT_CHARTER,
  };
}

// ── I/O ──────────────────────────────────────────────────────────────────────

/** Minimal shape of the Supabase client calls used below (client or admin). */
export interface ContextFetchDeps {
  /** All `source='cbo'` docs in the seeker's CPO Reports folder. */
  fetchReportRows: () => Promise<KbDocumentRow[]>;
  /** Content of the Page with `metadata.role = 'history'`. */
  fetchHistory: () => Promise<string | null>;
  /** Content of the Page with `metadata.role = 'charter'`. */
  fetchCharter: () => Promise<string | null>;
}

/**
 * Fetch + assemble. Kept dependency-injected so the CLI (service role) and the
 * browser (RLS session) can supply their own queries without this module
 * importing a Supabase client.
 */
export async function fetchReportContext(
  deps: ContextFetchDeps,
  periodStart: string,
  depth: number = DEFAULT_PRIOR_DEPTH,
): Promise<ReportContext> {
  const [reportRows, historyContent, charterContent] = await Promise.all([
    deps.fetchReportRows(),
    deps.fetchHistory(),
    deps.fetchCharter(),
  ]);
  return buildReportContext({ reportRows, historyContent, charterContent, periodStart, depth });
}

export type { CharterConfig };

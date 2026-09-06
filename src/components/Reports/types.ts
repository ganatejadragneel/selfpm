// SEEK-GEN (CPO report self-generation) — shared contracts.
// See docs/01-features/cpo-self-generation/plan.md.

import type { CharterConfig } from '../Focus/charterConfig';

/**
 * A change the report asked the seeker to make.
 *
 * This is the continuity contract. Each generated report extracts its own
 * commitments into `kb_documents.metadata.commitments`; the NEXT report reads
 * that structured list and assesses each item directly, instead of re-inferring
 * "what did you agree to last time" from prior prose on every run.
 */
export interface ReportCommitment {
  /** Stable within its own report: 'c1', 'c2'. */
  id: string;
  /** The commitment itself: "Move focus hours out of the 3:30am window". */
  text: string;
  /** An observable check: "focus hours logged before 11am". */
  measure?: string;
}

/** What the continuity-diff receives about each prior report. */
export interface PriorReport {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD) — the end of the period this report covered. */
  periodDate: string;
  /** Empty for the 43 historical reports imported before commitments existed. */
  commitments: ReportCommitment[];
  content: string;
}

/** Everything the generator needs that is NOT this period's behavioral data. */
export interface ReportContext {
  /** Newest first, capped at the requested depth. */
  priorReports: PriorReport[];
  /** The curated history Page, or null when absent/blank/still seed text. */
  history: string | null;
  charter: CharterConfig;
}

/** The `kb_documents` columns this feature reads. */
export interface KbDocumentRow {
  id: string;
  title: string;
  content: string;
  source: string;
  metadata: Record<string, unknown> | null;
  created_at?: string;
}

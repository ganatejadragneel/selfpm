// Node-only Anthropic call for SEEK-GEN (Phase 2). Imported by the report CLI
// and, later, the Vite dev middleware. Never imported by client code.
//
// Reuses callClaude/MODELS from server/focus.ts — one Anthropic seam for the app.

import { callClaude, MODELS, type ModelId } from './focus';
import { buildReportMessages, splitReportOutput } from '../components/Reports/reportPrompt';
import type { ReportContext, ReportCommitment } from '../components/Reports/types';
import type { ReportPayload } from '../components/Reports/reportPayload';

/** Reports run long — his own reports are 5–20k tokens of prose. */
export const REPORT_MAX_TOKENS = 8000;

export interface GenerateReportResult {
  body: string;
  commitments: ReportCommitment[];
  commitmentParseFailed: boolean;
  model: ModelId;
  modelUsed: string;
  usage: { input_tokens: number; output_tokens: number };
  ms: number;
  /** Kept so the eval harness can diff prompt changes against output changes. */
  promptChars: number;
}

export async function generateReport(opts: {
  payload: ReportPayload;
  context: ReportContext;
  model?: ModelId;
  apiKey?: string;
  maxTokens?: number;
}): Promise<GenerateReportResult> {
  const { payload, context, model = 'sonnet', apiKey, maxTokens = REPORT_MAX_TOKENS } = opts;
  const { system, user } = buildReportMessages(payload, context);

  const r = await callClaude({ system, user, model, maxTokens, apiKey });
  const split = splitReportOutput(r.text);

  return {
    ...split,
    model,
    modelUsed: r.modelUsed,
    usage: r.usage,
    ms: r.ms,
    promptChars: system.length + user.length,
  };
}

export { MODELS };
export type { ModelId };

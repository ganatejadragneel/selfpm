/**
 * SEEK-GEN Phase 0 — print the generation context for a period.
 *
 *   npm run report:context -- <period-end> [days] [depth]
 *   npm run report:context -- 2026-08-20          # 7-day window, 4 prior reports
 *   npm run report:context -- 2026-01-15 7 4
 *
 * Reads only. Shows exactly which prior reports would be fed to the model, and
 * whether the curated history page has been written yet.
 */

import { fetchReportContext, DEFAULT_PRIOR_DEPTH } from '../../src/components/Reports/reportContext';
import type { KbDocumentRow } from '../../src/components/Reports/types';
import { signInAsSeeker, shiftIsoDate, assertIsoDate } from '../lib/seekerClient';

async function main() {
  const [endArg, daysArg, depthArg] = process.argv.slice(2);
  if (!endArg) {
    console.error('Usage: npm run report:context -- <period-end YYYY-MM-DD> [days] [depth]');
    process.exit(1);
  }
  const periodEnd = assertIsoDate(endArg, 'period-end');
  const days = daysArg ? Number(daysArg) : 7;
  const depth = depthArg ? Number(depthArg) : DEFAULT_PRIOR_DEPTH;
  if (!Number.isFinite(days) || days <= 0) throw new Error(`days must be a positive number, got "${daysArg}"`);
  const periodStart = shiftIsoDate(periodEnd, -(days - 1));

  const { supabase, userId } = await signInAsSeeker();

  // Resolve the seeker's reserved folders once (role lives in metadata.role).
  const { data: folders, error: fErr } = await supabase
    .from('kb_folders')
    .select('id, name, metadata')
    .eq('new_user_id', userId);
  if (fErr) throw new Error(`kb_folders read failed: ${fErr.message}`);

  const cpoFolder = (folders ?? []).find((f) => (f.metadata as { role?: string } | null)?.role === 'cpo_reports');
  const systemFolder = (folders ?? []).find((f) => (f.metadata as { role?: string } | null)?.role === 'system');

  const pageByRole = async (role: 'history' | 'charter'): Promise<string | null> => {
    if (!systemFolder) return null;
    const { data } = await supabase
      .from('kb_documents')
      .select('content, metadata')
      .eq('new_user_id', userId)
      .eq('folder_id', systemFolder.id);
    const hit = (data ?? []).find((d) => (d.metadata as { role?: string } | null)?.role === role);
    return hit?.content ?? null;
  };

  const ctx = await fetchReportContext(
    {
      fetchReportRows: async () => {
        if (!cpoFolder) return [];
        const { data, error } = await supabase
          .from('kb_documents')
          .select('id, title, content, source, metadata, created_at')
          .eq('new_user_id', userId)
          .eq('folder_id', cpoFolder.id)
          .eq('source', 'cbo');
        if (error) throw new Error(`kb_documents read failed: ${error.message}`);
        return (data ?? []) as KbDocumentRow[];
      },
      fetchHistory: () => pageByRole('history'),
      fetchCharter: () => pageByRole('charter'),
    },
    periodStart,
    depth,
  );

  console.log(`\nPeriod:  ${periodStart} → ${periodEnd}  (${days} days)`);
  console.log(`Depth:   ${depth} prior reports\n`);

  console.log(`Prior reports fed to the model (${ctx.priorReports.length}):`);
  if (ctx.priorReports.length === 0) {
    console.log('  (none — this would generate as a baseline / first report)');
  }
  for (const r of ctx.priorReports) {
    const commits = r.commitments.length
      ? `${r.commitments.length} commitment(s)`
      : 'no commitments (imported / pre-contract)';
    console.log(`  · ${r.periodDate}  ${r.title.slice(0, 62).padEnd(62)} ${commits}`);
    for (const c of r.commitments) console.log(`      - [${c.id}] ${c.text}${c.measure ? `  (${c.measure})` : ''}`);
  }

  console.log(`\nHistory page: ${ctx.history ? `${ctx.history.length} chars` : 'NOT WRITTEN (seed or empty) — no longitudinal context'}`);
  console.log(
    `Charter:      ore="${ctx.charter.focusOreName}" goal=${ctx.charter.weeklyAverageGoal} unit=${ctx.charter.unit} tag="${ctx.charter.notesTag}"\n`,
  );
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});

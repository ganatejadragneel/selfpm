/**
 * SEEK-GEN — continuity loop test.
 *
 *   npm run report:continuity -- <A-start> <A-end> <B-start> <B-end> [model]
 *   npm run report:continuity -- 2026-08-07 2026-08-13 2026-08-14 2026-08-20
 *
 * Generates report A, then generates report B with A injected as its most recent
 * prior report — carrying A's extracted `commitments` forward as the structured
 * contract B must grade.
 *
 * This is the only way to exercise the commitment contract before Phase 4, since
 * every report currently in the database predates the field and carries `[]`.
 * Writes to out/ only; nothing touches the database.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateReport, type ModelId } from '../../src/server/report';
import type { PriorReport } from '../../src/components/Reports/types';
import { signInAsSeeker, assertIsoDate, envValue } from '../lib/seekerClient';
import { gather } from '../../src/components/Reports/reportsGather';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'out', 'reports');

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const [aStart, aEnd, bStart, bEnd, modelArg] = args;
  if (!aStart || !aEnd || !bStart || !bEnd) {
    console.error('Usage: npm run report:continuity -- <A-start> <A-end> <B-start> <B-end> [model]');
    process.exit(1);
  }
  [aStart, aEnd, bStart, bEnd].forEach((d, i) => assertIsoDate(d, `arg ${i + 1}`));
  const model = (modelArg ?? 'sonnet') as ModelId;
  const apiKey = envValue(['ANTHROPIC_API_KEY']);

  const { supabase, userId } = await signInAsSeeker();
  mkdirSync(OUT, { recursive: true });

  // ── Report A ──────────────────────────────────────────────────────────────
  console.log(`\n━━ A: ${aStart} → ${aEnd} ━━`);
  const a = await gather(supabase, userId, aStart, aEnd);
  console.log(`   focus ${a.payload.focus.total} · notes ${a.payload.notes.length} · priors ${a.context.priorReports.length}`);
  const repA = await generateReport({ payload: a.payload, context: a.context, model, apiKey });
  writeFileSync(join(OUT, `continuity_A_${aStart}_${aEnd}.md`), repA.body, 'utf-8');
  console.log(`   ✓ ${repA.body.length} chars, ${repA.commitments.length} commitments extracted:`);
  for (const c of repA.commitments) console.log(`     [${c.id}] ${c.text}`);

  if (repA.commitments.length === 0) {
    console.log('\n✗ A produced no commitments — nothing to carry forward. Stopping.');
    process.exit(1);
  }

  // ── Report B, with A injected as the newest prior ─────────────────────────
  console.log(`\n━━ B: ${bStart} → ${bEnd} (with A as prior) ━━`);
  const b = await gather(supabase, userId, bStart, bEnd);

  const injected: PriorReport = {
    id: 'local-A',
    title: `CPO Report — ${aEnd}`,
    periodDate: aEnd,
    commitments: repA.commitments,
    content: repA.body,
  };
  // Newest first, and keep the same depth so the token cost matches production.
  const depth = b.context.priorReports.length || 1;
  const contextB = { ...b.context, priorReports: [injected, ...b.context.priorReports].slice(0, depth) };

  console.log(`   priors: ${contextB.priorReports.map((r) => `${r.periodDate}${r.commitments.length ? `(${r.commitments.length}c)` : ''}`).join(', ')}`);
  const repB = await generateReport({ payload: b.payload, context: contextB, model, apiKey });
  writeFileSync(join(OUT, `continuity_B_${bStart}_${bEnd}.md`), repB.body, 'utf-8');
  console.log(`   ✓ ${repB.body.length} chars, ${repB.commitments.length} commitments extracted`);

  // ── Did the contract actually get graded? ─────────────────────────────────
  // Keyword overlap is a coarse proxy, so the matched sentences are printed for
  // a human to judge — the check flags absence, it does not certify presence.
  const stop = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'every', 'each', 'your', 'you', 'all', 'any', 'log', 'logged', 'day', 'days', 'next', 'period', 'hard', 'stop', 'on', 'in', 'to', 'of', 'a', 'is', 'it']);
  const sentences = repB.body.split(/(?<=[.!?])\s+/);

  console.log(`\n━━ CONTINUITY CHECK ━━`);
  let graded = 0;
  for (const c of repA.commitments) {
    const keys = c.text.toLowerCase().match(/[a-z0-9']+/g)?.filter((w) => w.length > 3 && !stop.has(w)) ?? [];
    const scored = sentences
      .map((s) => ({ s, hits: keys.filter((k) => s.toLowerCase().includes(k)).length }))
      .sort((x, y) => y.hits - x.hits);
    const best = scored[0];
    const ok = best && best.hits >= Math.max(2, Math.ceil(keys.length * 0.3));
    if (ok) graded += 1;
    console.log(`\n  [${c.id}] ${c.text}`);
    console.log(`     ${ok ? '✓ addressed' : '✗ NOT clearly addressed'} (${best?.hits ?? 0}/${keys.length} key terms)`);
    if (best?.hits) console.log(`     → "${best.s.replace(/\s+/g, ' ').trim().slice(0, 260)}"`);
  }
  console.log(`\n  ${graded}/${repA.commitments.length} of A's commitments addressed in B.`);
  console.log(`  Read out/reports/continuity_B_${bStart}_${bEnd}.md to judge whether the grading is real.\n`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});

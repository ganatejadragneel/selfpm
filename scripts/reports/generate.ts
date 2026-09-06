/**
 * SEEK-GEN Phase 2 — generate a report locally and write it to out/.
 *
 *   npm run report:gen -- <period-start> <period-end> [model]
 *   npm run report:gen -- 2026-08-14 2026-08-20
 *   npm run report:gen -- 2026-08-14 2026-08-20 opus
 *
 * Writes NOTHING to the database. The output is a file you read and judge.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateReport, type ModelId } from '../../src/server/report';
import { buildReportMessages } from '../../src/components/Reports/reportPrompt';
import { signInAsSeeker, assertIsoDate, envValue } from '../lib/seekerClient';
import { gather } from '../../src/components/Reports/reportsGather';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const [startArg, endArg, modelArg] = args.filter((a) => !a.startsWith('--'));
  if (!startArg || !endArg) {
    console.error('Usage: npm run report:gen -- <period-start> <period-end> [haiku|sonnet|opus]');
    process.exit(1);
  }
  const periodStart = assertIsoDate(startArg, 'period-start');
  const periodEnd = assertIsoDate(endArg, 'period-end');
  const model = (modelArg ?? 'sonnet') as ModelId;

  const { supabase, userId } = await signInAsSeeker();
  const { payload, context, warnings, priorWindow } = await gather(supabase, userId, periodStart, periodEnd);

  console.log(`\nPeriod:       ${periodStart} → ${periodEnd} (${payload.days} days), files as ${payload.periodDate}`);
  console.log(`Prior window: ${priorWindow.start} → ${priorWindow.end}`);
  console.log(`Focus:        ${payload.focus.total} ${context.charter.unit} · avg ${payload.focus.average} · ${payload.focus.deltaPct === null ? 'no delta' : `${payload.focus.deltaPct}%`}`);
  console.log(`Notes:        ${payload.notes.length} (${payload.notes.filter((n) => n.source === 'quick').length} focus log)`);
  console.log(`Prior reports: ${context.priorReports.length} — ${context.priorReports.map((r) => r.periodDate).join(', ') || 'none'}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);

  const outDirEarly = join(ROOT, 'out', 'reports');
  if (dryRun) {
    // Write the exact prompt that would be sent — lets the assembled context be
    // reviewed without spending a call or needing a credential.
    const { system, user } = buildReportMessages(payload, context);
    mkdirSync(outDirEarly, { recursive: true });
    const p = join(outDirEarly, `prompt_${periodStart}_${periodEnd}.txt`);
    writeFileSync(p, `===== SYSTEM (${system.length} chars) =====\n${system}\n\n===== USER (${user.length} chars) =====\n${user}\n`, 'utf-8');
    console.log(`\n--dry-run: no model call.`);
    console.log(`✓ ${p}`);
    console.log(`  system ${system.length} chars · user ${user.length} chars · ~${Math.round((system.length + user.length) / 4)} input tokens`);
    return;
  }

  // Prefer an explicit key from .env.local; fall back to the signed-in Anthropic
  // profile (which the SDK resolves itself when apiKey is undefined).
  const apiKey = envValue(['ANTHROPIC_API_KEY']);
  console.log(`\nGenerating with ${model} (${apiKey ? 'ANTHROPIC_API_KEY' : 'signed-in profile'})…`);
  const result = await generateReport({ payload, context, model, apiKey });

  const outDir = join(ROOT, 'out', 'reports');
  mkdirSync(outDir, { recursive: true });
  const stem = `report_${periodStart}_${periodEnd}_${model}`;
  const bodyPath = join(outDir, `${stem}.md`);
  const metaPath = join(outDir, `${stem}.json`);

  writeFileSync(bodyPath, result.body, 'utf-8');
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        period_start: periodStart,
        period_end: periodEnd,
        period_date: payload.periodDate,
        model: result.modelUsed,
        commitments: result.commitments,
        commitment_parse_failed: result.commitmentParseFailed,
        usage: result.usage,
        ms: result.ms,
        prompt_chars: result.promptChars,
        prior_reports: context.priorReports.map((r) => ({ periodDate: r.periodDate, title: r.title })),
        warnings,
      },
      null,
      2,
    ),
    'utf-8',
  );

  const cost = (result.usage.input_tokens / 1e6) * 3 + (result.usage.output_tokens / 1e6) * 15; // Sonnet list price
  console.log(`\n✓ ${bodyPath}`);
  console.log(`  ${result.body.length} chars · ${result.usage.input_tokens} in / ${result.usage.output_tokens} out tokens · ${(result.ms / 1000).toFixed(1)}s · ~$${cost.toFixed(3)}`);
  if (result.commitmentParseFailed) console.log('  ⚠ commitments block was present but unparseable — report body is intact');
  console.log(`\nCommitments extracted (${result.commitments.length}):`);
  for (const c of result.commitments) console.log(`  [${c.id}] ${c.text}${c.measure ? `\n        measure: ${c.measure}` : ''}`);
  console.log();
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});

/**
 * SEEK-GEN Phase 1 — print the assembled behavioral payload for a period.
 *
 *   npm run report:payload -- <period-start> <period-end>
 *   npm run report:payload -- 2026-08-14 2026-08-20
 *
 * Reads only. Use it to spot-check focus hours against what the Dashboard shows
 * for the same dates — they must match exactly. Shares `gather()` with
 * report:gen so what you inspect here is exactly what the model is fed.
 */

import { signInAsSeeker, assertIsoDate } from '../lib/seekerClient';
import { gather } from '../../src/components/Reports/reportsGather';

async function main() {
  const [startArg, endArg] = process.argv.slice(2);
  if (!startArg || !endArg) {
    console.error('Usage: npm run report:payload -- <period-start YYYY-MM-DD> <period-end YYYY-MM-DD>');
    process.exit(1);
  }
  const periodStart = assertIsoDate(startArg, 'period-start');
  const periodEnd = assertIsoDate(endArg, 'period-end');
  if (periodStart > periodEnd) throw new Error('period-start must not be after period-end');

  const { supabase, userId } = await signInAsSeeker();
  const { payload, context, warnings, priorWindow } = await gather(supabase, userId, periodStart, periodEnd);
  const { charter } = context;
  const f = payload.focus;

  console.log(`\nPeriod:       ${payload.periodStart} → ${payload.periodEnd}  (${payload.days} days)`);
  console.log(`Files as:     ${payload.periodDate}  (median day)`);
  console.log(`Prior window: ${priorWindow.start} → ${priorWindow.end}\n`);

  console.log(`FOCUS — ${charter.focusOreName} (goal ${f.goal} ${charter.unit}/day)`);
  console.log(`  total ${f.total} ${charter.unit} · avg ${f.average}/day · prior ${f.priorTotal ?? 'n/a'} · delta ${f.deltaPct === null ? 'incomparable' : `${f.deltaPct > 0 ? '+' : ''}${f.deltaPct}%`}`);
  console.log('  per day: ' + f.days.map((d) => `${d.date.slice(5)}=${d.logged ? d.value : '–'}`).join('  '));

  console.log(`\nADHERENCE — ${payload.adherence.done}/${payload.adherence.attempted} (${payload.adherence.pct}%)` +
    `${payload.adherence.deltaPct === null ? ' · no prior comparison' : ` · ${payload.adherence.deltaPct > 0 ? '+' : ''}${payload.adherence.deltaPct}pp vs prior`}`);

  console.log(`\nORES (${payload.ores.length}):`);
  for (const o of payload.ores) {
    console.log(`  ${o.isFocusOre ? '★' : ' '} ${o.name.slice(0, 34).padEnd(34)} logged ${String(o.daysLogged).padStart(2)}/${o.daysInWindow}  total ${o.total ?? '—(non-numeric)'}`);
  }

  const oreNotes = payload.notes.filter((n) => n.source === 'ore').length;
  console.log(`\nNOTES (${payload.notes.length} — ${oreNotes} ORE, ${payload.notes.length - oreNotes} quick):`);
  for (const n of payload.notes) {
    console.log(`  ${n.date}  [${n.label.slice(0, 20)}] ${n.text.replace(/\s+/g, ' ').slice(0, 88)}`);
  }

  console.log(`\nCONTEXT — ${context.priorReports.length} prior report(s), history ${context.history ? `${context.history.length} chars` : 'UNWRITTEN'}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log();
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});

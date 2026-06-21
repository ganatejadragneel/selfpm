// Model-selection harness (build step 6).
// Runs BOTH prompts through ALL three models on the same sample day, then prints
// a side-by-side comparison (output tokens, latency, est. cost) and writes the
// full texts to scripts/focus/out/comparison.md for review.
//
//   npm run focus:compare

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { generateFocusBox, type ModelId } from '../../src/server/focus';
import type { FocusBox } from '../../src/components/Focus/prompts';

function loadEnvLocal() {
  try {
    const txt = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
    for (const line of txt.split('\n')) {
      const mm = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (mm && !process.env[mm[1]]) process.env[mm[1]] = mm[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* rely on ambient env */
  }
}
loadEnvLocal();

// Approximate Anthropic list prices, USD per 1M tokens. EDIT to match your plan.
const PRICING: Record<ModelId, { in: number; out: number }> = {
  haiku: { in: 1, out: 5 },
  sonnet: { in: 3, out: 15 },
  opus: { in: 15, out: 75 },
};

const BOXES: FocusBox[] = ['analysis', 'todays-focus'];
const MODELS_ORDER: ModelId[] = ['haiku', 'sonnet', 'opus'];

const apiKey = process.env.ANTHROPIC_API_KEY || '';
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY is not set. Paste it into .env.local.');
  process.exit(1);
}

function cost(model: ModelId, inTok: number, outTok: number): number {
  const p = PRICING[model];
  return (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
}

console.log('Running 6 generations (2 prompts × 3 models)…\n');

// One flat list of jobs, run concurrently.
const jobs = BOXES.flatMap((box) => MODELS_ORDER.map((model) => ({ box, model })));
const results = await Promise.all(
  jobs.map(async (j) => {
    const r = await generateFocusBox({ box: j.box, model: j.model, apiKey });
    return { ...j, ...r, estCost: cost(j.model, r.usage.input_tokens, r.usage.output_tokens) };
  })
);

// ── Terminal summary table, grouped by box ──
const mdParts: string[] = ['# Focus model comparison\n', '_Same sample day, identical prompt per box._\n'];

for (const box of BOXES) {
  console.log(`\n══════ ${box.toUpperCase()} ══════`);
  console.log('model   out_tok  latency   est_cost');
  console.log('──────  ───────  ───────   ────────');
  mdParts.push(`\n## ${box}\n`);

  for (const model of MODELS_ORDER) {
    const r = results.find((x) => x.box === box && x.model === model)!;
    console.log(
      `${model.padEnd(6)}  ${String(r.usage.output_tokens).padStart(7)}  ${(r.ms / 1000).toFixed(1).padStart(5)}s   $${r.estCost.toFixed(5)}`
    );
    mdParts.push(
      `### ${model} — ${r.usage.output_tokens} out tok · ${(r.ms / 1000).toFixed(1)}s · ~$${r.estCost.toFixed(5)}\n\n${r.text}\n`
    );
  }
}

const totalCost = results.reduce((s, r) => s + r.estCost, 0);
console.log(`\nTotal est. cost for this run: $${totalCost.toFixed(5)}`);

const outDir = new URL('./out/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const outFile = new URL('./out/comparison.md', import.meta.url);
writeFileSync(outFile, mdParts.join('\n'));
console.log(`\nFull side-by-side written to scripts/focus/out/comparison.md`);

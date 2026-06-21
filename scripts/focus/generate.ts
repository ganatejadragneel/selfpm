// CLI runner for the Focus prompts (build step 4/5; seeds steps 6–7).
//   npm run focus:gen -- analysis sonnet
//   npm run focus:gen -- todays-focus opus
// Reads the key from .env.local. This is the backbone the model-selection
// harness + golden eval will reuse.

import { readFileSync } from 'node:fs';
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
    /* no .env.local — rely on ambient env */
  }
}

loadEnvLocal();

const box = (process.argv[2] as FocusBox) || 'analysis';
const model = (process.argv[3] as ModelId) || 'sonnet';
const apiKey = process.env.ANTHROPIC_API_KEY || '';

if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY is not set. Paste it into .env.local.');
  process.exit(1);
}

const r = await generateFocusBox({ box, model, apiKey });
console.log(
  `\n── [${r.box}] via ${r.modelUsed} · ${r.usage.output_tokens} out tok · ${(r.ms / 1000).toFixed(1)}s ──\n`
);
console.log(r.text + '\n');

// Golden eval (build step 7).
// For each box × model: generate the candidate, then have a judge model score it
// AGAINST your golden answer on a 5-point rubric. Prints a scorecard and writes
// the full rationale to scripts/focus/out/eval.md.
//
//   npm run focus:eval
//
// Edit the golden answers in scripts/focus/golden/*.md first — they are the
// standard everything is measured against.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { generateFocusBox, callClaude, type ModelId } from '../../src/server/focus';
import { buildSamplePayload } from '../../src/components/Focus/payload';
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

const apiKey = process.env.ANTHROPIC_API_KEY || '';
if (!apiKey) {
  console.error('✗ ANTHROPIC_API_KEY is not set. Paste it into .env.local.');
  process.exit(1);
}

const JUDGE_MODEL: ModelId = 'sonnet'; // a strong, neutral grader; switch to 'opus' for a stricter pass
const MODELS_ORDER: ModelId[] = ['haiku', 'sonnet', 'opus'];
const BOXES: FocusBox[] = ['analysis', 'todays-focus'];
const DIMS = ['faithful', 'moves', 'actionable', 'voice', 'concision'] as const;
type Dim = (typeof DIMS)[number];

const RUBRIC: Record<FocusBox, string> = {
  analysis: `- faithful: every claim is grounded in the day's data (a time, count, duration, or the note). No invented wanders or facts.
- moves: covers the analytical moves — names the win, the dead zone + its cause, the specific barrier AND enabler, and the distraction theme from the focus log.
- actionable: surfaces a concrete lever, not vague "be more disciplined".
- voice: honest and non-judgmental, second person, the seeker's register. Names the loss as data, then pivots.
- concision: tight, no run-on sentences or filler; ~3–5 sentences.`,
  'todays-focus': `- faithful: derived from YESTERDAY's specific evidence, not generic advice true on any day.
- moves: extracts a concrete protocol (a time, a hard stop, a defined first move) and prioritizes to 1–2 things, tied to the north-star.
- actionable: a person could do exactly this today without re-interpreting it.
- voice: second person, the seeker's register, direct.
- concision: 2–4 sentences, no padding.`,
};

function factsBlock(): string {
  const p = buildSamplePayload();
  return [
    `North-star: hold ${p.goal} ${p.unit}/day (rolling 7-day average).`,
    `Yesterday (${p.yesterday.dateLabel}): ${p.yesterday.hours} ${p.unit}.`,
    `Note: ${p.yesterday.note ?? '(none)'}`,
    `Focus log: ${p.focusLog.join(' ') || '(none)'}`,
    `Week so far: ${p.weekTotal} ${p.unit} total, ${p.weekAverage} ${p.unit}/day. Raw target today: ${p.targetToday} ${p.unit}.`,
  ].join('\n');
}

function judgePrompt(box: FocusBox, golden: string, candidate: string): string {
  return `You are a strict evaluator. Score the CANDIDATE answer for the "${box}" box against the GOLDEN answer and the SOURCE DATA, on a 1–5 scale per dimension (5 = matches or beats golden; 1 = poor).

SOURCE DATA:
${factsBlock()}

RUBRIC (${box}):
${RUBRIC[box]}

GOLDEN (the standard):
${golden}

CANDIDATE (to score):
${candidate}

Respond with ONLY a JSON object, no prose, no code fences:
{"faithful":N,"moves":N,"actionable":N,"voice":N,"concision":N,"note":"one short sentence on the biggest gap vs golden"}`;
}

interface Score extends Record<Dim, number> {
  note: string;
  total: number;
}

function parseScore(text: string): Score {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const obj = JSON.parse(cleaned);
  const s = { faithful: 0, moves: 0, actionable: 0, voice: 0, concision: 0, note: obj.note ?? '', total: 0 } as Score;
  for (const d of DIMS) s[d] = Number(obj[d]) || 0;
  s.total = DIMS.reduce((a, d) => a + s[d], 0);
  return s;
}

console.log(`Generating candidates + judging with ${JUDGE_MODEL}…\n`);

const golden: Record<FocusBox, string> = {
  analysis: readFileSync(new URL('./golden/analysis.md', import.meta.url), 'utf8').trim(),
  'todays-focus': readFileSync(new URL('./golden/todays-focus.md', import.meta.url), 'utf8').trim(),
};

const rows = await Promise.all(
  BOXES.flatMap((box) =>
    MODELS_ORDER.map(async (model) => {
      const gen = await generateFocusBox({ box, model, apiKey });
      const judged = await callClaude({
        user: judgePrompt(box, golden[box], gen.text),
        model: JUDGE_MODEL,
        maxTokens: 300,
        apiKey,
      });
      let score: Score;
      try {
        score = parseScore(judged.text);
      } catch {
        score = { faithful: 0, moves: 0, actionable: 0, voice: 0, concision: 0, note: 'parse failed: ' + judged.text.slice(0, 80), total: 0 };
      }
      return { box, model, text: gen.text, score };
    })
  )
);

const md: string[] = ['# Focus golden eval\n', `_Judge: ${JUDGE_MODEL}. Scores are 1–5 per dimension (25 max)._\n`];

for (const box of BOXES) {
  console.log(`\n══════ ${box.toUpperCase()} ══════`);
  console.log('model   faith moves  act  voice  conc   TOTAL');
  console.log('──────  ───── ─────  ───  ─────  ────   ─────');
  md.push(`\n## ${box}\n`);
  const ranked = rows.filter((r) => r.box === box).sort((a, b) => b.score.total - a.score.total);
  for (const r of ranked) {
    const s = r.score;
    console.log(
      `${r.model.padEnd(6)}  ${pad(s.faithful)} ${pad(s.moves)}  ${pad(s.actionable)}  ${pad(s.voice)}  ${pad(s.concision)}   ${String(s.total).padStart(2)}/25`
    );
    md.push(`### ${r.model} — ${s.total}/25\n\n- faithful ${s.faithful} · moves ${s.moves} · actionable ${s.actionable} · voice ${s.voice} · concision ${s.concision}\n- Judge note: ${s.note}\n\n> ${r.text}\n`);
  }
  const winner = ranked[0];
  console.log(`→ winner: ${winner.model} (${winner.score.total}/25)`);
}

function pad(n: number): string {
  return String(n).padStart(5).slice(0, 5).padStart(5);
}

mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/eval.md', import.meta.url), md.join('\n'));
console.log(`\nFull rationale written to scripts/focus/out/eval.md`);

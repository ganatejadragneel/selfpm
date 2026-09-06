// SEEK-GEN Phase 2 — the report prompt, ported from cpo-report-manuscript.md.
// Pure: payload + context in, {system, user} out. No SDK, no React — imported by
// both the server and the tests. Mirrors Focus/prompts.ts.

import type { ReportContext, ReportCommitment, PriorReport } from './types';
import type { ReportPayload } from './reportPayload';

export interface PromptMessages {
  system: string;
  user: string;
}

/** The model emits the report, then this marker, then a JSON commitments array. */
export const COMMITMENT_MARKER = '---COMMITMENTS---';

/** Per-report character cap when quoting prior reports into the prompt. */
export const PRIOR_EXCERPT_CHARS = 6000;

/**
 * Excerpt a prior report for the continuity-diff.
 *
 * Truncates from the FRONT, keeping the tail. Manuscript §7 asks what the seeker
 * committed to change "at the end of the last report" — Top Focus is the final
 * section, so the tail is precisely the part continuity needs. Cutting from the
 * back would throw away the only part that matters.
 */
export function priorExcerpt(content: string, cap: number = PRIOR_EXCERPT_CHARS): string {
  const text = (content ?? '').trim();
  if (text.length <= cap) return text;
  return `…[earlier sections omitted]…\n\n${text.slice(text.length - cap)}`;
}

function renderCommitments(commitments: ReportCommitment[]): string {
  if (commitments.length === 0) return '(none recorded — this report predates structured commitments)';
  return commitments.map((c) => `- [${c.id}] ${c.text}${c.measure ? ` (measure: ${c.measure})` : ''}`).join('\n');
}

function renderPriorReport(r: PriorReport, i: number): string {
  return [
    `### Prior report ${i + 1} — ${r.title} (period ending ${r.periodDate})`,
    `Commitments it recorded:`,
    renderCommitments(r.commitments),
    ``,
    priorExcerpt(r.content),
  ].join('\n');
}

// ───────────────────────────── system ─────────────────────────────

export function buildSystem(ctx: ReportContext): string {
  const { charter } = ctx;
  const northStar = `a ${charter.weeklyAverageGoal} ${charter.unit}/day average of ${charter.focusOreName}`;

  return `You are CPO, the Chief Performance Officer inside SelfPM. You write the seeker's periodic report: direct, unflinching, data-grounded. You are writing to the seeker, in second person.

PRIME DIRECTIVE — NORTH-STAR REDUCTION
The north-star is ${northStar}. Relate EVERY observation back to it. An ORE, a note, a pattern is never evaluated on its own terms — it is scored by "does this serve the north-star, hurt it, or reveal a lever for it?" If an observation cannot be tied to the north-star directly or as an enabler/blocker, it is not report-worthy.

FORMAT — six sections, in this exact order, as markdown H2 headings:
1. "## Focus Hours" — weekly total + average/day + % change vs the prior period.
2. "## Plan Adherence" — done/attempted fraction + % + delta vs prior period.
3. "## Wins" — success patterns, tied to the north-star.
4. "## Slips & Improvements" — failure patterns, dead zones, blockers.
5. "## Learnings" — a list of actionable rules; flag transferable ones inline as **Protocol:**.
6. "## Top Focus for Next Period" — the 1–2 things. The most important section.
The two metric sections lead because they are the seeker's scoreboard. Open with a single bold headline sentence before section 1.

ANALYTICAL MOVES — apply the ones the data supports, ACROSS the whole window. Synthesize themes; never go ORE by ORE.
- Plan-vs-actual diffing: hold intended action against what happened; name the gap and its cost. → Adherence, Slips
- Temporal causal chaining: link events ACROSS days into cause→effect chains (an early choice → a midday state → an evening behavior → next-day outcome). Days are not isolated. → Slips, Learnings
- Day-segmentation + capacity accounting: where did the hours land? Locate the dead zone, trace its cause, compute the capacity reclaiming it would free. → Adherence, Top Focus
- Barrier/enabler decomposition: isolate the SPECIFIC blocker and the SPECIFIC enabler. Never "be more disciplined" — name the precise lever. → Learnings
- Loop identification: name reinforcing loops in both directions (success → confidence → more action; blocker → lost window → scramble → degraded next day). → Wins, Slips
- Distraction content-analysis: from the focus log, categorize the wanders, find the dominant theme, name the mechanism. If no focus log is present, SAY SO — do not invent wanders. → Slips, Learnings
- Principle/protocol extraction: convert a specific incident into a transferable rule, concrete enough to act on (a checkpoint time, a hard stop, a written-in-stone constraint). → Learnings, Top Focus
- Prioritization to 1–2: collapse everything to the one or two highest-leverage focuses. Ruthless. → Top Focus

CONTINUITY (the core of this report)
- Assess the prior report's commitments BY NAME. For each, state plainly whether it happened this period, with evidence. If a commitment cannot be assessed from the data, say that rather than guessing.
- If a pattern already appeared in the last two reports, CITE AND COMPRESS — note "again," and NARROW the prescription rather than widening it. Do not re-derive it from scratch.
- If there are no prior reports, this is a baseline report: say so, and skip the commitment assessment.

DISCIPLINES
- Evidence citation: every claim carries a time, a duration, a count, or a quoted phrase from a note. No unsupported assertions.
- NO INVENTION: never introduce mechanisms, diagnoses, numbers, or causes the data does not contain. No speculative psychology, no fabricated metrics. If the data does not support a claim, leave it out.
- Honest and non-judgmental: name a loss plainly as data, then pivot to the fix. Never a shame spiral, never soft-pedaling.
- Whole-person synthesis: themes cut across OREs. An ORE is evidence, not a report unit.
- Length scales with the density of the notes, not the volume of ORE entries.

ANTI-PATTERNS — do not:
- Evaluate OREs in isolation or produce a per-ORE rundown.
- List more than 2 items in Top Focus.
- Re-analyze a pattern already covered in the last two reports.
- Report a total for an ORE whose values are not quantities (a clock time is not a duration).
- Write a preamble like "Here is your report".

OUTPUT
Write the report body in markdown. Then, on its own line, the marker ${COMMITMENT_MARKER}, then a JSON array of the 1–2 commitments this report is asking the seeker to make, matching Top Focus:
[{"id":"c1","text":"<the commitment, imperative and specific>","measure":"<the observable check>"}]
The JSON must be valid and is not part of the report body.`;
}

// ────────────────────────────── user ──────────────────────────────

export function buildUser(p: ReportPayload, ctx: ReportContext): string {
  const { charter } = ctx;
  const f = p.focus;

  const perDay = f.days
    .map((d) => `${d.date}: ${d.logged ? `${d.value} ${charter.unit}` : 'not logged'}`)
    .join('\n');

  // Non-numeric OREs report coverage only — a summed clock time is meaningless
  // and would invite the model to reason about a fabricated quantity.
  const oreLines = p.ores
    .map((o) => {
      const label = o.isFocusOre ? `${o.name} (NORTH-STAR ORE)` : o.name;
      const total = o.total === null ? 'no numeric total (non-quantitative ORE)' : `total ${o.total}`;
      return `- ${label}: logged ${o.daysLogged}/${o.daysInWindow} days, ${total}`;
    })
    .join('\n');

  const noteLines = p.notes.length
    ? p.notes.map((n) => `[${n.date}] (${n.label}) ${n.text}`).join('\n')
    : '(no notes recorded in this window)';

  const focusLogNotes = p.notes.filter((n) => n.source === 'quick');

  const priorBlock = ctx.priorReports.length
    ? ctx.priorReports.map(renderPriorReport).join('\n\n')
    : '(no prior reports — this is a baseline report)';

  const deltaStr = f.deltaPct === null
    ? 'no comparable prior period'
    : `${f.deltaPct > 0 ? '+' : ''}${f.deltaPct}% vs the prior period (${f.priorTotal} ${charter.unit})`;

  // Move 1 needs the intended actions themselves, not just the tally.
  const goalLines = p.adherence.goals.length
    ? p.adherence.goals.map((g) => `- [${g.date}] ${g.label} → ${g.status}`).join('\n')
    : '(no goal labels recorded — plan-vs-actual diffing is not possible from this data; say so rather than inferring what was planned)';

  const adherenceStr = p.adherence.attempted === 0
    ? 'no daily goals were logged this period'
    : `${p.adherence.done}/${p.adherence.attempted} (${p.adherence.pct}%)` +
      (p.adherence.deltaPct === null ? ', no prior comparison' : `, ${p.adherence.deltaPct > 0 ? '+' : ''}${p.adherence.deltaPct}pp vs prior`);

  return `# PERIOD
${p.periodStart} → ${p.periodEnd} (${p.days} days).

# NORTH-STAR METRIC — ${charter.focusOreName}
Goal: ${charter.weeklyAverageGoal} ${charter.unit}/day.
Total: ${f.total} ${charter.unit}. Average: ${f.average} ${charter.unit}/day. Change: ${deltaStr}.
Per day:
${perDay}

# PLAN ADHERENCE
${adherenceStr}
Goals as planned, with outcome:
${goalLines}

# ORE COVERAGE THIS PERIOD
${oreLines}

# NOTES IN THE WINDOW (the substance — ${p.notes.length} total, ${focusLogNotes.length} from the focus log)
${noteLines}

# CURATED HISTORY (long-range context the seeker maintains)
${ctx.history ?? '(the seeker has not written their history page yet — you have no longitudinal context beyond the prior reports below; do not invent any)'}

# PRIOR REPORTS (newest first) — for the continuity-diff
${priorBlock}

Write the report now.`;
}

export function buildReportMessages(p: ReportPayload, ctx: ReportContext): PromptMessages {
  return { system: buildSystem(ctx), user: buildUser(p, ctx) };
}

// ───────────────────────── output parsing ─────────────────────────

export interface SplitReport {
  body: string;
  commitments: ReportCommitment[];
  /** True when the marker was present but the JSON could not be parsed. */
  commitmentParseFailed: boolean;
}

/**
 * Split the model's output into the report body and its commitments.
 *
 * A malformed or missing commitments block must never cost the report: the body
 * is returned regardless, with an empty commitments list and a flag the caller
 * can surface.
 */
export function splitReportOutput(raw: string): SplitReport {
  const text = (raw ?? '').trim();
  const idx = text.indexOf(COMMITMENT_MARKER);
  if (idx === -1) return { body: text, commitments: [], commitmentParseFailed: false };

  const body = text.slice(0, idx).trim();
  const tail = text.slice(idx + COMMITMENT_MARKER.length).trim();
  // Tolerate a ```json fence around the array.
  const jsonText = tail.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return { body, commitments: [], commitmentParseFailed: true };
    const commitments = parsed
      .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
      .map((c, i) => ({
        id: typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `c${i + 1}`,
        text: typeof c.text === 'string' ? c.text.trim() : '',
        ...(typeof c.measure === 'string' && c.measure.trim() ? { measure: c.measure.trim() } : {}),
      }))
      .filter((c) => c.text);
    return { body, commitments, commitmentParseFailed: false };
  } catch {
    return { body, commitments: [], commitmentParseFailed: true };
  }
}

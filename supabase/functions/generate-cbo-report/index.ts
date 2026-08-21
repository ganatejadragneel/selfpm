// Edge Function: generate-cbo-report  (SEEK-GEN Phase 4)
//
// Generates a CPO report for one seeker over a period, and files it as a Page:
// a kb_documents row with source='cbo' in their reserved "CPO Reports" folder.
//
// Pipeline (docs/01-features/cpo-self-generation/plan.md):
//   1. behavioral window  — custom_tasks / daily_task_completions / daily_task_notes
//                           / tagged quick_notes / daily_goals
//   2. curated history    — the Page with metadata.role='history'
//   3. prior 3–4 reports  — kb_documents, source='cbo', period BEFORE this window
//   4. commitment contract— prior reports' metadata.commitments are graded by name;
//                           this report writes its own for the next one to grade.
//
// Deploy:   supabase functions deploy generate-cbo-report
// Secrets:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   (and optionally CRON_SECRET)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Request body: { "user_id": "...", "period_end": "YYYY-MM-DD", "days": 7,
//                 "model": "claude-sonnet-4-6", "force": false, "dry_run": false }
//   - period_end defaults to today (UTC); days defaults to 7
//   - force overrides the 7-day cooldown; dry_run returns the report without writing
//
// ─────────────────────────────────────────────────────────────────────────────
// SYNC BANNER — the pure logic below is a PORT of:
//   src/components/Reports/reportPayload.ts
//   src/components/Reports/reportContext.ts
//   src/components/Reports/reportPrompt.ts
//   src/components/Focus/charterConfig.ts   (parseCharter / normalizeName)
// It is duplicated because this file deploys as a single-file Deno module.
// Tests live under functions/_tests/ — the CLI skips `_`-prefixed directories, so
// nothing that imports from src/ can end up in the deployed bundle.
// `supabase/functions/_tests/parity.test.ts` asserts the port
// and the originals agree on identical inputs — if you change one, that test
// fails until you change the other.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Deno's globals, declared locally so this module also loads under Node when the
// test runner imports it. `typeof` on an undeclared identifier is safe in JS, so
// these checks do not throw outside Deno.
declare const Deno: undefined | {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

/** Env access that works under Deno (production) and Node (tests). */
export const getEnv = (k: string): string | undefined => {
  const fromDeno = typeof Deno !== "undefined" ? Deno.env.get(k) : undefined;
  if (fromDeno !== undefined) return fromDeno;
  const node = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return node?.env?.[k];
};

export const DEFAULT_MODEL = "claude-sonnet-4-6";
export const REPORT_MAX_TOKENS = 8000;
export const DEFAULT_PRIOR_DEPTH = 4;
export const PRIOR_EXCERPT_CHARS = 6000;
export const COMMITMENT_MARKER = "---COMMITMENTS---";
export const COOLDOWN_DAYS = 7;

// ═══════════════════════ charter (port of charterConfig.ts) ═══════════════════

/**
 * Only the fields SEEK-GEN reads. The app's CharterConfig carries more (the
 * qualitative-ORE win/watch options), but a report never consults them — so this
 * port deliberately does NOT mirror them, and the parity test compares exactly
 * these four. That keeps the function independent of unrelated charter changes.
 */
export interface CharterConfig {
  focusOreName: string;
  notesTag: string;
  weeklyAverageGoal: number;
  unit: string;
}

export const DEFAULT_CHARTER: CharterConfig = {
  focusOreName: "Hard Focus Hours",
  notesTag: "focus log",
  weeklyAverageGoal: 6,
  unit: "hrs",
};

export const normalizeName = (v: string): string => v.trim().replace(/\s+/g, " ").toLowerCase();

const unwrap = (v: string): string => {
  const m = v.trim().match(/^<\s*(.*?)\s*>$/);
  return m ? m[1].trim() : v.trim();
};
const SEED_HINT = /^(your\s+)?(ore\s+name|quick[-\s]note\s+tag|tag|name)$/i;
const isUnset = (v: string): boolean => !v || SEED_HINT.test(v);
export function parseCharter(content: string | null | undefined): CharterConfig {
  const cfg: CharterConfig = { ...DEFAULT_CHARTER };
  if (!content) return cfg;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/^\s*[-*]\s+/, "").trim();
    const m = line.match(/^([a-z_ ]+):\s*(.+)$/i);
    if (!m) continue;
    const key = m[1].trim().toLowerCase().replace(/\s+/g, "_");
    const value = unwrap(m[2]);
    if (isUnset(value)) continue;

    if (key === "ore" || key === "focus_ore") cfg.focusOreName = value;
    else if (key === "notes_tag" || key === "tag") cfg.notesTag = value;
    else if (key === "unit") cfg.unit = value;
    else if (key === "goal") {
      // Numeric goals only. A "%" goal expresses a qualitative-ORE clean-day RATE,
      // which a report cannot yet use as a north-star — when that lands, this and
      // the parity test move together.
      const n = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(n) && n > 0) cfg.weeklyAverageGoal = n;
    }
  }
  return cfg;
}

// ═══════════════════════ payload (port of reportPayload.ts) ═══════════════════

export interface DayValue { date: string; value: number; logged: boolean; numeric: boolean }
export interface OreSummary { taskId: string; name: string; isFocusOre: boolean; daysLogged: number; daysInWindow: number; total: number | null }
export interface DatedNote { date: string; source: "ore" | "quick"; label: string; text: string }
export interface PlannedGoal { date: string; label: string; status: string }
export interface FocusMetrics { days: DayValue[]; total: number; average: number; deltaPct: number | null; priorTotal: number | null; goal: number }
export interface Adherence { done: number; attempted: number; pct: number; deltaPct: number | null; goals: PlannedGoal[] }
export interface ReportPayload {
  periodStart: string; periodEnd: string; periodDate: string; days: number;
  focus: FocusMetrics; ores: OreSummary[]; notes: DatedNote[]; adherence: Adherence;
}

export interface TaskRow { id: string; name: string }
export interface CompletionRow { custom_task_id: string; completion_date: string; value: unknown }
export interface TaskNoteRow { custom_task_id: string; note_date: string; note_text: string }
export interface QuickNoteRow { content: string; created_at: string; tags?: string[] | null }
export interface DailyGoalRow { goal_date: string; status: string; label?: string | null }

const round1 = (n: number): number => Math.round(n * 10) / 10;

export function datesInRange(periodStart: string, periodEnd: string): string[] {
  const out: string[] = [];
  const [ys, ms, ds] = periodStart.split("-").map(Number);
  const [ye, me, de] = periodEnd.split("-").map(Number);
  const cur = new Date(Date.UTC(ys, ms - 1, ds));
  const end = new Date(Date.UTC(ye, me - 1, de));
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

export function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function medianDate(dates: string[]): string {
  if (dates.length === 0) return "";
  return dates[Math.floor((dates.length - 1) / 2)];
}

/** main|alt split BEFORE digit-parsing, so "3.5|2" is 3.5 and not 3.52. */
export function toNumericValue(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw);
  const main = s.includes("|") ? s.split("|")[0] ?? "" : s;
  const cleaned = main.replace(/[^0-9.]/g, "");
  if (!/\d/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function daySeries(rows: CompletionRow[], taskId: string, dates: string[]): DayValue[] {
  const byDate = new Map<string, unknown>();
  for (const r of rows) {
    if (r.custom_task_id !== taskId) continue;
    if (!dates.includes(r.completion_date)) continue;
    byDate.set(r.completion_date, r.value);
  }
  return dates.map((date) => {
    const has = byDate.has(date);
    const n = has ? toNumericValue(byDate.get(date)) : null;
    return { date, value: n ?? 0, logged: has, numeric: n !== null };
  });
}

export function computeFocusMetrics(days: DayValue[], priorDays: DayValue[] | null, goal: number): FocusMetrics {
  const total = round1(days.reduce((s, d) => s + d.value, 0));
  const average = days.length ? round1(total / days.length) : 0;
  const priorTotal = priorDays ? round1(priorDays.reduce((s, d) => s + d.value, 0)) : null;
  const deltaPct = priorTotal === null || priorTotal === 0 ? null : Math.round(((total - priorTotal) / priorTotal) * 100);
  return { days, total, average, deltaPct, priorTotal, goal };
}

export function computeAdherence(rows: DailyGoalRow[], priorRows: DailyGoalRow[] | null = null): Adherence {
  const tally = (list: DailyGoalRow[]) => {
    const attempted = list.length;
    const done = list.filter((g) => g.status === "done").length;
    return { done, attempted, pct: attempted === 0 ? 0 : Math.round((done / attempted) * 100) };
  };
  const cur = tally(rows);
  const prior = priorRows ? tally(priorRows) : null;
  const deltaPct = prior && prior.attempted > 0 ? cur.pct - prior.pct : null;
  const goals: PlannedGoal[] = rows
    .map((g) => ({ date: g.goal_date, label: (g.label ?? "").trim(), status: g.status }))
    .filter((g) => g.label)
    .sort((a, b) => (a.date === b.date ? a.label.localeCompare(b.label) : a.date.localeCompare(b.date)));
  return { ...cur, deltaPct, goals };
}

export function buildOreSummaries(tasks: TaskRow[], completions: CompletionRow[], dates: string[], focusOreName: string): OreSummary[] {
  const target = normalizeName(focusOreName);
  return tasks.map((t) => {
    const series = daySeries(completions, t.id, dates);
    const logged = series.filter((d) => d.logged);
    const numeric = series.filter((d) => d.numeric);
    return {
      taskId: t.id,
      name: t.name.trim(),
      isFocusOre: normalizeName(t.name) === target,
      daysLogged: logged.length,
      daysInWindow: dates.length,
      total: numeric.length ? round1(numeric.reduce((s, d) => s + d.value, 0)) : null,
    };
  });
}

export function collectNotes(taskNotes: TaskNoteRow[], quickNotes: QuickNoteRow[], tasks: TaskRow[], dates: string[], notesTag: string): DatedNote[] {
  const nameById = new Map(tasks.map((t) => [t.id, t.name.trim()]));
  const inWindow = new Set(dates);
  const fromOres: DatedNote[] = taskNotes
    .filter((n) => inWindow.has(n.note_date) && (n.note_text ?? "").trim())
    .map((n) => ({ date: n.note_date, source: "ore" as const, label: nameById.get(n.custom_task_id) ?? "Unknown ORE", text: n.note_text.trim() }));
  const fromQuick: DatedNote[] = quickNotes
    .filter((n) => inWindow.has((n.created_at ?? "").slice(0, 10)) && (n.content ?? "").trim())
    .map((n) => ({ date: n.created_at.slice(0, 10), source: "quick" as const, label: notesTag, text: n.content.trim() }));
  return [...fromOres, ...fromQuick].sort((a, b) => (a.date === b.date ? a.source.localeCompare(b.source) : a.date.localeCompare(b.date)));
}

export interface BuildPayloadInput {
  periodStart: string; periodEnd: string; charter: CharterConfig;
  tasks: TaskRow[]; completions: CompletionRow[]; priorCompletions?: CompletionRow[];
  taskNotes: TaskNoteRow[]; quickNotes: QuickNoteRow[];
  dailyGoals: DailyGoalRow[]; priorDailyGoals?: DailyGoalRow[];
}

export function buildReportPayload(input: BuildPayloadInput): ReportPayload {
  const dates = datesInRange(input.periodStart, input.periodEnd);
  const ores = buildOreSummaries(input.tasks, input.completions, dates, input.charter.focusOreName);
  const focusOre = ores.find((o) => o.isFocusOre);
  const focusDays = focusOre
    ? daySeries(input.completions, focusOre.taskId, dates)
    : dates.map((date) => ({ date, value: 0, logged: false, numeric: false }));

  let priorDays: DayValue[] | null = null;
  if (focusOre && input.priorCompletions) {
    const priorEnd = shiftIso(input.periodStart, -1);
    const priorStart = shiftIso(priorEnd, -(dates.length - 1));
    priorDays = daySeries(input.priorCompletions, focusOre.taskId, datesInRange(priorStart, priorEnd));
  }

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    periodDate: medianDate(dates),
    days: dates.length,
    focus: computeFocusMetrics(focusDays, priorDays, input.charter.weeklyAverageGoal),
    ores,
    notes: collectNotes(input.taskNotes, input.quickNotes, input.tasks, dates, input.charter.notesTag),
    adherence: computeAdherence(input.dailyGoals.filter((g) => dates.includes(g.goal_date)), input.priorDailyGoals ?? null),
  };
}

// ═══════════════════════ context (port of reportContext.ts) ═══════════════════

export interface ReportCommitment { id: string; text: string; measure?: string }
export interface PriorReport { id: string; title: string; periodDate: string; commitments: ReportCommitment[]; content: string }
export interface ReportContext { priorReports: PriorReport[]; history: string | null; charter: CharterConfig }
export interface KbDocumentRow { id: string; title: string; content: string; source: string; metadata: Record<string, unknown> | null; created_at?: string }

const isIsoDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function priorReportDate(metadata: Record<string, unknown> | null | undefined): string | null {
  const end = metadata?.period_end;
  if (isIsoDate(end)) return end;
  const date = metadata?.period_date;
  if (isIsoDate(date)) return date;
  return null;
}

export function parseCommitments(metadata: Record<string, unknown> | null | undefined): ReportCommitment[] {
  const raw = metadata?.commitments;
  if (!Array.isArray(raw)) return [];
  const out: ReportCommitment[] = [];
  raw.forEach((entry, i) => {
    if (!entry || typeof entry !== "object") return;
    const e = entry as Record<string, unknown>;
    const text = typeof e.text === "string" ? e.text.trim() : "";
    if (!text) return;
    out.push({
      id: typeof e.id === "string" && e.id.trim() ? e.id.trim() : `c${i + 1}`,
      text,
      ...(typeof e.measure === "string" && e.measure.trim() ? { measure: e.measure.trim() } : {}),
    });
  });
  return out;
}

export function selectPriorReports(rows: KbDocumentRow[], periodStart: string, depth: number = DEFAULT_PRIOR_DEPTH): PriorReport[] {
  if (depth <= 0) return [];
  return rows
    .map((row) => ({ row, date: priorReportDate(row.metadata) }))
    .filter((x): x is { row: KbDocumentRow; date: string } => x.date !== null)
    .filter((x) => x.date < periodStart)
    .sort((a, b) => (a.date === b.date ? a.row.id.localeCompare(b.row.id) : b.date.localeCompare(a.date)))
    .slice(0, depth)
    .map((x) => ({
      id: x.row.id,
      title: x.row.title,
      periodDate: x.date,
      commitments: parseCommitments(x.row.metadata),
      content: x.row.content ?? "",
    }));
}

const HISTORY_SEED_MARKER = "the prose the weekly report reads for long-range continuity";

export function resolveHistory(content: string | null | undefined): string | null {
  const trimmed = (content ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.includes(HISTORY_SEED_MARKER) && trimmed.length < 400) return null;
  return trimmed;
}

// ═══════════════════════ prompt (port of reportPrompt.ts) ═════════════════════

export function priorExcerpt(content: string, cap: number = PRIOR_EXCERPT_CHARS): string {
  const text = (content ?? "").trim();
  if (text.length <= cap) return text;
  return `…[earlier sections omitted]…\n\n${text.slice(text.length - cap)}`;
}

function renderCommitments(commitments: ReportCommitment[]): string {
  if (commitments.length === 0) return "(none recorded — this report predates structured commitments)";
  return commitments.map((c) => `- [${c.id}] ${c.text}${c.measure ? ` (measure: ${c.measure})` : ""}`).join("\n");
}

function renderPriorReport(r: PriorReport, i: number): string {
  return [
    `### Prior report ${i + 1} — ${r.title} (period ending ${r.periodDate})`,
    `Commitments it recorded:`,
    renderCommitments(r.commitments),
    ``,
    priorExcerpt(r.content),
  ].join("\n");
}

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

export function buildUser(p: ReportPayload, ctx: ReportContext): string {
  const { charter } = ctx;
  const f = p.focus;

  const perDay = f.days.map((d) => `${d.date}: ${d.logged ? `${d.value} ${charter.unit}` : "not logged"}`).join("\n");

  const oreLines = p.ores
    .map((o) => {
      const label = o.isFocusOre ? `${o.name} (NORTH-STAR ORE)` : o.name;
      const total = o.total === null ? "no numeric total (non-quantitative ORE)" : `total ${o.total}`;
      return `- ${label}: logged ${o.daysLogged}/${o.daysInWindow} days, ${total}`;
    })
    .join("\n");

  const noteLines = p.notes.length
    ? p.notes.map((n) => `[${n.date}] (${n.label}) ${n.text}`).join("\n")
    : "(no notes recorded in this window)";

  const focusLogNotes = p.notes.filter((n) => n.source === "quick");

  const goalLines = p.adherence.goals.length
    ? p.adherence.goals.map((g) => `- [${g.date}] ${g.label} → ${g.status}`).join("\n")
    : "(no goal labels recorded — plan-vs-actual diffing is not possible from this data; say so rather than inferring what was planned)";

  const priorBlock = ctx.priorReports.length
    ? ctx.priorReports.map(renderPriorReport).join("\n\n")
    : "(no prior reports — this is a baseline report)";

  const deltaStr = f.deltaPct === null
    ? "no comparable prior period"
    : `${f.deltaPct > 0 ? "+" : ""}${f.deltaPct}% vs the prior period (${f.priorTotal} ${charter.unit})`;

  const adherenceStr = p.adherence.attempted === 0
    ? "no daily goals were logged this period"
    : `${p.adherence.done}/${p.adherence.attempted} (${p.adherence.pct}%)` +
      (p.adherence.deltaPct === null ? ", no prior comparison" : `, ${p.adherence.deltaPct > 0 ? "+" : ""}${p.adherence.deltaPct}pp vs prior`);

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
${ctx.history ?? "(the seeker has not written their history page yet — you have no longitudinal context beyond the prior reports below; do not invent any)"}

# PRIOR REPORTS (newest first) — for the continuity-diff
${priorBlock}

Write the report now.`;
}

export interface SplitReport { body: string; commitments: ReportCommitment[]; commitmentParseFailed: boolean }

export function splitReportOutput(raw: string): SplitReport {
  const text = (raw ?? "").trim();
  const idx = text.indexOf(COMMITMENT_MARKER);
  if (idx === -1) return { body: text, commitments: [], commitmentParseFailed: false };
  const body = text.slice(0, idx).trim();
  const tail = text.slice(idx + COMMITMENT_MARKER.length).trim();
  const jsonText = tail.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return { body, commitments: [], commitmentParseFailed: true };
    const commitments = parsed
      .filter((c: unknown): c is Record<string, unknown> => !!c && typeof c === "object")
      .map((c: Record<string, unknown>, i: number) => ({
        id: typeof c.id === "string" && c.id.trim() ? c.id.trim() : `c${i + 1}`,
        text: typeof c.text === "string" ? c.text.trim() : "",
        ...(typeof c.measure === "string" && c.measure.trim() ? { measure: c.measure.trim() } : {}),
      }))
      .filter((c) => c.text);
    return { body, commitments, commitmentParseFailed: false };
  } catch {
    return { body, commitments: [], commitmentParseFailed: true };
  }
}

// ═══════════════════════ filing ═══════════════════════════════════════════════

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Default report name, brief §B5: `CPO Report — {period date}`. */
export function reportTitle(periodDate: string): string {
  const [, m, d] = periodDate.split("-").map(Number);
  return `CPO Report — ${MONTHS[(m || 1) - 1]} ${d || 1}`;
}

export interface DocumentRowInput {
  uid: string; folderId: string; body: string; payload: ReportPayload;
  commitments: ReportCommitment[]; model: string; generatedAt: string;
}

/** The kb_documents row a generated report becomes (brief §B6). */
export function buildDocumentRow(i: DocumentRowInput) {
  return {
    new_user_id: i.uid,
    folder_id: i.folderId,
    title: reportTitle(i.payload.periodDate),
    content: i.body,
    source: "cbo",
    display_order: 0, // newest first — the grid and Pages list both sort ascending
    metadata: {
      period_start: i.payload.periodStart,
      period_end: i.payload.periodEnd,
      period_date: i.payload.periodDate,
      model: i.model,
      generated_at: i.generatedAt,
      commitments: i.commitments,
      report_type: "cbo",
      notes: "",
    },
  };
}

/** Cooldown guard (brief §B4): most recent prior report within COOLDOWN_DAYS. */
export function cooldownBlocks(rows: KbDocumentRow[], periodEnd: string, days: number = COOLDOWN_DAYS): string | null {
  const dates = rows.map((r) => priorReportDate(r.metadata)).filter((d): d is string => !!d).sort();
  const latest = dates[dates.length - 1];
  if (!latest) return null;
  const earliestAllowed = shiftIso(periodEnd, -days);
  return latest > earliestAllowed ? latest : null;
}

// ═══════════════════════ Claude ═══════════════════════════════════════════════

export async function callClaude(apiKey: string, system: string, user: string, model: string, maxTokens: number): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${detail.slice(0, 300)}`);
  }
  const data = await resp.json();
  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Anthropic returned no text content");
  return text;
}

// ═══════════════════════ per-seeker pipeline ══════════════════════════════════

/** The Supabase client, as the existing edge function types it. */
type DB = ReturnType<typeof createClient>;

export interface GenerateOptions {
  periodEnd: string; days: number; model: string; force: boolean; dryRun: boolean; priorDepth: number;
}

export async function generateForUser(admin: DB, anthropicKey: string, uid: string, opts: GenerateOptions) {
  const dates = datesInRange(shiftIso(opts.periodEnd, -(opts.days - 1)), opts.periodEnd);
  const periodStart = dates[0];
  const periodEnd = dates[dates.length - 1];
  const priorEnd = shiftIso(periodStart, -1);
  const priorStart = shiftIso(priorEnd, -(dates.length - 1));
  const warnings: string[] = [];

  // folders
  const { data: folders, error: fErr } = await admin.from("kb_folders").select("id, name, metadata").eq("new_user_id", uid);
  if (fErr) throw new Error(`kb_folders: ${fErr.message}`);
  const roleOf = (f: { metadata: unknown }) => (f.metadata as { role?: string } | null)?.role;
  let cpoFolder = (folders ?? []).find((f: { metadata: unknown }) => roleOf(f) === "cpo_reports");
  const systemFolder = (folders ?? []).find((f: { metadata: unknown }) => roleOf(f) === "system");

  if (!cpoFolder) {
    // Mirrors pagesStore.ensureReserved so a seeker who has never opened Pages
    // still gets their report filed correctly.
    const { data: made, error } = await admin
      .from("kb_folders")
      .insert({ new_user_id: uid, name: "CPO Reports", is_system: true, metadata: { role: "cpo_reports" }, display_order: 900 })
      .select()
      .single();
    if (error || !made) throw new Error(`could not create CPO Reports folder: ${error?.message ?? "no row"}`);
    cpoFolder = made;
  }

  // system pages (charter + history)
  const systemPages = systemFolder
    ? (await admin.from("kb_documents").select("content, metadata").eq("new_user_id", uid).eq("folder_id", systemFolder.id)).data ?? []
    : [];
  const pageByRole = (role: string): string | null =>
    systemPages.find((d: { metadata: unknown }) => (d.metadata as { role?: string } | null)?.role === role)?.content ?? null;

  const charterContent = pageByRole("charter");
  const charter = parseCharter(charterContent);
  const tag = charter.notesTag.toLowerCase();

  // existing reports (prior context + cooldown)
  const { data: reportRows } = await admin
    .from("kb_documents").select("id, title, content, source, metadata, created_at")
    .eq("new_user_id", uid).eq("folder_id", cpoFolder.id).eq("source", "cbo");
  const existing = (reportRows ?? []) as KbDocumentRow[];

  if (!opts.force) {
    const blockedBy = cooldownBlocks(existing, periodEnd);
    if (blockedBy) return { skipped: `cooldown — a report already covers up to ${blockedBy}; pass force:true to override` };
  }

  const [tasksRes, compsRes, priorCompsRes, notesRes, quickRes, goalsRes, priorGoalsRes] = await Promise.all([
    admin.from("custom_tasks").select("id, name").eq("new_user_id", uid),
    admin.from("daily_task_completions").select("custom_task_id, completion_date, value").eq("new_user_id", uid).gte("completion_date", periodStart).lte("completion_date", periodEnd),
    admin.from("daily_task_completions").select("custom_task_id, completion_date, value").eq("new_user_id", uid).gte("completion_date", priorStart).lte("completion_date", priorEnd),
    admin.from("daily_task_notes").select("custom_task_id, note_date, note_text").eq("new_user_id", uid).gte("note_date", periodStart).lte("note_date", periodEnd),
    admin.from("quick_notes").select("content, created_at, tags").eq("new_user_id", uid).gte("created_at", periodStart).lte("created_at", `${periodEnd}T23:59:59Z`),
    admin.from("daily_goals").select("goal_date, status, label").eq("new_user_id", uid).gte("goal_date", periodStart).lte("goal_date", periodEnd),
    admin.from("daily_goals").select("goal_date, status, label").eq("new_user_id", uid).gte("goal_date", priorStart).lte("goal_date", priorEnd),
  ]);

  const allQuick = (quickRes.data ?? []) as QuickNoteRow[];
  const tagged = allQuick.filter((n) => (n.tags ?? []).some((t) => (t ?? "").toLowerCase() === tag));
  if (allQuick.length > 0 && tagged.length === 0) {
    warnings.push(`charter notes_tag "${charter.notesTag}" matched no quick note in this window`);
  }

  const payload = buildReportPayload({
    periodStart, periodEnd, charter,
    tasks: (tasksRes.data ?? []) as TaskRow[],
    completions: (compsRes.data ?? []) as CompletionRow[],
    priorCompletions: (priorCompsRes.data ?? []) as CompletionRow[],
    taskNotes: (notesRes.data ?? []) as TaskNoteRow[],
    quickNotes: tagged,
    dailyGoals: (goalsRes.data ?? []) as DailyGoalRow[],
    priorDailyGoals: (priorGoalsRes.data ?? []) as DailyGoalRow[],
  });

  const history = resolveHistory(pageByRole("history"));
  const context: ReportContext = { priorReports: selectPriorReports(existing, periodStart, opts.priorDepth), history, charter };
  if (!history) warnings.push("history page unwritten — no longitudinal context");
  if (context.priorReports.length === 0) warnings.push("no prior reports — baseline report");
  if (payload.notes.length === 0) warnings.push("no notes in window — thin report");

  const raw = await callClaude(anthropicKey, buildSystem(context), buildUser(payload, context), opts.model, REPORT_MAX_TOKENS);
  const split = splitReportOutput(raw);
  if (split.commitmentParseFailed) warnings.push("commitments block was unparseable — report body intact, commitments empty");
  if (!split.body.trim()) throw new Error("model returned an empty report body — nothing filed");

  if (opts.dryRun) {
    return { dry_run: true, period_start: periodStart, period_end: periodEnd, chars: split.body.length, commitments: split.commitments, warnings };
  }

  const row = buildDocumentRow({
    uid, folderId: cpoFolder.id, body: split.body, payload,
    commitments: split.commitments, model: opts.model, generatedAt: new Date().toISOString(),
  });

  const { data: inserted, error: insErr } = await admin.from("kb_documents").insert(row).select("id").single();
  if (insErr) throw new Error(`kb_documents insert: ${insErr.message}`);

  return {
    document_id: inserted?.id,
    title: row.title,
    period_start: periodStart,
    period_end: periodEnd,
    period_date: payload.periodDate,
    chars: split.body.length,
    commitments: split.commitments,
    prior_reports: context.priorReports.length,
    warnings,
  };
}

// ═══════════════════════ entry ════════════════════════════════════════════════

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const cronSecret = getEnv("CRON_SECRET");
    if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicKey = getEnv("ANTHROPIC_API_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "missing Supabase env" }, 500);
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const periodEnd = typeof body.period_end === "string" ? body.period_end : new Date().toISOString().slice(0, 10);
    if (!isIsoDate(periodEnd)) return json({ error: "period_end must be YYYY-MM-DD" }, 400);

    // Clamp rather than reject (brief §B4): a wild value degrades to a sane window.
    const rawDays = Number(body.days ?? 7);
    if (!Number.isFinite(rawDays) || rawDays <= 0) return json({ error: "days must be a positive number" }, 400);
    const days = Math.min(Math.floor(rawDays), 365);

    const opts: GenerateOptions = {
      periodEnd,
      days,
      model: typeof body.model === "string" ? body.model : DEFAULT_MODEL,
      force: body.force === true,
      dryRun: body.dry_run === true,
      priorDepth: Number.isFinite(Number(body.prior_depth)) ? Number(body.prior_depth) : DEFAULT_PRIOR_DEPTH,
    };

    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    let userIds: string[];
    if (typeof body.user_id === "string" && body.user_id) {
      userIds = [body.user_id];
    } else {
      const { data } = await admin.from("kb_documents").select("new_user_id").eq("metadata->>role", "charter");
      userIds = [...new Set((data ?? []).map((r: { new_user_id: string }) => r.new_user_id))];
    }

    const results: unknown[] = [];
    for (const uid of userIds) {
      try {
        results.push({ uid, ...(await generateForUser(admin, anthropicKey, uid, opts)) });
      } catch (e) {
        // One seeker's failure must not abort the rest, and a failed run files nothing.
        results.push({ uid, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return json({ period_end: opts.periodEnd, days: opts.days, processed: results.length, results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

// Guarded so the module can be imported by the Node test runner, which has no Deno.
if (typeof Deno !== "undefined") Deno.serve(handler);

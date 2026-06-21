// Edge Function: generate-focus-brief
// Runs nightly (pg_cron). For each seeker with a Focus ORE, it reads their
// 7-day window from the daily-task tables + focus-log quick notes, calls Claude
// Sonnet with the Analysis + Today's-Focus prompts, and upserts the result into
// focus_briefs (one row per seeker per day). The dashboard then just READS it.
//
// Deploy:   supabase functions deploy generate-focus-brief
// Secrets:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   (and optionally CRON_SECRET)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Request body (optional): { "user_id": "...", "date": "YYYY-MM-DD" }
//   - no user_id → process all seekers who have the Focus ORE
//   - no date    → today (UTC). The cron should pass the seeker-local date.

// Match the existing edge function (auto-complete-sprints): esm.sh import.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ───────── prompts (inlined for single-file paste) ─────────
// MUST stay in sync with src/components/Focus/prompts.ts — change both together.
interface FocusPayload {
  focusOreName: string;
  unit: string;
  goal: number;
  yesterday: { dateLabel: string; hours: number; note?: string };
  focusLog: string[];
  weekTotal: number;
  weekAverage: number;
  targetToday: number;
}
type FocusBox = "analysis" | "todays-focus";

const ANALYSIS_SYSTEM = (p: FocusPayload) =>
  `You are CPO, the analyst inside SelfPM. You write a short daily Analysis of the seeker's single most important metric — their ${p.focusOreName}. Say what actually happened yesterday, name the one real win, and name the one improvement — all tied to the north-star.

NORTH-STAR REDUCTION: everything is scored against holding a ${p.goal} ${p.unit}/day average. An observation earns its place only if it serves that goal, hurts it, or reveals a lever for it.

ANALYTICAL MOVES (apply only the ones the data actually supports):
- Plan vs actual: hold the intended day against what happened; name the gap and its cost.
- Day-segmentation: where did the hours land? Locate the dead zone and trace its cause.
- Barrier / enabler: isolate the SPECIFIC blocker and the SPECIFIC enabler. Never "be more disciplined" — name the precise lever.
- Loop: if the day reveals a reinforcing loop (a good start compounding, or a stall cascading), name it.
- Distraction content-analysis: if a focus log is present, categorize the wanders and name the dominant theme + the underlying mechanism. If no focus log is present, say the data is absent — do NOT invent wanders.

DISCIPLINES:
- Every claim carries evidence: a time, a duration, a count, or a quoted phrase from the note.
- NO INVENTION. Do not introduce mechanisms, diagnoses, numbers, or causes the data doesn't contain. Any mechanism you name must be directly traceable to the note or focus log — no speculative psychology (e.g. "task-ambiguity anxiety") and no fabricated metrics (e.g. a "cumulative deficit"). If the data doesn't support a claim, leave it out.
- Honor the seeker's own words: if the note names a lever (a routine, an early start), treat it as real upstream signal — build on it, don't second-guess or override it.
- Honest and non-judgmental: name a loss plainly as data, then pivot to the fix. No shame spiral, no soft-pedaling.
- Second person, the seeker's own register. 3–5 sentences, flowing prose. No headings, no bullet lists, no preamble like "Here is".`;

const ANALYSIS_USER = (p: FocusPayload) =>
  `North-star: hold ${p.goal} ${p.unit}/day (rolling 7-day average).
Yesterday (${p.yesterday.dateLabel}): ${p.yesterday.hours} ${p.unit} logged.
Yesterday's note: ${p.yesterday.note ? `"${p.yesterday.note}"` : "(no note logged)"}
Focus log (wander count / reason / attention span): ${
    p.focusLog.length ? p.focusLog.map((l) => `"${l}"`).join(" ") : "(none recorded)"
  }
Week so far: ${p.weekTotal} ${p.unit} total, ${p.weekAverage} ${p.unit}/day average.

Write the Analysis.`;

const FOCUS_SYSTEM = (p: FocusPayload) =>
  `You are CPO inside SelfPM. From yesterday's data you write "Today's Focus": the 1–2 highest-leverage things to do today, derived from yesterday's specific lever.

RULES:
- Protocol extraction: convert yesterday's lesson into a CONCRETE rule — a checkpoint time, a hard stop, a defined first move. Not vague intent ("focus more").
- Give 1–2 DISTINCT moves. When yesterday reveals two separate levers — e.g. a morning to defend AND an afternoon failure to fix — name BOTH as their own move ("First… Second…"). Do not blend two levers into one sentence, and do not pad to two if only one is supported.
- NO INVENTION: every move must trace to yesterday's specific evidence (the note or focus log). Do NOT invent clock times (e.g. "11:45 AM", "noon–1 PM"), checkpoints, schedules, or protocols the data doesn't contain, and do not contradict a lever the seeker named themselves.
- Tie it to the north-star: holding ${p.goal} ${p.unit}/day.
- Second person, the seeker's register. Keep it TIGHT: one sentence per move, 2–3 sentences total. No run-on sentences (nothing with three-plus stacked clauses), no third move, no preamble.`;

const FOCUS_USER = (p: FocusPayload) =>
  `North-star: hold ${p.goal} ${p.unit}/day.
Yesterday (${p.yesterday.dateLabel}): ${p.yesterday.hours} ${p.unit}. Note: ${
    p.yesterday.note ? `"${p.yesterday.note}"` : "(none)"
  }
Focus log: ${p.focusLog.length ? p.focusLog.map((l) => `"${l}"`).join(" ") : "(none recorded)"}
Today's raw target to hold the average: ${p.targetToday} ${p.unit}.

Write Today's Focus.`;

function buildMessages(box: FocusBox, p: FocusPayload): { system: string; user: string } {
  if (box === "analysis") return { system: ANALYSIS_SYSTEM(p), user: ANALYSIS_USER(p) };
  return { system: FOCUS_SYSTEM(p), user: FOCUS_USER(p) };
}

// v1 charter is a constant (becomes per-seeker config later — see ADR work).
const CHARTER = { focusOreName: "Hard Focus Hours", unit: "hrs", goal: 6, notesTag: "focus log" };
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ───────── helpers ─────────
const round1 = (n: number) => Math.round(n * 10) / 10;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

function toHours(value: unknown): number {
  const n = parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function windowDates(endStr: string, days: number): { offset: number; str: string }[] {
  const end = new Date(endStr + "T00:00:00Z");
  const out: { offset: number; str: string }[] = [];
  for (let offset = 0; offset < days; offset++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - offset);
    out.push({ offset, str: ymd(d) });
  }
  return out;
}

function labelOf(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function callClaude(apiKey: string, msgs: { system: string; user: string }, maxTokens: number): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: msgs.system,
      messages: [{ role: "user", content: msgs.user }],
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.message ?? `Anthropic ${resp.status}`);
  return (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();
}

type DB = ReturnType<typeof createClient>;

async function generateForUser(admin: DB, anthropicKey: string, uid: string, date: string) {
  const { data: oreRows } = await admin
    .from("custom_tasks")
    .select("id")
    .eq("new_user_id", uid)
    .eq("name", CHARTER.focusOreName)
    .limit(1);
  const ore = oreRows?.[0];
  if (!ore) return { skipped: "no Focus ORE" };

  const dates = windowDates(date, 7);
  const dateStrs = dates.map((d) => d.str);
  const windowStart = dateStrs[dateStrs.length - 1];

  const [compsRes, notesRes, qnotesRes] = await Promise.all([
    admin.from("daily_task_completions").select("completion_date, value").eq("new_user_id", uid).eq("custom_task_id", ore.id).in("completion_date", dateStrs),
    admin.from("daily_task_notes").select("note_date, note_text").eq("new_user_id", uid).eq("custom_task_id", ore.id).in("note_date", dateStrs),
    admin.from("quick_notes").select("content, created_at").eq("new_user_id", uid).contains("tags", [CHARTER.notesTag]).gte("created_at", windowStart),
  ]);

  const compByDate = new Map((compsRes.data ?? []).map((c: { completion_date: string; value: unknown }) => [c.completion_date, c.value]));
  const noteByDate = new Map((notesRes.data ?? []).map((n: { note_date: string; note_text: string }) => [n.note_date, n.note_text]));

  const focusDays = dates.map(({ offset, str }) => ({
    offset,
    str,
    hours: compByDate.has(str) ? toHours(compByDate.get(str)) : 0,
    note: noteByDate.get(str) ?? undefined,
  }));

  const yesterdayStr = dates.find((d) => d.offset === 1)?.str;
  const focusLog = (qnotesRes.data ?? [])
    .filter((n: { created_at: string }) => (n.created_at ?? "").slice(0, 10) === yesterdayStr)
    .map((n: { content: string }) => n.content)
    .filter(Boolean);

  // metrics (mirror src/components/Focus/focusLogic.ts)
  const total = round1(focusDays.reduce((s, d) => s + d.hours, 0));
  const average = round1(total / focusDays.length);
  const priorTotal = round1(focusDays.filter((d) => d.offset !== 0).reduce((s, d) => s + d.hours, 0));
  const targetToday = Math.max(0, round1(CHARTER.goal * focusDays.length - priorTotal));
  const y = focusDays.find((d) => d.offset === 1);

  const payload: FocusPayload = {
    focusOreName: CHARTER.focusOreName,
    unit: CHARTER.unit,
    goal: CHARTER.goal,
    yesterday: { dateLabel: y ? labelOf(y.str) : "yesterday", hours: y?.hours ?? 0, note: y?.note },
    focusLog,
    weekTotal: total,
    weekAverage: average,
    targetToday,
  };

  const [analysisText, focusText] = await Promise.all([
    callClaude(anthropicKey, buildMessages("analysis", payload), 450),
    callClaude(anthropicKey, buildMessages("todays-focus", payload), 300),
  ]);

  const { error } = await admin
    .from("focus_briefs")
    .upsert(
      { new_user_id: uid, brief_date: date, analysis_text: analysisText, focus_text: focusText, model: MODEL },
      { onConflict: "new_user_id,brief_date" },
    );
  if (error) return { error: error.message };
  return { ok: true };
}

// ───────── entry ─────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // optional shared-secret guard so random callers can't run up Claude costs
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "missing Supabase env" }, 500);
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not set" }, 500);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const body = await req.json().catch(() => ({} as Record<string, string>));
    const date = body.date ?? new Date().toISOString().slice(0, 10);

    let userIds: string[];
    if (body.user_id) {
      userIds = [body.user_id];
    } else {
      const { data } = await admin.from("custom_tasks").select("new_user_id").eq("name", CHARTER.focusOreName);
      userIds = [...new Set((data ?? []).map((r: { new_user_id: string }) => r.new_user_id))];
    }

    const results: unknown[] = [];
    for (const uid of userIds) {
      try {
        results.push({ uid, ...(await generateForUser(admin, anthropicKey, uid, date)) });
      } catch (e) {
        results.push({ uid, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return json({ date, processed: results.length, results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

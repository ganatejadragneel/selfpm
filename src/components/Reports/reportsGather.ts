// Shared Supabase reads for SEEK-GEN — one place that knows which tables a report
// pulls from, so the browser (Reports tab) and the CLIs can never disagree about
// what the model is fed. Takes the client as an argument, so it works with the
// RLS-scoped browser session and with a CLI sign-in alike.

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildReportPayload, datesInRange, shiftIso } from './reportPayload';
import type {
  CompletionRow,
  DailyGoalRow,
  QuickNoteRow,
  ReportPayload,
  TaskNoteRow,
  TaskRow,
} from './reportPayload';
import { fetchReportContext, DEFAULT_PRIOR_DEPTH } from './reportContext';
import type { KbDocumentRow, ReportContext } from './types';
import { parseCharter, DEFAULT_CHARTER } from '../Focus/charterConfig';

export interface GatherResult {
  payload: ReportPayload;
  context: ReportContext;
  /** Non-fatal problems worth showing the operator before trusting the output. */
  warnings: string[];
  priorWindow: { start: string; end: string };
}

export async function gather(
  supabase: SupabaseClient,
  userId: string,
  periodStart: string,
  periodEnd: string,
  depth: number = DEFAULT_PRIOR_DEPTH,
): Promise<GatherResult> {
  const dates = datesInRange(periodStart, periodEnd);
  const priorEnd = shiftIso(periodStart, -1);
  const priorStart = shiftIso(priorEnd, -(dates.length - 1));
  const warnings: string[] = [];

  const folders = await supabase.from('kb_folders').select('id, name, metadata').eq('new_user_id', userId);
  const roleOf = (f: { metadata: unknown }) => (f.metadata as { role?: string } | null)?.role;
  const cpoFolder = (folders.data ?? []).find((f) => roleOf(f) === 'cpo_reports');
  const systemFolder = (folders.data ?? []).find((f) => roleOf(f) === 'system');

  const systemPages = systemFolder
    ? (await supabase.from('kb_documents').select('content, metadata').eq('new_user_id', userId).eq('folder_id', systemFolder.id)).data ?? []
    : [];
  const pageByRole = (role: string): string | null =>
    systemPages.find((d) => (d.metadata as { role?: string } | null)?.role === role)?.content ?? null;

  const charterContent = pageByRole('charter');
  const charter = charterContent ? parseCharter(charterContent) : DEFAULT_CHARTER;
  const tag = charter.notesTag.toLowerCase();

  const [tasksRes, compsRes, priorCompsRes, notesRes, quickRes, goalsRes, priorGoalsRes] = await Promise.all([
    supabase.from('custom_tasks').select('id, name').eq('new_user_id', userId),
    supabase.from('daily_task_completions').select('custom_task_id, completion_date, value').eq('new_user_id', userId).gte('completion_date', periodStart).lte('completion_date', periodEnd),
    supabase.from('daily_task_completions').select('custom_task_id, completion_date, value').eq('new_user_id', userId).gte('completion_date', priorStart).lte('completion_date', priorEnd),
    supabase.from('daily_task_notes').select('custom_task_id, note_date, note_text').eq('new_user_id', userId).gte('note_date', periodStart).lte('note_date', periodEnd),
    supabase.from('quick_notes').select('content, created_at, tags').eq('new_user_id', userId).gte('created_at', periodStart).lte('created_at', `${periodEnd}T23:59:59Z`),
    supabase.from('daily_goals').select('goal_date, status, label').eq('new_user_id', userId).gte('goal_date', periodStart).lte('goal_date', periodEnd),
    supabase.from('daily_goals').select('goal_date, status, label').eq('new_user_id', userId).gte('goal_date', priorStart).lte('goal_date', priorEnd),
  ]);

  const allQuick = (quickRes.data ?? []) as QuickNoteRow[];
  // Case-insensitive, matching how the tag reads in the UI.
  const tagged = allQuick.filter((n) => (n.tags ?? []).some((t) => (t ?? '').toLowerCase() === tag));

  if (allQuick.length > 0 && tagged.length === 0) {
    const present = [...new Set(allQuick.flatMap((n) => n.tags ?? []))].slice(0, 8);
    warnings.push(
      `Charter notes_tag is "${charter.notesTag}" but no quick note in this window carries it. ` +
        `Tags actually present: ${present.map((t) => `"${t}"`).join(', ')}. The focus log will be missing from the report.`,
    );
  }

  const payload = buildReportPayload({
    periodStart,
    periodEnd,
    charter,
    tasks: (tasksRes.data ?? []) as TaskRow[],
    completions: (compsRes.data ?? []) as CompletionRow[],
    priorCompletions: (priorCompsRes.data ?? []) as CompletionRow[],
    taskNotes: (notesRes.data ?? []) as TaskNoteRow[],
    quickNotes: tagged,
    dailyGoals: (goalsRes.data ?? []) as DailyGoalRow[],
    priorDailyGoals: (priorGoalsRes.data ?? []) as DailyGoalRow[],
  });

  const context = await fetchReportContext(
    {
      fetchReportRows: async () => {
        if (!cpoFolder) return [];
        const { data } = await supabase
          .from('kb_documents')
          .select('id, title, content, source, metadata, created_at')
          .eq('new_user_id', userId)
          .eq('folder_id', cpoFolder.id)
          .eq('source', 'cbo');
        return (data ?? []) as KbDocumentRow[];
      },
      fetchHistory: async () => pageByRole('history'),
      fetchCharter: async () => charterContent,
    },
    periodStart,
    depth,
  );

  if (!context.history) warnings.push('History page is unwritten — the report has no longitudinal context.');
  if (context.priorReports.length === 0) warnings.push('No prior reports before this window — generating as a baseline report.');
  if (payload.notes.length === 0) warnings.push('No notes in this window — the report will have little to analyze.');

  return { payload, context, warnings, priorWindow: { start: priorStart, end: priorEnd } };
}

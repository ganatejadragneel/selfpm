// Local sample-data store for the Focus-ORE dashboard (build step 2).
// Stands in for Supabase while we build local-first. Swap the reader in
// focusLogic.ts for a real query later with NO change to the UI.
//
// PRIVACY: every value here is generic and work-neutral. No personal content.
// This file is committed; never seed it with real journal text.

export interface FocusDay {
  /** 0 = today, 1 = yesterday, 2 = two days ago ... */
  offset: number;
  /** Focus hours logged for that day (the Focus ORE numeric value). */
  hours: number;
  /** The verbatim per-ORE note for that day (only the recent ones carry one). */
  note?: string;
}

export interface FocusLogEntry {
  offset: number;
  /** quick note tagged `focus log` — wander count, reason, attention span. */
  text: string;
}

export type GoalStatus = 'done' | 'in_progress' | 'not_done';

export interface DailyGoal {
  id: string;
  label: string;
  status: GoalStatus;
  /** carried over from a prior day (shows a tally mark). */
  carriedOver?: boolean;
}

// ── Charter-driven config (the bits the dashboard reads from charter.md) ──
export const charter = {
  focusOreName: 'Hard Focus Hours',
  unit: 'hrs',
  // north-star goal: hold a weekly average of N per day
  weeklyAverageGoal: 6,
  notesTag: 'focus log',
};

// ── Focus ORE values, newest first (offset 0 = today, in progress) ──
export const focusDays: FocusDay[] = [
  { offset: 0, hours: 2.0 }, // today, still in progress
  {
    offset: 1,
    hours: 4.5,
    note: 'Two clean blocks before noon, then the afternoon got away from me — kept switching into admin tabs and lost the thread for about an hour. A short walk reset it and I got one more block in the evening. Ive noticed before that If i have a bad day sometimes, then all I have to do is wake up early the next dailyGoals, and Ill be bettter to follow my routine. Routine and ealy wake up are key!',
  },
  { offset: 2, hours: 6.5, note: 'Best day of the week. Started the first block within 20 minutes of sitting down and the momentum carried.' },
  { offset: 3, hours: 3.0, note: 'Slow start, low energy. Only really got going after the gym.' },
  { offset: 4, hours: 7.0, note: 'Deep on the build all day. Barely looked up.' },
  { offset: 5, hours: 5.5, note: 'Solid but a bit scattered in the last block.' },
  { offset: 6, hours: 4.0, note: 'Decent morning, quiet afternoon.' },
  { offset: 7, hours: 6.0 },
  { offset: 8, hours: 5.0 },
  { offset: 9, hours: 3.5 },
];

// ── Focus-log quick notes (the high-signal distraction data) ──
export const focusLog: FocusLogEntry[] = [
  { offset: 1, text: 'Block 1 — 0 wanders, ~50 min span. Block 2 — 4 wanders, all pulling toward planning instead of doing, ~15 min span. Evening block recovered to ~40 min.' },
  { offset: 2, text: 'Block 1 — 1 wander, ~55 min. Steady all day.' },
];

// ── Daily Goals (plan-adherence list, right rail) ──
export const dailyGoals: DailyGoal[] = [
  { id: 'g1', label: 'Deep work block — feature scaffold', status: 'in_progress' },
  { id: 'g2', label: 'Workout', status: 'done' },
  { id: 'g3', label: 'Write one page', status: 'not_done', carriedOver: true },
  { id: 'g4', label: 'Review weekly metrics', status: 'not_done' },
  { id: 'g5', label: 'Inbox to zero', status: 'done' },
];

// ── Placeholder AI output (steps 4–7 replace these with live model calls) ──
// Kept generic. The real text will come from the Analysis / Today's-Focus prompts.
export const placeholderAnalysis =
  'Yesterday held 4.5 focus hours — under the 6-hour line, but the shape tells the story more than the total. The two morning blocks were clean; the loss was a single mid-afternoon hour where attention kept pulling toward planning instead of doing. The walk that reset it is the lever: the dip was situational, not a low-capacity day. Naming the wander theme (plan-vs-do) is the win here — it is a recurring, fixable pattern rather than a mood.';

export const placeholderTodaysFocus =
  'Protect the first block: start within 20 minutes of sitting down, the same move that made your best day work. When you feel the pull to re-plan mid-afternoon, treat it as the signal to take the walk early rather than fighting the tab. One concrete target: two morning blocks before noon, no admin tabs open during them.';

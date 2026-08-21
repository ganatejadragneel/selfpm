// Lifetime tenure for the signed-in seeker: how many days since they started,
// and what share of those days has any activity at all.
//
// "Any activity" spans three tables deliberately. A day where the seeker only
// wrote a quick note, or only left a note on an ORE without completing it, is
// still a day they showed up — counting only completions would quietly punish
// the days that were hardest to show up for.
//
// Self-contained (its own fetch, its own state) so it can be dropped into any
// surface without threading data through a store.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import { computeTenure, EMPTY_TENURE, type Tenure } from './tenureLogic';

/** The seeker's local date — not UTC, so "today" means their today. */
function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function useTenure(): { tenure: Tenure; loading: boolean } {
  const userId = useSupabaseAuthStore((s) => s.user?.id ?? null);
  const [tenure, setTenure] = useState<Tenure>(EMPTY_TENURE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTenure(EMPTY_TENURE);
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      // One column each, lifetime. A year of daily logging is on the order of a
      // thousand rows across all three, so this stays a cheap single round trip
      // rather than something worth denormalising into a counter.
      const [completions, taskNotes, quickNotes] = await Promise.all([
        supabase.from('daily_task_completions').select('completion_date').eq('new_user_id', userId),
        supabase.from('daily_task_notes').select('note_date').eq('new_user_id', userId),
        supabase.from('quick_notes').select('created_at').eq('new_user_id', userId),
      ]);
      if (cancelled) return;

      const dates: string[] = [
        ...(completions.data ?? []).map((r) => r.completion_date as string),
        ...(taskNotes.data ?? []).map((r) => r.note_date as string),
        ...(quickNotes.data ?? []).map((r) => r.created_at as string),
      ];

      setTenure(computeTenure(dates, todayLocal()));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { tenure, loading };
}

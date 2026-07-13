// Daily Goals store — Supabase-backed (daily_goals), scoped to today.
// Mirrors the quickNotesStore pattern. Same component contract as the local
// version, plus init() + loading.

import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';
import type { DailyGoal, GoalStatus } from './sampleData';

const userId = () => useSupabaseAuthStore.getState().user?.id ?? null;
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local tz

const CYCLE: GoalStatus[] = ['not_done', 'in_progress', 'done'];

type GoalRow = { id: string; label: string; status: GoalStatus; carried_over: boolean; display_order: number };
const toGoal = (r: GoalRow): DailyGoal => ({ id: r.id, label: r.label, status: r.status, carriedOver: r.carried_over });

interface DailyGoalsStore {
  goals: DailyGoal[];
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  addGoal: (label: string) => Promise<void>;
  cycleStatus: (id: string) => Promise<void>;
  renameGoal: (id: string, label: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useDailyGoalsStore = create<DailyGoalsStore>((set, get) => ({
  goals: [],
  loading: false,
  initialized: false,

  init: async () => {
    const uid = userId();
    if (!uid) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from('daily_goals')
      .select('id, label, status, carried_over, display_order')
      .eq('new_user_id', uid)
      .eq('goal_date', today())
      .order('display_order', { ascending: true });
    if (error) return set({ loading: false, initialized: true });
    set({ goals: (data ?? []).map((r) => toGoal(r as GoalRow)), loading: false, initialized: true });
  },

  addGoal: async (label) => {
    const uid = userId();
    if (!uid || !label.trim()) return;
    const { data, error } = await supabase
      .from('daily_goals')
      .insert({ new_user_id: uid, goal_date: today(), label: label.trim(), status: 'not_done', display_order: get().goals.length })
      .select('id, label, status, carried_over, display_order')
      .single();
    if (error || !data) return;
    set((s) => ({ goals: [...s.goals, toGoal(data as GoalRow)] }));
  },

  cycleStatus: async (id) => {
    const g = get().goals.find((x) => x.id === id);
    if (!g) return;
    const next = CYCLE[(CYCLE.indexOf(g.status) + 1) % CYCLE.length];
    set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, status: next } : x)) }));
    await supabase.from('daily_goals').update({ status: next }).eq('id', id);
  },

  renameGoal: async (id, label) => {
    const clean = label.trim();
    if (!clean) return;
    set((s) => ({ goals: s.goals.map((x) => (x.id === id ? { ...x, label: clean } : x)) }));
    await supabase.from('daily_goals').update({ label: clean }).eq('id', id);
  },

  deleteGoal: async (id) => {
    set((s) => ({ goals: s.goals.filter((x) => x.id !== id) }));
    await supabase.from('daily_goals').delete().eq('id', id);
  },
}));

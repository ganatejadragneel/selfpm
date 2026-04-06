import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSupabaseAuthStore } from './supabaseAuthStore';
import type {
  Sprint,
  SprintWithMetrics,
  SprintMetricWithEntries,
  SprintMetricEntry,
  EntryData,
  SleepEntryData,
  BooleanEntryData,
  DurationEntryData,
  CompleteSprintResponse,
  MetricProgress,
  SprintProgress,
  SprintMetric,
  MetricType,
  MetricComponents,
  WeeklyTarget,
  DailyTarget,
  SprintSuggestion,
} from '../types/sprint';
import {
  USER_TIMEZONE,
} from '../constants/sprint';

// =====================================================
// STORE INTERFACE
// =====================================================

interface SprintStore {
  // State
  activeSprint: SprintWithMetrics | null;
  completedSprints: Sprint[];
  loading: boolean;
  error: string | null;
  // Sprint Operations
  fetchActiveSprint: () => Promise<SprintWithMetrics | null>;
  createSprint: (startDate: string, endDate: string) => Promise<string>;
  cloneSprintMetrics: (fromSprintId: string, toSprintId: string) => Promise<number>;
  completeSprint: (sprintId: string) => Promise<CompleteSprintResponse>;
  fetchCompletedSprints: () => Promise<Sprint[]>;
  fetchSprintById: (sprintId: string) => Promise<SprintWithMetrics | null>;
  fetchCompletedSprintCount: () => Promise<number>;
  deleteSprint: (sprintId: string) => Promise<void>;
  reopenSprint: (sprintId: string) => Promise<void>;

  // Metric Operations
  addMetric: (sprintId: string, metric: {
    name: string;
    metric_type: MetricType;
    components: MetricComponents;
    daily_target: DailyTarget;
    weekly_target: WeeklyTarget;
    display_order: number;
  }) => Promise<SprintMetric>;
  updateMetric: (metricId: string, updates: Partial<Pick<SprintMetric, 'name' | 'daily_target' | 'weekly_target' | 'components' | 'metric_type'>>) => Promise<void>;
  deleteMetric: (metricId: string) => Promise<void>;
  updateMetricType: (metricId: string, newType: MetricType, newDailyTarget: DailyTarget, newComponents: MetricComponents) => Promise<void>;
  reorderMetrics: (orderedIds: string[]) => Promise<void>;
  fetchSuggestions: () => Promise<SprintSuggestion[]>;

  // Entry Operations
  saveEntry: (metricId: string, entryDate: string, data: EntryData) => Promise<SprintMetricEntry>;
  updateEntry: (entryId: string, data: Partial<EntryData>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;

  // Progress Calculations
  calculateMetricProgress: (metric: SprintMetricWithEntries) => MetricProgress;
  calculateSprintProgress: (sprint: SprintWithMetrics) => SprintProgress;

  // Internal helpers
  _refreshActiveSprint: () => Promise<void>;
  _updateEntryInCache: (entry: SprintMetricEntry) => void;
  _removeEntryFromCache: (entryId: string) => void;
  clearError: () => void;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if a sleep entry meets the wake time target
 */
const checkSleepTarget = (wakeAt: string, targetEnd: string): boolean => {
  const wake = new Date(wakeAt);
  const [h, m] = targetEnd.split(':').map(Number);
  if (wake.getHours() < h) return true;
  if (wake.getHours() === h && wake.getMinutes() <= m) return true;
  return false;
};

/**
 * Check if a duration entry meets its target
 */
const checkDurationTarget = (durationMinutes: number, targetValue: number): boolean => {
  return durationMinutes >= targetValue;
};

/**
 * Check if a boolean entry meets its target (completed = true)
 */
const checkBooleanTarget = (completed: boolean): boolean => {
  return completed === true;
};

/**
 * Get the number of days elapsed in a sprint (1-7)
 */
const getDaysElapsed = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const localNow = new Date(now.toLocaleString('en-US', { timeZone: USER_TIMEZONE }));
  const diffTime = localNow.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 7);
};

// =====================================================
// STORE IMPLEMENTATION
// =====================================================

export const useSprintStore = create<SprintStore>((set, get) => ({
  // Initial state
  activeSprint: null,
  completedSprints: [],
  loading: false,
  error: null,
  // =====================================================
  // SPRINT OPERATIONS
  // =====================================================

  fetchActiveSprint: async () => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;

    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return null;
    }

    set({ loading: true, error: null });

    try {
      // Fetch active sprint
      const { data: sprint, error: sprintError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (sprintError) {
        if (sprintError.code === 'PGRST116') {
          // No active sprint found
          set({ activeSprint: null, loading: false });
          return null;
        }
        throw sprintError;
      }

      // Fetch metrics for this sprint
      const { data: metrics, error: metricsError } = await supabase
        .from('sprint_metrics')
        .select('*')
        .eq('sprint_id', sprint.id)
        .order('display_order', { ascending: true });

      if (metricsError) throw metricsError;

      // Fetch all entries for these metrics
      const metricIds = (metrics || []).map((m) => m.id);
      let entries: SprintMetricEntry[] = [];

      if (metricIds.length > 0) {
        const { data: entriesData, error: entriesError } = await supabase
          .from('sprint_metric_entries')
          .select('*')
          .in('metric_id', metricIds);

        if (entriesError) throw entriesError;
        entries = entriesData || [];
      }

      // Assemble the full sprint with metrics and entries
      const metricsWithEntries: SprintMetricWithEntries[] = (metrics || []).map((metric) => ({
        ...metric,
        entries: entries.filter((e) => e.metric_id === metric.id),
      }));

      const sprintWithMetrics: SprintWithMetrics = {
        ...sprint,
        metrics: metricsWithEntries,
      };

      set({ activeSprint: sprintWithMetrics, loading: false });
      return sprintWithMetrics;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  createSprint: async (startDate, endDate) => {
    const { data, error } = await supabase.rpc('create_sprint', {
      p_start_date: startDate,
      p_end_date: endDate,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  cloneSprintMetrics: async (fromSprintId, toSprintId) => {
    const { data, error } = await supabase.rpc('clone_sprint_metrics', {
      p_from_sprint_id: fromSprintId,
      p_to_sprint_id: toSprintId,
    });
    if (error) throw new Error(error.message);
    return data as number;
  },

  completeSprint: async (sprintId) => {
    const { error } = await supabase.rpc('complete_sprint', {
      p_sprint_id: sprintId,
    });
    if (error) {
      // RPC may fail for expired sprints (date constraint on entries).
      // Fall back to directly marking the sprint completed.
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      const { error: updateError } = await supabase
        .from('sprints')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', sprintId)
        .eq('user_id', userId);
      if (updateError) throw new Error(updateError.message);
    }
    set({ activeSprint: null, error: null });
    return { completed_sprint_id: sprintId };
  },

  fetchCompletedSprints: async () => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;

    if (!userId) {
      set({ error: 'User not authenticated' });
      return [];
    }

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

      if (error) throw error;

      set({ completedSprints: data || [], loading: false });
      return data || [];
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchSprintById: async (sprintId: string) => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;

    if (!userId) {
      set({ error: 'User not authenticated' });
      return null;
    }

    set({ loading: true, error: null });

    try {
      // Fetch sprint
      const { data: sprint, error: sprintError } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .eq('user_id', userId)
        .single();

      if (sprintError) throw sprintError;

      // Fetch metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('sprint_metrics')
        .select('*')
        .eq('sprint_id', sprintId)
        .order('display_order', { ascending: true });

      if (metricsError) throw metricsError;

      // Fetch entries
      const metricIds = (metrics || []).map((m) => m.id);
      let entries: SprintMetricEntry[] = [];

      if (metricIds.length > 0) {
        const { data: entriesData, error: entriesError } = await supabase
          .from('sprint_metric_entries')
          .select('*')
          .in('metric_id', metricIds);

        if (entriesError) throw entriesError;
        entries = entriesData || [];
      }

      const metricsWithEntries: SprintMetricWithEntries[] = (metrics || []).map((metric) => ({
        ...metric,
        entries: entries.filter((e) => e.metric_id === metric.id),
      }));

      const sprintWithMetrics: SprintWithMetrics = {
        ...sprint,
        metrics: metricsWithEntries,
      };

      set({ loading: false });
      return sprintWithMetrics;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  fetchCompletedSprintCount: async () => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) return 0;
    const { count, error } = await supabase
      .from('sprints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  deleteSprint: async (sprintId) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    const { error } = await supabase.from('sprints').delete().eq('id', sprintId).eq('user_id', userId).eq('status', 'active');
    if (error) throw new Error(error.message);
  },

  reopenSprint: async (sprintId) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    // Guard: only one active sprint allowed
    const { data: existing } = await supabase
      .from('sprints').select('id').eq('user_id', userId).eq('status', 'active').maybeSingle();
    if (existing) throw new Error('You already have an active sprint. Complete it before reopening another.');
    const { error } = await supabase
      .from('sprints')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', sprintId).eq('user_id', userId);
    if (error) throw new Error(error.message);
    await get().fetchActiveSprint();
  },

  // =====================================================
  // METRIC OPERATIONS
  // =====================================================

  addMetric: async (sprintId, metric) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { typeChanged: _tc, ...metricFields } = metric as typeof metric & { typeChanged?: boolean };
    const { data, error } = await supabase
      .from('sprint_metrics')
      .insert([{ sprint_id: sprintId, user_id: userId, ...metricFields }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    const newMetric: SprintMetricWithEntries = { ...data, entries: [] };
    set(state => {
      if (!state.activeSprint) return state;
      return { activeSprint: { ...state.activeSprint, metrics: [...state.activeSprint.metrics, newMetric] } };
    });
    return data;
  },

  updateMetric: async (metricId, updates) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('sprint_metrics')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', metricId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    set(state => {
      if (!state.activeSprint) return state;
      return { activeSprint: { ...state.activeSprint, metrics: state.activeSprint.metrics.map(m => m.id === metricId ? { ...m, ...data } : m) } };
    });
  },

  deleteMetric: async (metricId) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    const snapshot = get().activeSprint?.metrics ?? [];
    set(state => {
      if (!state.activeSprint) return state;
      return { activeSprint: { ...state.activeSprint, metrics: state.activeSprint.metrics.filter(m => m.id !== metricId) } };
    });
    const { data: deleted, error } = await supabase
      .from('sprint_metrics')
      .delete()
      .eq('id', metricId)
      .eq('user_id', userId)
      .select('id');
    if (error || !deleted?.length) {
      set(state => {
        if (!state.activeSprint) return state;
        return { activeSprint: { ...state.activeSprint, metrics: [...snapshot].sort((a, b) => a.display_order - b.display_order) } };
      });
      throw new Error(error?.message ?? 'Delete failed — check Supabase RLS policies for sprint_metrics');
    }
  },

  updateMetricType: async (metricId, newType, newDailyTarget, newComponents) => {
    const { error } = await supabase.rpc('update_metric_type', {
      p_metric_id: metricId,
      p_new_metric_type: newType,
      p_new_daily_target: newDailyTarget,
      p_new_components: newComponents,
    });
    if (error) throw new Error(error.message);
    set(state => {
      if (!state.activeSprint) return state;
      return { activeSprint: { ...state.activeSprint, metrics: state.activeSprint.metrics.map(m => m.id === metricId ? { ...m, metric_type: newType, daily_target: newDailyTarget, components: newComponents, entries: [] } : m) } };
    });
  },

  reorderMetrics: async (orderedIds) => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');
    set(state => {
      if (!state.activeSprint) return state;
      const metricsById = Object.fromEntries(state.activeSprint.metrics.map(m => [m.id, m]));
      return { activeSprint: { ...state.activeSprint, metrics: orderedIds.map((id, i) => ({ ...metricsById[id], display_order: i })) } };
    });
    await Promise.all(orderedIds.map((id, i) => supabase.from('sprint_metrics').update({ display_order: i }).eq('id', id).eq('user_id', userId)));
  },

  fetchSuggestions: async () => {
    const userId = useSupabaseAuthStore.getState().user?.id;
    if (!userId) return [];
    const { data: sprints, error: sprintsErr } = await supabase
      .from('sprints').select('id').eq('user_id', userId).eq('status', 'completed')
      .order('end_date', { ascending: false }).order('created_at', { ascending: false }).limit(4);
    if (sprintsErr || !sprints?.length) return [];
    const sprintIds = sprints.map(s => s.id);
    const { data: metrics, error: metricsErr } = await supabase
      .from('sprint_metrics').select('name, metric_type, components, daily_target, weekly_target, sprint_id').in('sprint_id', sprintIds);
    if (metricsErr || !metrics?.length) return [];
    const seen = new Map<string, SprintSuggestion>();
    for (const sprintId of sprintIds) {
      const sprintIndex = sprintIds.indexOf(sprintId);
      const sprintMetrics = metrics.filter(m => m.sprint_id === sprintId);
      for (const m of sprintMetrics) {
        const key = m.name.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, { name: m.name, metric_type: m.metric_type, components: m.components, daily_target: m.daily_target, weekly_target: m.weekly_target, usedNSprintsAgo: sprintIndex + 1 });
        }
      }
    }
    return Array.from(seen.values());
  },

  // =====================================================
  // ENTRY OPERATIONS
  // =====================================================

  saveEntry: async (metricId: string, entryDate: string, data: EntryData) => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    set({ loading: true, error: null });

    try {
      // Build the insert object based on entry type
      const insertData: Record<string, unknown> = {
        metric_id: metricId,
        user_id: userId,
        entry_date: entryDate,
      };

      if ('bed_at' in data && 'wake_at' in data) {
        // Sleep entry
        insertData.bed_at = (data as SleepEntryData).bed_at;
        insertData.wake_at = (data as SleepEntryData).wake_at;
      } else if ('completed' in data) {
        // Boolean entry
        insertData.completed = (data as BooleanEntryData).completed;
      } else if ('duration_minutes' in data) {
        // Duration entry
        insertData.duration_minutes = (data as DurationEntryData).duration_minutes;
      }

      if ('notes' in data && data.notes) {
        insertData.notes = data.notes;
      }

      // Check if entry already exists
      const { data: existingEntry } = await supabase
        .from('sprint_metric_entries')
        .select('id')
        .eq('metric_id', metricId)
        .eq('entry_date', entryDate)
        .single();

      let entry;
      let error;

      if (existingEntry) {
        // Update existing entry
        const { data, error: updateError } = await supabase
          .from('sprint_metric_entries')
          .update(insertData)
          .eq('id', existingEntry.id)
          .select()
          .single();
        entry = data;
        error = updateError;
      } else {
        // Insert new entry
        const { data, error: insertError } = await supabase
          .from('sprint_metric_entries')
          .insert(insertData)
          .select()
          .single();
        entry = data;
        error = insertError;
      }

      if (error) {
        console.error('Database error saving entry:', error);
        throw new Error(error.message || JSON.stringify(error));
      }

      // Update cache
      get()._updateEntryInCache(entry);

      set({ loading: false });
      return entry;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateEntry: async (entryId: string, data: Partial<EntryData>) => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    set({ loading: true, error: null });

    try {
      const updateData: Record<string, unknown> = {};

      if ('bed_at' in data) updateData.bed_at = data.bed_at;
      if ('wake_at' in data) updateData.wake_at = data.wake_at;
      if ('completed' in data) updateData.completed = data.completed;
      if ('duration_minutes' in data) updateData.duration_minutes = data.duration_minutes;
      if ('notes' in data) updateData.notes = data.notes;

      const { data: entry, error } = await supabase
        .from('sprint_metric_entries')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      get()._updateEntryInCache(entry);

      set({ loading: false });
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  deleteEntry: async (entryId: string) => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('sprint_metric_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);

      if (error) throw error;

      get()._removeEntryFromCache(entryId);

      set({ loading: false });
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // =====================================================
  // PROGRESS CALCULATIONS
  // =====================================================

  calculateMetricProgress: (metric: SprintMetricWithEntries): MetricProgress => {
    const weeklyTarget = metric.weekly_target as { count: number; total: number };
    let metCount = 0;

    for (const entry of metric.entries) {
      let met = false;

      if (metric.metric_type === 'sleep' && entry.wake_at && metric.daily_target.type === 'time_of_day') {
        met = checkSleepTarget(entry.wake_at, metric.daily_target.target_end);
      } else if (metric.metric_type === 'boolean' && entry.completed !== null) {
        met = checkBooleanTarget(entry.completed);
      } else if (metric.metric_type === 'duration' && entry.duration_minutes !== null && metric.daily_target.type === 'number') {
        met = checkDurationTarget(entry.duration_minutes, metric.daily_target.value);
      }

      if (met) metCount++;
    }

    const sprint = get().activeSprint;
    const daysElapsed = sprint ? getDaysElapsed(sprint.start_date) : 7;

    return {
      metricId: metric.id,
      metricName: metric.name,
      current: metCount,
      target: weeklyTarget.count,
      totalEntries: metric.entries.length,
      daysElapsed,
      isMet: metCount >= weeklyTarget.count,
    };
  },

  calculateSprintProgress: (sprint: SprintWithMetrics): SprintProgress => {
    const daysElapsed = getDaysElapsed(sprint.start_date);
    const daysRemaining = 7 - daysElapsed;

    const metricProgresses = sprint.metrics.map((m) => get().calculateMetricProgress(m));

    const onTrackCount = metricProgresses.filter((p) => {
      // A metric is "on track" if current / daysElapsed >= target / 7
      const requiredPace = (p.target / 7) * p.daysElapsed;
      return p.current >= requiredPace;
    }).length;

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      status: sprint.status,
      daysElapsed,
      daysRemaining,
      metrics: metricProgresses,
      overallScore: Math.round((onTrackCount / sprint.metrics.length) * 100),
    };
  },

  // =====================================================
  // INTERNAL HELPERS
  // =====================================================

  _refreshActiveSprint: async () => {
    await get().fetchActiveSprint();
  },

  _updateEntryInCache: (entry: SprintMetricEntry) => {
    set((state) => {
      if (!state.activeSprint) return state;

      const updatedMetrics = state.activeSprint.metrics.map((metric) => {
        if (metric.id !== entry.metric_id) return metric;

        const existingIndex = metric.entries.findIndex((e) => e.id === entry.id);
        let updatedEntries: SprintMetricEntry[];

        if (existingIndex >= 0) {
          // Update existing
          updatedEntries = metric.entries.map((e) => (e.id === entry.id ? entry : e));
        } else {
          // Add new
          updatedEntries = [...metric.entries, entry];
        }

        return { ...metric, entries: updatedEntries };
      });

      return {
        activeSprint: {
          ...state.activeSprint,
          metrics: updatedMetrics,
        },
      };
    });
  },

  _removeEntryFromCache: (entryId: string) => {
    set((state) => {
      if (!state.activeSprint) return state;

      const updatedMetrics = state.activeSprint.metrics.map((metric) => ({
        ...metric,
        entries: metric.entries.filter((e) => e.id !== entryId),
      }));

      return {
        activeSprint: {
          ...state.activeSprint,
          metrics: updatedMetrics,
        },
      };
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

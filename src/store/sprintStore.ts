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
} from '../types/sprint';
import {
  isSprintEnabledForUser,
  getCurrentSprintDates,
  DURATION_TARGETS,
  SLEEP_WAKE_TARGET,
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
  isFeatureEnabled: boolean;

  // Sprint Operations
  checkFeatureEnabled: () => boolean;
  fetchActiveSprint: () => Promise<SprintWithMetrics | null>;
  ensureActiveSprint: () => Promise<SprintWithMetrics | null>;
  completeSprint: (sprintId: string) => Promise<CompleteSprintResponse>;
  fetchCompletedSprints: () => Promise<Sprint[]>;
  fetchSprintById: (sprintId: string) => Promise<SprintWithMetrics | null>;

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
const checkSleepTarget = (wakeAt: string): boolean => {
  const wakeDate = new Date(wakeAt);
  // Convert to local timezone
  const wakeLocal = new Date(wakeDate.toLocaleString('en-US', { timeZone: USER_TIMEZONE }));
  const wakeHours = wakeLocal.getHours();
  const wakeMinutes = wakeLocal.getMinutes();

  // Target: wake by 4:30am
  const targetMinutes = SLEEP_WAKE_TARGET.hours * 60 + SLEEP_WAKE_TARGET.minutes;
  const actualMinutes = wakeHours * 60 + wakeMinutes;

  return actualMinutes <= targetMinutes;
};

/**
 * Check if a duration entry meets its target
 */
const checkDurationTarget = (metricName: string, durationMinutes: number): boolean => {
  const target = DURATION_TARGETS[metricName as keyof typeof DURATION_TARGETS];
  if (target === undefined) return false;
  return durationMinutes >= target;
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
  isFeatureEnabled: false,

  // =====================================================
  // FEATURE CHECK
  // =====================================================

  checkFeatureEnabled: () => {
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;
    const enabled = isSprintEnabledForUser(userId);
    set({ isFeatureEnabled: enabled });
    return enabled;
  },

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

  ensureActiveSprint: async () => {
    const state = get();

    // Check if feature is enabled
    if (!state.checkFeatureEnabled()) {
      set({ error: 'Sprint feature not enabled for this user', loading: false });
      return null;
    }

    set({ loading: true, error: null });

    try {
      // First check if we already have an active sprint
      const existing = await state.fetchActiveSprint();
      if (existing) {
        return existing;
      }

      // No active sprint - create one
      const { startDate, endDate } = getCurrentSprintDates();

      const { error: createError } = await supabase
        .rpc('create_sprint_with_metrics', {
          p_start_date: startDate,
          p_end_date: endDate,
        });

      if (createError) {
        // Handle "already has active sprint" gracefully (race condition)
        if (createError.message?.includes('already has an active sprint')) {
          const sprint = await state.fetchActiveSprint();
          if (sprint) return sprint;
        }
        throw createError;
      }

      // Fetch the newly created sprint
      return await state.fetchActiveSprint();
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  completeSprint: async (sprintId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .rpc('complete_sprint', { p_sprint_id: sprintId });

      if (error) throw error;

      // Refresh to get the new active sprint
      await get()._refreshActiveSprint();

      set({ loading: false });
      return data as CompleteSprintResponse;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, loading: false });
      throw error;
    }
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
        console.error('Database error:', error);
        throw error;
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

      if (metric.metric_type === 'sleep' && entry.wake_at) {
        met = checkSleepTarget(entry.wake_at);
      } else if (metric.metric_type === 'boolean' && entry.completed !== null) {
        met = checkBooleanTarget(entry.completed);
      } else if (metric.metric_type === 'duration' && entry.duration_minutes !== null) {
        met = checkDurationTarget(metric.name, entry.duration_minutes);
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

import { useState, useEffect, useCallback } from 'react';
import { useSprintStore } from '../store/sprintStore';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import type {
  SprintWithMetrics,
  Sprint,
  SprintMetric,
  SprintMetricEntry,
  EntryData,
  CompleteSprintResponse,
  SprintProgress,
  MetricProgress,
  MetricType,
  MetricComponents,
  DailyTarget,
  WeeklyTarget,
  SprintSuggestion,
} from '../types/sprint';

// =====================================================
// HOOK RETURN TYPE
// =====================================================

export interface UseSprintReturn {
  // State
  loading: boolean;
  error: string | null;
  activeSprint: SprintWithMetrics | null;
  completedSprints: Sprint[];
  sprintProgress: SprintProgress | null;

  // Sprint Operations
  refreshActiveSprint: () => Promise<void>;
  completeSprint: (sprintId: string) => Promise<CompleteSprintResponse>;
  fetchCompletedSprints: () => Promise<Sprint[]>;
  fetchSprintById: (sprintId: string) => Promise<SprintWithMetrics | null>;

  // Entry Operations
  saveEntry: (metricId: string, entryDate: string, data: EntryData) => Promise<SprintMetricEntry>;
  updateEntry: (entryId: string, data: Partial<EntryData>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;

  // Progress
  getMetricProgress: (metricId: string) => MetricProgress | null;

  // Sprint creation
  createSprint: (startDate: string, endDate: string) => Promise<string>;
  cloneSprintMetrics: (fromId: string, toId: string) => Promise<number>;
  deleteSprint: (sprintId: string) => Promise<void>;

  // Metric operations
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

  // Data fetching
  fetchCompletedSprintCount: () => Promise<number>;
  fetchSuggestions: () => Promise<SprintSuggestion[]>;

  // Utility
  clearError: () => void;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

/**
 * Custom hook for managing sprints
 * Handles feature gating and auto-fetch on mount
 */
export const useSprint = (): UseSprintReturn => {
  // Local state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sprintProgress, setSprintProgress] = useState<SprintProgress | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Get auth state
  const { user } = useSupabaseAuthStore();

  // Get store
  const {
    activeSprint,
    completedSprints,
    loading: storeLoading,
    error: storeError,
    fetchActiveSprint: storeFetchActiveSprint,
    completeSprint: storeCompleteSprint,
    fetchCompletedSprints: storeFetchCompletedSprints,
    fetchSprintById: storeFetchSprintById,
    saveEntry: storeSaveEntry,
    updateEntry: storeUpdateEntry,
    deleteEntry: storeDeleteEntry,
    calculateSprintProgress,
    calculateMetricProgress,
    clearError: storeClearError,
    createSprint: storeCreateSprint,
    cloneSprintMetrics: storeCloneSprintMetrics,
    deleteSprint: storeDeleteSprint,
    addMetric: storeAddMetric,
    updateMetric: storeUpdateMetric,
    deleteMetric: storeDeleteMetric,
    updateMetricType: storeUpdateMetricType,
    reorderMetrics: storeReorderMetrics,
    fetchCompletedSprintCount: storeFetchCompletedSprintCount,
    fetchSuggestions: storeFetchSuggestions,
  } = useSprintStore();

  // Auto-fetch sprint when user is authenticated
  useEffect(() => {
    if (!user?.id || initialized) return;
    setLoading(true);
    storeFetchActiveSprint()
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load sprint'))
      .finally(() => { setLoading(false); setInitialized(true); });
  }, [user?.id, initialized, storeFetchActiveSprint]);

  // Calculate progress when activeSprint changes
  useEffect(() => {
    if (activeSprint) {
      const progress = calculateSprintProgress(activeSprint);
      setSprintProgress(progress);
    } else {
      setSprintProgress(null);
    }
  }, [activeSprint, calculateSprintProgress]);

  // =====================================================
  // SPRINT OPERATIONS
  // =====================================================

  const refreshActiveSprint = useCallback(async (): Promise<void> => {

    setLoading(true);
    setError(null);

    try {
      await storeFetchActiveSprint();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh sprint';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeFetchActiveSprint]);

  const completeSprint = useCallback(
    async (sprintId: string): Promise<CompleteSprintResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await storeCompleteSprint(sprintId);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete sprint';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeCompleteSprint]
  );

  const fetchCompletedSprints = useCallback(async (): Promise<Sprint[]> => {
    setLoading(true);
    setError(null);

    try {
      const sprints = await storeFetchCompletedSprints();
      return sprints;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch completed sprints';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeFetchCompletedSprints]);

  const fetchSprintById = useCallback(
    async (sprintId: string): Promise<SprintWithMetrics | null> => {
      setLoading(true);
      setError(null);

      try {
        const sprint = await storeFetchSprintById(sprintId);
        return sprint;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sprint';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeFetchSprintById]
  );

  // =====================================================
  // ENTRY OPERATIONS
  // =====================================================

  const saveEntry = useCallback(
    async (metricId: string, entryDate: string, data: EntryData): Promise<SprintMetricEntry> => {
      setLoading(true);
      setError(null);

      try {
        const entry = await storeSaveEntry(metricId, entryDate, data);
        return entry;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save entry';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeSaveEntry]
  );

  const updateEntry = useCallback(
    async (entryId: string, data: Partial<EntryData>): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await storeUpdateEntry(entryId, data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update entry';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeUpdateEntry]
  );

  const deleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await storeDeleteEntry(entryId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeDeleteEntry]
  );

  // =====================================================
  // PROGRESS HELPERS
  // =====================================================

  const getMetricProgress = useCallback(
    (metricId: string): MetricProgress | null => {
      if (!activeSprint) return null;

      const metric = activeSprint.metrics.find((m) => m.id === metricId);
      if (!metric) return null;

      return calculateMetricProgress(metric);
    },
    [activeSprint, calculateMetricProgress]
  );

  // =====================================================
  // UTILITY
  // =====================================================

  const clearError = useCallback(() => {
    setError(null);
    storeClearError();
  }, [storeClearError]);

  // Combine loading states
  const combinedLoading = loading || storeLoading;

  // Combine errors (prefer local error)
  const combinedError = error || storeError;

  return {
    // State
    loading: combinedLoading,
    error: combinedError,
    activeSprint,
    completedSprints,
    sprintProgress,

    // Sprint operations
    refreshActiveSprint,
    completeSprint,
    fetchCompletedSprints,
    fetchSprintById,

    // Entry operations
    saveEntry,
    updateEntry,
    deleteEntry,

    // Progress
    getMetricProgress,

    // Sprint creation
    createSprint: storeCreateSprint,
    cloneSprintMetrics: storeCloneSprintMetrics,
    deleteSprint: storeDeleteSprint,

    // Metric operations
    addMetric: storeAddMetric,
    updateMetric: storeUpdateMetric,
    deleteMetric: storeDeleteMetric,
    updateMetricType: storeUpdateMetricType,
    reorderMetrics: storeReorderMetrics,

    // Data fetching
    fetchCompletedSprintCount: storeFetchCompletedSprintCount,
    fetchSuggestions: storeFetchSuggestions,

    // Utility
    clearError,
  };
};

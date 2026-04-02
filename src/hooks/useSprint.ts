import { useState, useEffect, useCallback } from 'react';
import { useSprintStore } from '../store/sprintStore';
import { useSupabaseAuthStore } from '../store/supabaseAuthStore';
import type {
  SprintWithMetrics,
  Sprint,
  SprintMetricEntry,
  EntryData,
  CompleteSprintResponse,
  SprintProgress,
  MetricProgress,
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
  ensureActiveSprint: () => Promise<SprintWithMetrics | null>;
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

  // Utility
  clearError: () => void;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

/**
 * Custom hook for managing sprints
 * Handles feature gating and auto-creation on mount
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
    ensureActiveSprint: storeEnsureActiveSprint,
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
  } = useSprintStore();

  // Auto-fetch/create sprint when user is authenticated
  useEffect(() => {
    if (!user?.id || initialized) {
      return;
    }

    const initializeSprint = async () => {
      setLoading(true);
      setError(null);

      try {
        await storeEnsureActiveSprint();
        setInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize sprint';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeSprint();
  }, [user?.id, initialized, storeEnsureActiveSprint]);

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

  const ensureActiveSprint = useCallback(async (): Promise<SprintWithMetrics | null> => {
    setLoading(true);
    setError(null);

    try {
      const sprint = await storeEnsureActiveSprint();
      return sprint;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ensure active sprint';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeEnsureActiveSprint]);

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
    ensureActiveSprint,
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

    // Utility
    clearError,
  };
};

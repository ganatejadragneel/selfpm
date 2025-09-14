import { useState, useEffect, useCallback } from 'react';
import { useMigratedTaskStore } from '../store/migratedTaskStore';
import type { Task } from '../types';

export interface UseDataFetchingReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidateCache: () => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 min default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

export const useDataFetching = (cacheKey: string = 'tasks', ttl: number = 300000): UseDataFetchingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { tasks, fetchTasks } = useMigratedTaskStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cachedData = cache.get<Task[]>(cacheKey);
      if (cachedData) {
        setLoading(false);
        return;
      }
      
      // Fetch fresh data
      await fetchTasks();
      
      // Cache the result
      cache.set(cacheKey, tasks, ttl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, ttl, fetchTasks, tasks]);

  const invalidateCache = useCallback(() => {
    cache.invalidate(cacheKey);
  }, [cacheKey]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-invalidate cache when tasks change
  useEffect(() => {
    cache.set(cacheKey, tasks, ttl);
  }, [tasks, cacheKey, ttl]);

  return {
    tasks,
    loading,
    error,
    refetch,
    invalidateCache,
  };
};

// Specialized hooks for common data fetching patterns
export const useTasksFetch = () => useDataFetching('tasks', 300000);

export const useWeeklyTasksFetch = (weekNumber: number) => {
  const cacheKey = `weekly-tasks-${weekNumber}`;
  return useDataFetching(cacheKey, 180000); // 3 min TTL for weekly data
};
// Shared Cache Management - Phase 7B DRY Refactoring
// INTERNAL UTILITY - Extracted from useDataFetching.ts

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Universal cache implementation (extracted from useDataFetching)
export class UniversalCache {
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

  // Additional utility methods
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create global cache instance (can be used across multiple hooks)
export const globalCache = new UniversalCache();

// Cache utilities for common patterns
export const createCacheKey = (...parts: (string | number | boolean)[]): string => {
  return parts.filter(Boolean).join(':');
};

export const withCache = <T>(
  cache: UniversalCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) => async (): Promise<T> => {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached) return cached;

  // Fetch and cache result
  const result = await fetcher();
  cache.set(key, result, ttl);
  return result;
};
/**
 * CacheService - Manages data caching for performance optimization
 * Implements TTL-based caching with invalidation strategies
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for grouped invalidation
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;
  private maxCacheSize: number;
  private tagIndex: Map<string, Set<string>>;
  
  constructor(defaultTTL: number = 5 * 60 * 1000, maxCacheSize: number = 100) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxCacheSize = maxCacheSize;
    this.tagIndex = new Map();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }
  
  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }
    
    // Update access time for LRU
    entry.timestamp = Date.now();
    
    return entry.data as T;
  }
  
  /**
   * Set cache data with options
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const ttl = options.ttl ?? this.defaultTTL;
    const tags = options.tags ?? [];
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    };
    
    // Clean up old tags if updating existing entry
    const oldEntry = this.cache.get(key);
    if (oldEntry?.tags) {
      this.removeFromTagIndex(key, oldEntry.tags);
    }
    
    // Set new entry
    this.cache.set(key, entry);
    
    // Update tag index
    if (tags.length > 0) {
      this.addToTagIndex(key, tags);
    }
  }
  
  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (entry) {
      // Remove from tag index
      if (entry.tags) {
        this.removeFromTagIndex(key, entry.tags);
      }
      
      return this.cache.delete(key);
    }
    
    return false;
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }
  
  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    
    if (!keys) {
      return 0;
    }
    
    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }
    
    // Clean up tag index
    this.tagIndex.delete(tag);
    
    return count;
  }
  
  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let count = 0;
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      if (this.delete(key)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    tags: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate(),
      tags: this.tagIndex.size
    };
  }
  
  /**
   * Memoize function results
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    options: CacheOptions = {}
  ): T {
    const generateKey = keyGenerator || ((...args) => JSON.stringify(args));
    
    return ((...args: Parameters<T>) => {
      const key = `memoize:${fn.name}:${generateKey(...args)}`;
      
      // Check cache
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.then(data => {
          this.set(key, data, options);
          return data;
        }) as ReturnType<T>;
      }
      
      // Cache and return result
      this.set(key, result, options);
      return result;
    }) as T;
  }
  
  /**
   * Cache with refresh strategy
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Get fresh data
    const data = await factory();
    
    // Cache the result
    this.set(key, data, options);
    
    return data;
  }
  
  /**
   * Batch get multiple cache entries
   */
  getMany<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    
    return results;
  }
  
  /**
   * Batch set multiple cache entries
   */
  setMany<T>(entries: Array<[string, T, CacheOptions?]>): void {
    for (const [key, data, options] of entries) {
      this.set(key, data, options);
    }
  }
  
  // Private methods
  
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
  
  private addToTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }
  
  private removeFromTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }
  
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Run every minute
  }
  
  private cleanup(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.delete(key);
    }
  }
  
  private calculateHitRate(): number {
    // This would require tracking hits and misses
    // For now, return a placeholder
    return 0;
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
}

// Cache key generators for consistent key creation
export const CacheKeys = {
  task: (id: string) => `task:${id}`,
  tasksByWeek: (userId: string, week: number) => `tasks:${userId}:week:${week}`,
  tasksByCategory: (userId: string, category: string) => `tasks:${userId}:category:${category}`,
  dependencies: (userId: string) => `dependencies:${userId}`,
  recurringTemplates: (userId: string) => `recurring:${userId}`,
  statistics: (userId: string, week?: number) => `stats:${userId}:${week || 'all'}`,
  progress: (taskId: string) => `progress:${taskId}`,
  activities: (userId: string, date: string) => `activities:${userId}:${date}`,
  userPreferences: (userId: string) => `preferences:${userId}`
};

// Cache tags for grouped invalidation
export const CacheTags = {
  TASKS: 'tasks',
  DEPENDENCIES: 'dependencies',
  RECURRING: 'recurring',
  STATISTICS: 'statistics',
  USER_DATA: 'user-data'
};
/**
 * BaseRepository - Abstract data access layer following SOLID principles
 * Provides common CRUD operations and abstracts database implementation
 */

import { supabase } from '../../lib/supabase';

export interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
}

export interface RepositoryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface RepositoryListResult<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

/**
 * Base repository class providing common database operations
 * Following DIP: High-level modules depend on abstractions
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string;
  protected client = supabase;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Transform database snake_case to camelCase
   * Can be overridden in child classes for custom transformations
   */
  protected transformFromDatabase(data: Record<string, unknown>): T {
    if (!data) return data as T;
    
    const transformed: Record<string, unknown> = {};
    for (const key in data) {
      const camelKey = this.snakeToCamel(key);
      transformed[camelKey] = data[key];
    }
    return transformed as T;
  }

  /**
   * Transform camelCase to database snake_case
   * Can be overridden in child classes for custom transformations
   */
  protected transformToDatabase(data: Partial<T>): Record<string, unknown> {
    if (!data) return data;
    
    const transformed: Record<string, unknown> = {};
    for (const key in data) {
      const snakeKey = this.camelToSnake(key);
      transformed[snakeKey] = (data as Record<string, unknown>)[key];
    }
    return transformed;
  }

  /**
   * Convert snake_case to camelCase
   */
  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<RepositoryResult<T>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: this.transformFromDatabase(data),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options?: QueryOptions): Promise<RepositoryListResult<T>> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact' });

      // Apply filters
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          const snakeKey = this.camelToSnake(key);
          if (value === null) {
            query = query.is(snakeKey, null);
          } else if (Array.isArray(value)) {
            query = query.in(snakeKey, value);
          } else {
            query = query.eq(snakeKey, value);
          }
        }
      }

      // Apply ordering
      if (options?.orderBy) {
        for (const order of options.orderBy) {
          const snakeColumn = this.camelToSnake(order.column);
          query = query.order(snakeColumn, { ascending: order.ascending ?? true });
        }
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data ? data.map(item => this.transformFromDatabase(item)) : null,
        error: null,
        count: count ?? undefined,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id'>): Promise<RepositoryResult<T>> {
    try {
      const transformed = this.transformToDatabase(data as Partial<T>);
      
      const { data: created, error } = await this.client
        .from(this.tableName)
        .insert(transformed)
        .select()
        .single();

      if (error) throw error;

      return {
        data: this.transformFromDatabase(created),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, updates: Partial<T>): Promise<RepositoryResult<T>> {
    try {
      const transformed = this.transformToDatabase(updates);
      
      const { data, error } = await this.client
        .from(this.tableName)
        .update(transformed)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: this.transformFromDatabase(data),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: false,
        error: error as Error,
      };
    }
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data: Omit<T, 'id'>[]): Promise<RepositoryListResult<T>> {
    try {
      const transformed = data.map(item => this.transformToDatabase(item as Partial<T>));
      
      const { data: created, error } = await this.client
        .from(this.tableName)
        .insert(transformed)
        .select();

      if (error) throw error;

      return {
        data: created ? created.map(item => this.transformFromDatabase(item)) : null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<RepositoryListResult<T>> {
    try {
      const results = await Promise.all(
        updates.map(({ id, data }) => this.update(id, data))
      );

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} records`);
      }

      return {
        data: results.map(r => r.data!),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Bulk delete records
   */
  async bulkDelete(ids: string[]): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .in('id', ids);

      if (error) throw error;

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: false,
        error: error as Error,
      };
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(filters?: Record<string, any>): Promise<RepositoryResult<number>> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          const snakeKey = this.camelToSnake(key);
          query = query.eq(snakeKey, value);
        }
      }

      const { count, error } = await query;

      if (error) throw error;

      return {
        data: count ?? 0,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.count({ id });
    return result.data === 1;
  }
}
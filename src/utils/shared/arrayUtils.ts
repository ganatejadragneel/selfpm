// Phase 3: Array and Object Manipulation Utilities
// Common data manipulation patterns used across components

// Array utilities
export const arrayUtils = {
  // Remove duplicates by key
  uniqueBy: <T>(array: T[], keyFn: (item: T) => any): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // Remove duplicates (primitive values)
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  // Group array by key
  groupBy: <T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  // Sort by multiple criteria
  sortBy: <T>(array: T[], ...keyFns: ((item: T) => any)[]): T[] => {
    return [...array].sort((a, b) => {
      for (const keyFn of keyFns) {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },

  // Find with default value
  findWithDefault: <T>(array: T[], predicate: (item: T) => boolean, defaultValue: T): T => {
    return array.find(predicate) ?? defaultValue;
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Move item from one index to another
  move: <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
    const result = [...array];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  },

  // Insert item at index
  insert: <T>(array: T[], index: number, item: T): T[] => {
    const result = [...array];
    result.splice(index, 0, item);
    return result;
  },

  // Remove item at index
  removeAt: <T>(array: T[], index: number): T[] => {
    return array.filter((_, i) => i !== index);
  },

  // Update item at index
  updateAt: <T>(array: T[], index: number, updater: (item: T) => T): T[] => {
    return array.map((item, i) => i === index ? updater(item) : item);
  },

  // Toggle item in array (add if not present, remove if present)
  toggle: <T>(array: T[], item: T, compareFn?: (a: T, b: T) => boolean): T[] => {
    const compare = compareFn || ((a, b) => a === b);
    const exists = array.some(existing => compare(existing, item));

    if (exists) {
      return array.filter(existing => !compare(existing, item));
    } else {
      return [...array, item];
    }
  },

  // Partition array into two arrays based on predicate
  partition: <T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] => {
    const truthy: T[] = [];
    const falsy: T[] = [];

    array.forEach(item => {
      if (predicate(item)) {
        truthy.push(item);
      } else {
        falsy.push(item);
      }
    });

    return [truthy, falsy];
  },

  // Create range array
  range: (start: number, end: number, step: number = 1): number[] => {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
    return result;
  },

  // Sum array values
  sum: (array: number[]): number => {
    return array.reduce((sum, value) => sum + value, 0);
  },

  // Average array values
  average: (array: number[]): number => {
    return array.length > 0 ? arrayUtils.sum(array) / array.length : 0;
  },

  // Get min/max values
  min: (array: number[]): number => Math.min(...array),
  max: (array: number[]): number => Math.max(...array),

  // Shuffle array (Fisher-Yates)
  shuffle: <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  // Sample random items from array
  sample: <T>(array: T[], count: number = 1): T[] => {
    const shuffled = arrayUtils.shuffle(array);
    return shuffled.slice(0, count);
  },
};

// Object utilities
export const objectUtils = {
  // Deep clone object
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => objectUtils.deepClone(item)) as any;
    }

    if (typeof obj === 'object') {
      const cloned = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = objectUtils.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  },

  // Pick specific keys from object
  pick: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omit specific keys from object
  omit: <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  // Merge objects deeply
  deepMerge: <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (objectUtils.isObject(target) && objectUtils.isObject(source)) {
      for (const key in source) {
        if (objectUtils.isObject(source[key])) {
          if (!(key in target)) (target as any)[key] = {};
          objectUtils.deepMerge((target as any)[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return objectUtils.deepMerge(target, ...sources);
  },

  // Check if value is object
  isObject: (obj: any): obj is Record<string, any> => {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
  },

  // Get nested value safely
  get: <T = any>(obj: any, path: string, defaultValue?: T): T => {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue as T;
      }
    }

    return result as T;
  },

  // Set nested value safely
  set: <T extends Record<string, any>>(obj: T, path: string, value: any): T => {
    const keys = path.split('.');
    const result = objectUtils.deepClone(obj);
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || !objectUtils.isObject(current[key])) {
        (current as any)[key] = {};
      }
      current = (current as any)[key];
    }

    (current as any)[keys[keys.length - 1]] = value;
    return result;
  },

  // Check if object has nested path
  has: (obj: any, path: string): boolean => {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (!current || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  },

  // Get all keys recursively
  getAllKeys: (obj: Record<string, any>, prefix = ''): string[] => {
    const keys: string[] = [];

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);

      if (objectUtils.isObject(obj[key])) {
        keys.push(...objectUtils.getAllKeys(obj[key], fullKey));
      }
    }

    return keys;
  },

  // Transform object values
  mapValues: <T extends Record<string, any>, U>(
    obj: T,
    mapper: (value: T[keyof T], key: keyof T) => U
  ): Record<keyof T, U> => {
    const result = {} as Record<keyof T, U>;

    for (const key in obj) {
      result[key] = mapper(obj[key], key);
    }

    return result;
  },

  // Filter object by predicate
  filter: <T extends Record<string, any>>(
    obj: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean
  ): Partial<T> => {
    const result = {} as Partial<T>;

    for (const key in obj) {
      if (predicate(obj[key], key)) {
        result[key] = obj[key];
      }
    }

    return result;
  },
};

// Export grouped utilities
export const dataUtils = {
  array: arrayUtils,
  object: objectUtils,
};
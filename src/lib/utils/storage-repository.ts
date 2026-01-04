/**
 * Generic Storage Repository Pattern
 * Abstracts localStorage operations into a reusable class with consistent error handling.
 */

export interface StorageRepository<T extends { id: number | string }> {
  load(): T[];
  save(items: T[]): boolean;
  getById(id: T['id']): T | null;
  add(item: T): boolean;
  update(id: T['id'], updates: Partial<T>): boolean;
  delete(id: T['id']): boolean;
  getNextId(): number;
  clear(): void;
  getStorageSize(): number;
  getStorageUsagePercentage(): number;
  isNearLimit(): boolean;
}

export interface StorageOptions<T> {
  /** Maximum storage size in bytes (default: 5MB) */
  maxSize?: number;
  /** Callback when an item is saved */
  onSave?: (item: T) => void;
  /** Callback when an item is deleted */
  onDelete?: (item: T) => void;
  /** Default items to use when storage is empty */
  defaultItems?: T[];
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Creates a type-safe storage repository for managing localStorage data
 * @param storageKey - The localStorage key to use
 * @param options - Configuration options
 */
export function createStorageRepository<T extends { id: number }>(
  storageKey: string,
  options: StorageOptions<T> = {}
): StorageRepository<T> {
  const { maxSize = DEFAULT_MAX_SIZE, onSave, onDelete, defaultItems = [] } = options;

  /**
   * Load all items from localStorage
   */
  function load(): T[] {
    try {
      const json = localStorage.getItem(storageKey);
      if (!json) {
        // If storage is empty and we have defaults, save and return them
        if (defaultItems.length > 0) {
          save(defaultItems);
          return defaultItems;
        }
        return [];
      }
      return JSON.parse(json) as T[];
    } catch (error) {
      console.error(`Failed to load from ${storageKey}:`, error);
      return [];
    }
  }

  /**
   * Save all items to localStorage
   */
  function save(items: T[]): boolean {
    try {
      const json = JSON.stringify(items);
      if (json.length > maxSize) {
        throw new Error(`Data exceeds storage limit (${Math.round(maxSize / 1024 / 1024)}MB)`);
      }
      localStorage.setItem(storageKey, json);
      return true;
    } catch (error) {
      console.error(`Failed to save to ${storageKey}:`, error);
      return false;
    }
  }

  /**
   * Get a single item by ID
   */
  function getById(id: T['id']): T | null {
    const items = load();
    return items.find((item) => item.id === id) ?? null;
  }

  /**
   * Add a new item
   */
  function add(item: T): boolean {
    const items = load();
    items.push(item);
    const success = save(items);
    if (success && onSave) {
      onSave(item);
    }
    return success;
  }

  /**
   * Update an existing item by ID
   */
  function update(id: T['id'], updates: Partial<T>): boolean {
    const items = load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      console.error(`Item with id ${id} not found in ${storageKey}`);
      return false;
    }
    items[index] = { ...items[index], ...updates };
    const success = save(items);
    if (success && onSave) {
      onSave(items[index]);
    }
    return success;
  }

  /**
   * Delete an item by ID
   */
  function deleteItem(id: T['id']): boolean {
    const items = load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      console.error(`Item with id ${id} not found in ${storageKey}`);
      return false;
    }
    const deletedItem = items[index];
    items.splice(index, 1);
    const success = save(items);
    if (success && onDelete) {
      onDelete(deletedItem);
    }
    return success;
  }

  /**
   * Get the next available ID
   */
  function getNextId(): number {
    const items = load();
    if (items.length === 0) return 1;
    return Math.max(...items.map((item) => Number(item.id))) + 1;
  }

  /**
   * Clear all items from storage
   */
  function clear(): void {
    localStorage.removeItem(storageKey);
  }

  /**
   * Get current storage size in bytes
   */
  function getStorageSize(): number {
    const json = localStorage.getItem(storageKey);
    return json ? json.length : 0;
  }

  /**
   * Get storage usage percentage
   */
  function getStorageUsagePercentage(): number {
    return (getStorageSize() / maxSize) * 100;
  }

  /**
   * Check if storage is near limit (80%+)
   */
  function isNearLimit(): boolean {
    return getStorageUsagePercentage() >= 80;
  }

  return {
    load,
    save,
    getById,
    add,
    update,
    delete: deleteItem,
    getNextId,
    clear,
    getStorageSize,
    getStorageUsagePercentage,
    isNearLimit
  };
}

/**
 * Storage repository for string IDs (like UUIDs)
 */
export function createStringIdRepository<T extends { id: string }>(
  storageKey: string,
  options: Omit<StorageOptions<T>, 'defaultItems'> & { defaultItems?: T[] } = {}
): Omit<StorageRepository<T>, 'getNextId'> & { generateId: () => string } {
  const { maxSize = DEFAULT_MAX_SIZE, onSave, onDelete, defaultItems = [] } = options;

  function load(): T[] {
    try {
      const json = localStorage.getItem(storageKey);
      if (!json) {
        if (defaultItems.length > 0) {
          save(defaultItems);
          return defaultItems;
        }
        return [];
      }
      return JSON.parse(json) as T[];
    } catch (error) {
      console.error(`Failed to load from ${storageKey}:`, error);
      return [];
    }
  }

  function save(items: T[]): boolean {
    try {
      const json = JSON.stringify(items);
      if (json.length > maxSize) {
        throw new Error(`Data exceeds storage limit (${Math.round(maxSize / 1024 / 1024)}MB)`);
      }
      localStorage.setItem(storageKey, json);
      return true;
    } catch (error) {
      console.error(`Failed to save to ${storageKey}:`, error);
      return false;
    }
  }

  function getById(id: string): T | null {
    const items = load();
    return items.find((item) => item.id === id) ?? null;
  }

  function add(item: T): boolean {
    const items = load();
    items.push(item);
    const success = save(items);
    if (success && onSave) onSave(item);
    return success;
  }

  function update(id: string, updates: Partial<T>): boolean {
    const items = load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    items[index] = { ...items[index], ...updates };
    const success = save(items);
    if (success && onSave) onSave(items[index]);
    return success;
  }

  function deleteItem(id: string): boolean {
    const items = load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const deletedItem = items[index];
    items.splice(index, 1);
    const success = save(items);
    if (success && onDelete) onDelete(deletedItem);
    return success;
  }

  function clear(): void {
    localStorage.removeItem(storageKey);
  }

  function getStorageSize(): number {
    const json = localStorage.getItem(storageKey);
    return json ? json.length : 0;
  }

  function getStorageUsagePercentage(): number {
    return (getStorageSize() / maxSize) * 100;
  }

  function isNearLimit(): boolean {
    return getStorageUsagePercentage() >= 80;
  }

  function generateId(): string {
    return crypto.randomUUID();
  }

  return {
    load,
    save,
    getById,
    add,
    update,
    delete: deleteItem,
    clear,
    getStorageSize,
    getStorageUsagePercentage,
    isNearLimit,
    generateId
  };
}

/**
 * Generic localStorage API for persistent storage
 */

export interface StorageOptions<T> {
  key: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export class Storage<T> {
  private key: string;
  private defaultValue: T;
  private serialize: (value: T) => string;
  private deserialize: (value: string) => T;

  constructor(options: StorageOptions<T>) {
    this.key = options.key;
    this.defaultValue = options.defaultValue;
    this.serialize = options.serialize ?? JSON.stringify;
    this.deserialize = options.deserialize ?? JSON.parse;
  }

  /**
   * Get value from localStorage
   */
  get(): T {
    if (typeof window === 'undefined') {
      return this.defaultValue;
    }

    try {
      const item = localStorage.getItem(this.key);
      if (item === null) {
        return this.defaultValue;
      }
      return this.deserialize(item);
    } catch (error) {
      console.warn(`Failed to get item from localStorage for key "${this.key}":`, error);
      return this.defaultValue;
    }
  }

  /**
   * Set value in localStorage
   */
  set(value: T): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const serialized = this.serialize(value);
      localStorage.setItem(this.key, serialized);
    } catch (error) {
      console.error(`Failed to set item in localStorage for key "${this.key}":`, error);
    }
  }

  /**
   * Remove value from localStorage
   */
  remove(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error(`Failed to remove item from localStorage for key "${this.key}":`, error);
    }
  }

  /**
   * Check if value exists in localStorage
   */
  has(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem(this.key) !== null;
  }
}

/**
 * Create a storage instance with type safety
 */
export function createStorage<T>(options: StorageOptions<T>): Storage<T> {
  return new Storage(options);
}

const preferencesStorage = createStorage<Record<string, any>>({
  key: 'preferences',
  defaultValue: {},
});

export function getPreferences(): Record<string, any> {
  return preferencesStorage.get();
}

export function setPreferences(preferences: Record<string, any>): void {
  preferencesStorage.set(preferences);
}
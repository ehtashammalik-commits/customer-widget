import { Injectable } from '@angular/core';

export type StorageType = 'localStorage' | 'sessionStorage';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  /**
   * Get the storage object based on the specified type
   * @param storageType - Type of storage to use
   * @returns Storage object (localStorage or sessionStorage)
   */
  private getStorage(storageType: StorageType): Storage {
    return storageType === 'sessionStorage' ? sessionStorage : localStorage;
  }

  /**
   * Store a value in the specified storage
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified if not already a string)
   * @param storageType - Type of storage to use ('localStorage' or 'sessionStorage')
   */
  public setItem(
    key: string,
    value: any,
    storageType: StorageType = 'localStorage',
  ): void {
    try {
      const storage = this.getStorage(storageType);
      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      storage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }

  /**
   * Retrieve a value from the specified storage
   * @param key - Storage key
   * @param storageType - Type of storage to use ('localStorage' or 'sessionStorage')
   * @param parseJson - Whether to attempt JSON parsing (default: true)
   * @returns Retrieved value or null
   */
  public getItem(
    key: string,
    storageType: StorageType = 'localStorage',
    parseJson: boolean = true,
  ): any {
    try {
      const storage = this.getStorage(storageType);
      const value = storage.getItem(key);

      if (value === null) {
        return null;
      }

      if (!parseJson) {
        return value;
      }

      // Try to parse as JSON, fallback to string if parsing fails
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  /**
   * Remove a value from the specified storage
   * @param key - Storage key
   * @param storageType - Type of storage to use ('localStorage' or 'sessionStorage')
   */
  public removeItem(
    key: string,
    storageType: StorageType = 'localStorage',
  ): void {
    try {
      const storage = this.getStorage(storageType);
      storage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  }

  /**
   * Clear all data from the specified storage
   * @param storageType - Type of storage to clear ('localStorage' or 'sessionStorage')
   */
  public clear(storageType: StorageType = 'localStorage'): void {
    try {
      const storage = this.getStorage(storageType);
      storage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
}

/**
 * Simple In-Memory Cache Utility
 * HER-24: Get Random Content for Home Page
 * Provides basic caching functionality with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a cache entry with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttl: number = 300000): void {
    // Default 5 minutes
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Get a cache entry if not expired
   * @param {string} key - Cache key
   * @returns {any} - Cached value or null if expired/not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a cache entry
   * @param {string} key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   * @returns {number} - Number of cached entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if exists and not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Create singleton instance
const cache = new SimpleCache();

// Clear expired entries every minute
setInterval(() => {
  cache.clearExpired();
}, 60000);

export default cache;

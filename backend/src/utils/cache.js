/**
 * Simple In-Memory Cache Utility
 * HER-24: Get Random Content for Home Page
 * Provides basic caching functionality with TTL support
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a cache entry with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = 300000) { // Default 5 minutes
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Get a cache entry if not expired
   * @param {string} key - Cache key
   * @returns {any} - Cached value or null if expired/not found
   */
  get(key) {
    const entry = this.cache.get(key);

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
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
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
  size() {
    return this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if exists and not expired
   */
  has(key) {
    return this.get(key) !== null;
  }
}

// Create singleton instance
const cache = new SimpleCache();

// Clear expired entries every minute
setInterval(() => {
  cache.clearExpired();
}, 60000);

module.exports = cache;

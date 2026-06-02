/**
 * Simple in-memory cache with TTL support
 * Used for caching API responses to reduce API calls
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

// Request deduplication map
const pendingRequests = new Map<string, Promise<unknown>>();

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private defaultTTL: number;

  constructor(defaultTTLMs: number = 60000) {
    this.defaultTTL = defaultTTLMs;
    // Clean up expired items every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set pattern with request deduplication
   * Prevents multiple identical requests from being made simultaneously
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if there's already a pending request
    const pendingKey = `pending:${key}`;
    const pending = pendingRequests.get(pendingKey);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new request
    const request = fetcher()
      .then((data) => {
        this.set(key, data, ttlMs);
        pendingRequests.delete(pendingKey);
        return data;
      })
      .catch((error) => {
        pendingRequests.delete(pendingKey);
        throw error;
      });

    pendingRequests.set(pendingKey, request);
    return request;
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance with 60 second TTL by default
const cacheTTL = parseInt(process.env.MARKET_DATA_CACHE_TTL || '60', 10) * 1000;
export const marketCache = new MemoryCache(cacheTTL);

// Export for type usage
export type { CacheItem };

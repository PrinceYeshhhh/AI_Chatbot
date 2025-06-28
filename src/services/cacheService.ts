import { PerformanceMonitor } from '../utils/performanceMonitor';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  metadata?: Record<string, unknown>;
}

interface CacheOptions {
  maxSize?: number;
  maxAge?: number;
  strategy?: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  enableCompression?: boolean;
  enablePersistence?: boolean;
  namespace?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  averageAccessTime: number;
  totalAccessTime: number;
}

/**
 * Advanced caching service with multiple strategies and intelligent eviction
 */
class AdvancedCacheService {
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private options: Map<string, CacheOptions> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private compressionWorker: Worker | null = null;
  private persistenceEnabled: boolean = false;

  constructor() {
    this.initializeCompressionWorker();
    this.loadPersistedData();
  }

  /**
   * Create or get a cache instance
   */
  public createCache<T>(
    name: string, 
    options: CacheOptions = {}
  ): AdvancedCacheService {
    const defaultOptions: CacheOptions = {
      maxSize: 1000,
      maxAge: 1000 * 60 * 60, // 1 hour
      strategy: 'LRU',
      enableCompression: false,
      enablePersistence: false,
      namespace: 'default'
    };

    const finalOptions = { ...defaultOptions, ...options };
    this.options.set(name, finalOptions);

    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
      this.stats.set(name, {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0,
        maxSize: finalOptions.maxSize!,
        hitRate: 0,
        averageAccessTime: 0,
        totalAccessTime: 0
      });
    }

    return this;
  }

  /**
   * Set a value in cache
   */
  public async set<T>(
    cacheName: string, 
    key: string, 
    value: T, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const timer = PerformanceMonitor.startTimer(`cache-set-${cacheName}`);
    
    try {
      const cache = this.caches.get(cacheName);
      const options = this.options.get(cacheName);
      const stats = this.stats.get(cacheName);

      if (!cache || !options || !stats) {
        throw new Error(`Cache '${cacheName}' not found`);
      }

      // Calculate entry size
      const entrySize = this.calculateSize(value);
      
      // Check if we need to evict entries
      if (cache.size >= options.maxSize!) {
        this.evictEntries(cacheName);
      }

      // Compress value if enabled
      let finalValue = value;
      if (options.enableCompression && this.compressionWorker) {
        finalValue = await this.compressValue(value);
      }

      const entry: CacheEntry<T> = {
        value: finalValue,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size: entrySize,
        metadata
      };

      cache.set(key, entry);
      stats.size = cache.size;

      // Persist if enabled
      if (options.enablePersistence) {
        this.persistEntry(cacheName, key, entry);
      }
    } finally {
      timer();
    }
  }

  /**
   * Get a value from cache
   */
  public async get<T>(cacheName: string, key: string): Promise<T | null> {
    const timer = PerformanceMonitor.startTimer(`cache-get-${cacheName}`);
    
    try {
      const cache = this.caches.get(cacheName);
      const options = this.options.get(cacheName);
      const stats = this.stats.get(cacheName);

      if (!cache || !options || !stats) {
        throw new Error(`Cache '${cacheName}' not found`);
      }

      const entry = cache.get(key);
      if (!entry) {
        stats.misses++;
        this.updateStats(cacheName);
        return null;
      }

      // Check if entry has expired
      if (Date.now() - entry.timestamp > options.maxAge!) {
        cache.delete(key);
        stats.misses++;
        stats.evictions++;
        this.updateStats(cacheName);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      stats.hits++;

      // Decompress value if needed
      let finalValue = entry.value;
      if (options.enableCompression && this.compressionWorker) {
        finalValue = await this.decompressValue(entry.value);
      }

      this.updateStats(cacheName);
      return finalValue as T;
    } finally {
      timer();
    }
  }

  /**
   * Check if key exists in cache
   */
  public has(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) return false;

    const entry = cache.get(key);
    if (!entry) return false;

    // Check if expired
    const options = this.options.get(cacheName);
    if (options && Date.now() - entry.timestamp > options.maxAge!) {
      cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  public delete(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !stats) return false;

    const deleted = cache.delete(key);
    if (deleted) {
      stats.size = cache.size;
      this.updateStats(cacheName);
    }

    return deleted;
  }

  /**
   * Clear entire cache
   */
  public clear(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (cache && stats) {
      cache.clear();
      stats.size = 0;
      this.updateStats(cacheName);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(cacheName: string): CacheStats | null {
    return this.stats.get(cacheName) || null;
  }

  /**
   * Get all cache names
   */
  public getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Warm up cache with data
   */
  public async warmup<T>(
    cacheName: string, 
    data: Array<{ key: string; value: T; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    const timer = PerformanceMonitor.startTimer(`cache-warmup-${cacheName}`);
    
    try {
      for (const item of data) {
        await this.set(cacheName, item.key, item.value, item.metadata);
      }
    } finally {
      timer();
    }
  }

  /**
   * Prefetch data for keys
   */
  public async prefetch<T>(
    cacheName: string,
    keys: string[],
    fetchFunction: (key: string) => Promise<T>
  ): Promise<void> {
    const timer = PerformanceMonitor.startTimer(`cache-prefetch-${cacheName}`);
    
    try {
      const promises = keys.map(async (key) => {
        if (!this.has(cacheName, key)) {
          try {
            const value = await fetchFunction(key);
            await this.set(cacheName, key, value);
          } catch (error) {
            console.warn(`Failed to prefetch key '${key}':`, error);
          }
        }
      });

      await Promise.all(promises);
    } finally {
      timer();
    }
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    const options = this.options.get(cacheName);
    const stats = this.stats.get(cacheName);

    if (!cache || !options || !stats) return;

    const entries = Array.from(cache.entries());
    let entriesToEvict: Array<[string, CacheEntry<any>]> = [];

    switch (options.strategy) {
      case 'LRU':
        entriesToEvict = entries
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, Math.floor(entries.length * 0.2)); // Evict 20%
        break;
      case 'LFU':
        entriesToEvict = entries
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .slice(0, Math.floor(entries.length * 0.2));
        break;
      case 'FIFO':
        entriesToEvict = entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, Math.floor(entries.length * 0.2));
        break;
      case 'TTL':
        const now = Date.now();
        entriesToEvict = entries.filter(
          ([, entry]) => now - entry.timestamp > options.maxAge!
        );
        break;
    }

    for (const [key] of entriesToEvict) {
      cache.delete(key);
      stats.evictions++;
    }

    stats.size = cache.size;
  }

  /**
   * Update cache statistics
   */
  private updateStats(cacheName: string): void {
    const stats = this.stats.get(cacheName);
    if (!stats) return;

    const totalRequests = stats.hits + stats.misses;
    stats.hitRate = totalRequests > 0 ? stats.hits / totalRequests : 0;
  }

  /**
   * Calculate size of value
   */
  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1; // Fallback size
    }
  }

  /**
   * Initialize compression worker
   */
  private initializeCompressionWorker(): void {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        // Create a simple compression worker
        const workerCode = `
          self.onmessage = function(e) {
            const { type, data, id } = e.data;
            
            if (type === 'compress') {
              try {
                const compressed = JSON.stringify(data);
                self.postMessage({ type: 'compressed', data: compressed, id });
              } catch (error) {
                self.postMessage({ type: 'error', error: error.message, id });
              }
            } else if (type === 'decompress') {
              try {
                const decompressed = JSON.parse(data);
                self.postMessage({ type: 'decompressed', data: decompressed, id });
              } catch (error) {
                self.postMessage({ type: 'error', error: error.message, id });
              }
            }
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  /**
   * Compress value using worker
   */
  private async compressValue(value: any): Promise<any> {
    if (!this.compressionWorker) return value;

    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handler);
          
          if (e.data.type === 'compressed') {
            resolve(e.data.data);
          } else if (e.data.type === 'error') {
            reject(new Error(e.data.error));
          }
        }
      };

      this.compressionWorker.addEventListener('message', handler);
      this.compressionWorker.postMessage({ type: 'compress', data: value, id });
    });
  }

  /**
   * Decompress value using worker
   */
  private async decompressValue(value: any): Promise<any> {
    if (!this.compressionWorker) return value;

    return new Promise((resolve, reject) => {
      const id = Date.now().toString();
      
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handler);
          
          if (e.data.type === 'decompressed') {
            resolve(e.data.data);
          } else if (e.data.type === 'error') {
            reject(new Error(e.data.error));
          }
        }
      };

      this.compressionWorker.addEventListener('message', handler);
      this.compressionWorker.postMessage({ type: 'decompress', data: value, id });
    });
  }

  /**
   * Persist entry to localStorage
   */
  private persistEntry(cacheName: string, key: string, entry: CacheEntry<any>): void {
    try {
      const storageKey = `cache_${cacheName}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  /**
   * Load persisted data from localStorage
   */
  private loadPersistedData(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          const parts = key.split('_');
          if (parts.length >= 3) {
            const cacheName = parts[1];
            const entryKey = parts.slice(2).join('_');
            
            const entryData = localStorage.getItem(key);
            if (entryData) {
              const entry = JSON.parse(entryData);
              const cache = this.caches.get(cacheName);
              if (cache) {
                cache.set(entryKey, entry);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted cache data:', error);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
    
    this.caches.clear();
    this.options.clear();
    this.stats.clear();
  }
}

// Export singleton instance
export const cacheService = new AdvancedCacheService();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheService.destroy();
  });
} 
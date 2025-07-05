import { logger } from '../utils/logger';

// Optional Redis import
let Redis: any = null;
try {
  Redis = require('ioredis');
} catch (error) {
  logger.warn('Redis not available, using memory cache only');
}

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage?: number;
}

class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private stats = { hits: 0, misses: 0 };

  set(key: string, value: any, ttl: number = 3600): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.cache.size
    };
  }
}

export class CacheService {
  private redis: any = null;
  private memoryCache: MemoryCache;
  private prefix: string;
  private useRedis: boolean;

  constructor() {
    this.memoryCache = new MemoryCache();
    this.prefix = process.env.CACHE_PREFIX || 'chatbot:';
    this.useRedis = !!process.env.REDIS_URL && !!Redis;

    if (this.useRedis) {
      this.initializeRedis();
    }
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis(process.env.REDIS_URL!, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('error', (error: any) => {
        logger.error('Redis connection error:', error);
        this.useRedis = false;
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
      });

    } catch (error: any) {
      logger.error('Failed to initialize Redis:', error);
      this.useRedis = false;
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      } else {
        this.memoryCache.set(fullKey, value, ttl);
      }
    } catch (error: any) {
      logger.error('Cache set error:', error);
      // Fallback to memory cache
      this.memoryCache.set(fullKey, value, ttl);
    }
  }

  async get(key: string): Promise<any> {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.useRedis && this.redis) {
        const value = await this.redis.get(fullKey);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryCache.get(fullKey);
      }
    } catch (error: any) {
      logger.error('Cache get error:', error);
      // Fallback to memory cache
      return this.memoryCache.get(fullKey);
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    
    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(fullKey);
      } else {
        this.memoryCache.delete(fullKey);
      }
    } catch (error: any) {
      logger.error('Cache delete error:', error);
      // Fallback to memory cache
      this.memoryCache.delete(fullKey);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(`${this.prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        this.memoryCache.clear();
      }
    } catch (error: any) {
      logger.error('Cache clear error:', error);
      // Fallback to memory cache
      this.memoryCache.clear();
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(`${this.prefix}*`);
        const info = await this.redis.info('memory');
        
        return {
          hits: 0, // Redis doesn't provide hit/miss stats by default
          misses: 0,
          keys: keys.length,
          memoryUsage: parseInt(info.match(/used_memory_human:(\d+)/)?.[1] || '0')
        };
      } else {
        return this.memoryCache.getStats();
      }
    } catch (error: any) {
      logger.error('Cache stats error:', error);
      return this.memoryCache.getStats();
    }
  }

  // Cache chat responses
  async cacheChatResponse(userId: string, message: string, response: string, ttl: number = 1800): Promise<void> {
    const key = `chat:${userId}:${this.hashMessage(message)}`;
    await this.set(key, { response, timestamp: Date.now() }, ttl);
  }

  async getCachedChatResponse(userId: string, message: string): Promise<string | null> {
    const key = `chat:${userId}:${this.hashMessage(message)}`;
    const cached = await this.get(key);
    return cached?.response || null;
  }

  // Cache embeddings
  async cacheEmbeddings(text: string, embeddings: number[], ttl: number = 86400): Promise<void> {
    const key = `embeddings:${this.hashMessage(text)}`;
    await this.set(key, { embeddings, timestamp: Date.now() }, ttl);
  }

  async getCachedEmbeddings(text: string): Promise<number[] | null> {
    const key = `embeddings:${this.hashMessage(text)}`;
    const cached = await this.get(key);
    return cached?.embeddings || null;
  }

  // Cache vector search results
  async cacheVectorSearch(query: string, results: any[], ttl: number = 3600): Promise<void> {
    const key = `vector_search:${this.hashMessage(query)}`;
    await this.set(key, { results, timestamp: Date.now() }, ttl);
  }

  async getCachedVectorSearch(query: string): Promise<any[] | null> {
    const key = `vector_search:${this.hashMessage(query)}`;
    const cached = await this.get(key);
    return cached?.results || null;
  }

  private hashMessage(message: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (this.useRedis && this.redis) {
        await this.redis.ping();
        return true;
      } else {
        return true; // Memory cache is always available
      }
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 
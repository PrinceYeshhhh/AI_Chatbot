import { logger } from '../utils/logger.js';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = parseInt(process.env.CACHE_TTL_SECONDS) || 3600; // 1 hour default
    this.maxSize = parseInt(process.env.MAX_CACHE_SIZE) || 1000;
    this.enabled = process.env.ENABLE_MEMORY_CACHE === 'true';
    
    if (this.enabled) {
      // Clean up expired entries every 5 minutes
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
      logger.info('Cache service initialized');
    }
  }

  set(key, value, customTtl = null) {
    if (!this.enabled) return;

    try {
      const ttl = customTtl || this.ttl;
      const expiresAt = Date.now() + (ttl * 1000);
      
      // Remove oldest entries if cache is full
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      this.cache.set(key, {
        value,
        expiresAt,
        createdAt: Date.now()
      });

      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  get(key) {
    if (!this.enabled) return null;

    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }

      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        logger.debug(`Cache expired: ${key}`);
        return null;
      }

      logger.debug(`Cache hit: ${key}`);
      return entry.value;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  delete(key) {
    if (!this.enabled) return;

    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        logger.debug(`Cache deleted: ${key}`);
      }
      return deleted;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  clear() {
    if (!this.enabled) return;

    try {
      const size = this.cache.size;
      this.cache.clear();
      logger.info(`Cache cleared: ${size} entries removed`);
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  cleanup() {
    if (!this.enabled) return;

    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cache cleanup: ${cleaned} expired entries removed`);
      }
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }

  getStats() {
    return {
      enabled: this.enabled,
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

export const cacheService = new CacheService();
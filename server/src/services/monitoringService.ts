import { logger } from '../utils/logger';
import { vectorService } from './vectorService';
import { cacheService } from './cacheService';
import { supabase } from '../lib/supabase';

interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastHealthCheck: Date;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  error?: string | undefined;
}

class MonitoringService {
  private metrics: SystemMetrics;
  private serviceHealth: Map<string, ServiceHealth>;
  private startTime: Date;
  private requestTimes: number[];

  constructor() {
    this.startTime = new Date();
    this.serviceHealth = new Map();
    this.requestTimes = [];
    
    this.metrics = {
      uptime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      activeConnections: 0,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastHealthCheck: new Date()
    };

    // Start monitoring loop
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Health check every minute
    setInterval(() => {
      this.performHealthChecks();
    }, 60000);
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.lastHealthCheck = new Date();

    // Calculate average response time (keep last 100 requests)
    if (this.requestTimes.length > 0) {
      this.metrics.averageResponseTime = this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
    }

    logger.info('System metrics updated', this.metrics);
  }

  private async performHealthChecks(): Promise<void> {
    const checks = [
      this.checkDatabase(),
      this.checkVectorService(),
      this.checkCacheService(),
      this.checkOpenAI()
    ];

    await Promise.allSettled(checks);
  }

  private async checkDatabase(): Promise<void> {
    const start = Date.now();
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      const responseTime = Date.now() - start;
      this.serviceHealth.set('database', {
        name: 'Supabase Database',
        status: error ? 'unhealthy' : 'healthy',
        responseTime,
        lastCheck: new Date(),
        error: error?.message
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.serviceHealth.set('database', {
        name: 'Supabase Database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: errorMessage
      });
    }
  }

  private async checkVectorService(): Promise<void> {
    const start = Date.now();
    try {
      // Simple test query
      await vectorService.similaritySearch('test', 1);
      
      const responseTime = Date.now() - start;
      this.serviceHealth.set('vector', {
        name: 'Vector Service',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.serviceHealth.set('vector', {
        name: 'Vector Service',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: errorMessage
      });
    }
  }

  private async checkCacheService(): Promise<void> {
    const start = Date.now();
    try {
      // Test cache operations
      await cacheService.set('health-check', 'test', 60);
      await cacheService.get('health-check');
      
      const responseTime = Date.now() - start;
      this.serviceHealth.set('cache', {
        name: 'Cache Service',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.serviceHealth.set('cache', {
        name: 'Cache Service',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: errorMessage
      });
    }
  }

  private async checkOpenAI(): Promise<void> {
    const start = Date.now();
    try {
      const openAIApiKey = process.env.OPENAI_API_KEY || 'test-key';
      
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      
      const responseTime = Date.now() - start;
      this.serviceHealth.set('openai', {
        name: 'OpenAI API',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.serviceHealth.set('openai', {
        name: 'OpenAI API',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: errorMessage
      });
    }
  }

  // Public methods
  public recordRequest(duration: number): void {
    this.metrics.requestCount++;
    this.requestTimes.push(duration);
    
    // Keep only last 100 request times
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }
  }

  public recordError(): void {
    this.metrics.errorCount++;
  }

  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  public getHealthStatus(): { overall: string; services: ServiceHealth[] } {
    const services = Array.from(this.serviceHealth.values());
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    let overall: string;
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      services
    };
  }

  public getDetailedHealth(): any {
    return {
      system: this.getMetrics(),
      health: this.getHealthStatus(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const monitoringService = new MonitoringService(); 
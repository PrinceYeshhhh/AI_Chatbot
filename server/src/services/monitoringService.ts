import { logger } from '../utils/logger';
import { NeonDatabaseService } from './neonDatabaseService';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

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

class MonitoringService {
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private dbService: NeonDatabaseService;

  constructor() {
    this.dbService = new NeonDatabaseService();
  }

  async checkAllServices(): Promise<void> {
    await Promise.all([
      this.checkGroq(),
      this.checkTogether(),
      this.checkQdrant(),
      this.checkNeon(),
      this.checkCloudinary(),
      this.checkClerk()
    ]);
  }

  private async checkNeon(): Promise<void> {
    const start = Date.now();
    try {
      // Test database connection
      await this.dbService.query('SELECT 1');
      
      const responseTime = Date.now() - start;
      this.serviceHealth.set('neon', {
        name: 'Neon Database',
        status: 'healthy',
        responseTime,
        lastCheck: new Date()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.serviceHealth.set('neon', {
        name: 'Neon Database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: errorMessage
      });
    }
  }

  // Public methods
  public recordRequest(duration: number): void {
    // This method is no longer directly used for metrics, but kept for compatibility
    // if other parts of the application still rely on it.
  }

  public recordError(): void {
    // This method is no longer directly used for metrics, but kept for compatibility
    // if other parts of the application still rely on it.
  }

  public getMetrics(): SystemMetrics {
    // This method is no longer directly used for metrics, but kept for compatibility
    // if other parts of the application still rely on it.
    return {
      uptime: 0, // Placeholder, actual uptime calculation would require a start time
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0, // Placeholder
      activeConnections: 0, // Placeholder
      requestCount: 0, // Placeholder
      errorCount: 0, // Placeholder
      averageResponseTime: 0, // Placeholder
      lastHealthCheck: new Date() // Placeholder
    };
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
        env: process.env['NODE_ENV'] || 'development'
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const monitoringService = new MonitoringService(); 
import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { LLMService } from '../services/llmService';
import { cacheService } from '../services/cacheService';

const router = express.Router();
const llmService = new LLMService();

// Overall system status
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const vectorStats = await llmService.getVectorStats();
    const cacheStats = await cacheService.getStats();
    
    const systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      services: {
        vector: vectorStats,
        cache: cacheStats,
        database: {
          status: process.env['NEON_DATABASE_URL'] ? 'configured' : 'not_configured'
        }
      }
    };

    // Check if any critical services are down
    const criticalServices = [
      vectorStats.status === 'healthy',
      cacheStats && cacheStats.keys !== undefined // Check if cache is working
    ];

    if (criticalServices.some(status => !status)) {
      systemStatus.status = 'degraded';
    }

    res.json({ success: true, ...systemStatus });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting system status:', errorMessage);
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get system status' });
  }
});

// Simple health check
router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '1.0.0'
  });
});

// Configuration info
router.get('/config', (_req: Request, res: Response): void => {
  const config = {
    nodeEnv: process.env['NODE_ENV'] || 'development',
    port: process.env['PORT'] || 3001,
    corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    llmModel: process.env['GROQ_MODEL'] || 'llama3-70b-8192',
    embeddingModel: process.env['TOGETHER_MODEL'] || 'togethercomputer/llama-3-70b-instruct',
    vectorCollection: process.env['QDRANT_COLLECTION'] || 'chatbot_embeddings',
    hasNeon: !!process.env['NEON_DATABASE_URL'],
    hasQdrant: !!process.env['QDRANT_URL'],
    hasRedis: !!process.env['REDIS_URL'],
    version: process.env['npm_package_version'] || '1.0.0'
  };

  res.json({ success: true, ...config });
});

// Service-specific health checks
router.get('/services/vector', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await llmService.getVectorStats();
    res.json({ success: true, ...stats });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting vector service status:', errorMessage);
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get vector service status' });
  }
});

router.get('/services/cache', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await cacheService.getStats();
    res.json({ success: true, ...stats });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting cache service status:', errorMessage);
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get cache service status' });
  }
});

// Recent logs (development only)
router.get('/logs', (_req: Request, res: Response): void => {
  if (process.env['NODE_ENV'] === 'production') {
    res.status(403).json({ error: 'Logs endpoint not available in production' });
    return;
  }

  // Mock recent logs for development
  const logs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Server started successfully'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      message: 'Health check performed'
    }
  ];

  res.json({ success: true, logs });
});

export default router; 
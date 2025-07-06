import express, { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';
import { vectorService } from '../services/vectorService';
import { cacheService } from '../services/cacheService';

const router = express.Router();

// Overall system status
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const vectorStats = await vectorService.getStats();
    const cacheStats = cacheService.getStats();
    
    const systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        vector: vectorStats,
        cache: cacheStats,
        database: {
          status: process.env.SUPABASE_URL ? 'configured' : 'not_configured'
        }
      }
    };

    // Check if any critical services are down
    const criticalServices = [
      vectorStats.status === 'healthy',
      cacheStats.status === 'healthy'
    ];

    if (criticalServices.some(status => !status)) {
      systemStatus.status = 'degraded';
    }

    successResponse(res, systemStatus);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting system status:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get system status');
  }
});

// Simple health check
router.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Configuration info
router.get('/config', (req: Request, res: Response): void => {
  const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    vectorCollection: process.env.CHROMA_COLLECTION_NAME || 'chatbot_embeddings',
    hasSupabase: !!process.env.SUPABASE_URL,
    hasRedis: !!process.env.REDIS_URL,
    version: process.env.npm_package_version || '1.0.0'
  };

  successResponse(res, config);
});

// Service-specific health checks
router.get('/services/vector', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await vectorService.getStats();
    successResponse(res, stats);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting vector service status:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get vector service status');
  }
});

router.get('/services/cache', (req: Request, res: Response): void => {
  try {
    const stats = cacheService.getStats();
    successResponse(res, stats);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting cache service status:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get cache service status');
  }
});

// Recent logs (development only)
router.get('/logs', (req: Request, res: Response): void => {
  if (process.env.NODE_ENV === 'production') {
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

  successResponse(res, { logs });
});

export default router; 
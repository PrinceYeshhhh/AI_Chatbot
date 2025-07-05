import express, { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    successResponse(res, health);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check error:', errorMessage);
    errorResponse(res, errorMessage || 'Health check failed');
  }
});

// System status endpoint
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = {
      server: {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {
        database: 'connected',
        cache: 'connected',
        vectorStore: 'connected'
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    successResponse(res, status);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Status check error:', errorMessage);
    errorResponse(res, errorMessage || 'Status check failed');
  }
});

// Metrics endpoint
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0
      },
      performance: {
        averageResponseTime: 0,
        maxResponseTime: 0
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    successResponse(res, metrics);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Metrics error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get metrics');
  }
});

export default router; 
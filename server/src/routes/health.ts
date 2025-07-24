import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cacheService';
import { smartBrainService } from '../services/smartBrainService';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the server and all services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 *                     vectorStore:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         vectors:
 *                           type: number
 *                           description: Number of vectors in store
 *                     cache:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         keys:
 *                           type: number
 *                           description: Number of cached items
 *                     llm:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         provider:
 *                           type: string
 *                           example: "anthropic"
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const healthChecks = {
    database: { status: 'healthy', responseTime: 0 },
    vectorStore: { status: 'healthy', vectors: 0 },
    cache: { status: 'healthy', keys: 0 },
    llm: { status: 'healthy', provider: 'anthropic' }
  };

  try {
    // Check database connection
    const dbStart = Date.now();
    try {
      // Add your database health check here
      healthChecks.database.responseTime = Date.now() - dbStart;
    } catch (error) {
      healthChecks.database.status = 'unhealthy';
      healthChecks.database.responseTime = Date.now() - dbStart;
    }

    // Check vector store
    try {
      const brainHealth = smartBrainService.getHealthStatus();
      healthChecks.vectorStore.status = brainHealth.vectorStoreAvailable ? 'healthy' : 'unhealthy';
      healthChecks.vectorStore.vectors = brainHealth.activeSessions || 0;
    } catch (error) {
      healthChecks.vectorStore.status = 'unhealthy';
    }

    // Check cache service
    try {
      const cacheStats = await cacheService.getStats();
      const cacheHealth = await cacheService.healthCheck();
      healthChecks.cache.status = cacheHealth ? 'healthy' : 'unhealthy';
      healthChecks.cache.keys = cacheStats.keys || 0;
    } catch (error) {
      healthChecks.cache.status = 'unhealthy';
    }

    // Check LLM service
    try {
      // Add your LLM health check here
      healthChecks.llm.status = 'healthy';
    } catch (error) {
      healthChecks.llm.status = 'unhealthy';
    }

    // Determine overall health
    const overallStatus = Object.values(healthChecks).every(
      service => service.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      services: healthChecks
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: 'Health check failed',
      services: healthChecks
    });
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Checks if the service is ready to receive traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    const brainHealth = smartBrainService.getHealthStatus();
    const cacheHealth = await cacheService.healthCheck();

    const isReady = brainHealth.vectorStoreAvailable && cacheHealth;

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        errors: [
          !brainHealth.vectorStoreAvailable ? 'Vector store not ready' : null,
          !cacheHealth ? 'Cache not ready' : null
        ].filter(Boolean)
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Checks if the service is alive and responding
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service is not responding
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router; 
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import * as dotenv from 'dotenv';
import * as path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { validateEnv } from './utils/schemas';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import trainingRoutes from './routes/training';
import statusRoutes from './routes/status';
import { logger, logEvent } from './utils/logger';
import { checkDependencies } from './utils/dependencyCheck';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth.middleware';
import { rbacMiddleware } from './middleware/rbac.middleware';
import authRouter from './routes/auth';
import docsRouter from './routes/docs';
import userSettingsRouter from './routes/userSettings';
import agentToolRouter from './routes/agentTool';
import analyticsRouter from './routes/analytics';
import { securityHeaders } from './middleware/securityHeaders';
import { auditLogger } from './middleware/auditLogger';
import { startVideoJobProcessor } from './services/retryQueue';
import mainRouter from './routes';
const expressPkg = { version: '4.x' };

// Sentry error monitoring
import * as Sentry from '@sentry/node';

// --- Dependency Check ---
checkDependencies(logger);

// --- Sentry Setup ---
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});

dotenv.config();

try {
  validateEnv();
} catch (err: any) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

const app = express();

// --- Logging Middleware ---
app.use((req, res, next) => {
  logger.info({
    eventType: 'http_request',
    method: req.method,
    url: req.url,
    user: req.user?.id || null,
    timestamp: new Date().toISOString(),
  });
  next();
});

// --- Sentry Request Handler ---
app.use(Sentry.Handlers.requestHandler());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HELMET === 'true') {
  app.use(helmet());
}

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_COMPRESSION === 'true') {
  app.use(compression());
}

const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: isProduction ? [corsOrigin] : [corsOrigin, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Global rate limiter: 100 req/min/IP (fail-safe for all /api routes)
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 60
  }
});

const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500
});

app.use('/api/', rateLimiter);
app.use('/api/', speedLimiter);

if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(securityHeaders);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use('/api', authRouter);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/docs', docsRouter);
app.use('/api/user-settings', userSettingsRouter);
app.use('/api/agent-tools', agentToolRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', mainRouter);
app.get('/api/ping', (_req: Request, res: Response): void => { res.status(200).send('pong'); });

// Test endpoint for chat without authentication
app.post('/api/test-chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    
    // Simple echo response for testing
    res.status(200).json({ 
      response: `Test response: ${message}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const adminRouter = express.Router();
adminRouter.get('/test', (req: Request, res: Response) => {
  const user = (req as any).user;
  res.status(200).json({ message: 'Admin access granted', user });
});
app.use('/api/admin', authMiddleware, rbacMiddleware('admin'), adminRouter);

// Add auditLogger to all /api routes
app.use('/api', auditLogger('api_request'));

// Metrics endpoint for observability
app.get('/api/metrics', async (_req: Request, res: Response) => {
  // Mocked metrics for now; replace with real queries as needed
  res.json({
    uptime: process.uptime(),
    recentErrors: 0, // TODO: Query from logs or error DB
    activeUsers: 1, // TODO: Query from analytics/events
    timestamp: new Date().toISOString()
  });
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AI Chatbot Backend API',
    version: '1.0.0',
    description: 'API documentation for the AI Chatbot backend',
  },
  servers: [
    { url: `http://localhost:${PORT}/api` },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/openapi.json', (_req, res) => {
  res.sendFile(path.join(__dirname, 'apiDocs', 'openapi.json'));
});

// Serve backend API only - frontend is deployed separately
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'AI Chatbot Backend API',
    version: process.env.npm_package_version || '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.originalUrl} does not exist.`,
  });
});

// Enhanced error logging in errorHandler
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    userId: req.user?.id,
    url: req.originalUrl,
    method: req.method,
    body: req.body
  }, 'API error');
  next(err);
});

app.use(errorHandler);

// Sentry error handler (after all routes)
app.use(Sentry.Handlers.errorHandler());

// Note: For async file uploads/chunking/embedding, use a background job queue (e.g., BullMQ, Cloud Tasks) and resumable upload protocol (e.g., tus, S3 multipart). Ensure all file processing is non-blocking and can be retried/resumed.
startVideoJobProcessor();

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on port ${PORT} (Express v${expressPkg.version})`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Agent Tools Framework: Ready`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
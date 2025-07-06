import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { validateEnv } from './utils/schemas';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import trainingRoutes from './routes/training';
import statusRoutes from './routes/status';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth.middleware';
import { rbacMiddleware } from './middleware/rbac.middleware';
import authRouter from './routes/auth';
import docsRouter from './routes/docs';
const expressPkg = { version: '4.x' };

dotenv.config();

try {
  validateEnv();
} catch (err: any) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

const app = express();
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

const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100') || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') || 900000) / 1000)
  }
});

const speedLimiter = slowDown({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') || 15 * 60 * 1000,
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
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const frontendDistPath = path.resolve(__dirname, '../../dist');
app.use(express.static(frontendDistPath));
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Frontend build not found.',
      message: 'Please run the frontend build process.',
    });
  }
});

app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.originalUrl} does not exist.`,
  });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on port ${PORT} (Express v${expressPkg.version})`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  server.close(() => {
    console.log('✅ Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    console.log('✅ Server closed due to unhandled rejection');
    process.exit(1);
  });
}); 
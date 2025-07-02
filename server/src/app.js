import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
// Import env validation
import { validateEnv } from './utils/schemas.js';

// Import routes
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import trainingRoutes from './routes/training.js';
import statusRoutes from './routes/status.js';

// Import services
import { initializeVectorStore } from './services/vectorService.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Validate environment variables
try {
  validateEnv();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HELMET === 'true') {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}

// Compression middleware
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_COMPRESSION === 'true') {
  app.use(compression());
}

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
let corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
if (isProduction) {
  // Never allow '*' in production
  if (corsOrigin === '*' || !corsOrigin) {
    throw new Error('CORS_ORIGIN must be a trusted URL in production, not "*" or empty.');
  }
}
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});

app.use(limiter);
app.use(speedLimiter);

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/status', statusRoutes);
app.get('/api/ping', (req, res) => res.status(200).send('pong'));

// Swagger/OpenAPI setup
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
  apis: ['./src/routes/*.js'], // JSDoc comments in route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Static File Serving for Frontend ---

// Resolve the path to the frontend build directory
const frontendDistPath = path.resolve(__dirname, '../../dist');

// Serve static files from the React app build directory
app.use(express.static(frontendDistPath));

// For any other request, serve the React app's index.html
app.get('*', (req, res) => {
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

// --- Error Handling ---

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.originalUrl} does not exist.`,
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    // Initialize vector store
    logger.info('Initializing vector store...');
    await initializeVectorStore();
    logger.info('Vector store initialized successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 AI Chatbot Backend Server running on port ${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🤖 Chat API: http://localhost:${PORT}/api/chat`);
      logger.info(`📁 Upload API: http://localhost:${PORT}/api/upload`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`🔧 Frontend should connect to: http://localhost:${PORT}`);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;
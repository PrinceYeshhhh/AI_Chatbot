import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import 'dotenv-safe/config';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import routes
import healthRoutes from './routes/health';
import apiRoutes from './routes/api';
import authRoutes from './routes/auth';

// Load environment variables

const app = express();
const PORT = process.env['PORT'] || 3001;
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const CORS_ORIGIN = process.env['CORS_ORIGIN'] || 'http://localhost:5173';

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

// Export io for use in other modules
export { io };

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env['NODE_ENV'] === 'production' 
    ? process.env['CORS_ORIGIN'] || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 1000)
  }
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes without slowing down
  delayMs: () => 500 // add 500ms delay per request after delayAfter
});

app.use('/api/', rateLimiter);
app.use('/api/', speedLimiter);

// Logging middleware
if (process.env['NODE_ENV'] !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Brain AI Chatbot API',
    version: '1.0.0',
    description: 'API documentation for the Smart Brain AI Chatbot backend',
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

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Smart Brain AI Chatbot Backend',
    version: process.env['npm_package_version'] || '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      api: '/api'
    }
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.originalUrl} does not exist.`,
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
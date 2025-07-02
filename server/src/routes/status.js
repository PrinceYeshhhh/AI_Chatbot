import express from 'express';
import { vectorService } from '../services/vectorService.js';
import { cacheService } from '../services/cacheService.js';
import { logger, wrapAsync } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/status - Get overall system status
router.get('/', wrapAsync(async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Vector store status
    try {
      status.vectorStore = await vectorService.getStats();
      status.vectorStore.status = 'healthy';
    } catch (error) {
      status.vectorStore = {
        status: 'error',
        error: error.message
      };
    }

    // Cache status
    status.cache = cacheService.getStats();

    // OpenAI API status
    status.openai = {
      configured: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
    };

    // File system status
    try {
      const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
      const files = await fs.readdir(uploadDir);
      status.fileSystem = {
        uploadDir,
        fileCount: files.length,
        status: 'healthy'
      };
    } catch (error) {
      status.fileSystem = {
        status: 'error',
        error: error.message
      };
    }

    // Overall health check
    const isHealthy = status.vectorStore.status === 'healthy' && 
                     status.openai.configured && 
                     status.fileSystem.status === 'healthy';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      ...status
    });

  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// GET /api/status/health - Simple health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/status/config - Get configuration info (non-sensitive)
router.get('/config', (req, res) => {
  const config = {
    server: {
      port: process.env.PORT || 3001,
      environment: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
    },
    ai: {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      maxTokens: process.env.OPENAI_MAX_TOKENS || 1000,
      temperature: process.env.OPENAI_TEMPERATURE || 0.7
    },
    vectorStore: {
      path: process.env.CHROMA_DB_PATH || './vector_store',
      collection: process.env.CHROMA_COLLECTION_NAME || 'chatbot_embeddings',
      similarityThreshold: process.env.VECTOR_SIMILARITY_THRESHOLD || 0.7,
      maxResults: process.env.MAX_RETRIEVAL_RESULTS || 5
    },
    fileUpload: {
      maxSize: process.env.MAX_FILE_SIZE || '50MB',
      allowedTypes: (process.env.ALLOWED_FILE_TYPES || '.txt,.md,.csv,.pdf,.json').split(','),
      maxFiles: process.env.MAX_FILES_PER_REQUEST || 10
    },
    textProcessing: {
      chunkSize: process.env.CHUNK_SIZE || 1000,
      chunkOverlap: process.env.CHUNK_OVERLAP || 200
    },
    cache: cacheService.getStats()
  };

  res.json(config);
});

// GET /api/status/logs - Get recent logs (development only)
router.get('/logs', wrapAsync(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Logs not available in production'
    });
  }

  try {
    const logFile = path.join(__dirname, '../../logs/combined.log');
    const lines = parseInt(req.query.lines) || 100;
    
    try {
      const logContent = await fs.readFile(logFile, 'utf-8');
      const logLines = logContent.split('\n').slice(-lines);
      
      res.json({
        logs: logLines.filter(line => line.trim()),
        totalLines: logLines.length,
        file: logFile
      });
    } catch (error) {
      res.json({
        logs: [],
        message: 'No log file found or unable to read logs',
        error: error.message
      });
    }

  } catch (error) {
    logger.error('Error reading logs:', error);
    res.status(500).json({
      error: 'Failed to read logs',
      message: error.message
    });
  }
}));

export default router;
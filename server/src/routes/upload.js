import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { documentProcessor } from '../services/documentProcessor.js';
import { vectorService } from '../services/vectorService.js';
import { logger, wrapAsync } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
try {
  await fs.mkdir(uploadDir, { recursive: true });
} catch (error) {
  logger.error('Failed to create upload directory:', error);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.txt,.md,.csv,.pdf,.json')
    .split(',')
    .map(type => type.trim());
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 10
  }
});

// Per-IP rate limiter for upload endpoint
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Too many upload requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Throttle repeated requests
const uploadSpeedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 5, // allow 5 requests at full speed, then...
  delayMs: 1000, // ...add 1s per request above 5
});

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Upload and process files
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files processed successfully
 *       207:
 *         description: Some files failed to process
 *       400:
 *         description: No files uploaded or invalid file type
 *       413:
 *         description: File too large or too many files
 *       429:
 *         description: Too many requests (rate limited)
 *       500:
 *         description: Upload processing failed
 *     security:
 *       - bearerAuth: []
 */
// POST /api/upload - Upload and process files
router.post('/', uploadLimiter, uploadSpeedLimiter, upload.array('files', 10), wrapAsync(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    logger.info(`Processing ${req.files.length} uploaded files`);

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        logger.info(`Processing file: ${file.originalname}`);

        // Process the document
        const processedDoc = await documentProcessor.processFile(file.path, {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });

        // Add to vector store
        const vectorResults = await vectorService.addDocuments([processedDoc]);

        results.push({
          filename: file.originalname,
          size: file.size,
          chunks: processedDoc.chunks.length,
          vectorIds: vectorResults,
          status: 'success'
        });

        logger.info(`Successfully processed ${file.originalname}: ${processedDoc.chunks.length} chunks`);

      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error.message,
          status: 'failed'
        });

        // Clean up failed file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.warn(`Failed to clean up file ${file.path}:`, unlinkError);
        }
        // Also remove any vector store entries for this file
        try {
          await vectorService.deleteDocument(file.originalname);
        } catch (vectorError) {
          logger.warn(`Failed to clean up vector store for ${file.originalname}:`, vectorError);
        }
      }
    }

    const response = {
      message: `Processed ${results.length} files successfully`,
      results,
      errors,
      summary: {
        totalFiles: req.files.length,
        successful: results.length,
        failed: errors.length,
        totalChunks: results.reduce((sum, r) => sum + r.chunks, 0)
      }
    };

    if (errors.length > 0) {
      res.status(207).json(response); // Multi-status
    } else {
      res.status(200).json(response);
    }

  } catch (error) {
    logger.error('Error in upload endpoint:', error);
    res.status(500).json({
      error: 'Upload processing failed',
      message: error.message
    });
  }
}));

/**
 * @openapi
 * /upload/text:
 *   post:
 *     summary: Upload raw text content
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               filename:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Text processed successfully
 *       400:
 *         description: Invalid content
 *       413:
 *         description: Content too large
 *       429:
 *         description: Too many requests (rate limited)
 *       500:
 *         description: Text processing failed
 *     security:
 *       - bearerAuth: []
 */
// POST /api/upload/text - Upload raw text content
router.post('/text', wrapAsync(async (req, res) => {
  try {
    const { content, filename = 'text-input.txt', metadata = {} } = req.body;

    // Enforce a maximum size for text uploads (e.g., 256KB)
    if (typeof content === 'string' && Buffer.byteLength(content, 'utf-8') > 256 * 1024) {
      return res.status(413).json({
        error: 'Content too large',
        message: 'Text uploads must be less than 256KB. Please use the file upload endpoint for larger files.'
      });
    }
    // TODO: Consider supporting streaming or chunked uploads for very large text data

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'Invalid content',
        message: 'Content must be a non-empty string'
      });
    }

    logger.info(`Processing text input: ${filename}`);

    // Process the text content
    const processedDoc = await documentProcessor.processText(content, {
      filename,
      ...metadata
    });

    // Add to vector store
    const vectorResults = await vectorService.addDocuments([processedDoc]);

    res.json({
      message: 'Text processed successfully',
      result: {
        filename,
        chunks: processedDoc.chunks.length,
        vectorIds: vectorResults,
        status: 'success'
      }
    });

  } catch (error) {
    logger.error('Error processing text input:', error);
    res.status(500).json({
      error: 'Text processing failed',
      message: error.message
    });
  }
}));

/**
 * @openapi
 * /upload/status:
 *   get:
 *     summary: Get upload and processing status
 *     tags:
 *       - Upload
 *     responses:
 *       200:
 *         description: Upload and vector store status
 *     security:
 *       - bearerAuth: []
 */
// GET /api/upload/status - Get upload and processing status
router.get('/status', wrapAsync(async (req, res) => {
  try {
    const vectorStats = await vectorService.getStats();
    
    // Get upload directory stats
    let uploadStats = { files: 0, totalSize: 0 };
    try {
      const files = await fs.readdir(uploadDir);
      uploadStats.files = files.length;
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);
        uploadStats.totalSize += stats.size;
      }
    } catch (error) {
      logger.warn('Error reading upload directory:', error);
    }

    res.json({
      vectorStore: vectorStats,
      uploads: uploadStats,
      configuration: {
        maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || '.txt,.md,.csv,.pdf,.json').split(','),
        maxFiles: process.env.MAX_FILES_PER_REQUEST || 10
      }
    });

  } catch (error) {
    logger.error('Error getting upload status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
}));

// DELETE /api/upload/clear - Clear all uploaded files and vectors
router.delete('/clear', wrapAsync(async (req, res) => {
  try {
    logger.info('Clearing all uploaded files and vectors');

    // Clear vector store
    await vectorService.clear();

    // Clear upload directory
    const files = await fs.readdir(uploadDir);
    for (const file of files) {
      await fs.unlink(path.join(uploadDir, file));
    }

    res.json({
      message: 'All files and vectors cleared successfully',
      cleared: {
        files: files.length,
        vectors: 'all'
      }
    });

  } catch (error) {
    logger.error('Error clearing files:', error);
    res.status(500).json({
      error: 'Failed to clear files',
      message: error.message
    });
  }
}));

export default router;
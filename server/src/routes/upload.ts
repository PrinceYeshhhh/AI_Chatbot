import express, { Request, Response } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';
import { documentProcessor } from '../services/documentProcessor';
import { smartBrainService } from '../services/smartBrainService';
import { vectorService } from '../services/vectorService';
import { supabase } from '../lib/supabase';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
    cb(null, uploadDir);
  },
  filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  // No fileSize or files limit for unlimited ingestion
});

const router = express.Router();

// Upload files endpoint with Smart Brain integration
router.post('/', authMiddleware, upload.array('files'), async (req: Request, res: Response): Promise<void> => {
  try {
    const files = (req as any).files as any[];
    const userId = req.user?.id || 'unknown';
    const { sessionId } = req.body;

    if (!files || files.length === 0) {
      errorResponse(res, 'No files uploaded', 400);
      return;
    }

    // Prepare batch for processing
    const batchFiles = files.map(file => ({
      path: file.path,
      type: file.mimetype,
      id: file.filename,
      userId
    }));

    // Process all files in batch
    const processingResults = await documentProcessor.processDocumentsBatch(batchFiles);

    // Build file-level status
    const uploadedFiles = files.map((file, idx) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      chunks: processingResults[idx]?.chunks || 0,
      status: processingResults[idx]?.success ? 'processed' : 'error',
      error: processingResults[idx]?.error || null
    }));

    // Get vector store stats
    const vectorStats = await vectorService.getStats();

    logger.info(`Files uploaded by user ${userId}:`, uploadedFiles.map(f => f.originalName));

    successResponse(res, {
      message: 'Files uploaded and processed successfully',
      files: uploadedFiles,
      processingResults,
      vectorStats,
      count: uploadedFiles.length,
      sessionId: sessionId || null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Upload error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to upload files');
  }
});

// Upload text content directly
router.post('/text', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, filename, sessionId } = req.body;
    const userId = req.user?.id || 'unknown';

    if (!content || !filename) {
      errorResponse(res, 'Content and filename are required', 400);
      return;
    }

    // Create temporary file path
    const uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filePath = path.join(uploadDir, `text-${uniqueSuffix}.txt`);

    // Write content to file
    const fs = require('fs').promises;
    await fs.writeFile(filePath, content, 'utf-8');

    // Process with document processor
    const processingResult = await documentProcessor.processDocument(filePath, userId);
    
    if (processingResult.success) {
      // Add to Smart Brain session if sessionId provided
      if (sessionId) {
        await smartBrainService.addUploadedFile(sessionId, {
          fileId: `text-${uniqueSuffix}`,
          filename: filename,
          fileType: 'text/plain',
          documentCount: processingResult.chunks
        });
      }

      successResponse(res, {
        message: 'Text content uploaded and processed successfully',
        filename: filename,
        chunks: processingResult.chunks,
        sessionId: sessionId || null
      });
    } else {
      errorResponse(res, `Failed to process text content: ${processingResult.error}`, 500);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Text upload error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to upload text content');
  }
});

// Get uploaded files with processing status
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'unknown';
    const { sessionId } = req.query;

    // Get vector store stats
    const vectorStats = await vectorService.getStats();

    // Get session stats if sessionId provided
    let sessionStats = null;
    if (sessionId) {
      sessionStats = smartBrainService.getSessionStats(sessionId as string);
    }

    // Mock file list with processing status
    const files = [
      {
        id: 1,
        originalName: 'test.pdf',
        filename: 'test-123.pdf',
        size: 1024,
        uploadedAt: new Date().toISOString(),
        userId,
        status: 'processed',
        chunks: 5
      }
    ];

    successResponse(res, {
      files,
      total: files.length,
      vectorStats,
      sessionStats,
      sessionId: sessionId || null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting files:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get files');
  }
});

// Get upload status and processing stats
router.get('/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'unknown';
    const { sessionId } = req.query;

    // Get vector store stats
    const vectorStats = await vectorService.getStats();
    
    // Get Smart Brain health status
    const brainHealth = smartBrainService.getHealthStatus();

    // Get session stats if sessionId provided
    let sessionStats = null;
    if (sessionId) {
      sessionStats = smartBrainService.getSessionStats(sessionId as string);
    }

    successResponse(res, {
      vectorStore: vectorStats,
      smartBrain: brainHealth,
      sessionStats,
      sessionId: sessionId || null,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting upload status:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get upload status');
  }
});

// Delete uploaded file
router.delete('/:fileId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id || 'unknown';
    const { sessionId } = req.query;

    // Remove file metadata from files table
    const { error: fileError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);
    if (fileError) throw new Error(fileError.message);

    // Remove all associated vectors from vectors table
    const { error: vectorError } = await supabase
      .from('vectors')
      .delete()
      .eq('file_id', fileId)
      .eq('user_id', userId);
    if (vectorError) throw new Error(vectorError.message);

    // Remove from session if sessionId provided
    if (sessionId) {
      logger.info(`File removed from session ${sessionId}: ${fileId}`);
    }

    logger.info(`File and vectors deleted for user ${userId}: ${fileId}`);

    successResponse(res, {
      message: 'File and associated memory deleted successfully',
      fileId,
      sessionId: sessionId || null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error deleting file:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to delete file');
  }
});

export default router; 
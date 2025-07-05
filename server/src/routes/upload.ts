import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth.middleware';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';

// Extend Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const router = express.Router();

// Upload files endpoint
router.post('/', authMiddleware, upload.array('files', 5), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.user?.id || 'unknown';

    if (!files || files.length === 0) {
      errorResponse(res, 'No files uploaded', 400);
      return;
    }

    const uploadedFiles = files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    }));

    logger.info(`Files uploaded by user ${userId}:`, uploadedFiles.map(f => f.originalName));

    successResponse(res, {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Upload error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to upload files');
  }
});

// Get uploaded files
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'unknown';

    // Mock file list
    const files = [
      {
        id: 1,
        originalName: 'test.pdf',
        filename: 'test-123.pdf',
        size: 1024,
        uploadedAt: new Date().toISOString(),
        userId
      }
    ];

    successResponse(res, {
      files,
      total: files.length
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting files:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get files');
  }
});

// Delete uploaded file
router.delete('/:filename', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const userId = req.user?.id || 'unknown';

    // Mock file deletion
    logger.info(`File deletion requested by user ${userId}: ${filename}`);

    successResponse(res, {
      message: 'File deleted successfully',
      filename
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error deleting file:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to delete file');
  }
});

export default router; 
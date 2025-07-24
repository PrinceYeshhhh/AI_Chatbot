import express from 'express';
import multer from 'multer';
import path from 'path';
import { processImage } from '../services/imageService';
import { NeonDatabaseService } from '../services/neonDatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware';
import xss from 'xss';
import fs from 'fs/promises';

const router = express.Router();

const dbService = new NeonDatabaseService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get user ID and storage_mode from request
    const userId = req.user?.id || 'anonymous';
    const storageMode = req.body.storage_mode === 'temporary' ? 'temporary' : 'permanent';
    const dest = path.join(__dirname, '../../uploads', userId, storageMode);
    fs.mkdir(dest, { recursive: true })
      .then(() => cb(null, dest))
      .catch(() => cb(new Error('Failed to create upload directory'), ''));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(null, false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Add authMiddleware to ensure user is authenticated
router.post('/', authMiddleware, upload.single('image'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const userId = req.user?.id || 'anonymous';
    const storageMode = req.body.storage_mode === 'temporary' ? 'temporary' : 'permanent';
    const fileId = uuidv4();
    const fileName = xss(req.file.originalname);
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;
    const filePath = req.file.path;
    const createdAt = new Date().toISOString();
    // Insert metadata into files table
    await dbService.insertFile(fileId, userId, '', fileName, fileSize, mimeType, storageMode, createdAt);
    // Optionally process image (OCR, etc.)
    const result = await processImage(filePath);
    res.json({ fileId, fileName, fileSize, mimeType, storageMode, result });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router; 
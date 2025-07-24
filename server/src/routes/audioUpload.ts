import express from 'express';
import multer from 'multer';
import path from 'path';
import { processAudio } from '../services/audioService';
import { NeonDatabaseService } from '../services/neonDatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware';
import xss from 'xss';
import fs from 'fs/promises';

const router = express.Router();

const dbService = new NeonDatabaseService();

const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    const userId = req.user?.id || 'anonymous';
    const storageMode = req.body.storage_mode === 'temporary' ? 'temporary' : 'permanent';
    const dest = path.join(__dirname, '../../uploads', userId, storageMode);
    try {
      require('fs').mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (e) {
      cb(null, '');
    }
  },
  filename: function (req: any, file: any, cb: any) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a', 'audio/mp4', 'audio/ogg', 'audio/webm'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

router.post('/', authMiddleware, upload.single('audio'), async (req, res): Promise<void> => {
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
    await dbService.insertFile(fileId, userId, '', fileName, fileSize, mimeType, storageMode, createdAt);
    const result = await processAudio(filePath);
    res.json({ fileId, fileName, fileSize, mimeType, storageMode, result });
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express, { Request, Response } from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { z } from 'zod';
import xss from 'xss';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rate limiting middleware (10 requests per minute per IP)
const whisperLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many STT requests, please try again later.' }
});

const allowedAudioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
const maxAudioFileSize = 20 * 1024 * 1024; // 20MB

const whisperQuerySchema = z.object({
  provider: z.string().optional()
});

function validateWhisperQuery(req: Request, res: Response, next: express.NextFunction): void {
  const result = whisperQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid query', details: result.error.errors });
    return;
  }
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = xss(req.query[key] as string);
    }
  }
  next();
}

function validateAudioFile(req: Request, res: Response, next: express.NextFunction): void {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded' });
    return;
  }
  const { originalname, size } = req.file;
  const ext = originalname.slice(originalname.lastIndexOf('.')).toLowerCase();
  if (!allowedAudioExtensions.includes(ext)) {
    res.status(400).json({ error: `Unsupported audio file type: ${ext}` });
    return;
  }
  if (size > maxAudioFileSize) {
    res.status(400).json({ error: `Audio file size exceeds limit (${maxAudioFileSize / (1024 * 1024)}MB)` });
    return;
  }
  req.file.originalname = xss(originalname);
  next();
}

// POST /api/whisper
router.post('/whisper', whisperLimiter, upload.single('audio'), validateWhisperQuery, validateAudioFile, async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded' });
    return;
  }
  try {
    const provider = req.query['provider'] || process.env['STT_PROVIDER'] || 'assemblyai';
    let transcriptResult;
    if (provider === 'whispercpp') {
      transcriptResult = await transcribeWithWhisperCpp(req.file);
    } else {
      transcriptResult = await transcribeWithAssemblyAI(req.file);
    }
    res.json(transcriptResult);
    return;
  } catch (error: any) {
    logger.error('STT error:', error);
    res.status(500).json({ error: error.message || 'Speech-to-text failed' });
    return;
  }
});

// AssemblyAI cloud transcription
async function transcribeWithAssemblyAI(file: Express.Multer.File | undefined) {
  if (!file) throw new Error('No file provided');
  const assemblyApiKey = process.env['ASSEMBLYAI_API_KEY'];
  if (!assemblyApiKey) throw new Error('AssemblyAI API key not set');
  // Step 1: Upload audio
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: { 'authorization': assemblyApiKey },
    body: file.buffer
  });
  if (!uploadRes.ok) throw new Error('Failed to upload audio to AssemblyAI');
  const uploadData = await uploadRes.json() as any;
  const audioUrl = uploadData.upload_url;
  // Step 2: Request transcription (with word/timestamp options)
  const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': assemblyApiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      punctuate: true,
      format_text: true,
      word_boost: [],
      auto_highlights: true,
      iab_categories: true,
      entity_detection: true,
      sentiment_analysis: true,
      summarization: false,
      // Return word-level timestamps
      words: true
    })
  });
  if (!transcriptRes.ok) throw new Error('Failed to start transcription job');
  const transcriptData = await transcriptRes.json() as any;
  const transcriptId = transcriptData.id;
  // Step 3: Poll for completion
  let status = transcriptData.status;
  let transcriptText = '';
  let words = [];
  let utterances = [];
  let metadata: any = {};
  for (let i = 0; i < 30 && status !== 'completed'; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { 'authorization': assemblyApiKey }
    });
    const pollData = await pollRes.json() as any;
    status = pollData.status;
    if (status === 'completed') {
      transcriptText = pollData.text;
      words = pollData.words || [];
      utterances = pollData.utterances || [];
      metadata = pollData || {};
      break;
    } else if (status === 'failed') {
      throw new Error('Transcription failed');
    }
  }
  if (status !== 'completed') throw new Error('Transcription timed out');
  return {
    transcription: transcriptText,
    words,
    utterances,
    metadata
  };
}

// Whisper.cpp local transcription
async function transcribeWithWhisperCpp(file: Express.Multer.File | undefined) {
  if (!file) throw new Error('No file provided');
  // Save file to temp location
  const tempDir = path.join(process.cwd(), 'server', 'uploads', 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  const tempPath = path.join(tempDir, `${Date.now()}_${file.originalname}`);
  await fs.writeFile(tempPath, file.buffer);
  try {
    // Call local Whisper.cpp server (assume POST /transcribe)
    const whisperUrl = process.env['WHISPERCPP_URL'] || 'http://localhost:9000/transcribe';
    const whisperRes = await fetch(whisperUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: tempPath })
    });
    if (!whisperRes.ok) throw new Error('Whisper.cpp transcription failed');
    const data = await whisperRes.json() as any;
    return {
      transcription: data.transcription || '',
      words: data.words || [],
      utterances: data.utterances || [],
      metadata: data.metadata || {}
    };
  } finally {
    // Clean up temp file
    await fs.unlink(tempPath).catch(() => {});
  }
}

export default router; 
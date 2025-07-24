import fs from 'fs/promises';
import path from 'path';
// import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
// Use require for csv-parse/sync to avoid ESM import issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parse: csvParse } = require('csv-parse/sync');
import fetch from 'node-fetch';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { sendWebhookAlert } from './logger';
import { spawn } from 'child_process';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { logger } from './logger';

// Supported file types and their MIME types
export const supportedFileTypes: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
  '.txt': ['text/plain'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.svg': ['image/svg+xml'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.heic': ['image/heic'],
  '.heif': ['image/heif'],
  '.mp3': ['audio/mpeg'],
  '.wav': ['audio/wav'],
  '.m4a': ['audio/mp4'],
  '.aac': ['audio/aac'],
  '.ogg': ['audio/ogg'],
  '.webm': ['audio/webm'],
  '.mp4': ['video/mp4'],
};

const redis = new IORedis(process.env['REDIS_URL'] || 'redis://localhost:6379');
export const fileProcessingQueue = new Queue('file-processing', { connection: redis });

const CACHE_TTL = 60 * 60; // 1 hour

export interface ParseResult {
  text: string;
  file_type: string;
  file_name: string;
  token_count?: number;
  metadata?: Record<string, any>;
}

export async function getBufferFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file from URL: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function estimateTokenCount(text: string): Promise<number> {
  try {
    // @ts-ignore: gpt-3-encoder is an optional dependency
    const encoder = await import('gpt-3-encoder');
    return encoder.encode(text).length;
  } catch (e) {
    // Fallback to word count
    return text ? text.split(/\s+/).length : 0;
  }
}

export async function parseFile(
  input: { buffer?: Buffer; url?: string; fileName: string; userId?: string; mimeType?: string }
): Promise<ParseResult> {
  let buffer: Buffer;
  const { fileName, url, userId, mimeType } = input;
  if (url) {
    buffer = await getBufferFromUrl(url);
  } else if (input.buffer) {
    buffer = input.buffer;
  } else {
    throw new Error('No file buffer or URL provided');
  }

  const ext = path.extname(fileName).toLowerCase();
  let text = '';
  let metadata: Record<string, any> = { user_id: userId || null, file_name: fileName };
  let modality = 'text';

  // --- Supported file type check ---
  if (!supportedFileTypes[ext] || (mimeType && !supportedFileTypes[ext].includes(mimeType))) {
    logger.warn('Unsupported file type attempted', { userId, fileName, ext, mimeType });
    const error = new Error(`Unsupported file type: ${ext}`);
    (error as any).status = 422;
    throw error;
  }

  try {
    switch (ext) {
      case '.pdf': {
        // Use Python microservice for PDF parsing (pdfplumber)
        const res = await fetch('http://localhost:8000/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/pdf' },
          body: buffer
        });
        if (!res.ok) throw new Error('PDF parsing failed');
        const data: any = await res.json();
        text = data.text || '';
        metadata = { ...metadata, ...data.metadata, source_type: 'pdf' };
        break;
      }
      case '.docx': {
        try {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value || '';
          metadata = { ...metadata, messages: result.messages, source_type: 'docx' };
        } catch (err) {
          logger.error('DOCX extraction failed', { userId, fileName, error: err });
          const error = new Error('File corrupted or unreadable');
          (error as any).status = 422;
          throw error;
        }
        break;
      }
      case '.txt': {
        text = buffer.toString('utf-8');
        metadata = { ...metadata, source_type: 'txt' };
        break;
      }
      case '.csv':
      case '.xlsx': {
        // Use Python microservice for table parsing (pandas)
        const res = await fetch('http://localhost:8000/table', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': fileName },
          body: buffer
        });
        if (!res.ok) throw new Error('Table parsing failed');
        const data: any = await res.json();
        text = data.text || '';
        metadata = { ...metadata, ...data.metadata, source_type: ext.replace('.', '') };
        break;
      }
      case '.svg': {
        try {
          // Convert SVG buffer to PNG using sharp
          const pngBuffer = await sharp(buffer).png().toBuffer();
          // OCR with tesseract.js
          const { data: { text: ocrText } } = await Tesseract.recognize(pngBuffer, 'eng');
          text = ocrText ? ocrText.replace(/\s+/g, ' ').trim() : '';
          if (!text) throw new Error('No text found in SVG via OCR');
          metadata = { ...metadata, source_type: 'svg_ocr' };
        } catch (err) {
          logger.error('SVG OCR extraction failed', { userId, fileName, error: err });
          const error = new Error('File corrupted or unreadable');
          (error as any).status = 422;
          throw error;
        }
        break;
      }
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.webp':
      case '.heic':
      case '.heif': {
        // Use Python microservice for OCR (pytesseract/easyocr)
        modality = 'image';
        const res = await fetch('http://localhost:8000/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': fileName },
          body: buffer
        });
        if (!res.ok) throw new Error('Image OCR failed');
        const data: any = await res.json();
        text = data.text || '';
        metadata = { ...metadata, ...data.metadata, source_type: ext.replace('.', '') };
        break;
      }
      case '.mp3':
      case '.wav':
      case '.m4a':
      case '.aac':
      case '.ogg':
      case '.webm': {
        // Use Python microservice for audio transcription (Whisper)
        modality = 'audio';
        const res = await fetch('http://localhost:8000/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': fileName },
          body: buffer
        });
        if (!res.ok) throw new Error('Audio transcription failed');
        const data: any = await res.json();
        text = data.text || '';
        metadata = { ...metadata, ...data.metadata, source_type: ext.replace('.', '') };
        break;
      }
      case '.mp4': {
        // Extract audio with ffmpeg, then transcribe with Whisper
        modality = 'video';
        const tempVideo = `/tmp/${Date.now()}_${fileName}`;
        const tempAudio = tempVideo.replace(/\.mp4$/, '.wav');
        await fs.writeFile(tempVideo, buffer);
        await new Promise((resolve, reject) => {
          const ffmpeg = spawn('ffmpeg', ['-i', tempVideo, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', tempAudio]);
          ffmpeg.on('close', (code) => (code === 0 ? resolve(null) : reject(new Error('ffmpeg failed'))));
        });
        const audioBuffer = await fs.readFile(tempAudio);
        const res = await fetch('http://localhost:8000/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': tempAudio },
          body: audioBuffer
        });
        if (!res.ok) throw new Error('Video transcription failed');
        const data: any = await res.json();
        text = data.text || '';
        metadata = { ...metadata, ...data.metadata, source_type: 'mp4' };
        // Clean up temp files
        await fs.unlink(tempVideo).catch(() => {});
        await fs.unlink(tempAudio).catch(() => {});
        break;
      }
      default: {
        logger.warn('Unsupported file type attempted', { userId, fileName, ext });
        const error = new Error(`Unsupported file type: ${ext}`);
        (error as any).status = 422;
        throw error;
      }
    }
  } catch (err: any) {
    // Log and rethrow as structured error
    logger.error('File parsing failed', { userId, fileName, ext, error: err });
    if (err.status === 422) throw err;
    const error = new Error('File corrupted or unreadable');
    (error as any).status = 422;
    throw error;
  }

  // Clean up text
  text = text.replace(/\s+/g, ' ').trim();

  // Token estimation (gpt-3-encoder if available, else word count)
  const token_count = await estimateTokenCount(text);

  return {
    text,
    file_type: ext.replace('.', ''),
    file_name: fileName,
    token_count,
    metadata: { ...metadata, modality },
  };
}

export async function parseFileJob(input: { buffer?: Buffer; url?: string; fileName: string }): Promise<ParseResult> {
  // Check cache first
  const cacheKey = `file:${input.fileName}:${input.url || ''}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  // Run actual parsing
  const result = await parseFile(input);
  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

// Worker to process jobs
export function startFileProcessingWorker() {
  new Worker('file-processing', async (job) => {
    try {
      return await parseFileJob(job.data);
    } catch (error) {
      await sendWebhookAlert({
        type: 'file_processing_failure',
        file: job.data.fileName,
        error: error instanceof Error ? error.message : String(error),
        jobData: job.data
      });
      throw error;
    }
  }, { connection: redis });
} 
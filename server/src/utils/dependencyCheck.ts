import fs from 'fs';
import path from 'path';

const requiredModules = [
  'multer', 'express-fileupload', 'pdf-parse', 'mammoth', 'papaparse', 'xlsx',
  'openai', '@dqbd/tiktoken', 'supabase-js', 'pgvector', 'redis', 'sqlite3',
  'fluent-ffmpeg', 'ffmpeg-static', 'tesseract.js', 'winston', 'sentry', 'pino'
];

export function checkDependencies(logger = console) {
  let allOk = true;
  for (const mod of requiredModules) {
    try {
      require.resolve(mod);
    } catch (e) {
      logger.warn(`[DependencyCheck] Missing npm module: ${mod}`);
      allOk = false;
    }
  }
  // Check for ffmpeg binary
  try {
    const ffmpegPath = require('ffmpeg-static');
    if (!fs.existsSync(ffmpegPath)) {
      logger.warn('[DependencyCheck] ffmpeg-static binary not found.');
      allOk = false;
    }
  } catch (e) {
    logger.warn('[DependencyCheck] ffmpeg-static not installed.');
    allOk = false;
  }
  // Add more binary checks as needed
  return allOk;
} 
// Deprecated: Use parseFile.ts for all new file type support and error handling. This file is legacy for document processing.
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { logger } from '../utils/logger';
import { EmbeddingService } from './embeddingService';
import { NeonDatabaseService } from './neonDatabaseService';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { parse as csvParse } from 'csv-parse/sync';
import xlsx from 'xlsx';
import Tesseract from 'tesseract.js';
import fetch from 'node-fetch';
import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import IORedis from 'ioredis';

interface ProcessingMetadata {
  fileId: string;
  userId: string;
  chunkCount: number;
  processingTime: number;
  status: 'success' | 'error';
  error?: string;
}

interface ProcessingResult {
  success: boolean;
  chunks: number;
  error?: string;
}

interface BatchProcessingResult {
  success: boolean;
  chunks: number;
  error?: string;
}

// Redis connection for BullMQ and caching
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

// BullMQ queue for heavy document processing
const docProcessingQueue = new Queue('doc-processing', { connection: redis });
const docProcessingScheduler = new QueueScheduler('doc-processing', { connection: redis });

// Simple Redis cache for repeat file analysis
async function getCachedResult(fileId: string): Promise<ProcessingResult | null> {
  const cached = await redis.get(`docproc:${fileId}`);
  return cached ? JSON.parse(cached) : null;
}
async function setCachedResult(fileId: string, result: ProcessingResult) {
  await redis.set(`docproc:${fileId}`, JSON.stringify(result), 'EX', 60 * 60 * 24); // 24h
}

export class DocumentProcessor {
  private chunkSize: number;
  private chunkOverlap: number;
  private _textSplitter: RecursiveCharacterTextSplitter;
  private embeddingService: EmbeddingService;
  private dbService: NeonDatabaseService;

  constructor(chunkSize = 1000, chunkOverlap = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this._textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
    this.embeddingService = new EmbeddingService();
    this.dbService = new NeonDatabaseService();
  }

  // Enqueue heavy processing as a BullMQ job
  async processDocument(filePath: string, userId: string): Promise<ProcessingResult> {
    const fileId = path.basename(filePath, path.extname(filePath));
    // Check cache first
    const cached = await getCachedResult(fileId);
    if (cached) {
      logger.info(`Cache hit for file ${fileId}`);
      return cached;
    }
    // Enqueue job
    const job = await docProcessingQueue.add('process', { filePath, userId, fileId });
    // Optionally, emit progress events here (stub for frontend integration)
    // e.g., socket.emit('upload-progress', { fileId, progress: 0 });
    const result: ProcessingResult = await job.waitUntilFinished(docProcessingScheduler);
    await setCachedResult(fileId, result);
    return result;
  }

  async processDocumentsBatch(files: any[]): Promise<BatchProcessingResult[]> {
    const results: BatchProcessingResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processDocument(file.path, file.userId);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          chunks: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  private async extractTextFromFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.txt':
        return await fs.readFile(filePath, 'utf-8');
      case '.pdf':
        return await this.extractTextFromPDF(filePath);
      case '.csv':
        return await this.extractTextFromCSV(filePath);
      case '.xlsx':
        return await this.extractTextFromXLSX(filePath);
      default:
        return await this.extractTextWithTextract(filePath);
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const data = await fs.readFile(filePath);
      const pdfData = await pdfParse(data);
      return pdfData.text || '';
    } catch (err) {
      logger.error('PDF extraction failed:', err);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractTextFromCSV(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const records = csvParse(content, { columns: true });
      return records.map((row: any) => Object.values(row).join(' ')).join('\n');
    } catch (err) {
      logger.error('CSV extraction failed:', err);
      throw new Error('Failed to extract text from CSV');
    }
  }

  private async extractTextFromXLSX(filePath: string): Promise<string> {
    try {
      const data = await fs.readFile(filePath);
      const workbook = xlsx.read(data, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        text += rows.map((row: any) => row.join(' ')).join('\n') + '\n';
      });
      return text;
    } catch (err) {
      logger.error('XLSX extraction failed:', err);
      throw new Error('Failed to extract text from XLSX');
    }
  }

  private async extractTextWithTextract(filePath: string): Promise<string> {
    // Try OCR for images, fallback to Google Vision API if configured
    try {
      const ext = path.extname(filePath).toLowerCase();
      const imageTypes = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'];
      if (imageTypes.includes(ext)) {
        // Use Tesseract.js for OCR
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
        if (text && text.trim().length > 0) return text;
        // Fallback to Google Vision API if configured
        if (process.env['GOOGLE_VISION_API_KEY']) {
          const visionText = await this.extractTextWithGoogleVision(filePath);
          if (visionText) return visionText;
        }
        throw new Error('OCR failed for image');
      }
      // Fallback: try reading as plain text
      return await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      logger.error('General extraction failed:', err);
      throw new Error('Failed to extract text from file');
    }
  }

  private async extractTextWithGoogleVision(filePath: string): Promise<string> {
    try {
      const apiKey = process.env['GOOGLE_VISION_API_KEY'];
      if (!apiKey) throw new Error('Google Vision API key not set');
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      });
      const data = await response.json();
      const text = data.responses?.[0]?.fullTextAnnotation?.text || '';
      return text;
    } catch (err) {
      logger.error('Google Vision extraction failed:', err);
      return '';
    }
  }

  // Move the original processDocument logic to a private method
  private async _processDocumentInternal(filePath: string, userId: string): Promise<ProcessingResult> {
    try {
      const startTime = Date.now();
      
      // Extract text from file
      const text = await this.extractTextFromFile(filePath);
      
      // Split text into chunks
      const chunks = await this._textSplitter.splitText(text);
      
      // Generate embeddings for chunks
      const fileName = path.basename(filePath);
      const fileId = path.basename(filePath, path.extname(filePath));
      
      // Save embeddings to Qdrant
      await this.embeddingService.saveFileEmbeddings(fileId, userId, fileName, chunks);
      
      // Save file metadata to database
      const query = `
        INSERT INTO files (id, user_id, file_name, file_size, mime_type, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          file_name = EXCLUDED.file_name,
          file_size = EXCLUDED.file_size,
          updated_at = CURRENT_TIMESTAMP;
      `;
      
      const stats = await fs.stat(filePath);
      await this.dbService.query(query, [
        fileId,
        userId,
        fileName,
        stats.size,
        'text/plain', // Default mime type
        'processed'
      ]);
      
      const processingTime = Date.now() - startTime;
      
      const _metadata: ProcessingMetadata = {
        fileId,
        userId,
        chunkCount: chunks.length,
        processingTime,
        status: 'success'
      };
      
      logger.info(`Document processed successfully: ${filePath}`, {
        chunks: chunks.length,
        processingTime,
        userId
      });
      
      return {
        success: true,
        chunks: chunks.length
      };
    } catch (error) {
      logger.error('Error processing document:', error);
      return {
        success: false,
        chunks: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// BullMQ worker for heavy processing
const docProcessingWorker = new Worker('doc-processing', async (job: Job) => {
  const { filePath, userId, fileId } = job.data;
  // Optionally, emit progress events here (stub for frontend integration)
  // e.g., socket.emit('upload-progress', { fileId, progress: 10 });
  // Call the original processing logic
  const processor = new DocumentProcessor();
  const result = await processor._processDocumentInternal(filePath, userId);
  // Optionally, emit progress events here (stub for frontend integration)
  // e.g., socket.emit('upload-progress', { fileId, progress: 100 });
  return result;
}, { connection: redis });

export const documentProcessor = new DocumentProcessor();

// Get processing statistics
export async function getProcessingStats(userId: string): Promise<Record<string, unknown>> {
  try {
    const dbService = new NeonDatabaseService();
    const query = `
      SELECT 
        COUNT(*) as total_files,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed_files,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_files
      FROM files 
      WHERE user_id = $1;
    `;
    
    const result = await dbService.query(query, [userId]);
    return result.rows[0] || { total_files: 0, processed_files: 0, error_files: 0 };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get processing stats:', errorMessage);
    throw error;
  }
} 
import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { vectorService } from './vectorService';
import { logger } from '../utils/logger';
import { saveTrainingData, updateFileStatus, getProcessingStatsFromDB, saveFileEmbeddings } from './supabaseService';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import textract from 'textract';

interface ProcessingMetadata {
  source: string;
  filename: string;
  fileType: string;
  chunkIndex: number;
  totalChunks: number;
  userId: string;
  [key: string]: any; // Add index signature to make it compatible with VectorMetadata
}

interface ProcessingResult {
  success: boolean;
  chunks: number;
  error?: string;
}

interface BatchFile {
  path: string;
  type: string;
  id: string;
  userId: string;
}

export class DocumentProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const openAIApiKey = process.env['OPENAI_API_KEY'];
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is required for document processing');
    }
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
    });
  }

  async processDocument(filePath: string, userId: string, fileId?: string): Promise<ProcessingResult> {
    try {
      const fileType = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      let text = '';
      switch (fileType) {
        case '.pdf':
          text = await this.extractTextFromPDF(filePath);
          break;
        case '.docx':
          text = await this.extractTextFromDOCX(filePath);
          break;
        case '.csv':
          text = await this.extractTextFromCSV(filePath);
          break;
        case '.xlsx':
          text = await this.extractTextFromXLSX(filePath);
          break;
        case '.txt':
          text = await this.extractTextFromTXT(filePath);
          break;
        default:
          text = await this.extractTextWithTextract(filePath);
      }
      if (!text.trim()) {
        throw new Error('No text content found in document');
      }
      const chunks = await this.splitText(text);
      const embeddings = await this.generateEmbeddings(chunks);
      if (fileId) {
        if (embeddings.length !== chunks.length) {
          throw new Error('Mismatch between number of embeddings and chunks');
        }
        const uploadedAt = new Date().toISOString();
        const embeddingRows = chunks.map((chunk, i) => {
          if (!embeddings[i]) throw new Error('Missing embedding for chunk');
          return {
            user_id: userId,
            file_id: fileId,
            file_name: filename,
            chunk_text: chunk,
            embedding_vector: embeddings[i],
            chunk_index: i,
            uploaded_at: uploadedAt
          };
        });
        await saveFileEmbeddings(embeddingRows);
      }
      const metadata: ProcessingMetadata = {
        source: filePath,
        filename,
        fileType,
        chunkIndex: 0,
        totalChunks: chunks.length,
        userId,
      };
      await vectorService.addDocuments(
        chunks,
        embeddings,
        chunks.map((chunk, i) => ({
          file_id: fileId,
          user_id: userId,
          chunk_index: i,
          chunk_text: chunk,
          file_name: filename,
          uploaded_at: new Date().toISOString(),
        }))
      );
      logger.info(`Processed document: ${filename}, chunks: ${chunks.length}`);
      return {
        success: true,
        chunks: chunks.length,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Document processing error:', errorMessage);
      return {
        success: false,
        chunks: 0,
        error: errorMessage,
      };
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // Mock PDF extraction for now
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      logger.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractTextFromTXT(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error('TXT extraction error:', error);
      throw new Error('Failed to read text file');
    }
  }

  private async extractTextFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractTextFromCSV(filePath: string): Promise<string> {
    const rows: string[] = [];
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return fileContent;
  }

  private async extractTextFromXLSX(filePath: string): Promise<string> {
    const workbook = xlsx.readFile(filePath);
    let text = '';
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      text += xlsx.utils.sheet_to_csv(sheet);
    });
    return text;
  }

  private async extractTextWithTextract(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, (err, text) => {
        if (err) reject(err);
        else resolve(text || '');
      });
    });
  }

  private async splitText(text: string): Promise<string[]> {
    try {
      const docs = await this.textSplitter.createDocuments([text]);
      return docs.map(doc => doc.pageContent);
    } catch (error) {
      logger.error('Text splitting error:', error);
      throw new Error('Failed to split text into chunks');
    }
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      logger.error('Embedding generation error:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  async processDocumentsBatch(files: BatchFile[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    for (const file of files) {
      try {
        const result = await this.processDocument(file.path, file.userId, file.id);
        results.push(result);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          chunks: 0,
          error: errorMessage,
        });
      }
    }
    return results;
  }
}

export const documentProcessor = new DocumentProcessor();

// Get processing statistics
export async function getProcessingStats(userId: string): Promise<Record<string, unknown>> {
  try {
    const stats = await getProcessingStatsFromDB(userId);
    return stats;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get processing stats:', errorMessage);
    throw error;
  }
} 
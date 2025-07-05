import * as fs from 'fs/promises';
import * as path from 'path';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { vectorService } from './vectorService';
import { logger } from '../utils/logger';
import { saveTrainingData, updateFileStatus, getProcessingStatsFromDB } from './supabaseService';
import pdfParse from 'pdf-parse';

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
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processDocument(filePath: string, userId: string): Promise<ProcessingResult> {
    try {
      const fileType = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);

      let text = '';
      switch (fileType) {
        case '.pdf':
          text = await this.extractTextFromPDF(filePath);
          break;
        case '.txt':
          text = await this.extractTextFromTXT(filePath);
          break;
        case '.md':
          text = await this.extractTextFromMD(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      if (!text.trim()) {
        throw new Error('No text content found in document');
      }

      const chunks = await this.splitText(text);
      const embeddings = await this.generateEmbeddings(chunks);

      const metadata: ProcessingMetadata = {
        source: filePath,
        filename,
        fileType,
        chunkIndex: 0,
        totalChunks: chunks.length,
        userId,
      };

      await vectorService.addDocuments(chunks, embeddings, [metadata]);

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

  private async extractTextFromMD(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error('MD extraction error:', error);
      throw new Error('Failed to read markdown file');
    }
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
}

export const documentProcessor = new DocumentProcessor();

// Batch processing for multiple files
export async function processDocumentsBatch(
  files: BatchFile[]
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  for (const file of files) {
    try {
      const result = await documentProcessor.processDocument(file.path, file.userId);
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
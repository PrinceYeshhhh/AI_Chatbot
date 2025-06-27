import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import csv from 'csv-parser';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { logger } from '../utils/logger.js';

class DocumentProcessor {
  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  async processFile(filePath, metadata = {}) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      let content = '';

      // Extract text based on file type
      switch (fileExtension) {
        case '.txt':
          content = await this.processTxtFile(filePath);
          break;
        case '.md':
          content = await this.processMarkdownFile(filePath);
          break;
        case '.csv':
          content = await this.processCsvFile(filePath);
          break;
        case '.pdf':
          content = await this.processPdfFile(filePath);
          break;
        case '.json':
          content = await this.processJsonFile(filePath);
          break;
        case '.docx':
          content = await this.processDocxFile(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Split content into chunks
      const chunks = await this.splitIntoChunks(content, metadata);

      logger.info(`Processed ${metadata.filename}: ${content.length} characters, ${chunks.length} chunks`);

      return {
        content,
        chunks,
        metadata: {
          ...metadata,
          processedAt: new Date().toISOString(),
          contentLength: content.length,
          chunkCount: chunks.length
        }
      };

    } catch (error) {
      logger.error(`Error processing file ${filePath}:`, error);
      throw error;
    }
  }

  async processText(content, metadata = {}) {
    try {
      const chunks = await this.splitIntoChunks(content, metadata);

      return {
        content,
        chunks,
        metadata: {
          ...metadata,
          processedAt: new Date().toISOString(),
          contentLength: content.length,
          chunkCount: chunks.length
        }
      };

    } catch (error) {
      logger.error('Error processing text content:', error);
      throw error;
    }
  }

  async processTxtFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }

  async processMarkdownFile(filePath) {
    const markdownContent = await fs.readFile(filePath, 'utf-8');
    
    // Convert markdown to plain text (remove formatting)
    const htmlContent = marked(markdownContent);
    const textContent = htmlContent.replace(/<[^>]*>/g, ''); // Strip HTML tags
    
    return textContent;
  }

  async processCsvFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const headers = [];
      let isFirstRow = true;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          if (isFirstRow) {
            isFirstRow = false;
            // Add headers as context
            results.push(`CSV Headers: ${headers.join(', ')}`);
          }
          
          // Convert each row to readable text
          const rowText = headers.map(header => `${header}: ${data[header] || 'N/A'}`).join(', ');
          results.push(rowText);
        })
        .on('end', () => {
          resolve(results.join('\n'));
        })
        .on('error', reject);
    });
  }

  async processPdfFile(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  async processJsonFile(filePath) {
    const jsonContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);
    
    // Convert JSON to readable text format
    return this.jsonToText(jsonData);
  }

  async processDocxFile(filePath) {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  }

  jsonToText(obj, prefix = '') {
    let text = '';
    
    for (const [key, value] of Object.entries(obj)) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        text += this.jsonToText(value, currentKey);
      } else if (Array.isArray(value)) {
        text += `${currentKey}: [${value.join(', ')}]\n`;
      } else {
        text += `${currentKey}: ${value}\n`;
      }
    }
    
    return text;
  }

  async splitIntoChunks(content, metadata = {}) {
    try {
      // Split the content into chunks
      const documents = await this.textSplitter.createDocuments([content]);
      
      // Format chunks with metadata
      const chunks = documents.map((doc, index) => ({
        content: doc.pageContent,
        metadata: {
          chunkIndex: index,
          chunkSize: doc.pageContent.length,
          ...metadata
        }
      }));

      return chunks;

    } catch (error) {
      logger.error('Error splitting content into chunks:', error);
      throw error;
    }
  }

  // Extract keywords from content (simple implementation)
  extractKeywords(content, maxKeywords = 10) {
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Extract entities (simple implementation)
  extractEntities(content) {
    const entities = {
      emails: content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
      phones: content.match(/\b\d{3}-\d{3}-\d{4}\b/g) || [],
      dates: content.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || [],
      urls: content.match(/https?:\/\/[^\s]+/g) || []
    };

    return entities;
  }

  // Summarize content (simple implementation)
  summarizeContent(content, maxLength = 200) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 3) {
      return content;
    }

    // Take first and last sentences, plus one from the middle
    const summary = [
      sentences[0],
      sentences[Math.floor(sentences.length / 2)],
      sentences[sentences.length - 1]
    ].join('. ') + '.';

    return summary.length > maxLength ? summary.substring(0, maxLength) + '...' : summary;
  }
}

export const documentProcessor = new DocumentProcessor();
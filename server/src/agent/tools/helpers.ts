import path from 'path';
import fs from 'fs/promises';
import { DocumentProcessor } from '../../services/documentProcessor';
import { LLMService } from '../../services/llmService';
import { AnalyticsService } from '../../services/analyticsService';
import { logger } from '../../utils/logger';

const documentProcessor = new DocumentProcessor();
const llmService = new LLMService();
const analyticsService = new AnalyticsService();

// Utility: Log tool invocation for analytics
export async function logToolInvocation({ toolName, userId, duration, input, output, success }) {
  try {
    await analyticsService.logEvent(userId, 'tool_invocation', {
      toolName,
      duration,
      input,
      output,
      success,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Failed to log tool invocation:', err);
  }
}

// 1. Get document text by file ID
export async function getDocumentTextById(fileId: string): Promise<string> {
  // In production, look up file path from DB or storage service
  // Here, assume files are stored in /server/uploads/<fileId>
  try {
    const filePath = path.join(process.cwd(), 'server', 'uploads', fileId);
    // Validate file existence
    await fs.access(filePath);
    // Use DocumentProcessor to extract text
    const text = await documentProcessor.extractTextFromFile(filePath);
    if (!text || text.trim().length === 0) throw new Error('No text extracted from file');
    return text;
  } catch (err) {
    logger.error(`getDocumentTextById error for fileId=${fileId}:`, err);
    throw new Error('Failed to retrieve or process document');
  }
}

// 2. Call LLM to summarize text
export async function callLLMSummarize(text: string, maxLength: number = 200) {
  try {
    const start = Date.now();
    const result = await llmService.summarize(text, maxLength);
    const duration = Date.now() - start;
    return {
      text: result.content || result.summary || '',
      keyPoints: result.keyPoints || [],
      wordCount: (result.content || result.summary || '').split(/\s+/).length,
      executionTime: duration,
      tokensUsed: result.usage?.total_tokens || 0,
      cost: result.usage?.cost || 0,
    };
  } catch (err) {
    logger.error('callLLMSummarize error:', err);
    throw new Error('Failed to summarize document');
  }
}

// 3. Get data by source (CSV, XLSX, etc.)
export async function getDataBySource(dataSource: string): Promise<any[]> {
  try {
    const filePath = path.join(process.cwd(), 'server', 'uploads', dataSource);
    await fs.access(filePath);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.csv') {
      const csv = await import('csv-parse/sync');
      const content = await fs.readFile(filePath, 'utf-8');
      return csv.parse(content, { columns: true });
    } else if (ext === '.xlsx') {
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(await fs.readFile(filePath), { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return xlsx.utils.sheet_to_json(sheet);
    } else {
      throw new Error('Unsupported data source format');
    }
  } catch (err) {
    logger.error('getDataBySource error:', err);
    throw new Error('Failed to load data source');
  }
}

// 4. Analyze data with LLM or stats
export async function analyzeDataWithLLMOrStats(data: any[], analysisType: string) {
  try {
    // For summary, use LLM; for trend/correlation/outlier, use stats or LLM
    if (analysisType === 'summary') {
      const text = JSON.stringify(data).slice(0, 8000); // Truncate for LLM
      const result = await llmService.summarize(text, 300);
      return { data: { summary: result.content }, metadata: { tokensUsed: result.usage?.total_tokens || 0 } };
    } else {
      // Use simple stats for trend/correlation/outlier
      // (In production, use a real stats library or Python microservice)
      // Here, just return a dummy structure for demonstration
      return { data: { analysisType, stats: {} }, metadata: {} };
    }
  } catch (err) {
    logger.error('analyzeDataWithLLMOrStats error:', err);
    throw new Error('Failed to analyze data');
  }
}

// 5. Get report data from multiple sources
export async function getReportData(dataSources: string[]): Promise<any[]> {
  try {
    const results = [];
    for (const src of dataSources) {
      try {
        results.push(await getDataBySource(src));
      } catch (err) {
        logger.warn(`Failed to load data source ${src}:`, err);
      }
    }
    return results.flat();
  } catch (err) {
    logger.error('getReportData error:', err);
    throw new Error('Failed to aggregate report data');
  }
}

// 6. Call LLM to generate report
export async function callLLMGenerateReport({ reportType, reportData, format }) {
  try {
    const prompt = `Generate a ${reportType} report in ${format} format based on the following data:\n${JSON.stringify(reportData).slice(0, 8000)}`;
    const result = await llmService.chatCompletion([
      { role: 'system', content: 'You are a report generator.' },
      { role: 'user', content: prompt }
    ], { stream: false });
    // In production, generate a downloadable file and return URL
    return { report: result.content, downloadUrl: '' };
  } catch (err) {
    logger.error('callLLMGenerateReport error:', err);
    throw new Error('Failed to generate report');
  }
}

// 7. Extract tables from file
export async function extractTablesFromFile(fileId: string, format: string) {
  try {
    const filePath = path.join(process.cwd(), 'server', 'uploads', fileId);
    await fs.access(filePath);
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      // Use pdf-parse or pdf-table-extractor (Node.js) or call Python microservice
      // Here, just return an empty array for demonstration
      return [];
    } else if (ext === '.xlsx') {
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(await fs.readFile(filePath), { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return xlsx.utils.sheet_to_json(sheet);
    } else if (ext === '.csv') {
      const csv = await import('csv-parse/sync');
      const content = await fs.readFile(filePath, 'utf-8');
      return csv.parse(content, { columns: true });
    } else {
      throw new Error('Unsupported file type for table extraction');
    }
  } catch (err) {
    logger.error('extractTablesFromFile error:', err);
    throw new Error('Failed to extract tables');
  }
}

// 8. Search documents by query
export async function searchDocumentsByQuery({ query, userId, fileIds, maxResults }) {
  try {
    // Use vector search or keyword search over indexed documents
    // Here, call RAG service or LLMService
    const ragService = await import('../../services/ragService');
    const results = await ragService.generateRAGResponse(query, userId, maxResults || 10);
    return Array.isArray(results) ? results : [{ result: results }];
  } catch (err) {
    logger.error('searchDocumentsByQuery error:', err);
    throw new Error('Failed to search documents');
  }
}

// 9. Call LLM to generate email
export async function callLLMGenerateEmail({ recipient, subject, context, tone }) {
  try {
    const prompt = `Write a ${tone} email to ${recipient} with subject "${subject}". Context: ${context}`;
    const result = await llmService.chatCompletion([
      { role: 'system', content: 'You are an expert email writer.' },
      { role: 'user', content: prompt }
    ], { stream: false });
    return result.content;
  } catch (err) {
    logger.error('callLLMGenerateEmail error:', err);
    throw new Error('Failed to generate email');
  }
} 
import path from 'path';
import { parseFile } from '../utils/parseFile';
import { chunkText, chunkByParagraphsOrHeaders } from '../utils/chunkText';

// --- Utility: Clean and normalize text ---
function cleanText(text: string): string {
  // Remove common page numbers, headers, footers, watermarks (simple heuristics)
  let cleaned = text
    .replace(/\f/g, ' ') // Remove form feeds
    .replace(/Page \d+ of \d+/gi, ' ')
    .replace(/Page \d+/gi, ' ')
    .replace(/\bCopyright.*?\b/gi, ' ')
    .replace(/\bAll rights reserved\b/gi, ' ')
    .replace(/\bConfidential\b/gi, ' ')
    .replace(/\bWatermark\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/\r/g, '')
    .trim();
  // Normalize to UTF-8 (Node strings are UTF-16, but this ensures valid code points)
  cleaned = Buffer.from(cleaned, 'utf-8').toString('utf-8');
  return cleaned;
}

// --- Format-specific chunkers ---
function chunkDocxOrPdf(text: string, maxTokens = 1000): string[] {
  // Split by paragraphs (double line breaks), then merge to fit token limit
  const paras = text.split(/\n{2,}|\r\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;
  for (const para of paras) {
    const paraTokens = para.split(/\s+/).length;
    if (currentTokens + paraTokens > maxTokens && current) {
      chunks.push(current.trim());
      current = '';
      currentTokens = 0;
    }
    current += (current ? '\n\n' : '') + para;
    currentTokens += paraTokens;
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

function chunkTxt(text: string, maxTokens = 1000): string[] {
  // Split by paragraphs, fallback to char limit if needed
  const paras = text.split(/\n{2,}|\r\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;
  for (const para of paras) {
    const paraTokens = para.split(/\s+/).length;
    if (currentTokens + paraTokens > maxTokens && current) {
      chunks.push(current.trim());
      current = '';
      currentTokens = 0;
    }
    current += (current ? '\n\n' : '') + para;
    currentTokens += paraTokens;
  }
  if (current) chunks.push(current.trim());
  // If still too large, split by char limit
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > 4000) {
      for (let i = 0; i < chunk.length; i += 4000) {
        finalChunks.push(chunk.slice(i, i + 4000));
      }
    } else {
      finalChunks.push(chunk);
    }
  }
  return finalChunks;
}

function chunkCsv(text: string, includeHeaders = true): string[] {
  // Each row is a chunk; optionally prepend headers
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const [header, ...rows] = lines;
  return rows.map((row, i) => (includeHeaders ? `${header}\n${row}` : row));
}

// --- Main chunking service ---
export interface FileChunkMetadata {
  userId: string;
  fileId: string;
  chunkIndex: number;
  content: string;
  modality: 'text';
}

export async function smartFileChunking({
  buffer,
  fileName,
  userId,
  fileId,
  mimeType
}: {
  buffer: Buffer;
  fileName: string;
  userId: string;
  fileId: string;
  mimeType?: string;
}): Promise<FileChunkMetadata[]> {
  // Parse and clean
  let parseResult;
  try {
    const parseArgs: any = { buffer, fileName, userId };
    if (mimeType !== undefined) parseArgs.mimeType = mimeType;
    parseResult = await parseFile(parseArgs);
  } catch (err: any) {
    // Graceful fail for corrupt/unsupported files
    return [];
  }
  let { text, file_type } = parseResult;
  if (!text || typeof text !== 'string' || !text.trim()) return [];
  text = cleanText(text);

  // Chunking logic
  let rawChunks: string[] = [];
  let modality: 'text' = 'text';
  if (file_type === 'pdf' || file_type === 'docx') {
    rawChunks = chunkByParagraphsOrHeaders(text, 1000);
  } else if (file_type === 'txt') {
    rawChunks = chunkTxt(text, 1000);
  } else if (file_type === 'csv') {
    rawChunks = chunkCsv(text, true);
  } else {
    // Fallback: treat as plain text
    rawChunks = chunkTxt(text, 1000);
  }

  // Final metadata mapping
  const chunks: FileChunkMetadata[] = rawChunks.map((content, i) => ({
    userId,
    fileId,
    chunkIndex: i,
    content: content.trim(),
    modality
  }));
  return chunks;
}

// --- Extensibility: Add new format handlers below as needed ---
// TODO: Add HTML, JSON, and other format chunkers here for future support. 
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
// Use require for csv-parse/sync to avoid ESM import issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parse: csvParse } = require('csv-parse/sync');
import fetch from 'node-fetch';

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
  input: { buffer?: Buffer; url?: string; fileName: string }
): Promise<ParseResult> {
  let buffer: Buffer;
  const { fileName, url } = input;
  if (url) {
    buffer = await getBufferFromUrl(url);
  } else if (input.buffer) {
    buffer = input.buffer;
  } else {
    throw new Error('No file buffer or URL provided');
  }

  const ext = path.extname(fileName).toLowerCase();
  let text = '';
  let metadata: Record<string, any> = {};

  switch (ext) {
    case '.pdf': {
      const data = await pdfParse(buffer);
      text = data.text || '';
      metadata = { numpages: data.numpages, info: data.info };
      break;
    }
    case '.docx': {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
      metadata = { messages: result.messages };
      break;
    }
    case '.txt': {
      text = buffer.toString('utf-8');
      break;
    }
    case '.csv': {
      const records = csvParse(buffer.toString('utf-8'), { columns: false, skip_empty_lines: true });
      text = records.map((row: string[]) => row.join(', ')).join('\n');
      metadata = { rows: records.length };
      break;
    }
    default:
      throw new Error(`Unsupported file type: ${ext}`);
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
    metadata,
  };
} 
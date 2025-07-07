import fetch from 'node-fetch';
import { PassThrough } from 'stream';
import { logger } from '../utils/logger';
import type MarkdownItType from 'markdown-it';
import type sanitizeHtmlType from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

interface CallGPTOptions {
  prompt: string;
  user_id: string;
  model?: string;
  stream?: boolean;
  chat_id?: string;
  metadata?: Record<string, any>;
}

// Helper to extract citations like [1], [2] and match to chunk metadata
function extractCitations(
  text: string,
  chunks: Array<{ chunk_index: number; file_name?: string; [key: string]: any }>
): Array<{ file: string; chunk_index: number; id?: string }> {
  const sources: Array<{ file: string; chunk_index: number; id?: string }> = [];
  const citationRegex = /\[(\d+)\]/g;
  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const idx = parseInt(match[1], 10) - 1;
    if (chunks[idx]) {
      sources.push({
        file: chunks[idx].file_name || '',
        chunk_index: chunks[idx].chunk_index,
        id: chunks[idx]['id'] || undefined
      });
    }
  }
  return sources;
}

export function postProcessResponse(
  rawGPTResponse: string,
  chunkMetadata: Array<{ chunk_index: number; file_name?: string; [key: string]: any }>,
  config: { enableCitations?: boolean; htmlFormat?: boolean } = {}
): { content: string; rawText: string; sources: Array<{ file: string; chunk_index: number; id?: string }>; safeToDisplay: boolean } {
  // 1. Clean and standardize
  const clean = rawGPTResponse.trim().replace(/\n{2,}/g, "\n\n");
  // 2. Markdown to HTML
  const md: MarkdownItType = new MarkdownIt({ html: false, linkify: true, breaks: true });
  let html = md.render(clean);
  // 3. Sanitize HTML
  html = (sanitizeHtml as typeof sanitizeHtmlType)(html, { allowedTags: (sanitizeHtml as typeof sanitizeHtmlType).defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'pre', 'code']), allowedAttributes: { ...(sanitizeHtml as typeof sanitizeHtmlType).defaults.allowedAttributes, code: ['class'] } });
  // 4. Extract citations if enabled
  let sources: Array<{ file: string; chunk_index: number; id?: string }> = [];
  if (config.enableCitations) {
    sources = extractCitations(clean, chunkMetadata);
    // Optionally append footnotes to HTML
    if (sources.length > 0) {
      html += '<hr><div class="citations"><strong>Sources:</strong><ul>' +
        sources.map((s, i) => `<li>[${i + 1}] - ${sanitizeHtml(s.file)} (Chunk ${s.chunk_index})</li>`).join('') +
        '</ul></div>';
    }
  }
  // 5. Package final output
  return {
    content: html,
    rawText: clean,
    sources,
    safeToDisplay: true
  };
}

export async function callGPT({
  prompt,
  user_id,
  model = 'gpt-4o',
  stream = true,
  chat_id,
  metadata = {}
}: CallGPTOptions): Promise<NodeJS.ReadableStream> {
  const apiKey = process.env['OPENAI_API_KEY'];
  const messages = [
    { role: 'system', content: 'You are a helpful assistant grounded in the provided file content.' },
    { role: 'user', content: prompt }
  ];
  const payload = {
    model,
    messages,
    stream,
    temperature: 0.3,
    ...metadata
  };
  const url = 'https://api.openai.com/v1/chat/completions';
  let attempt = 0;
  let lastError: any = null;
  while (attempt < 2) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errText = await res.text();
        if (res.status >= 500 || res.status === 429) {
          attempt++;
          lastError = errText;
          continue; // retry once
        }
        logger.error(`[GPT] OpenAI error: ${res.status} - ${errText}`);
        throw new Error('OpenAI API error: ' + res.status);
      }
      // Stream response
      if (stream && res.body) {
        const pass = new PassThrough();
        res.body.on('data', chunk => pass.write(chunk));
        res.body.on('end', () => pass.end());
        res.body.on('error', err => {
          logger.error('[GPT] Stream error:', err);
          pass.end();
        });
        // Optionally log token usage from headers if available
        if (res.headers.has('openai-usage-tokens')) {
          logger.info(`[GPT] Token usage: ${res.headers.get('openai-usage-tokens')}`);
        }
        logger.info(`[GPT] Streaming response for user ${user_id}, chat ${chat_id || ''}`);
        return pass;
      } else {
        // Non-streamed fallback (should not happen in normal flow)
        const text = await res.text();
        const pass = new PassThrough();
        pass.end(text);
        return pass;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.error('[GPT] OpenAI API timeout');
        throw new Error('OpenAI API timed out. Please try again.');
      }
      lastError = err;
      attempt++;
    }
  }
  logger.error(`[GPT] Failed after retry: ${lastError}`);
  throw new Error('OpenAI API failed. Please try again later.');
} 
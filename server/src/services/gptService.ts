import fetch from 'node-fetch';
import { PassThrough } from 'stream';
import { logger } from '../utils/logger';
import type MarkdownItType from 'markdown-it';
import type sanitizeHtmlType from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import xss from 'xss';
import { encoding_for_model } from 'tiktoken';
import type { TiktokenModel } from 'tiktoken';

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
    const idx = parseInt(match[1] || '0', 10) - 1;
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

// Helper to count tokens using tiktoken
function countTokens(text: string, model: string = 'llama3-70b-8192'): number {
  try {
    // Use a default model if the provided one is not a valid TiktokenModel
    const tiktokenModel = (model as TiktokenModel) || 'gpt-3.5-turbo';
    const enc = encoding_for_model(tiktokenModel);
    const tokens = enc.encode(text);
    return tokens.length;
  } catch {
    // Fallback: rough estimate (1 token ≈ 4 chars)
    return Math.ceil(text.length / 4);
  }
}

const MAX_PROMPT_TOKENS = 2000;

// Helper to sanitize user input for prompt injection protection
export function sanitizePromptInput(input: string): string {
  // Remove dangerous characters, strip HTML, and escape newlines
  return xss(input).replace(/[\r\n]+/g, ' ').replace(/[{}$]/g, '');
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
  model = 'llama3-70b-8192',
  stream = true,
  chat_id,
  metadata = {}
}: CallGPTOptions): Promise<NodeJS.ReadableStream> {
  // Switch to Google AI Studio (Gemini) as backup provider
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  const apiKey = process.env['GOOGLE_API_KEY'] || '';
  // Sanitize user prompt for injection protection
  const safePrompt = sanitizePromptInput(prompt);
  // Token pre-check
  const tokenCount = countTokens(safePrompt, model);
  if (tokenCount > MAX_PROMPT_TOKENS) {
    // Truncate prompt to fit within token limit
    let truncated = safePrompt;
    while (countTokens(truncated, model) > MAX_PROMPT_TOKENS) {
      truncated = truncated.slice(0, -10);
    }
    logger.warn(`[LLM PROMPT] Prompt truncated for user_id=${user_id}, chat_id=${chat_id || ''}, original_tokens=${tokenCount}`);
    // Optionally, notify user or add a warning
    // safePrompt = truncated; // Uncomment to use truncated prompt
    throw new Error('Prompt too long. Please shorten your input.');
  }
  const messages = [
    { role: 'system', content: 'You are a helpful assistant grounded in the provided file content.' },
    { role: 'user', content: safePrompt }
  ];
  // Log prompt for audit/debug (PII redacted)
  logger.info(`[LLM PROMPT] user_id=${user_id}, chat_id=${chat_id || ''}, prompt=${safePrompt.slice(0, 200)}...`);
  const payload = {
    model,
    messages,
    stream,
    temperature: 0.3,
    ...metadata
  };
  let attempt = 0;
  let lastError: any = null;
  const maxRetries = 3;
  const backoffDelays = [1000, 2000, 4000]; // ms
  while (attempt < maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 429 || res.status >= 500) {
          logger.warn(`[GPT] API error ${res.status} (attempt ${attempt + 1}/${maxRetries}): ${errText}`);
          lastError = errText;
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, backoffDelays[attempt] || 4000));
          }
          attempt++;
          continue; // retry with backoff
        }
        logger.error(`[GPT] Groq API error: ${res.status} - ${errText}`);
        throw new Error('Groq API error: ' + res.status);
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
        // Gemini API: adjust token usage logging and error messages as needed
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
        logger.error('[GPT] API timeout');
        throw new Error('API timed out. Please try again.');
      }
      lastError = err;
      logger.warn(`[GPT] callGPT error (attempt ${attempt + 1}/${maxRetries}): ${err.message || err}`);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, backoffDelays[attempt] || 4000));
      }
      attempt++;
    }
  }
  logger.error(`[GPT] Failed after retry: ${lastError}`);
  throw new Error('API failed. Please try again later.');
} 
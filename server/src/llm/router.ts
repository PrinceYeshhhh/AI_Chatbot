// LLM router: routes calls to Groq, Together.ai, or Local
import { callClaude } from './anthropic';
import { callLocalLLM } from './local';
import { LLMService } from '../services/llmService';
import { NeonDatabaseService } from '../services/neonDatabaseService';
import { logSystemAlert, sendWebhookAlert } from '../utils/logger';
import { encoding_for_model } from 'tiktoken';

const llmService = new LLMService();
const dbService = new NeonDatabaseService();

// Helper to log usage
async function logUsage({ userId, model, tokensIn, tokensOut }: { userId: string; model: string; tokensIn: number; tokensOut: number }) {
  if (!userId) return;
  try {
    const query = `
      INSERT INTO usage_logs (user_id, model, tokens_in, tokens_out, event_type, timestamp)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
    `;
    
    await dbService.query(query, [
      userId,
      model,
      tokensIn,
      tokensOut,
      'llm_api_call'
    ]);
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}

// --- Prompt Injection Protection ---
const promptInjectionPatterns = [
  /ignore (all|any|previous|above) instructions?/i,
  /disregard (all|any|previous|above) instructions?/i,
  /you are now (an?|the)?/i,
  /pretend to be/i,
  /please jailbreak/i,
  /reset your instructions/i,
  /as an ai language model/i,
  /repeat after me/i,
  /do anything now/i,
  /bypass/i,
  /unfiltered/i,
  /simulate/i,
  /act as/i
];

function sanitizePromptInput(input: string): string {
  if (typeof input !== 'string') return '';
  let sanitized = input;
  for (const pattern of promptInjectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }
  // Remove excessive whitespace, control chars
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]+/g, ' ').trim();
  // Optionally, escape dangerous chars
  return sanitized;
}

function escapeUserVariable(str: string): string {
  // Escape curly braces and $ for template safety
  return str.replace(/[{}$]/g, '_');
}

// --- Retry logic with exponential backoff ---
async function withRetries<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelay = 300): Promise<T> {
  let attempt = 0;
  let lastError: any;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (err && (err.status === 429 || err.status >= 500)) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
        attempt++;
      } else {
        break;
      }
    }
  }
  throw lastError;
}

// Multi-LLM router with fallback and benchmarking
export async function callLLM({ provider, model, messages, chat_id, message_id, ...options }: any): Promise<any> {
  // Sanitize all user/system prompt inputs
  const sanitizedMessages = (messages || []).map((m: any) => ({
    ...m,
    content: sanitizePromptInput(m.content)
  }));
  // --- Token pre-check ---
  const modelName = model || 'llama3-70b-8192';
  const enc = encoding_for_model(modelName);
  const maxTokens = 8192; // Example: adjust per model
  const totalTokens = sanitizedMessages.reduce((acc: number, m: any) => acc + enc.encode(m.content || '').length, 0);
  if (totalTokens > maxTokens) {
    throw new Error(`Prompt too long (${totalTokens} tokens, max ${maxTokens}). Please shorten your input.`);
  }
  // Escape user variables in system prompts
  if (sanitizedMessages.length && sanitizedMessages[0].role === 'system') {
    sanitizedMessages[0].content = escapeUserVariable(sanitizedMessages[0].content);
  }
  // Log all prompts for audit/debug
  if (process.env['LOG_LLM_PROMPTS'] === 'true') {
    console.log('[LLM PROMPT]', JSON.stringify(sanitizedMessages));
  }
  const providers = Array.isArray(provider) ? provider : [provider];
  let lastError = null;
  let start = Date.now();
  
  for (const prov of providers) {
    try {
      let result;
      let latency;
      let cost = 0; // TODO: Calculate cost per provider/model
      
      result = await withRetries(async () => {
        switch (prov) {
          case 'groq':
            return await llmService.chatCompletion(sanitizedMessages, { 
              model: model || 'llama3-70b-8192',
              ...options 
            });
          case 'together':
            return await llmService.chatCompletion(sanitizedMessages, { 
              model: model || 'togethercomputer/llama-3-70b-instruct',
              provider: 'together',
              ...options 
            });
          case 'anthropic':
            return await callClaude(model, sanitizedMessages, { chat_id, message_id, ...options });
          case 'local':
            return await callLocalLLM(model, sanitizedMessages, { chat_id, message_id, ...options });
          default:
            throw new Error('Unsupported provider');
        }
      });
      
      latency = Date.now() - start;
      
      // Log call for benchmarking
      await logLLMCall({ provider: prov, model, latency, cost, userId: options.userId || 'unknown', taskType: options.taskType || 'chat' });
      
      // Log usage
      const tokensIn = sanitizedMessages.map((m: any) => m.content || '').join(' ').split(' ').length;
      const tokensOut = (result && (result as any).content) ? (result as any).content.split(' ').length : 0;
      await logUsage({ userId: options.userId, model, tokensIn, tokensOut });
      
      // On success, log low severity
      await logSystemAlert({
        alert_type: 'llm_call_success',
        severity: 'low',
        message: `LLM call succeeded`,
        context: { provider: prov, model, userId: options.userId },
        metadata: { latency, tokensIn, tokensOut }
      });
      return result;
    } catch (err) {
      lastError = err;
      // Try next provider (fallback)
    }
  }
  // On final failure, log high severity alert
  await logSystemAlert({
    alert_type: 'llm_call_failure',
    severity: 'high',
    message: `All LLM providers failed`,
    context: { provider, model, userId: options.userId },
    metadata: { error: (lastError && (lastError as any).message) || '', stack: (lastError && (lastError as any).stack) || '' }
  });
  // Send webhook alert for LLM failure
  await sendWebhookAlert({
    type: 'llm_failure',
    provider,
    model,
    userId: options.userId,
    error: (lastError && (lastError as any).message) || '',
    stack: (lastError && (lastError as any).stack) || ''
  });
  throw lastError || new Error('All LLM providers failed');
}

// Helper function to log LLM calls
async function logLLMCall({ provider, model, latency, cost, userId, taskType }: {
  provider: string;
  model: string;
  latency: number;
  cost: number;
  userId: string;
  taskType: string;
}): Promise<void> {
  try {
    const query = `
      INSERT INTO llm_logs (provider, model, latency, cost, user_id, task_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
    `;
    
    await dbService.query(query, [
      provider,
      model,
      latency,
      cost,
      userId,
      taskType
    ]);
  } catch (error) {
    console.error('Failed to log LLM call:', error);
  }
} 
// LLM router: routes calls to OpenAI, Anthropic, or Local
import { callOpenAIChat } from './openai';
import { callClaude } from './anthropic';
import { callLocalLLM } from './local';
import { logLLMCall } from './logs';

// Multi-LLM router with fallback and benchmarking
export async function callLLM({ provider, model, messages, ...options }: any) {
  const providers = Array.isArray(provider) ? provider : [provider];
  let lastError = null;
  let start = Date.now();
  for (const prov of providers) {
    try {
      let result;
      let latency;
      let cost = 0; // TODO: Calculate cost per provider/model
      switch (prov) {
        case 'openai':
          result = await callOpenAIChat(model, messages, options);
          break;
        case 'anthropic':
          result = await callClaude(model, messages, options);
          break;
        case 'local':
          result = await callLocalLLM(model, messages, options);
          break;
        default:
          throw new Error('Unsupported provider');
      }
      latency = Date.now() - start;
      // Log call for benchmarking
      await logLLMCall({ provider: prov, model, latency, cost, userId: options.userId || 'unknown', taskType: options.taskType || 'chat' });
      return result;
    } catch (err) {
      lastError = err;
      // Try next provider (fallback)
    }
  }
  throw lastError || new Error('All LLM providers failed');
} 
import { callLLM } from '../llm/router';
import { sanitizePromptInput } from './gptService';

export class LLMService {
  async chatCompletion(messages: any[], options: any = {}) {
    try {
      // Sanitize all user-supplied message content
      const safeMessages = messages.map(m => ({ ...m, content: typeof m.content === 'string' ? sanitizePromptInput(m.content) : m.content }));
      // Log prompt for audit/debug (PII redacted)
      const userMsg = safeMessages.find(m => m.role === 'user');
      if (userMsg) {
        console.info(`[LLM PROMPT] chatCompletion: prompt=${userMsg.content.slice(0, 200)}...`);
      }
      const result = await callLLM({
        provider: 'local', // Use Ollama/local LLM by default
        model: options.model || 'mistral', // Default to Mistral, can be changed to llama2, etc.
        messages: safeMessages,
        ...options
      });
      return result;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw error;
    }
  }

  async generateEmbeddings(text: string) {
    try {
      // For now, return a mock embedding
      // In production, this would call the Together.ai API
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      return mockEmbedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  async searchSimilar(embedding: number[], limit: number = 5) {
    try {
      // For now, return mock search results
      // In production, this would call Qdrant
      const mockResults = Array.from({ length: limit }, (_, i) => ({
        id: `result_${i}`,
        score: Math.random(),
        payload: {
          text: `Mock result ${i}`,
          metadata: {}
        }
      }));
      return mockResults;
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  async evaluateResponse(response: string, criteria: string) {
    try {
      const result = await callLLM({
        provider: 'openrouter',
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: `Evaluate the following response based on: ${criteria}. Return a JSON object with score (1-10), flagged (boolean), and reason (string).`
          },
          {
            role: 'user',
            content: response
          }
        ],
        stream: false
      });
      return result;
    } catch (error) {
      console.error('Response evaluation error:', error);
      throw error;
    }
  }

  async translate(text: string, targetLanguage: string) {
    try {
      // For now, return the original text
      // In production, this would call LibreTranslate API
      return { translatedText: text };
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async summarize(text: string, maxLength: number = 150) {
    try {
      const result = await callLLM({
        provider: 'local',
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: `Summarize the following text in ${maxLength} characters or less:`
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: false
      });
      return result;
    } catch (error) {
      console.error('Summarization error:', error);
      throw error;
    }
  }

  async smartBrain(userId: string, message: string, context: any = {}) {
    try {
      const result = await callLLM({
        provider: 'local',
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: `You are a smart AI assistant. Use the provided context to answer the user's question intelligently. Context: ${JSON.stringify(context)}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: false
      });
      return result;
    } catch (error) {
      console.error('Smart brain error:', error);
      throw error;
    }
  }

  async getVectorStats() {
    try {
      return {
        status: 'healthy',
        collectionCount: 1,
        vectorCount: 1000,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Extract named entities from text using LLM.
   */
  async extractEntities(text: string) {
    try {
      const result = await callLLM({
        provider: 'local',
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: 'Extract all named entities (people, organizations, locations, dates, etc.) from the following text. Return as a JSON array.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: false
      });
      // Try to parse JSON from result
      try {
        return JSON.parse(result.content);
      } catch {
        return result.content;
      }
    } catch (error) {
      console.error('Entity extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract topics from text using LLM.
   */
  async extractTopics(text: string) {
    try {
      const result = await callLLM({
        provider: 'local',
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: 'List the main topics or themes present in the following text. Return as a JSON array.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: false
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return result.content;
      }
    } catch (error) {
      console.error('Topic extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract semantic meaning or summary from text using LLM.
   */
  async extractSemanticMeaning(text: string) {
    try {
      const result = await callLLM({
        provider: 'local',
        model: 'mistral',
        messages: [
          {
            role: 'system',
            content: 'Summarize the core semantic meaning of the following text in 1-2 sentences.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: false
      });
      return result.content;
    } catch (error) {
      console.error('Semantic meaning extraction error:', error);
      throw error;
    }
  }
} 
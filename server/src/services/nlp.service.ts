import fetch from 'node-fetch';

// --- Types ---
export type NEREntity = {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
};

export interface NERResult {
  entities: NEREntity[];
}

export interface SentimentResult {
  label: string; // e.g., 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
  score: number;
}

export interface SummaryResult {
  summary: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
}

export interface KeywordsResult {
  keywords: string[];
}

export interface CorefResult {
  resolved_text: string;
  clusters: Array<{ mentions: string[] }>;
}

export interface LanguageResult {
  language: string;
  score: number;
}

export interface ParaphraseResult {
  paraphrased: string;
}

export interface EntityLinkingResult {
  entities: Array<{
    mention: string;
    entity_id: string;
    entity_label: string;
    confidence: number;
  }>;
}

export interface NLPResult {
  ner?: NERResult;
  sentiment?: SentimentResult;
  summary?: SummaryResult;
  intent?: IntentResult;
  keywords?: KeywordsResult;
  coref?: CorefResult;
  language?: LanguageResult;
  paraphrase?: ParaphraseResult;
  entity_linking?: EntityLinkingResult;
}

export interface NLPProvider {
  ner(text: string): Promise<NERResult>;
  sentiment(text: string): Promise<SentimentResult>;
  summarize(text: string, type?: 'extractive' | 'abstractive'): Promise<SummaryResult>;
  intent(text: string): Promise<IntentResult>;
  keywords(text: string): Promise<KeywordsResult>;
  coref(text: string): Promise<CorefResult>;
  language(text: string): Promise<LanguageResult>;
  paraphrase(text: string, context?: string): Promise<ParaphraseResult>;
  entityLinking(text: string): Promise<EntityLinkingResult>;
  /**
   * Check health of the NLP microservice.
   * @returns {Promise<boolean>} True if healthy, false otherwise.
   */
  health(): Promise<boolean>;
}

// --- Python Microservice Provider (Hugging Face Transformers, spaCy, etc.) ---
export class PythonMicroserviceProvider implements NLPProvider {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = 'http://localhost:8001', timeout = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async post<T>(endpoint: string, body: any): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`${endpoint} microservice error: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      throw new Error(`${endpoint} request failed: ${err}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async ner(text: string): Promise<NERResult> {
    const data = await this.post<{ entities: NEREntity[] }>('/ner', { text });
    return { entities: data.entities };
  }

  async sentiment(text: string): Promise<SentimentResult> {
    const data = await this.post<SentimentResult>('/sentiment', { text });
    return data;
  }

  async summarize(text: string, type: 'extractive' | 'abstractive' = 'abstractive'): Promise<SummaryResult> {
    const data = await this.post<SummaryResult>('/summarize', { text, type });
    return data;
  }

  async intent(text: string): Promise<IntentResult> {
    const data = await this.post<IntentResult>('/intent', { text });
    return data;
  }

  async keywords(text: string): Promise<KeywordsResult> {
    const data = await this.post<KeywordsResult>('/keywords', { text });
    return data;
  }

  async coref(text: string): Promise<CorefResult> {
    const data = await this.post<CorefResult>('/coref', { text });
    return data;
  }

  async language(text: string): Promise<LanguageResult> {
    const data = await this.post<LanguageResult>('/language', { text });
    return data;
  }

  async paraphrase(text: string, context?: string): Promise<ParaphraseResult> {
    const data = await this.post<ParaphraseResult>('/paraphrase', { text, context });
    return data;
  }

  async entityLinking(text: string): Promise<EntityLinkingResult> {
    const data = await this.post<EntityLinkingResult>('/entity-linking', { text });
    return data;
  }

  /**
   * Check health of the Python NLP microservice.
   * @returns {Promise<boolean>} True if healthy, false otherwise.
   */
  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch (err) {
      console.error('NLP microservice health check failed:', err);
      return false;
    }
  }
}

// --- Main NLP Service ---
export class NLPService {
  private providers: { [task: string]: NLPProvider };

  constructor(providers: { [task: string]: NLPProvider }) {
    this.providers = providers;
  }

  async ner(text: string) {
    if (!this.providers.ner) throw new Error('NER provider not configured');
    return this.providers.ner.ner(text);
  }
  async sentiment(text: string) {
    if (!this.providers.sentiment) throw new Error('Sentiment provider not configured');
    return this.providers.sentiment.sentiment(text);
  }
  async summarize(text: string, type: 'extractive' | 'abstractive' = 'abstractive') {
    if (!this.providers.summarize) throw new Error('Summarize provider not configured');
    return this.providers.summarize.summarize(text, type);
  }
  async intent(text: string) {
    if (!this.providers.intent) throw new Error('Intent provider not configured');
    return this.providers.intent.intent(text);
  }
  async keywords(text: string) {
    if (!this.providers.keywords) throw new Error('Keywords provider not configured');
    return this.providers.keywords.keywords(text);
  }
  async coref(text: string) {
    if (!this.providers.coref) throw new Error('Coref provider not configured');
    return this.providers.coref.coref(text);
  }
  async language(text: string) {
    if (!this.providers.language) throw new Error('Language provider not configured');
    return this.providers.language.language(text);
  }
  async paraphrase(text: string, context?: string) {
    if (!this.providers.paraphrase) throw new Error('Paraphrase provider not configured');
    return this.providers.paraphrase.paraphrase(text, context);
  }
  async entityLinking(text: string) {
    if (!this.providers.entityLinking) throw new Error('Entity Linking provider not configured');
    return this.providers.entityLinking.entityLinking(text);
  }

  /**
   * Check health of the NLP backend (Python microservice).
   * @returns {Promise<boolean>} True if healthy, false otherwise.
   */
  async health() {
    if (!this.providers.ner) throw new Error('NER provider not configured');
    return this.providers.ner.health();
  }
}

// --- Singleton Instance (for app-wide use) ---
export const nlpService = new NLPService({
  ner: new PythonMicroserviceProvider('http://localhost:8001'),
  sentiment: new PythonMicroserviceProvider('http://localhost:8001'),
  summarize: new PythonMicroserviceProvider('http://localhost:8001'),
  intent: new PythonMicroserviceProvider('http://localhost:8001'),
  keywords: new PythonMicroserviceProvider('http://localhost:8001'),
  coref: new PythonMicroserviceProvider('http://localhost:8001'),
  language: new PythonMicroserviceProvider('http://localhost:8001'),
  paraphrase: new PythonMicroserviceProvider('http://localhost:8001'),
  entityLinking: new PythonMicroserviceProvider('http://localhost:8001'),
});

// --- Example Usage (in your chat pipeline, controller, or agent) ---
/*
import { nlpService } from './nlp.service';

async function enrichMessageWithNLP(message: string) {
  const [ner, sentiment, summary, intent, keywords, coref, language, paraphrase, entityLinking] = await Promise.all([
    nlpService.ner(message),
    nlpService.sentiment(message),
    nlpService.summarize(message, 'abstractive'),
    nlpService.intent(message),
    nlpService.keywords(message),
    nlpService.coref(message),
    nlpService.language(message),
    nlpService.paraphrase(message),
    nlpService.entityLinking(message),
  ]);
  // Use these results as needed (RAG, analytics, UI, etc.)
  return { ner, sentiment, summary, intent, keywords, coref, language, paraphrase, entityLinking };
}
*/

// --- How to Extend ---
// 1. Implement new endpoints in your Python microservice (e.g., /sentiment, /summarize, /intent, etc.)
// 2. Add corresponding methods to PythonMicroserviceProvider
// 3. Add unified API methods to NLPService
// 4. Register new providers/tasks in the singleton instance 
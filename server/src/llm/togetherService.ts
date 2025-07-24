// DEPRECATED: Embedding logic has moved to local SentenceTransformers microservice.
import fetch from 'node-fetch';

export class TogetherService {
  private apiKey: string;
  private baseUrl: string;
  private embeddingModel: string;

  constructor() {
    this.apiKey = process.env['TOGETHER_API_KEY']!;
    this.baseUrl = process.env['TOGETHER_BASE_URL'] || 'https://api.together.xyz';
    this.embeddingModel = process.env['TOGETHER_EMBEDDING_MODEL'] || 'togethercomputer/m2-bert-80M-8k-base';
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: texts,
          model: this.embeddingModel
        })
      });

      if (!response.ok) {
        throw new Error(`Together.ai API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.data?.map((item: any) => item.embedding) || [];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateBatchEmbeddings([text]);
    return embeddings[0] || [];
  }

  async chatCompletion(messages: any[], options: any = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'togethercomputer/llama-2-70b-chat',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        throw new Error(`Together.ai API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw error;
    }
  }
} 
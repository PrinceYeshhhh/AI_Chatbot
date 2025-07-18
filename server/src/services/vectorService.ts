import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';

interface VectorMetadata {
  [key: string]: unknown;
}

interface VectorStats {
  status: 'healthy' | 'error' | 'fallback';
  collectionName?: string;
  documentCount?: number;
  embeddingModel?: string;
  error?: string;
}

export class VectorService {
  private embeddings: OpenAIEmbeddings | null = null;
  private vectorStore: Chroma | null = null;
  private collectionName: string;
  private isInitialized: boolean = false;

  constructor() {
    this.collectionName = process.env.CHROMA_COLLECTION_NAME || 'chatbot_embeddings';
    this.initialize();
  }

  private initialize(): void {
    try {
      const openAIApiKey = process.env.OPENAI_API_KEY;
      if (!openAIApiKey) {
        logger.warn('OPENAI_API_KEY not found, vector service will use fallback mode');
        return;
      }

      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey,
        modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        maxConcurrency: 5
      });

      // Initialize ChromaDB
      this.vectorStore = new Chroma(this.embeddings, {
        collectionName: this.collectionName,
        collectionMetadata: {
          "hnsw:space": "cosine"
        }
      });

      this.isInitialized = true;
      logger.info('Vector service initialized successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize vector service:', errorMessage);
      this.isInitialized = false;
    }
  }

  async addDocuments(
    texts: string[], 
    embeddings: number[][], 
    metadata: VectorMetadata[] = []
  ): Promise<void> {
    if (!this.isInitialized || !this.vectorStore) {
      logger.warn('Vector service not initialized, skipping document addition');
      return;
    }

    try {
      const documents = texts.map((text, index) => {
        return new Document({
          pageContent: text,
          metadata: metadata[index] || {}
        });
      });

      await this.vectorStore.addDocuments(documents);
      logger.info(`Added ${documents.length} documents to vector store`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error adding documents to vector store:', errorMessage);
      throw new Error(`Failed to add documents: ${errorMessage}`);
    }
  }

  async similaritySearch(
    query: string, 
    k: number = 5, 
    filter?: Record<string, unknown>
  ): Promise<Document[]> {
    if (!this.isInitialized || !this.vectorStore) {
      logger.warn('Vector service not initialized, returning empty results');
      return [];
    }

    try {
      const results = await this.vectorStore.similaritySearch(query, k, filter);
      logger.info(`Found ${results.length} similar documents for query: ${query}`);
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in similarity search:', errorMessage);
      return [];
    }
  }

  async similaritySearchWithScore(
    query: string, 
    k: number = 5, 
    filter?: Record<string, unknown>
  ): Promise<[Document, number][]> {
    if (!this.isInitialized || !this.vectorStore) {
      logger.warn('Vector service not initialized, returning empty results');
      return [];
    }

    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, k, filter);
      logger.info(`Found ${results.length} similar documents with scores for query: ${query}`);
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in similarity search with score:', errorMessage);
      return [];
    }
  }

  async getStats(): Promise<VectorStats> {
    if (!this.isInitialized || !this.vectorStore) {
      return {
        status: 'fallback',
        error: 'Vector service not initialized'
      };
    }

    try {
      // Get collection info from ChromaDB
      const collection = await this.vectorStore.collection;
      if (!collection) {
        return {
          status: 'error',
          error: 'Collection not initialized'
        };
      }
      
      const count = await collection.count();
      
      return {
        status: 'healthy',
        collectionName: this.collectionName,
        documentCount: count,
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting vector store stats:', errorMessage);
      return {
        status: 'error',
        error: errorMessage
      };
    }
  }

  async deleteDocuments(filter?: Record<string, unknown>): Promise<void> {
    if (!this.isInitialized || !this.vectorStore) {
      logger.warn('Vector service not initialized, skipping document deletion');
      return;
    }

    try {
      await this.vectorStore.delete({ filter });
      logger.info('Documents deleted from vector store');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting documents from vector store:', errorMessage);
      throw new Error(`Failed to delete documents: ${errorMessage}`);
    }
  }

  async clearCollection(): Promise<void> {
    if (!this.isInitialized || !this.vectorStore) {
      logger.warn('Vector service not initialized, skipping collection clear');
      return;
    }

    try {
      await this.vectorStore.delete({});
      logger.info('Vector store collection cleared');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error clearing vector store collection:', errorMessage);
      throw new Error(`Failed to clear collection: ${errorMessage}`);
    }
  }

  // Method to check if service is available
  isServiceAvailable(): boolean {
    return this.isInitialized && this.vectorStore !== null;
  }

  // Query top-N vectors for a user, filtering by active files
  async queryUserVectors({ userId, queryEmbedding, topK = 5 }: { userId: string, queryEmbedding: number[], topK?: number }) {
    // 1. Get active file_ids for this user
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('id, file_name')
      .eq('user_id', userId);
    if (fileError) throw new Error(fileError.message);
    const fileIds = (files || []).map(f => f.id);
    if (fileIds.length === 0) return [];
    // 2. Query vectors table for topK most similar vectors for these files
    // (Assume a Supabase RPC or do client-side cosine similarity)
    // For now, fetch all vectors for user and files, then compute similarity
    const { data: vectors, error: vectorError } = await supabase
      .from('vectors')
      .select('id, embedding, content, metadata, file_id, file_name, chunk_index')
      .eq('user_id', userId)
      .in('file_id', fileIds);
    if (vectorError) throw new Error(vectorError.message);
    if (!vectors || vectors.length === 0) return [];
    // Compute cosine similarity
    function cosineSim(a: number[], b: number[]): number {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    const scored = vectors.map(v => ({
      ...v,
      score: cosineSim(queryEmbedding, v.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

// Export singleton instance
export const vectorService = new VectorService();

// Legacy function for backward compatibility
export function initializeVectorStore(): boolean {
  return vectorService.isServiceAvailable();
} 
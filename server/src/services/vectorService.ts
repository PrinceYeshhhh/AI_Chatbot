import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';
import { logger } from '../utils/logger';

interface VectorMetadata {
  [key: string]: unknown;
}

interface VectorStats {
  status: 'healthy' | 'error';
  collectionName?: string;
  documentCount?: number;
  embeddingModel?: string;
  error?: string;
}

export class VectorService {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: Chroma;
  private collectionName: string;

  constructor() {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is required for vector service');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      maxConcurrency: 5
    });

    this.collectionName = process.env.CHROMA_COLLECTION_NAME || 'chatbot_embeddings';
    
    // Initialize ChromaDB
    this.vectorStore = new Chroma(this.embeddings, {
      collectionName: this.collectionName,
      collectionMetadata: {
        "hnsw:space": "cosine"
      }
    });
  }

  async addDocuments(
    texts: string[], 
    embeddings: number[][], 
    metadata: VectorMetadata[] = []
  ): Promise<void> {
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
    try {
      const results = await this.vectorStore.similaritySearch(query, k, filter);
      logger.info(`Found ${results.length} similar documents for query: ${query}`);
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in similarity search:', errorMessage);
      throw new Error(`Similarity search failed: ${errorMessage}`);
    }
  }

  async similaritySearchWithScore(
    query: string, 
    k: number = 5, 
    filter?: Record<string, unknown>
  ): Promise<[Document, number][]> {
    try {
      const results = await this.vectorStore.similaritySearchWithScore(query, k, filter);
      logger.info(`Found ${results.length} similar documents with scores for query: ${query}`);
      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in similarity search with score:', errorMessage);
      throw new Error(`Similarity search with score failed: ${errorMessage}`);
    }
  }

  async getStats(): Promise<VectorStats> {
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
    try {
      await this.vectorStore.delete({});
      logger.info('Vector store collection cleared');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error clearing vector store collection:', errorMessage);
      throw new Error(`Failed to clear collection: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const vectorService = new VectorService();

// Legacy function for backward compatibility
export function initializeVectorStore(): boolean {
  try {
    // The vector service is already initialized in the constructor
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to initialize vector store:', errorMessage);
    return false;
  }
} 
import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger.js';

class VectorService {
  constructor() {
    this.embeddings = null;
    this.documents = [];
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize OpenAI embeddings only if API key is available
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        this.embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
        });
        logger.info('Vector service initialized successfully with OpenAI embeddings');
      } else {
        logger.warn('OpenAI API key not found. Vector service will use simple text matching.');
      }

      this.isInitialized = true;

    } catch (error) {
      logger.error('Failed to initialize vector service:', error);
      throw error;
    }
  }

  async addDocuments(documents) {
    if (!this.isInitialized) {
      throw new Error('Vector service not initialized');
    }

    try {
      const results = [];

      for (const doc of documents) {
        const { chunks, metadata } = doc;
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkId = `${metadata.filename}_chunk_${i}_${Date.now()}`;

          // Generate embedding if available, otherwise use simple hash
          let embedding = null;
          if (this.embeddings) {
            embedding = await this.embeddings.embedQuery(chunk.content);
          } else {
            // Simple hash-based embedding for fallback
            embedding = this.simpleHashEmbedding(chunk.content);
          }

          // Store in memory
          this.documents.push({
            id: chunkId,
            content: chunk.content,
            embedding: embedding,
            metadata: {
              filename: metadata.filename,
              chunkIndex: i,
              chunkSize: chunk.content.length,
              originalSize: metadata.size,
              mimetype: metadata.mimetype,
              uploadedAt: new Date().toISOString(),
              ...chunk.metadata
            }
          });

          results.push(chunkId);
        }
      }

      logger.info(`Added ${results.length} document chunks to vector store`);
      return results;

    } catch (error) {
      logger.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async similaritySearch(query, limit = 5) {
    if (!this.isInitialized) {
      throw new Error('Vector service not initialized');
    }

    try {
      // Generate query embedding if available, otherwise use simple hash
      let queryEmbedding = null;
      if (this.embeddings) {
        queryEmbedding = await this.embeddings.embedQuery(query);
      } else {
        queryEmbedding = this.simpleHashEmbedding(query);
      }

      // Calculate similarities
      const similarities = this.documents.map(doc => {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          ...doc,
          score: similarity,
          distance: 1 - similarity
        };
      });

      // Sort by similarity and return top results
      const results = similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(doc => ({
          content: doc.content,
          metadata: doc.metadata,
          score: doc.score,
          distance: doc.distance
        }));

      logger.info(`Similarity search returned ${results.length} results for query: ${query.substring(0, 50)}...`);
      return results;

    } catch (error) {
      logger.error('Error performing similarity search:', error);
      throw error;
    }
  }

  async getStats() {
    if (!this.isInitialized) {
      throw new Error('Vector service not initialized');
    }

    try {
      return {
        totalDocuments: this.documents.length,
        collectionName: 'in-memory-embeddings',
        isInitialized: this.isInitialized,
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'
      };

    } catch (error) {
      logger.error('Error getting vector store stats:', error);
      throw error;
    }
  }

  async clear() {
    if (!this.isInitialized) {
      throw new Error('Vector service not initialized');
    }

    try {
      this.documents = [];
      logger.info('Vector store cleared');

    } catch (error) {
      logger.error('Error clearing vector store:', error);
      throw error;
    }
  }

  async deleteDocument(filename) {
    if (!this.isInitialized) {
      throw new Error('Vector service not initialized');
    }

    try {
      const initialCount = this.documents.length;
      this.documents = this.documents.filter(doc => doc.metadata.filename !== filename);
      const deletedCount = initialCount - this.documents.length;

      logger.info(`Deleted ${deletedCount} chunks for document: ${filename}`);
      return deletedCount;

    } catch (error) {
      logger.error(`Error deleting document ${filename}:`, error);
      throw error;
    }
  }

  async getAllDocuments() {
    if (!this.isInitialized) {
      throw new Error('Vector service not initialized');
    }

    try {
      const formattedResults = this.documents.map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata
      }));

      logger.info(`Retrieved ${formattedResults.length} documents from vector store`);
      return formattedResults;

    } catch (error) {
      logger.error('Error getting all documents:', error);
      throw error;
    }
  }

  // Helper method to calculate cosine similarity
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Helper method to create simple hash-based embeddings when OpenAI is not available
  simpleHashEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0); // Same size as OpenAI embeddings
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = hash % embedding.length;
      embedding[position] = (embedding[position] + 1) / (index + 1);
    });
    
    return embedding;
  }

  // Simple hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Create singleton instance
export const vectorService = new VectorService();

// Initialize function for app startup
export async function initializeVectorStore() {
  await vectorService.initialize();
}
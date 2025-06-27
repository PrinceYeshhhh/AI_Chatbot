import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VectorService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.embeddings = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: process.env.CHROMA_DB_PATH || path.join(__dirname, '../../vector_store')
      });

      // Initialize OpenAI embeddings
      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      });

      // Get or create collection
      const collectionName = process.env.CHROMA_COLLECTION_NAME || 'chatbot_embeddings';
      
      try {
        this.collection = await this.client.getCollection({
          name: collectionName
        });
        logger.info(`Connected to existing collection: ${collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: collectionName,
          metadata: {
            description: 'AI Chatbot document embeddings',
            created_at: new Date().toISOString()
          }
        });
        logger.info(`Created new collection: ${collectionName}`);
      }

      this.isInitialized = true;
      logger.info('Vector service initialized successfully');

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

          // Generate embedding
          const embedding = await this.embeddings.embedQuery(chunk.content);

          // Add to ChromaDB
          await this.collection.add({
            ids: [chunkId],
            embeddings: [embedding],
            documents: [chunk.content],
            metadatas: [{
              filename: metadata.filename,
              chunkIndex: i,
              chunkSize: chunk.content.length,
              originalSize: metadata.size,
              mimetype: metadata.mimetype,
              uploadedAt: new Date().toISOString(),
              ...chunk.metadata
            }]
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
      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Search in ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      // Format results
      const formattedResults = [];
      
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          formattedResults.push({
            content: results.documents[0][i],
            metadata: results.metadatas[0][i],
            score: 1 - results.distances[0][i], // Convert distance to similarity score
            distance: results.distances[0][i]
          });
        }
      }

      logger.info(`Similarity search returned ${formattedResults.length} results for query: ${query.substring(0, 50)}...`);
      return formattedResults;

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
      const count = await this.collection.count();
      
      return {
        totalDocuments: count,
        collectionName: this.collection.name,
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
      // Delete the collection
      await this.client.deleteCollection({
        name: this.collection.name
      });

      // Recreate the collection
      this.collection = await this.client.createCollection({
        name: process.env.CHROMA_COLLECTION_NAME || 'chatbot_embeddings',
        metadata: {
          description: 'AI Chatbot document embeddings',
          created_at: new Date().toISOString()
        }
      });

      logger.info('Vector store cleared and recreated');

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
      // Get all documents with the specified filename
      const results = await this.collection.get({
        where: { filename: filename }
      });

      if (results.ids && results.ids.length > 0) {
        // Delete all chunks for this document
        await this.collection.delete({
          ids: results.ids
        });

        logger.info(`Deleted ${results.ids.length} chunks for document: ${filename}`);
        return results.ids.length;
      }

      return 0;

    } catch (error) {
      logger.error(`Error deleting document ${filename}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const vectorService = new VectorService();

// Initialize function for app startup
export async function initializeVectorStore() {
  await vectorService.initialize();
}
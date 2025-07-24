import { PostgresVectorService } from './postgresVectorService';
import { EmbeddingChunk } from '../types/embedding';

export class EmbeddingService {
  private vectorStore: PostgresVectorService;

  constructor() {
    this.vectorStore = new PostgresVectorService();
  }

  async saveFileEmbeddings(embeddings: EmbeddingChunk[]): Promise<void> {
    // Batch insert, idempotent
    await this.vectorStore.insertEmbeddings(embeddings);
  }

  async deleteEmbeddingsForFile(fileId: string, userId: string): Promise<void> {
    // Soft delete all embeddings for this file and user
    await this.vectorStore.softDeleteFileEmbeddings(userId, fileId);
  }

  async searchSimilarEmbeddings(userId: string, queryEmbedding: number[], topK: number = 5, fileId?: string): Promise<EmbeddingChunk[]> {
    // Top-k similarity search, scoped by user, optionally by file, excludes deleted
    return await this.vectorStore.searchEmbeddings(userId, queryEmbedding, topK, fileId);
  }

  async getFileEmbeddings(fileId: string, userId: string): Promise<EmbeddingChunk[]> {
    // Get all embeddings for a file and user (excluding deleted)
    return await this.vectorStore.getFileEmbeddings(userId, fileId);
  }

  async getUserEmbeddings(userId: string, fileId?: string): Promise<EmbeddingChunk[]> {
    // Get all embeddings for a user, optionally filtered by file
    if (fileId) {
      return await this.vectorStore.getFileEmbeddings(userId, fileId);
    }
    // Get all embeddings for user (excluding deleted)
    return await this.vectorStore.getUserEmbeddings(userId);
  }
} 
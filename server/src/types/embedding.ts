export interface EmbeddingChunk {
  userId: string;
  fileId: string;
  chunkIndex: number;
  embedding: number[];
  text: string;
  createdAt?: Date;
  isDeleted?: boolean;
}

export interface SearchResult {
  fileId: string;
  chunkIndex: number;
  text: string;
  score: number;
} 
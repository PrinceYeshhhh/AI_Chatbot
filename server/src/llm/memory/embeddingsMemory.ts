import { QdrantService } from '../../services/qdrantService';

// Embeddings memory module for file memory (RAG)
export async function getEmbeddingsMemory(userId: string, fileId?: string): Promise<any[]> {
  const qdrantService = new QdrantService();
  
  try {
    // Get embeddings from Qdrant
    const embeddings = await qdrantService.searchEmbeddings(userId, fileId);
    return embeddings || [];
  } catch (error) {
    console.error('Failed to fetch embeddings memory:', error);
    return [];
  }
}

export async function saveEmbeddingsMemory() {
  // Not needed: handled by file upload logic
  return;
} 
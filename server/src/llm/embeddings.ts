// Embeddings wrapper (Together.ai)
import { generateEmbeddings as generateLocalEmbeddings } from '../utils/generateEmbeddings';

export async function generateEmbeddings(textChunks: string[]) {
  // Use local microservice for embeddings
  return await generateLocalEmbeddings(textChunks.map(chunk => ({ chunk, metadata: {} })));
} 
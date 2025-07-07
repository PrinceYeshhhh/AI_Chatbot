// Embeddings wrapper (OpenAI for now)
import { callOpenAIEmbeddings } from './openai';

export async function generateEmbeddings(textChunks: string[]) {
  // Use OpenAI for now
  return await callOpenAIEmbeddings(textChunks);
} 
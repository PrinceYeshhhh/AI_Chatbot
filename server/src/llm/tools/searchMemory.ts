import { vectorService } from '../../services/vectorService';

/**
 * Searches user memory (vector DB) for relevant information.
 * @param query - Search query
 * @param user_id - ID of the user
 * @returns List of relevant memory chunks
 */
export async function searchMemory(query: string, user_id: string): Promise<any[]> {
  // For now, use similaritySearch with a filter for user_id
  const results = await vectorService.similaritySearch(query, 5, { user_id });
  return results;
} 
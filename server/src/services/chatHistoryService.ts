import { NeonDatabaseService } from './neonDatabaseService';

const dbService = new NeonDatabaseService();

export async function saveChatToHistory({ userId, encryptedQuery, encryptedResponse, matchedChunks, model, memoryUsed, timeTakenMs }: {
  userId: string;
  encryptedQuery: any;
  encryptedResponse: any;
  matchedChunks: any[];
  model?: string;
  memoryUsed?: any;
  timeTakenMs?: number;
}) {
  try {
    const query = `
      INSERT INTO chat_history (user_id, encrypted_query, encrypted_response, matched_chunks, model, memory_used, time_taken_ms, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    
    await dbService.query(query, [
      userId,
      JSON.stringify(encryptedQuery),
      JSON.stringify(encryptedResponse),
      JSON.stringify(matchedChunks),
      model || null,
      JSON.stringify(memoryUsed),
      timeTakenMs || null
    ]);
  } catch (error) {
    throw new Error('Failed to save chat history: ' + error);
  }
}

export async function getChatHistoryForUser(userId: string): Promise<any[]> {
  try {
    const query = `
      SELECT * FROM chat_history 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50;
    `;
    
    const result = await dbService.query(query, [userId]);
    return result.rows;
  } catch (error) {
    throw new Error('Failed to fetch chat history: ' + error);
  }
}

export async function clearChatHistoryForUser(userId: string): Promise<void> {
  try {
    const query = 'DELETE FROM chat_history WHERE user_id = $1';
    await dbService.query(query, [userId]);
  } catch (error) {
    throw new Error('Failed to clear chat history: ' + error);
  }
} 
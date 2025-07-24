import { NeonDatabaseService } from './neonDatabaseService';
import { logger } from '../utils/logger';

const dbService = new NeonDatabaseService();

export async function createChatSession({ user_id, session_id, messages }: {
  user_id: string;
  session_id: string;
  messages: any[];
}) {
  try {
    const query = `
      INSERT INTO chat_sessions (user_id, session_id, messages, created_at, last_accessed)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    
    const result = await dbService.query(query, [
      user_id,
      session_id,
      JSON.stringify(messages)
    ]);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating chat session:', error);
    throw error;
  }
}

export async function getChatSession(session_id: string) {
  try {
    const query = `
      SELECT * FROM chat_sessions 
      WHERE session_id = $1;
    `;
    
    const result = await dbService.query(query, [session_id]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching chat session:', error);
    throw error;
  }
}

export async function updateChatSession(session_id: string, messages: any[]) {
  try {
    const query = `
      UPDATE chat_sessions 
      SET messages = $1, last_accessed = CURRENT_TIMESTAMP
      WHERE session_id = $2
      RETURNING *;
    `;
    
    const result = await dbService.query(query, [
      JSON.stringify(messages),
      session_id
    ]);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating chat session:', error);
    throw error;
  }
} 
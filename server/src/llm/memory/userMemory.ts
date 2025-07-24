import { NeonDatabaseService } from '../../services/neonDatabaseService';

// User memory module
export async function getUserMemory(userId: string): Promise<any> {
  const dbService = new NeonDatabaseService();
  
  try {
    // Retrieve user memory from Neon database
    const query = `
      SELECT memory FROM user_memory 
      WHERE user_id = $1 
      LIMIT 1;
    `;
    const result = await dbService.query(query, [userId]);
    return result.rows[0]?.memory || {};
  } catch (error) {
    console.error('Failed to fetch user memory:', error);
    return {};
  }
}

export async function saveUserMemory(userId: string, memory: any): Promise<void> {
  const dbService = new NeonDatabaseService();
  
  try {
    // Upsert user memory in Neon database
    const query = `
      INSERT INTO user_memory (user_id, memory, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        memory = EXCLUDED.memory,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await dbService.query(query, [userId, JSON.stringify(memory)]);
  } catch (error) {
    console.error('Failed to save user memory:', error);
    throw error;
  }
}

// Long-term memory CRUD
export async function getUserLongTermMemory(userId: string, workspaceId: string): Promise<any[]> {
  const dbService = new NeonDatabaseService();
  
  try {
    const query = `
      SELECT * FROM long_term_memory 
      WHERE user_id = $1 AND workspace_id = $2
      ORDER BY created_at DESC;
    `;
    const result = await dbService.query(query, [userId, workspaceId]);
    return result.rows || [];
  } catch (error) {
    console.error('Failed to fetch long-term memory:', error);
    return [];
  }
}

export async function saveLongTermMemory(userId: string, type: string, content: string, workspaceId: string): Promise<any> {
  const dbService = new NeonDatabaseService();
  
  try {
    const query = `
      INSERT INTO long_term_memory (user_id, type, content, workspace_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await dbService.query(query, [userId, type, content, workspaceId]);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to save long-term memory:', error);
    throw error;
  }
}

export async function updateLongTermMemory(userId: string, id: string, type: string, content: string): Promise<any> {
  const dbService = new NeonDatabaseService();
  
  try {
    const query = `
      UPDATE long_term_memory 
      SET type = $1, content = $2
      WHERE user_id = $3 AND id = $4
      RETURNING *;
    `;
    const result = await dbService.query(query, [type, content, userId, id]);
    return result.rows[0];
  } catch (error) {
    console.error('Failed to update long-term memory:', error);
    throw error;
  }
}

export async function deleteLongTermMemory(userId: string, id: string): Promise<void> {
  const dbService = new NeonDatabaseService();
  
  try {
    const query = `
      DELETE FROM long_term_memory 
      WHERE user_id = $1 AND id = $2;
    `;
    await dbService.query(query, [userId, id]);
  } catch (error) {
    console.error('Failed to delete long-term memory:', error);
    throw error;
  }
} 
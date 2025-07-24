import { Pool } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

export class NeonDatabaseService {
  private pool: Pool;

  constructor() {
    const config: DatabaseConfig = {
      host: process.env['NEON_HOST']!,
      port: parseInt(process.env['NEON_PORT'] || '5432'),
      database: process.env['NEON_DATABASE']!,
      user: process.env['NEON_USER']!,
      password: process.env['NEON_PASSWORD']!,
      ssl: process.env['NODE_ENV'] === 'production'
    };

    this.pool = new Pool(config);
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async createTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES users(id),
        title VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES conversations(id),
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createFilesTable = `
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES users(id),
        file_name VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        storage_url VARCHAR(1000),
        status VARCHAR(50) DEFAULT 'uploaded',
        storage_mode VARCHAR(20) DEFAULT 'permanent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES users(id),
        session_data JSONB,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createFileActivityLogTable = `
      CREATE TABLE IF NOT EXISTS file_activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) REFERENCES users(id),
        file_id UUID REFERENCES files(id),
        event VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.query(createUsersTable);
      await this.query(createConversationsTable);
      await this.query(createMessagesTable);
      await this.query(createFilesTable);
      await this.query(createSessionsTable);
      await this.query(createFileActivityLogTable);
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async createUser(userId: string, email: string, firstName?: string, lastName?: string): Promise<any> {
    const query = `
      INSERT INTO users (id, email, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    return this.query(query, [userId, email, firstName, lastName]);
  }

  async getUser(userId: string): Promise<any> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  async saveConversation(userId: string, title: string): Promise<any> {
    const query = `
      INSERT INTO conversations (user_id, title)
      VALUES ($1, $2)
      RETURNING *;
    `;
    
    return this.query(query, [userId, title]);
  }

  async saveMessage(conversationId: string, role: string, content: string): Promise<any> {
    const query = `
      INSERT INTO messages (conversation_id, role, content)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    return this.query(query, [conversationId, role, content]);
  }

  async getConversationMessages(conversationId: string): Promise<any[]> {
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC;
    `;
    
    const result = await this.query(query, [conversationId]);
    return result.rows;
  }

  async getUserConversations(userId: string): Promise<any[]> {
    const query = `
      SELECT c.*, COUNT(m.id) as message_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC;
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows;
  }

  async saveSession(userId: string, sessionData: any, expiresAt: Date): Promise<any> {
    const query = `
      INSERT INTO sessions (user_id, session_data, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    return this.query(query, [userId, JSON.stringify(sessionData), expiresAt]);
  }

  async getSession(sessionId: string): Promise<any> {
    const query = `
      SELECT * FROM sessions 
      WHERE id = $1 AND expires_at > CURRENT_TIMESTAMP;
    `;
    
    const result = await this.query(query, [sessionId]);
    return result.rows[0];
  }

  async cleanupExpiredSessions(): Promise<void> {
    const query = 'DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP';
    await this.query(query);
  }

  async getUserFiles(userId: string): Promise<any> {
    const query = `
      SELECT * FROM files 
      WHERE user_id = $1 AND status != 'deleted'
      ORDER BY created_at DESC;
    `;
    
    const result = await this.query(query, [userId]);
    return { files: result.rows };
  }

  async getFileById(fileId: string): Promise<any> {
    const query = 'SELECT * FROM files WHERE id = $1';
    const result = await this.query(query, [fileId]);
    return result.rows[0];
  }

  async deleteFileById(fileId: string): Promise<void> {
    const query = `DELETE FROM files WHERE id = $1`;
    await this.query(query, [fileId]);
  }

  async insertFile(fileId: string, userId: string, workspaceId: string, fileName: string, fileSize: number, mimeType: string, storageMode: string, createdAt: string): Promise<void> {
    const query = `
      INSERT INTO files (id, user_id, file_name, file_size, mime_type, storage_mode, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        storage_mode = EXCLUDED.storage_mode,
        updated_at = CURRENT_TIMESTAMP;
    `;
    await this.query(query, [fileId, userId, fileName, fileSize, mimeType, storageMode, createdAt]);
  }

  async getExpiredTemporaryFiles(): Promise<any[]> {
    const query = `SELECT * FROM files WHERE storage_mode = 'temporary' AND created_at < NOW() - INTERVAL '1 hour'`;
    const result = await this.query(query);
    return result.rows;
  }

  async logFileActivity(userId: string, fileId: string, event: string, details?: string): Promise<void> {
    const query = `
      INSERT INTO file_activity_log (user_id, file_id, event, details)
      VALUES ($1, $2, $3, $4)
    `;
    await this.query(query, [userId, fileId, event, details || null]);
  }

  async getFileActivityLog(userId: string, fileId: string): Promise<any[]> {
    const query = `
      SELECT * FROM file_activity_log WHERE user_id = $1 AND file_id = $2 ORDER BY created_at DESC
    `;
    const result = await this.query(query, [userId, fileId]);
    return result.rows;
  }

  async updateFileStatus(fileId: string, status: string, progress: number, error: string | null = null): Promise<void> {
    const query = `UPDATE files SET status = $1, progress = $2, error = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`;
    await this.query(query, [status, progress, error, fileId]);
  }

  async getFileStatus(fileId: string): Promise<{ status: string, progress: number, error: string | null }> {
    const query = `SELECT status, progress, error FROM files WHERE id = $1`;
    const result = await this.query(query, [fileId]);
    if (result.rows.length === 0) return { status: 'unknown', progress: 0, error: null };
    return result.rows[0];
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 
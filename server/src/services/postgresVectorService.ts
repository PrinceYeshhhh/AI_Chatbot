import { Pool } from 'pg';
import { EmbeddingChunk } from '../types/embedding';

const pool = new Pool({
  connectionString: process.env['PG_VECTOR_URL'] || process.env['DATABASE_URL'],
});

export class PostgresVectorService {
  async insertEmbeddings(embeddings: EmbeddingChunk[]): Promise<void> {
    if (!embeddings.length) return;
    const values = embeddings.map(
      (e, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
    ).join(',');
    const params = embeddings.flatMap(e => [
      e.userId, e.fileId, e.chunkIndex, e.embedding, e.text
    ]);
    const query = `
      INSERT INTO embeddings (user_id, file_id, chunk_index, embedding, text)
      VALUES ${values}
      ON CONFLICT (user_id, file_id, chunk_index) DO NOTHING
    `;
    await pool.query(query, params);
  }

  async searchEmbeddings(userId: string, queryEmbedding: number[], topK: number = 5, fileId?: string): Promise<EmbeddingChunk[]> {
    let where = 'user_id = $1 AND is_deleted = FALSE';
    const params: any[] = [userId, queryEmbedding, topK];
    if (fileId) {
      where += ' AND file_id = $4';
      params.push(fileId);
    }
    const query = `
      SELECT user_id, file_id, chunk_index, embedding, text, created_at, is_deleted,
        1 - (embedding <#> $2::vector) AS score
      FROM embeddings
      WHERE ${where}
      ORDER BY embedding <#> $2::vector
      LIMIT $3
    `;
    const { rows } = await pool.query(query, params);
    return rows.map((r: any) => ({
      userId: r.user_id,
      fileId: r.file_id,
      chunkIndex: r.chunk_index,
      embedding: r.embedding,
      text: r.text,
      createdAt: r.created_at,
      isDeleted: r.is_deleted,
      score: Number(r.score)
    }));
  }

  async softDeleteFileEmbeddings(userId: string, fileId: string): Promise<void> {
    await pool.query(
      `UPDATE embeddings SET is_deleted = TRUE WHERE user_id = $1 AND file_id = $2`,
      [userId, fileId]
    );
  }

  async getFileEmbeddings(userId: string, fileId: string): Promise<EmbeddingChunk[]> {
    const { rows } = await pool.query(
      `SELECT user_id, file_id, chunk_index, embedding, text, created_at, is_deleted
       FROM embeddings WHERE user_id = $1 AND file_id = $2 AND is_deleted = FALSE`,
      [userId, fileId]
    );
    return rows.map((r: any) => ({
      userId: r.user_id,
      fileId: r.file_id,
      chunkIndex: r.chunk_index,
      embedding: r.embedding,
      text: r.text,
      createdAt: r.created_at,
      isDeleted: r.is_deleted
    }));
  }

  async getUserEmbeddings(userId: string): Promise<EmbeddingChunk[]> {
    const { rows } = await pool.query(
      `SELECT user_id, file_id, chunk_index, embedding, text, created_at, is_deleted
       FROM embeddings WHERE user_id = $1 AND is_deleted = FALSE`,
      [userId]
    );
    return rows.map((r: any) => ({
      userId: r.user_id,
      fileId: r.file_id,
      chunkIndex: r.chunk_index,
      embedding: r.embedding,
      text: r.text,
      createdAt: r.created_at,
      isDeleted: r.is_deleted
    }));
  }
} 
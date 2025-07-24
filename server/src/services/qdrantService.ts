import fetch from 'node-fetch';

export interface QdrantConfig {
  url: string;
  apiKey: string;
  collection: string;
}

export class QdrantService {
  private config: QdrantConfig;

  constructor() {
    this.config = {
      url: process.env['QDRANT_URL']!,
      apiKey: process.env['QDRANT_API_KEY']!,
      collection: process.env['QDRANT_COLLECTION'] || 'smart_brain_embeddings'
    };
  }

  async storeEmbedding(id: string, payload: any): Promise<void> {
    try {
      const response = await fetch(`${this.config.url}/collections/${this.config.collection}/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          points: [{
            id,
            vector: payload.embeddingVector,
            payload
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  }

  async searchSimilar(vector: number[], limit: number = 5, filter?: Record<string, any>): Promise<any[]> {
    try {
      const must: any[] = [];
      if (filter) {
        if (filter['userId']) must.push({ key: 'payload.userId', match: { value: filter['userId'] } });
        if (filter['embedding_status']) must.push({ key: 'payload.embedding_status', match: { value: filter['embedding_status'] } });
        if (filter['fileId']) must.push({ key: 'payload.fileId', match: { value: filter['fileId'] } });
        if (filter['fileType']) must.push({ key: 'payload.fileType', match: { value: filter['fileType'] } });
        if (filter['not_deleted']) must.push({ key: 'payload.deleted', match: { value: false } });
      }
      const response = await fetch(`${this.config.url}/collections/${this.config.collection}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          vector,
          limit,
          with_payload: true,
          filter: must.length > 0 ? { must } : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.result || [];
    } catch (error) {
      console.error('Error searching embeddings:', error);
      throw error;
    }
  }

  async searchEmbeddings(userId: string, fileId?: string): Promise<any[]> {
    try {
      const must: any[] = [
        { key: 'payload.userId', match: { value: userId } },
        { key: 'payload.embedding_status', match: { value: 'active' } },
        { key: 'payload.deleted', match: { value: false } }
      ];
      if (fileId) {
        must.push({ key: 'payload.fileId', match: { value: fileId } });
      }
      const response = await fetch(`${this.config.url}/collections/${this.config.collection}/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          limit: 100,
          with_payload: true,
          filter: { must }
        })
      });

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.result?.points || [];
    } catch (error) {
      console.error('Error searching embeddings:', error);
      return [];
    }
  }

  async deleteEmbeddings(fileId: string, userId?: string): Promise<void> {
    try {
      const must: any[] = [
        { key: 'payload.fileId', match: { value: fileId } }
      ];
      if (userId) {
        must.push({ key: 'payload.userId', match: { value: userId } });
      }
      const response = await fetch(`${this.config.url}/collections/${this.config.collection}/points/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          filter: { must }
        })
      });

      if (!response.ok) {
        throw new Error(`Qdrant API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting embeddings:', error);
      throw error;
    }
  }
} 
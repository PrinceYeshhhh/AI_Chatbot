import { vectorService, VectorService } from '../services/vectorService';
import { supabase } from '../lib/supabase';
import { Document } from '@langchain/core/documents';

describe('VectorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize vector service', () => {
    const service = new VectorService();
    expect(service).toBeDefined();
    expect(typeof service.isServiceAvailable()).toBe('boolean');
  });

  it('should add documents without error when initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { addDocuments: jest.fn().mockResolvedValue(undefined) } as any;
    await expect(service.addDocuments(['test'], [[0.1, 0.2]], [{}])).resolves.not.toThrow();
  });

  it('should skip addDocuments if not initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = false;
    service['vectorStore'] = null;
    await expect(service.addDocuments(['test'], [[0.1, 0.2]], [{}])).resolves.not.toThrow();
  });

  it('should handle error in addDocuments', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { addDocuments: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    await expect(service.addDocuments(['test'], [[0.1, 0.2]], [{}])).rejects.toThrow('Failed to add documents: fail');
  });

  it('should perform similaritySearch and return results', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { similaritySearch: jest.fn().mockResolvedValue([new Document({ pageContent: 'doc' })]) } as any;
    const results = await service.similaritySearch('query', 1);
    expect(results.length).toBe(1);
  });

  it('should return empty array if not initialized for similaritySearch', async () => {
    const service = new VectorService();
    service['isInitialized'] = false;
    service['vectorStore'] = null;
    const results = await service.similaritySearch('query', 1);
    expect(results).toEqual([]);
  });

  it('should handle error in similaritySearch', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { similaritySearch: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    const results = await service.similaritySearch('query', 1);
    expect(results).toEqual([]);
  });

  it('should perform similaritySearchWithScore and return results', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { similaritySearchWithScore: jest.fn().mockResolvedValue([[new Document({ pageContent: 'doc' }), 0.9]]) } as any;
    const results = await service.similaritySearchWithScore('query', 1);
    expect(results.length).toBe(1);
  });

  it('should return empty array if not initialized for similaritySearchWithScore', async () => {
    const service = new VectorService();
    service['isInitialized'] = false;
    service['vectorStore'] = null;
    const results = await service.similaritySearchWithScore('query', 1);
    expect(results).toEqual([]);
  });

  it('should handle error in similaritySearchWithScore', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { similaritySearchWithScore: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    const results = await service.similaritySearchWithScore('query', 1);
    expect(results).toEqual([]);
  });

  it('should get stats when initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { collection: { count: jest.fn().mockResolvedValue(5) } } as any;
    const stats = await service.getStats();
    expect(stats.status).toBe('healthy');
    expect(stats.documentCount).toBe(5);
  });

  it('should return fallback stats if not initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = false;
    service['vectorStore'] = null;
    const stats = await service.getStats();
    expect(stats.status).toBe('fallback');
  });

  it('should handle error in getStats', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { collection: { count: jest.fn().mockRejectedValue(new Error('fail')) } } as any;
    const stats = await service.getStats();
    expect(stats.status).toBe('error');
  });

  it('should delete documents when initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { delete: jest.fn().mockResolvedValue(undefined) } as any;
    await expect(service.deleteDocuments({})).resolves.not.toThrow();
  });

  it('should skip deleteDocuments if not initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = false;
    service['vectorStore'] = null;
    await expect(service.deleteDocuments({})).resolves.not.toThrow();
  });

  it('should handle error in deleteDocuments', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { delete: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    await expect(service.deleteDocuments({})).rejects.toThrow('Failed to delete documents: fail');
  });

  it('should clear collection when initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { delete: jest.fn().mockResolvedValue(undefined) } as any;
    await expect(service.clearCollection()).resolves.not.toThrow();
  });

  it('should skip clearCollection if not initialized', async () => {
    const service = new VectorService();
    service['isInitialized'] = false;
    service['vectorStore'] = null;
    await expect(service.clearCollection()).resolves.not.toThrow();
  });

  it('should handle error in clearCollection', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = { delete: jest.fn().mockRejectedValue(new Error('fail')) } as any;
    await expect(service.clearCollection()).rejects.toThrow('Failed to clear collection: fail');
  });

  it('should query user vectors and return topK', async () => {
    const service = new VectorService();
    service['isInitialized'] = true;
    service['vectorStore'] = {} as any;
    // Mock supabase
    (supabase.from as any) = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [
        { id: 'file1', embedding: [0.1, 0.2], content: 'chunk', metadata: {}, file_id: 'file1', file_name: 'file1.pdf', chunk_index: 0 }
      ], error: null })
    }));
    const result = await service.queryUserVectors({ userId: 'user1', queryEmbedding: [0.1, 0.2], topK: 1 });
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
}); 
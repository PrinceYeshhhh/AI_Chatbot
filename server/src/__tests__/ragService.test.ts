process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

import * as ragService from '../services/ragService';
import * as vectorSearchService from '../services/vectorSearchService';
import * as chatHistoryService from '../services/chatHistoryService';

jest.mock('node-fetch', () => jest.fn());

const mockFetch = (response) => {
  global.fetch = jest.fn().mockResolvedValue(response);
  const nodeFetch = require('node-fetch');
  nodeFetch.mockResolvedValue(response);
};

describe('ragService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('should return a valid RAG response', async () => {
    jest.spyOn(vectorSearchService, 'semanticSearch').mockResolvedValue([
      { chunk_text: 'Relevant chunk 1' },
      { chunk_text: 'Relevant chunk 2' }
    ]);
    mockFetch({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'AI answer' } }] })
    });
    jest.spyOn(chatHistoryService, 'saveChatToHistory').mockResolvedValue(undefined);
    const result = await ragService.generateRAGResponse('query', 'user1', 2);
    expect(result).toBe('AI answer');
  });

  it('should throw on OpenAI API error', async () => {
    jest.spyOn(vectorSearchService, 'semanticSearch').mockResolvedValue([
      { chunk_text: 'Relevant chunk' }
    ]);
    mockFetch({
      ok: false,
      status: 500,
      text: async () => 'API error'
    });
    await expect(ragService.generateRAGResponse('query', 'user1', 1)).rejects.toThrow('OpenAI API error: 500 API error');
  });

  it('should throw on semanticSearch error', async () => {
    jest.spyOn(vectorSearchService, 'semanticSearch').mockRejectedValue(new Error('semantic error'));
    await expect(ragService.generateRAGResponse('query', 'user1', 1)).rejects.toThrow('semantic error');
  });

  it('should call saveChatToHistory with correct params', async () => {
    jest.spyOn(vectorSearchService, 'semanticSearch').mockResolvedValue([
      { chunk_text: 'Relevant chunk' }
    ]);
    mockFetch({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'AI answer' } }] })
    });
    const saveSpy = jest.spyOn(chatHistoryService, 'saveChatToHistory').mockResolvedValue(undefined);
    await ragService.generateRAGResponse('query', 'user1', 1);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user1',
      queryText: 'query',
      aiResponse: 'AI answer'
    }));
  });
}); 
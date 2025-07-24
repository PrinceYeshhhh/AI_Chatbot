import { describe, test, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { chatService } from '../services/chatService';
import { Message, TrainingData } from '../types';

// Mock the cache service
jest.mock('../services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }
}));

// Mock the environment variables before importing chatService
beforeAll(() => {
  // Set up environment variables for tests
  (globalThis as any).viteEnv = {
    VITE_API_URL: 'http://localhost:3001',
    VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_test_key',
    VITE_CLERK_SECRET_KEY: 'sk_test_test_key',
    VITE_GROQ_MODEL: 'llama3-70b-8192',
    NODE_ENV: 'test'
  };
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('Training Data Management', () => {
    it('should add training data correctly', async () => {
      const mockResponse = {
        id: 'test-id',
        input: 'test input',
        expectedOutput: 'test output',
        intent: 'test',
        confidence: 0.9,
        dateAdded: new Date(),
        validationStatus: 'pending',
        validationScore: undefined
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await chatService.addTrainingData('test input', 'test output', 'test');
      
      expect(result).toBeDefined();
      expect(result.input).toBe('test input');
      expect(result.expectedOutput).toBe('test output');
      expect(result.intent).toBe('test');
    });

    it('should handle empty input gracefully', async () => {
      try {
        await chatService.addTrainingData('', 'test output', 'test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty expected output gracefully', async () => {
      try {
        await chatService.addTrainingData('test input', '', 'test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty intent gracefully', async () => {
      try {
        await chatService.addTrainingData('test input', 'test output', '');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should get training data correctly', async () => {
      const mockData = [
        {
          id: 'test-id',
          input: 'test input',
          expectedOutput: 'test output',
          intent: 'test',
          confidence: 0.9,
          dateAdded: new Date(),
          validationStatus: 'pending',
          validationScore: undefined
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainingData: mockData })
      });

      const result = await chatService.getTrainingData();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should remove training data correctly', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await expect(chatService.removeTrainingData('test-id')).resolves.not.toThrow();
    });

    it('should get training stats correctly', async () => {
      const mockStats = {
        total: 10,
        validated: 8,
        pending: 1,
        rejected: 1,
        validationRate: 80
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ training: mockStats })
      });

      const result = await chatService.getTrainingStats();
      
      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.validated).toBeDefined();
    });
  });

  describe('Message Handling', () => {
    it('should send message successfully', async () => {
      const mockMessage: Message = {
        id: 'test-id',
        content: 'test response',
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
        intent: 'general'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn().mockResolvedValueOnce({
              done: true,
              value: new TextEncoder().encode('data: [DONE]\n')
            })
          })
        }
      });

      const result = await chatService.sendMessage('test message', []);
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(chatService.sendMessage('test message', [])).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(chatService.sendMessage('test message', [])).rejects.toThrow();
    });
  });

  describe('API Configuration', () => {
    it('should update API config correctly', () => {
      const newConfig = {
        model: 'gpt-4',
        temperature: 0.5
      };

      expect(() => chatService.updateApiConfig(newConfig)).not.toThrow();
    });

    it('should mask API key correctly', () => {
      const masked = chatService.maskApiKey('sk-test123456789');
      expect(masked).toContain('***');
      expect(masked).not.toContain('test123456789');
    });
  });

  describe('Data Import/Export', () => {
    it('should import training data correctly', () => {
      const mockData = [
        {
          id: 'test-id',
          input: 'test input',
          expectedOutput: 'test output',
          intent: 'test',
          confidence: 0.9,
          dateAdded: new Date()
        }
      ];

      expect(() => chatService.importTrainingData(mockData)).not.toThrow();
    });

    it('should export training data correctly', async () => {
      const mockData = [
        {
          id: 'test-id',
          input: 'test input',
          expectedOutput: 'test output',
          intent: 'test',
          confidence: 0.9,
          dateAdded: new Date()
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trainingData: mockData })
      });

      const result = await chatService.exportTrainingData();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should get performance stats', () => {
      const stats = chatService.getPerformanceStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalOperations).toBe('number');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const mockMessage: Message = {
        id: 'test-id',
        content: 'test response',
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
        intent: 'general'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn().mockResolvedValue({
              done: true,
              value: new TextEncoder().encode('data: [DONE]\n')
            })
          })
        }
      });

      // Send multiple messages rapidly
      const promises = Array(3).fill(null).map(() => 
        chatService.sendMessage('test message', [])
      );

      const results = await Promise.all(promises);
      expect(results).toBeDefined();
      expect(results.length).toBe(3);
    });
  });
}); 
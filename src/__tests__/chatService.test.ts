import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { chatService } from '../services/chatService';
import { Message, TrainingData } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('ChatService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    (fetch as jest.Mock).mockClear();
  });

  describe('Training Data Management', () => {
    test('should add training data correctly', async () => {
      const result = await chatService.addTrainingData(
        'hello',
        'Hello! How can I help you?',
        'greeting'
      );

      expect(result.input).toBe('hello');
      expect(result.expectedOutput).toBe('Hello! How can I help you?');
      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBe(0.98);
      expect(result.id).toBeDefined();
      expect(result.dateAdded).toBeInstanceOf(Date);
    });

    test('should handle empty input gracefully', async () => {
      await expect(
        chatService.addTrainingData('', 'response', 'intent')
      ).rejects.toThrow();
    });

    test('should handle empty expected output gracefully', async () => {
      await expect(
        chatService.addTrainingData('input', '', 'intent')
      ).rejects.toThrow();
    });

    test('should handle empty intent gracefully', async () => {
      await expect(
        chatService.addTrainingData('input', 'response', '')
      ).rejects.toThrow();
    });

    test('should get training data correctly', () => {
      const data = chatService.getTrainingData();
      expect(Array.isArray(data)).toBe(true);
    });

    test('should remove training data correctly', async () => {
      const trainingData = await chatService.addTrainingData(
        'test input',
        'test output',
        'test intent'
      );

      const initialCount = chatService.getTrainingData().length;
      chatService.removeTrainingData(trainingData.id);
      const finalCount = chatService.getTrainingData().length;

      expect(finalCount).toBe(initialCount - 1);
    });

    test('should get training stats correctly', () => {
      const stats = chatService.getTrainingStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('validated');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('rejected');
      expect(stats).toHaveProperty('validationRate');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.validationRate).toBe('number');
    });
  });

  describe('Message Handling', () => {
    test('should send message successfully', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
          }),
        },
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const message = 'Hello, AI!';
      const conversationHistory: Message[] = [];

      const result = await chatService.sendMessage(message, conversationHistory);

      expect(result.content).toBeDefined();
      expect(result.sender).toBe('bot');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.id).toBeDefined();
    });

    test('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const message = 'Hello, AI!';
      const conversationHistory: Message[] = [];

      await expect(
        chatService.sendMessage(message, conversationHistory)
      ).rejects.toThrow();
    });

    test('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const message = 'Hello, AI!';
      const conversationHistory: Message[] = [];

      await expect(
        chatService.sendMessage(message, conversationHistory)
      ).rejects.toThrow();
    });
  });

  describe('API Configuration', () => {
    test('should update API config correctly', () => {
      const newConfig = {
        apiKey: 'sk-test123456789',
        baseUrl: 'https://api.example.com',
        model: 'gpt-4',
      };

      chatService.updateApiConfig(newConfig);
      const config = chatService.getApiConfig();

      expect(config.apiKey).toBe(newConfig.apiKey);
      expect(config.baseUrl).toBe(newConfig.baseUrl);
      expect(config.model).toBe(newConfig.model);
    });

    test('should validate API key format', () => {
      expect(() => {
        chatService.updateApiConfig({ apiKey: 'invalid-key' });
      }).toThrow();
    });

    test('should mask API key correctly', () => {
      const masked = chatService.maskApiKey('sk-test123456789');
      expect(masked).toBe('sk-test...6789');
    });
  });

  describe('Data Import/Export', () => {
    test('should import training data correctly', () => {
      const importData: TrainingData[] = [
        {
          id: '1',
          input: 'imported input',
          expectedOutput: 'imported output',
          intent: 'imported intent',
          confidence: 0.95,
          dateAdded: new Date(),
          validationStatus: 'pending',
        },
      ];

      chatService.importTrainingData(importData);
      const currentData = chatService.getTrainingData();

      expect(currentData.length).toBeGreaterThan(0);
      expect(currentData.some(item => item.input === 'imported input')).toBe(true);
    });

    test('should export training data correctly', () => {
      const exportedData = chatService.exportTrainingData();
      expect(Array.isArray(exportedData)).toBe(true);
    });

    test('should validate imported data', () => {
      const invalidData: TrainingData[] = [
        {
          id: '1',
          input: '', // Invalid empty input
          expectedOutput: 'output',
          intent: 'intent',
          confidence: 0.95,
          dateAdded: new Date(),
          validationStatus: 'pending',
        },
      ];

      expect(() => {
        chatService.importTrainingData(invalidData);
      }).toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    test('should get performance stats', () => {
      const stats = chatService.getPerformanceStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
          }),
        },
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const message = 'Test message';
      const conversationHistory: Message[] = [];

      // Send multiple messages rapidly
      const promises = Array(15).fill(null).map(() =>
        chatService.sendMessage(message, conversationHistory)
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      // Should have some rate limiting
      expect(failed.length).toBeGreaterThan(0);
    });
  });
}); 
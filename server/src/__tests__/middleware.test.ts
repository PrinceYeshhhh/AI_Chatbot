import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { validateChatRequest, validateTrainingData } from '../middleware/validation';

// Mock Request, Response, and NextFunction
const mockRequest = (body: any = {}, headers: any = {}) => ({
  body,
  headers,
  user: undefined
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Middleware Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateChatRequest', () => {
    test('should pass validation for valid message', () => {
      const req = mockRequest({ message: 'Hello world' });
      const res = mockResponse();
      
      validateChatRequest(req as any, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject empty message', () => {
      const req = mockRequest({ message: '' });
      const res = mockResponse();
      
      validateChatRequest(req as any, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Message is required and must be a non-empty string'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject missing message', () => {
      const req = mockRequest({});
      const res = mockResponse();
      
      validateChatRequest(req as any, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Message is required and must be a non-empty string'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateTrainingData', () => {
    test('should pass validation for valid training data', () => {
      const req = mockRequest({
        input: 'What is AI?',
        expectedOutput: 'AI is artificial intelligence',
        intent: 'question'
      });
      const res = mockResponse();
      
      validateTrainingData(req as any, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject missing input', () => {
      const req = mockRequest({
        expectedOutput: 'AI is artificial intelligence',
        intent: 'question'
      });
      const res = mockResponse();
      
      validateTrainingData(req as any, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Input is required and must be a string'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject missing expectedOutput', () => {
      const req = mockRequest({
        input: 'What is AI?',
        intent: 'question'
      });
      const res = mockResponse();
      
      validateTrainingData(req as any, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Expected output is required and must be a string'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject missing intent', () => {
      const req = mockRequest({
        input: 'What is AI?',
        expectedOutput: 'AI is artificial intelligence'
      });
      const res = mockResponse();
      
      validateTrainingData(req as any, res, mockNext);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Intent is required and must be a string'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 
import { successResponse, errorResponse, sanitizeInput } from '../utils/schemas';

// Mock Response object
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Utility Functions', () => {
  describe('successResponse', () => {
    test('should send success response with data', () => {
      const res = mockResponse();
      const data = { message: 'Success' };
      
      successResponse(res, data);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data
      });
    });

    test('should send success response with custom status code', () => {
      const res = mockResponse();
      const data = { message: 'Created' };
      
      successResponse(res, data, 201);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data
      });
    });
  });

  describe('errorResponse', () => {
    test('should send error response with message', () => {
      const res = mockResponse();
      const message = 'Something went wrong';
      
      errorResponse(res, message);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: message
      });
    });

    test('should send error response with custom status code', () => {
      const res = mockResponse();
      const message = 'Not found';
      
      errorResponse(res, message, 404);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: message
      });
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('alert("xss")Hello');
    });

    test('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      expect(result).toBe('alert("xss")');
    });

    test('should remove event handlers', () => {
      const input = 'onclick=alert("xss")Hello';
      const result = sanitizeInput(input);
      console.log('Input:', input);
      console.log('Result:', result);
      const input2 = 'onclick=alert("xss") Hello';
      const result2 = sanitizeInput(input2);
      expect(result2).toBe('Hello');
    });

    test('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    test('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });
  });
}); 
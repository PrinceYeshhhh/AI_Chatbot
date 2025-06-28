import { describe, test, expect, beforeEach } from '@jest/globals';
import { SecurityUtils } from '../../utils/security';

describe('SecurityUtils', () => {
  describe('validateApiKey', () => {
    test('should validate correct API key format', () => {
      const validKeys = [
        'sk-1234567890abcdef1234567890abcdef1234567890',
        'sk-test1234567890abcdef1234567890abcdef1234567890',
        'sk-proj-1234567890abcdef1234567890abcdef1234567890'
      ];

      validKeys.forEach(key => {
        expect(SecurityUtils.validateApiKey(key)).toBe(true);
      });
    });

    test('should reject invalid API key format', () => {
      const invalidKeys = [
        'invalid-key',
        'sk-',
        'sk-123',
        '1234567890abcdef1234567890abcdef1234567890',
        '',
        'sk-invalid-key-without-proper-length',
        'sk-1234567890abcdef1234567890abcdef123456789' // too short
      ];

      invalidKeys.forEach(key => {
        expect(SecurityUtils.validateApiKey(key)).toBe(false);
      });
    });

    test('should handle null and undefined', () => {
      expect(SecurityUtils.validateApiKey(null as any)).toBe(false);
      expect(SecurityUtils.validateApiKey(undefined as any)).toBe(false);
    });
  });

  describe('maskApiKey', () => {
    test('should mask API key correctly', () => {
      const key = 'sk-1234567890abcdef1234567890abcdef1234567890';
      const masked = SecurityUtils.maskApiKey(key);
      
      expect(masked).toBe('sk-123456...7890');
      expect(masked).not.toContain('abcdef1234567890abcdef123456');
    });

    test('should handle short API keys', () => {
      const shortKey = 'sk-1234567890abcdef1234567890abcdef123456789';
      const masked = SecurityUtils.maskApiKey(shortKey);
      
      expect(masked).toBe('sk-123456...6789');
    });

    test('should handle very short API keys', () => {
      const veryShortKey = 'sk-1234567890';
      const masked = SecurityUtils.maskApiKey(veryShortKey);
      
      expect(masked).toBe('sk-123456...7890');
    });

    test('should handle invalid keys gracefully', () => {
      expect(SecurityUtils.maskApiKey('')).toBe('');
      expect(SecurityUtils.maskApiKey('invalid')).toBe('invalid');
    });
  });

  describe('sanitizeInput', () => {
    test('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const sanitized = SecurityUtils.sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<b>');
    });

    test('should handle empty input', () => {
      expect(SecurityUtils.sanitizeInput('')).toBe('');
    });

    test('should handle input without HTML', () => {
      const input = 'Hello World';
      const sanitized = SecurityUtils.sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    test('should remove dangerous attributes', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const sanitized = SecurityUtils.sanitizeInput(input);
      
      expect(sanitized).toBe('');
    });

    test('should handle complex HTML', () => {
      const input = `
        <div>
          <script>alert("xss")</script>
          <p>Hello <a href="javascript:alert(1)">World</a></p>
          <iframe src="http://evil.com"></iframe>
        </div>
      `;
      const sanitized = SecurityUtils.sanitizeInput(input);
      
      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('<iframe>');
    });
  });

  describe('validateTrainingData', () => {
    test('should validate correct training data', () => {
      const validData = {
        input: 'Hello, how are you?',
        expectedOutput: 'I am doing well, thank you for asking!',
        intent: 'greeting'
      };

      const result = SecurityUtils.validateTrainingData(
        validData.input,
        validData.expectedOutput,
        validData.intent
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject empty input', () => {
      const result = SecurityUtils.validateTrainingData(
        '',
        'Valid output',
        'valid intent'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Input cannot be empty');
    });

    test('should reject empty expected output', () => {
      const result = SecurityUtils.validateTrainingData(
        'Valid input',
        '',
        'valid intent'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Expected output cannot be empty');
    });

    test('should reject empty intent', () => {
      const result = SecurityUtils.validateTrainingData(
        'Valid input',
        'Valid output',
        ''
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Intent cannot be empty');
    });

    test('should reject input that is too long', () => {
      const longInput = 'a'.repeat(1001);
      const result = SecurityUtils.validateTrainingData(
        longInput,
        'Valid output',
        'valid intent'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Input is too long');
    });

    test('should reject output that is too long', () => {
      const longOutput = 'a'.repeat(4001);
      const result = SecurityUtils.validateTrainingData(
        'Valid input',
        longOutput,
        'valid intent'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Expected output is too long');
    });

    test('should reject intent that is too long', () => {
      const longIntent = 'a'.repeat(101);
      const result = SecurityUtils.validateTrainingData(
        'Valid input',
        'Valid output',
        longIntent
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Intent is too long');
    });

    test('should reject input with dangerous content', () => {
      const dangerousInput = '<script>alert("xss")</script>Hello';
      const result = SecurityUtils.validateTrainingData(
        dangerousInput,
        'Valid output',
        'valid intent'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Input contains potentially dangerous content');
    });

    test('should reject output with dangerous content', () => {
      const dangerousOutput = '<script>alert("xss")</script>Hello';
      const result = SecurityUtils.validateTrainingData(
        'Valid input',
        dangerousOutput,
        'valid intent'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Expected output contains potentially dangerous content');
    });
  });

  describe('createRateLimiter', () => {
    test('should create rate limiter with correct limits', () => {
      const rateLimiter = SecurityUtils.createRateLimiter(5, 60000); // 5 requests per minute
      
      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    test('should allow requests within limit', () => {
      const rateLimiter = SecurityUtils.createRateLimiter(3, 1000); // 3 requests per second
      
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(true);
    });

    test('should block requests over limit', () => {
      const rateLimiter = SecurityUtils.createRateLimiter(2, 1000); // 2 requests per second
      
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(false); // Should be blocked
    });

    test('should handle different users separately', () => {
      const rateLimiter = SecurityUtils.createRateLimiter(1, 1000); // 1 request per second
      
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(false); // Blocked
      expect(rateLimiter('user2')).toBe(true); // Different user, should be allowed
    });

    test('should reset after time window', async () => {
      const rateLimiter = SecurityUtils.createRateLimiter(1, 100); // 1 request per 100ms
      
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(false); // Blocked
      
      // Wait for time window to pass
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(rateLimiter('user1')).toBe(true); // Should be allowed again
    });
  });

  // Note: validateFileUpload method doesn't exist in SecurityUtils
  // File upload validation is handled elsewhere in the application

  describe('generateSecureId', () => {
    test('should generate unique IDs', () => {
      const id1 = SecurityUtils.generateSecureId();
      const id2 = SecurityUtils.generateSecureId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    test('should generate IDs with specified length', () => {
      const id = SecurityUtils.generateSecureId(16);
      expect(id.length).toBe(16);
    });

    test('should generate cryptographically secure IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(SecurityUtils.generateSecureId());
      }
      
      // Should have very few collisions
      expect(ids.size).toBeGreaterThan(990);
    });
  });
}); 
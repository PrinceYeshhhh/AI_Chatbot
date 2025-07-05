import { AppError } from '../types';

/**
 * Security utilities for input validation, sanitization, and API key protection
 */
export class SecurityUtils {
  private static readonly API_KEY_PREFIX = 'sk-';
  private static readonly MIN_API_KEY_LENGTH = 20;
  private static readonly MAX_INPUT_LENGTH = 4000;
  private static readonly MAX_TRAINING_INPUT_LENGTH = 1000;

  /**
   * Sanitize user input to prevent XSS attacks
   * @param input - Raw user input
   * @returns Sanitized input
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      throw new AppError({
        code: 'INVALID_INPUT_TYPE',
        message: 'Input must be a string',
        timestamp: new Date()
      });
    }

    // Remove potentially dangerous HTML tags and attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Validate API key format and security
   * @param key - API key to validate
   * @returns True if valid, false otherwise
   */
  static validateApiKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }

    return (
      key.startsWith(this.API_KEY_PREFIX) &&
      key.length >= this.MIN_API_KEY_LENGTH &&
      /^[a-zA-Z0-9\-_]+$/.test(key.slice(this.API_KEY_PREFIX.length))
    );
  }

  /**
   * Mask API key for logging (shows only first 8 and last 4 characters)
   * @param key - API key to mask
   * @returns Masked API key
   */
  static maskApiKey(key: string): string {
    if (!key) return '';
    if (!key.startsWith(this.API_KEY_PREFIX) || key.length < 12) return key;
    // Show first 6 characters after sk- prefix and last 4 characters
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  /**
   * Validate message content
   * @param content - Message content to validate
   * @returns Validation result
   */
  static validateMessageContent(content: string): { isValid: boolean; error?: string } {
    if (!content || typeof content !== 'string') {
      return { isValid: false, error: 'Message content is required and must be a string' };
    }

    if (content.length > this.MAX_INPUT_LENGTH) {
      return { 
        isValid: false, 
        error: `Message content must be ${this.MAX_INPUT_LENGTH} characters or less` 
      };
    }

    if (content.trim().length === 0) {
      return { isValid: false, error: 'Message content cannot be empty' };
    }

    return { isValid: true };
  }

  /**
   * Validate training data input
   * @param input - Training input to validate
   * @param expectedOutput - Expected output to validate
   * @param intent - Intent to validate
   * @returns Validation result
   */
  static validateTrainingData(
    input: string, 
    expectedOutput: string, 
    intent: string
  ): { isValid: boolean; error: string | null } {
    // Validate input
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Training input is required and must be a string' };
    }
    if (input.length > this.MAX_TRAINING_INPUT_LENGTH) {
      return { 
        isValid: false, 
        error: `Training input must be ${this.MAX_TRAINING_INPUT_LENGTH} characters or less` 
      };
    }
    if (this.containsMaliciousContent(input)) {
      return { isValid: false, error: 'Input contains potentially dangerous content' };
    }
    // Validate expected output
    if (!expectedOutput || typeof expectedOutput !== 'string') {
      return { isValid: false, error: 'Expected output is required and must be a string' };
    }
    if (expectedOutput.length > this.MAX_INPUT_LENGTH) {
      return { 
        isValid: false, 
        error: `Expected output must be ${this.MAX_INPUT_LENGTH} characters or less` 
      };
    }
    if (this.containsMaliciousContent(expectedOutput)) {
      return { isValid: false, error: 'Expected output contains potentially dangerous content' };
    }
    // Validate intent
    if (!intent || typeof intent !== 'string') {
      return { isValid: false, error: 'Intent is required and must be a string' };
    }
    if (intent.length > 100) {
      return { isValid: false, error: 'Intent must be 100 characters or less' };
    }
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(intent)) {
      return { isValid: false, error: 'Intent can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate conversation history
   * @param history - Conversation history to validate
   * @returns Validation result
   */
  static validateConversationHistory(history: unknown[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(history)) {
      return { isValid: false, error: 'Conversation history must be an array' };
    }

    if (history.length > 100) {
      return { isValid: false, error: 'Conversation history cannot exceed 100 messages' };
    }

    for (let i = 0; i < history.length; i++) {
      const message = history[i];
      if (!message || typeof message !== 'object') {
        return { isValid: false, error: `Invalid message at index ${i}` };
      }

      const msg = message as Record<string, unknown>;
      if (!msg.content || typeof msg.content !== 'string') {
        return { isValid: false, error: `Message at index ${i} must have a valid content string` };
      }

      if (!msg.sender || !['user', 'bot'].includes(msg.sender as string)) {
        return { isValid: false, error: `Message at index ${i} must have a valid sender (user or bot)` };
      }
    }

    return { isValid: true };
  }

  /**
   * Generate a secure random ID
   * @param length - Length of the ID (default: 16)
   * @returns Secure random ID
   */
  static generateSecureId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Use crypto.getRandomValues for better security
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback to Math.random (less secure but available everywhere)
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Hash a string for caching purposes
   * @param str - String to hash
   * @returns Hash of the string
   */
  static hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if a string contains potentially malicious content
   * @param content - Content to check
   * @returns True if potentially malicious
   */
  static containsMaliciousContent(content: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Rate limiting utility
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limited
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true; // Allowed
    };
  }

  /**
   * Validate URL for security
   * @param url - URL to validate
   * @returns True if valid and secure
   */
  static validateSecureUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}

// Export commonly used functions for easy access
export const sanitizeInput = SecurityUtils.sanitizeInput.bind(SecurityUtils);
export const validateApiKey = SecurityUtils.validateApiKey.bind(SecurityUtils);
export const maskApiKey = SecurityUtils.maskApiKey.bind(SecurityUtils);
export const validateMessageContent = SecurityUtils.validateMessageContent.bind(SecurityUtils);
export const generateSecureId = SecurityUtils.generateSecureId.bind(SecurityUtils); 
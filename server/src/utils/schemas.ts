import { Response } from 'express';

export function validateEnv() {
  const requiredEnvVars = [
    'GROQ_API_KEY',
    'TOGETHER_API_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'CLERK_SECRET_KEY',
    'NEON_HOST',
    'NEON_DATABASE',
    'NEON_USER',
    'NEON_PASSWORD',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }

  // Validate JWT_SECRET length
  if (process.env['JWT_SECRET'] && process.env['JWT_SECRET'].length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate Groq API key format
  if (process.env['GROQ_API_KEY'] && !process.env['GROQ_API_KEY'].startsWith('gsk_')) {
    throw new Error('GROQ_API_KEY must start with "gsk_"');
  }

  console.log('✅ Environment validation passed');
  return true;
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '') // Remove event handlers with quoted values
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '') // Remove event handlers with unquoted values
    .replace(/on\w+\s*=\s*[^>]*$/gi, '') // Remove event handlers at end of string
    .replace(/on\w+\s*=\s*[^>]*/gi, '') // Remove any remaining event handlers
    .replace(/on\w+\s*=\s*[^>]*/gi, '') // Remove any remaining event handlers
    .replace(/on\w+\s*=\s*[^>]*/gi, '') // Remove any remaining event handlers
    .replace(/on\w+\s*=\s*[^>]*/gi, '') // Remove any remaining event handlers
    .trim();
}

export function successResponse(res: Response, data: any, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    data
  });
}

export function errorResponse(res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({
    success: false,
    error: message
  });
} 
import { Response } from 'express';

export function validateEnv() {
  // Add your environment validation logic here, or leave as a stub
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
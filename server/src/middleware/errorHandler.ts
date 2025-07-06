import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.'
    });
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
  }
} 
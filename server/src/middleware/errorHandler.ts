import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Map known error messages to user-friendly codes and hints
const errorMap: Record<string, { code: string; message: string; hint?: string; status?: number }> = {
  'LIMIT_FILE_SIZE': {
    code: 'file_too_large',
    message: 'File too large. Max size: 25MB',
    hint: 'Please upload a smaller file.',
    status: 413
  },
  'INVALID_FILE_TYPE': {
    code: 'invalid_file_type',
    message: 'This file format is not supported (PDF, DOCX, TXT allowed).',
    hint: 'Please upload a supported file type.',
    status: 415
  },
  // Add more mappings as needed
};

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  const isProduction = process.env.NODE_ENV === 'production';
  let status = err.status || err.statusCode || 500;
  let code = err.code || 'internal_error';
  let message = 'Something went wrong. Please try again later.';
  let hint: string | undefined = undefined;

  // Map known error codes/messages
  if (err.code && errorMap[err.code]) {
    code = errorMap[err.code].code;
    message = errorMap[err.code].message;
    hint = errorMap[err.code].hint;
    status = errorMap[err.code].status || status;
  } else if (err.message && errorMap[err.message]) {
    code = errorMap[err.message].code;
    message = errorMap[err.message].message;
    hint = errorMap[err.message].hint;
    status = errorMap[err.message].status || status;
  } else if (!isProduction && err.message) {
    // In dev, show the real error message
    message = err.message;
  }

  // Never leak stack traces or internal details in production
  const response: any = { message, code };
  if (hint) response.hint = hint;
  if (!isProduction && err.stack) response.stack = err.stack;

  res.status(status).json(response);
} 
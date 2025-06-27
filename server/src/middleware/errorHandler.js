import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: `File size exceeds the maximum limit of ${process.env.MAX_FILE_SIZE || '50MB'}`
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Too many files',
      message: `Maximum ${process.env.MAX_FILES_PER_REQUEST || 10} files allowed per request`
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      message: 'File upload field name is incorrect'
    });
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // OpenAI API errors
  if (err.message && err.message.includes('OpenAI')) {
    return res.status(502).json({
      error: 'AI service error',
      message: 'Failed to communicate with AI service',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // ChromaDB errors
  if (err.message && err.message.includes('Chroma')) {
    return res.status(503).json({
      error: 'Vector database error',
      message: 'Failed to access vector database',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    message: statusCode === 500 ? 'An unexpected error occurred' : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message
    })
  });
};
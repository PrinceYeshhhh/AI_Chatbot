import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../utils/schemas';

export function validateChatRequest(req: Request, res: Response, next: NextFunction): void {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required and must be a non-empty string' });
    return;
  }
  
  if (message.length > 10000) {
    res.status(400).json({ error: 'Message too long (max 10000 characters)' });
    return;
  }
  
  // Sanitize the message
  req.body.message = sanitizeInput(message);
  next();
}



export function validateTrainingData(req: Request, res: Response, next: NextFunction): void {
  const { input, expectedOutput, intent } = req.body;
  
  if (!input || typeof input !== 'string') {
    res.status(400).json({ error: 'Input is required and must be a string' });
    return;
  }
  
  if (!expectedOutput || typeof expectedOutput !== 'string') {
    res.status(400).json({ error: 'Expected output is required and must be a string' });
    return;
  }
  
  if (!intent || typeof intent !== 'string') {
    res.status(400).json({ error: 'Intent is required and must be a string' });
    return;
  }
  
  if (input.length > 5000) {
    res.status(400).json({ error: 'Input too long (max 5000 characters)' });
    return;
  }
  
  if (expectedOutput.length > 5000) {
    res.status(400).json({ error: 'Expected output too long (max 5000 characters)' });
    return;
  }
  
  // Sanitize inputs
  req.body.input = sanitizeInput(input);
  req.body.expectedOutput = sanitizeInput(expectedOutput);
  req.body.intent = sanitizeInput(intent);
  next();
} 
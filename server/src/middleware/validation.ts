import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import xss from 'xss';

// Chat message validation
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  mode: z.string().optional(),
  fileFilter: z.array(z.string()).optional(),
  workspace_id: z.string().optional()
});

export function validateChatRequest(req: Request, res: Response, next: NextFunction) {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid chat input', details: result.error.errors });
  }
  // Sanitize all string fields in body
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = xss(req.body[key]);
    }
  }
  next();
}

export function validateBody(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.errors });
      return;
    }
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
    next();
  };
}

// File upload validation
const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv', '.xlsx', '.png', '.jpg', '.jpeg'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const { originalname, size, mimetype } = req.file;
  const ext = originalname.slice(originalname.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({ error: `Unsupported file type: ${ext}` });
  }
  if (size > maxFileSize) {
    return res.status(400).json({ error: `File size exceeds limit (${maxFileSize / (1024 * 1024)}MB)` });
  }
  // Optionally, check mimetype here as well
  next();
}

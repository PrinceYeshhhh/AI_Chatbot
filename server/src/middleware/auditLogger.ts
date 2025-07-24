import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function auditLogger(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || 'anonymous';
    logger.info({
      userId,
      action,
      resource: req.originalUrl,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }, 'API request');
    next();
  };
} 
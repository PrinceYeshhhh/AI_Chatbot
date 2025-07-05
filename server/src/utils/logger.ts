import { Request, Response, NextFunction } from 'express';

// Simple logger implementation
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
  }
};

// Simple async wrapper for Express handlers
export function wrapAsync(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
} 
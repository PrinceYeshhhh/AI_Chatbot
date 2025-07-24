import { Request, Response, NextFunction } from 'express';

// Endpoint-specific rate limits
const RATE_LIMITS = {
  chat: { windowMs: 60 * 1000, maxIp: 100, maxUser: 20 }, // 100/min/IP, 20/min/user
  upload: { windowMs: 60 * 60 * 1000, maxIp: 10, maxUser: 5 }, // 10/hour/IP, 5/hour/user
};

const memory: Record<string, { count: number; lastReset: number }> = {};

function getKey(type: 'ip' | 'user', req: Request, endpoint: string) {
  if (type === 'ip') return `ip:${req.ip}:${endpoint}`;
  const userId = (req as any).user?.id || req.headers['x-user-id'] || 'anonymous';
  return `user:${userId}:${endpoint}`;
}

export function chatRateLimiter(req: Request, res: Response, next: NextFunction) {
  const endpoint = '/chat';
  const now = Date.now();
  // Per-IP
  const ipKey = getKey('ip', req, endpoint);
  const ipLimit = RATE_LIMITS.chat;
  if (!memory[ipKey] || now - memory[ipKey].lastReset > ipLimit.windowMs) {
    memory[ipKey] = { count: 1, lastReset: now };
  } else {
    memory[ipKey].count++;
  }
  if (memory[ipKey].count > ipLimit.maxIp) {
    return res.status(429).json({ error: 'Too many chat requests from this IP. Please slow down.' });
  }
  // Per-user
  const userKey = getKey('user', req, endpoint);
  if (!memory[userKey] || now - memory[userKey].lastReset > ipLimit.windowMs) {
    memory[userKey] = { count: 1, lastReset: now };
  } else {
    memory[userKey].count++;
  }
  if (memory[userKey].count > ipLimit.maxUser) {
    return res.status(429).json({ error: 'Too many chat requests for this user. Please slow down.' });
  }
  next();
}

export function uploadRateLimiter(req: Request, res: Response, next: NextFunction) {
  const endpoint = '/file/upload';
  const now = Date.now();
  // Per-IP
  const ipKey = getKey('ip', req, endpoint);
  const ipLimit = RATE_LIMITS.upload;
  if (!memory[ipKey] || now - memory[ipKey].lastReset > ipLimit.windowMs) {
    memory[ipKey] = { count: 1, lastReset: now };
  } else {
    memory[ipKey].count++;
  }
  if (memory[ipKey].count > ipLimit.maxIp) {
    return res.status(429).json({ error: 'Too many uploads from this IP. Please slow down.' });
  }
  // Per-user
  const userKey = getKey('user', req, endpoint);
  if (!memory[userKey] || now - memory[userKey].lastReset > ipLimit.windowMs) {
    memory[userKey] = { count: 1, lastReset: now };
  } else {
    memory[userKey].count++;
  }
  if (memory[userKey].count > ipLimit.maxUser) {
    return res.status(429).json({ error: 'Too many uploads for this user. Please slow down.' });
  }
  next();
}

// Legacy fallback for generic endpoints
export async function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  // Default: use chat limits for /chat endpoints, upload for /file/upload
  if (req.path.startsWith('/chat')) return chatRateLimiter(req, res, next);
  if (req.path.startsWith('/file/upload')) return uploadRateLimiter(req, res, next);
  next();
} 
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '../types/jwt';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only-change-in-production';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET not set in environment variables');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET || JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({ error: 'JWT secret not configured' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
} 
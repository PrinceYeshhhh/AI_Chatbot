import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '../jwt';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Type for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

// Type for async Express handlers
export type AsyncRequestHandler = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Type for sync Express handlers
export type SyncRequestHandler = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void;

// Union type for all Express handlers
export type RequestHandler = AsyncRequestHandler | SyncRequestHandler; 
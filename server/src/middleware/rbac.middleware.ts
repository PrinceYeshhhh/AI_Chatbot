import { Request, Response, NextFunction } from 'express';

export function rbacMiddleware(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    if (!user || user.role !== requiredRole) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
} 
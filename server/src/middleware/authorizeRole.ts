import { Request, Response, NextFunction } from 'express';

export function authorizeRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (typeof role !== 'string' || !requiredRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
} 
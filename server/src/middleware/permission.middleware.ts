import { Request, Response, NextFunction } from 'express';

export function permissionMiddleware(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    if (!user || !user.permissions || !user.permissions.includes(requiredPermission)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
} 
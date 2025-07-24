import { Request, Response, NextFunction } from 'express';

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'admin': ['read', 'write', 'delete', 'analytics', 'user_management', 'manage_training', 'manage_models'],
  'user': ['read', 'write'],
  'moderator': ['read', 'write', 'moderate']
};

export function permissionMiddleware(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: user not authenticated' });
      return;
    }

    // Check if user has the required role-based permissions
    const userRole = user.role || 'user';
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      res.status(403).json({ 
        error: 'Forbidden: insufficient permissions',
        required: requiredPermission,
        userRole: userRole,
        userPermissions: userPermissions
      });
      return;
    }
    
    next();
  };
} 
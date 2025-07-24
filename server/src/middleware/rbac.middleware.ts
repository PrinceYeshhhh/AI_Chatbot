import { Request, Response, NextFunction } from 'express';

// Role-based access control middleware
export function rbacMiddleware(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: user not authenticated' });
      return;
    }

    if (user.role !== requiredRole) {
      res.status(403).json({ 
        error: 'Forbidden: insufficient role',
        required: requiredRole,
        userRole: user.role
      });
      return;
    }
    
    next();
  };
}

export async function requireOrgRole(requiredRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const orgId = req.headers['x-org-id'] as string;
    if (!userId || !orgId) return res.status(401).json({ error: 'Missing user or org context' });
    // This function is currently a placeholder and would require actual org role logic
    // For now, it will always return true if userId and orgId are present
    // In a real scenario, you would query the database to check the user's role in the organization
    next(); 
  };
}

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Missing user context' });
  // This function is currently a placeholder and would require actual subscription logic
  // For now, it will always return true if userId is present
  // In a real scenario, you would query the database to check the user's subscription status
  next();
}

export function requireWorkspaceRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const workspaceId = req.body.workspaceId || req.query.workspaceId || req.params.workspaceId || req.headers['x-workspace-id'];
    if (!userId || !workspaceId) {
      return res.status(403).json({ error: 'Missing user or workspace context' });
    }
    // This function is currently a placeholder and would require actual workspace role logic
    // For now, it will always return true if userId and workspaceId are present
    // In a real scenario, you would query the database to check the user's role in the workspace
    next();
  };
} 
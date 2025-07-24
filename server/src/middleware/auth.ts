import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role?: string
      }
    }
  }
}

// Initialize Clerk for JWT verification
const clerkSecretKey = process.env['CLERK_SECRET_KEY']

if (!clerkSecretKey) {
  throw new Error('Missing Clerk environment variables')
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      })
      return;
    }

    // Verify the JWT token using JWT
    const payload = jwt.verify(token, clerkSecretKey) as any

    if (!payload) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      })
      return;
    }

    // Add user info to request object
    req.user = {
      id: payload.sub || '',
      email: payload.email || '',
      role: payload.metadata?.role || 'user'
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    })
    return;
  }
}

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const payload = jwt.verify(token, clerkSecretKey) as any
      
      if (payload) {
        req.user = {
          id: payload.sub || '',
          email: payload.email || '',
          role: payload.metadata?.role || 'user'
        }
      }
    }

    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    next()
  }
}

// Role-based access control middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      })
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      })
      return;
    }

    next()
  }
}

// Admin-only middleware
export const requireAdmin = requireRole('admin')

// User or admin middleware
export const requireUserOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    })
    return;
  }

  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    res.status(403).json({ 
      error: 'Insufficient permissions',
      message: 'You do not have permission to access this resource'
    })
    return;
  }

  next()
} 

// Middleware to check if user is a member of the workspace and has required role
export function checkWorkspaceAccess(requiredRole: 'admin' | 'editor' | 'viewer' = 'viewer') {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    const workspaceId = ((req.headers as any)?.['x-workspace-id'] || (req.body as any)?.['workspace_id'] || (req.query as any)?.['workspace_id'] || '') as string;
    if (!userId || !workspaceId) {
      res.status(403).json({ error: 'Workspace and user required' });
      return;
    }
    // For now, assume user has access - implement proper workspace membership check later
    // TODO: Implement workspace membership verification with Neon database
    const userObj = (req as any).user || {};
    const userRole = userObj.role || 'viewer';
    // Role hierarchy: admin > editor > viewer
    const roleOrder: { [key: string]: number } = { admin: 3, editor: 2, viewer: 1 };
    if (roleOrder[userRole] < roleOrder[requiredRole]) {
      res.status(403).json({ error: 'Insufficient role' });
      return;
    }
    (req as any).workspaceRole = userRole;
    (req as any).workspaceId = workspaceId;
    next();
  };
}

// Middleware to check for a specific role (e.g., admin only)
export function checkRole(role: 'admin' | 'editor' | 'viewer') {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).workspaceRole !== role) {
      res.status(403).json({ error: 'Insufficient role' });
      return;
    }
    next();
  };
} 
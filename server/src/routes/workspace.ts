import express, { Request, Response, RequestHandler } from 'express';
import { checkWorkspaceAccess } from '../middleware/auth';
import { NeonDatabaseService } from '../services/neonDatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import xss from 'xss';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const dbService = new NeonDatabaseService();

const adminAccess = checkWorkspaceAccess('admin');

// Zod schemas for validation
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255)
});
const workspaceIdParamSchema = z.object({
  workspaceId: z.string().uuid()
});
const inviteMemberSchema = z.object({
  user_id: z.string().min(1).max(255),
  role: z.string().min(1).max(50)
});
const changeRoleSchema = z.object({
  user_id: z.string().min(1).max(255),
  role: z.string().min(1).max(50)
});
const removeMemberParamSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().min(1).max(255)
});

function validateBody(schema: z.ZodSchema<any>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.errors });
      return;
    }
    // Sanitize all string fields in body
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
    next();
  };
}
function validateParams(schema: z.ZodSchema<any>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid params', details: result.error.errors });
      return;
    }
    // Sanitize all string fields in params
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = xss(req.params[key]);
      }
    }
    next();
  };
}

// Create a new workspace
router.post('/create', authMiddleware, validateBody(createWorkspaceSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { name } = req.body;
    if (!userId || !name) {
      res.status(400).json({ error: 'Name required' });
      return;
    }
    // Create workspace table if not exists
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspaces (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, owner_id VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspace_members (workspace_id VARCHAR(255), user_id VARCHAR(255), role VARCHAR(50), joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (workspace_id, user_id))`);
    const wsId = uuidv4();
    await dbService.query(`INSERT INTO workspaces (id, name, owner_id) VALUES ($1, $2, $3)`, [wsId, name, userId]);
    await dbService.query(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)`, [wsId, userId, 'admin']);
    const ws = { id: wsId, name, owner_id: userId, created_at: new Date().toISOString() };
    res.json({ workspace: ws });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List workspaces for user
router.get('/my', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspaces (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, owner_id VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspace_members (workspace_id VARCHAR(255), user_id VARCHAR(255), role VARCHAR(50), joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (workspace_id, user_id))`);
    const result = await dbService.query(`SELECT w.id, w.name, w.owner_id, w.created_at FROM workspaces w INNER JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = $1`, [userId]);
    res.json({ workspaces: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List members in a workspace
router.get('/:workspaceId/members', authMiddleware, validateParams(workspaceIdParamSchema), adminAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspace_members (workspace_id VARCHAR(255), user_id VARCHAR(255), role VARCHAR(50), joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (workspace_id, user_id))`);
    const result = await dbService.query(`SELECT user_id, role, joined_at FROM workspace_members WHERE workspace_id = $1`, [workspaceId]);
    res.json({ members: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite member (admin only)
router.post('/:workspaceId/invite', authMiddleware, validateParams(workspaceIdParamSchema), adminAccess, validateBody(inviteMemberSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { user_id, role } = req.body;
    if (!user_id || !role) {
      res.status(400).json({ error: 'User and role required' });
      return;
    }
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspace_members (workspace_id VARCHAR(255), user_id VARCHAR(255), role VARCHAR(50), joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (workspace_id, user_id))`);
    await dbService.query(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = $3`, [workspaceId, user_id, role]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change member role (admin only)
router.post('/:workspaceId/role', authMiddleware, validateParams(workspaceIdParamSchema), adminAccess, validateBody(changeRoleSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { user_id, role } = req.body;
    if (!user_id || !role) {
      res.status(400).json({ error: 'User and role required' });
      return;
    }
    await dbService.query(`UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3`, [role, workspaceId, user_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member (admin only)
router.delete('/:workspaceId/member/:userId', authMiddleware, validateParams(removeMemberParamSchema), adminAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, userId } = req.params;
    await dbService.query(`DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`, [workspaceId, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 
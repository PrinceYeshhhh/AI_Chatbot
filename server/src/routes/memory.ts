import express, { Request, Response } from 'express';
import { getUserLongTermMemory, saveLongTermMemory, updateLongTermMemory, deleteLongTermMemory } from '../llm/memory/userMemory';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkWorkspaceAccess } from '../middleware/auth';
import { z } from 'zod';
import xss from 'xss';

const router = express.Router();

const memorySchema = z.object({
  type: z.string().min(1).max(50),
  content: z.string().min(1).max(2000),
  workspace_id: z.string().optional()
});
function validateBody(schema: z.ZodSchema<any>) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.errors });
      return;
    }
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
    next();
  };
}

// Get all long-term memory for user
router.get('/', authMiddleware, checkWorkspaceAccess('viewer'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const workspaceId = String((req as any).workspaceId || req.query.workspace_id);
    if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
    const memories = await getUserLongTermMemory(userId, workspaceId);
    res.json({ memories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save new memory
router.post('/', validateBody(memorySchema), authMiddleware, checkWorkspaceAccess('editor'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const workspaceId = String((req as any).workspaceId || req.body.workspace_id);
    if (!workspaceId) return res.status(400).json({ error: 'Workspace required' });
    const { type, content } = req.body;
    const memory = await saveLongTermMemory(userId, type, content, workspaceId);
    res.json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update memory
router.put('/:id', validateBody(memorySchema), authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { type, content } = req.body;
    const memory = await updateLongTermMemory(userId, id, type, content);
    res.json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete memory
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    await deleteLongTermMemory(userId, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 
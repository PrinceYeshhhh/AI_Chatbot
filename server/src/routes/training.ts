import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { permissionMiddleware } from '../middleware/permission.middleware';
import { validateTrainingData } from '../middleware/validation';
import { z } from 'zod';
import xss from 'xss';

// Extend Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// Mock training data storage
let trainingData: any[] = [];
let trainingDataId = 1;

const router = express.Router();

const bulkDataSchema = z.object({
  data: z.array(z.object({
    input: z.string().min(1),
    expectedOutput: z.string().min(1),
    intent: z.string().min(1)
  }))
});
const fineTuneSchema = z.object({
  // Add fields as needed for fine-tune jobs
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

// Get all training data
router.get('/data', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const paginatedData = trainingData.slice(offset, offset + Number(limit));
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: trainingData.length,
        totalPages: Math.ceil(trainingData.length / Number(limit))
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get training data' });
  }
});

// Add training data
router.post('/data', authMiddleware, validateTrainingData, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { input, expectedOutput, intent } = req.body;
    
    const newData = {
      id: trainingDataId++,
      input,
      expectedOutput,
      intent,
      createdAt: new Date().toISOString(),
      userId: req.user?.id || 'unknown'
    };
    
    trainingData.push(newData);
    
    res.json({ success: true, message: 'Training data added successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to add training data' });
  }
});

// Bulk add training data
router.post('/data/bulk', validateBody(bulkDataSchema), authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      res.status(400).json({ success: false, error: 'Data must be an array' });
      return;
    }
    
    const results = data.map((item: any) => {
      try {
        if (!item.input || !item.expectedOutput || !item.intent) {
          return { success: false, error: 'Missing required fields' };
        }
        
        const newData = {
          id: trainingDataId++,
          input: item.input,
          expectedOutput: item.expectedOutput,
          intent: item.intent,
          createdAt: new Date().toISOString(),
          userId: req.user?.id || 'unknown'
        };
        
        trainingData.push(newData);
        return { success: true, id: newData.id };
      } catch (error) {
        return { success: false, error: 'Invalid data format' };
      }
    });
    
    res.json({
      success: true,
      message: 'Bulk training data processed',
      results,
      total: data.length,
      successful: results.filter(r => r.success).length
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to add training data' });
  }
});

// Delete training data
router.delete('/data/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ success: false, error: 'Data ID is required' });
      return;
    }
    
    const dataId = parseInt(id);
    
    if (isNaN(dataId)) {
      res.status(400).json({ success: false, error: 'Invalid data ID' });
      return;
    }
    
    const index = trainingData.findIndex(item => item.id === dataId);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Training data not found' });
      return;
    }
    
    trainingData.splice(index, 1);
    
    res.json({ success: true, message: 'Training data deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to delete training data' });
  }
});

// Get training statistics
router.get('/stats', authMiddleware, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = {
      total: trainingData.length,
      byIntent: trainingData.reduce((acc: any, item) => {
        acc[item.intent] = (acc[item.intent] || 0) + 1;
        return acc;
      }, {}),
      recent: trainingData.slice(-5)
    };
    
    res.json({ success: true, ...stats });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get training statistics' });
  }
});

// Export training data
router.get('/export', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { format = 'json' } = req.query;
    
    if (format === 'csv') {
      const csv = trainingData.map(item => 
        `${item.input},${item.expectedOutput},${item.intent}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=training-data.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=training-data.json');
      res.json(trainingData);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to export training data' });
  }
});

// Clear all training data
router.delete('/clear', authMiddleware, permissionMiddleware('manage_training'), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    trainingData = [];
    trainingDataId = 1;
    
    res.json({ success: true, message: 'All training data cleared successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to clear training data' });
  }
});

// Fine-tuning endpoints (stubs)
router.post('/fine-tune', validateBody(fineTuneSchema), authMiddleware, permissionMiddleware('manage_models'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Stub implementation
    res.json({ 
      success: true,
      message: 'Fine-tuning job started',
      jobId: 'ft-job-' + Date.now()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to start fine-tuning' });
  }
});

router.get('/fine-tune/jobs', authMiddleware, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Stub implementation
    res.json({ success: true, jobs: [] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get fine-tuning jobs' });
  }
});

router.get('/fine-tune/jobs/:jobId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      res.status(400).json({ success: false, error: 'Job ID is required' });
      return;
    }
    
    // Stub implementation
    res.json({ 
      success: true,
      jobId,
      status: 'completed',
      progress: 100
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage || 'Failed to get fine-tuning job status' });
  }
});

export default router; 
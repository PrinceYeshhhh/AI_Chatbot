import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateChatRequest } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';

// Extend Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

const router = express.Router();

// Development endpoint (no auth required)
router.post('/dev', validateChatRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;

    // Mock AI response
    const aiResponse = `Development response to: "${message}"`;
    
    // Log the interaction
    logger.info(`Dev chat interaction - Message: ${message}`);

    successResponse(res, {
      response: aiResponse,
      timestamp: new Date().toISOString(),
      userId: 'dev-user'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Dev chat error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to process chat message');
  }
});

// Chat endpoint
router.post('/', authMiddleware, validateChatRequest, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || 'unknown';

    // Mock AI response
    const aiResponse = `Mock response to: "${message}"`;
    
    // Log the interaction
    logger.info(`Chat interaction - User: ${userId}, Message: ${message}`);

    successResponse(res, {
      response: aiResponse,
      timestamp: new Date().toISOString(),
      userId
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Chat error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to process chat message');
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'unknown';
    const { limit = 50, offset = 0 } = req.query;

    // Mock chat history
    const history = [
      {
        id: 1,
        message: 'Hello',
        response: 'Hi there!',
        timestamp: new Date().toISOString(),
        userId
      }
    ];

    successResponse(res, {
      history: history.slice(Number(offset), Number(offset) + Number(limit)),
      total: history.length,
      hasMore: history.length > Number(offset) + Number(limit)
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting chat history:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get chat history');
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'unknown';
    
    // Mock clearing history
    logger.info(`Clearing chat history for user: ${userId}`);

    successResponse(res, { message: 'Chat history cleared successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error clearing chat history:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to clear chat history');
  }
});

export default router; 
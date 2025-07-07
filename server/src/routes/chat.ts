import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateChatRequest } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';
import { smartBrainService } from '../services/smartBrainService';
import { vectorService } from '../services/vectorService';

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

// Smart Brain Chat endpoint with streaming
router.post('/smart', authMiddleware, validateChatRequest, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, sessionId, mode, fileFilter } = req.body;
    const userId = req.user?.id || 'unknown';

    if (!message) {
      errorResponse(res, 'Message is required');
      return;
    }

    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${userId}_${Date.now()}`;

    try {
      // Process message with Smart Brain
      const brainResponse = await smartBrainService.processMessage(
        message,
        userId,
        finalSessionId,
        {
          mode: mode || 'auto',
          fileFilter: fileFilter || undefined,
          includeHistory: true
        }
      );

      // Send streaming response
      res.write(`data: ${JSON.stringify({
        type: 'response',
        content: brainResponse.response,
        context: brainResponse.context,
        metadata: brainResponse.metadata
      })}\n\n`);

      // Send completion signal
      res.write('data: [DONE]\n\n');
      res.end();

      // Log the interaction
      logger.info(`Smart Brain chat - User: ${userId}, Mode: ${brainResponse.context.mode}, Documents: ${brainResponse.context.retrievedDocuments.length}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Smart Brain processing error:', errorMessage);
      
      res.write(`data: ${JSON.stringify({
        type: 'error',
        content: 'I apologize, but I encountered an issue processing your request. Please try again.',
        error: errorMessage
      })}\n\n`);
      
      res.write('data: [DONE]\n\n');
      res.end();
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Smart Brain chat error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to process chat message');
  }
});

// Chat endpoint with Smart Brain integration
router.post('/', authMiddleware, validateChatRequest, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, sessionId, mode, fileFilter } = req.body;
    const userId = req.user?.id || 'unknown';

    if (!message) {
      errorResponse(res, 'Message is required');
      return;
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${userId}_${Date.now()}`;

    // Process message with Smart Brain
    const brainResponse = await smartBrainService.processMessage(
      message,
      userId,
      finalSessionId,
      {
        mode: mode || 'auto',
        fileFilter: fileFilter || undefined,
        includeHistory: true
      }
    );

    // Log the interaction
    logger.info(`Smart Brain chat - User: ${userId}, Mode: ${brainResponse.context.mode}, Documents: ${brainResponse.context.retrievedDocuments.length}`);

    successResponse(res, {
      response: brainResponse.response,
      context: brainResponse.context,
      metadata: brainResponse.metadata,
      sessionId: finalSessionId,
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
    const { limit = 50, offset = 0, sessionId } = req.query;

    if (sessionId) {
      // Get session-specific history
      const stats = smartBrainService.getSessionStats(sessionId as string);
      
      successResponse(res, {
        sessionStats: stats,
        sessionId: sessionId as string
      });
    } else {
      // Mock chat history for now
      const history = [
        {
          id: 1,
          message: 'Hello',
          response: 'Hi there! How can I help you today?',
          timestamp: new Date().toISOString(),
          userId
        }
      ];

      successResponse(res, {
        history: history.slice(Number(offset), Number(offset) + Number(limit)),
        total: history.length,
        hasMore: history.length > Number(offset) + Number(limit)
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting chat history:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get chat history');
  }
});

// Get Smart Brain status and capabilities
router.get('/brain-status', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const healthStatus = smartBrainService.getHealthStatus();
    const vectorStats = await vectorService.getStats();

    successResponse(res, {
      smartBrain: healthStatus,
      vectorStore: vectorStats,
      capabilities: {
        documentProcessing: true,
        ragEnabled: healthStatus.vectorStoreAvailable,
        streaming: true,
        multiModal: false, // Future enhancement
        realTimeLearning: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting brain status:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to get brain status');
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'unknown';
    const { sessionId } = req.query;
    
    if (sessionId) {
      smartBrainService.clearSession(sessionId as string);
      logger.info(`Clearing session: ${sessionId} for user: ${userId}`);
    } else {
      // Mock clearing history
      logger.info(`Clearing chat history for user: ${userId}`);
    }

    successResponse(res, { message: 'Chat history cleared successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error clearing chat history:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to clear chat history');
  }
});

export default router; 
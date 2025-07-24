import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateChatRequest, validateBody } from '../middleware/validation';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';
import { smartBrainService } from '../services/smartBrainService';
import { vectorService } from '../services/vectorService';
import { logAnalyticsEvent, logChatMessage, logLLMUsage } from '../utils/analytics';
import { checkWorkspaceAccess } from '../middleware/auth';
import { evaluateResponse } from '../services/responseEvaluationService';
import { analyticsService } from '../services/analyticsService';
import { chatRateLimiter } from '../rateLimiter/rateLimiterMiddleware';
import xss from 'xss';
import { z } from 'zod';

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
router.post('/dev', validateChatRequest, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    // errorResponse(res, errorMessage || 'Failed to process chat message');
    next({ message: errorMessage || 'Failed to process chat message', code: 'chat_dev_error' });
  }
});

// Smart Brain Chat endpoint with streaming
router.post('/smart', chatRateLimiter, authMiddleware, validateChatRequest, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, sessionId, mode, fileFilter } = req.body;
    const userId = req.user?.id || 'unknown';

    if (!message) {
      // errorResponse(res, 'Message is required');
      return next({ message: 'Message is required', code: 'message_required', status: 400 });
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
      // Streaming error: keep as is for SSE, but also log for analytics
      res.write(`data: ${JSON.stringify({
        type: 'error',
        content: 'I apologize, but I encountered an issue processing your request. Please try again.',
        error: errorMessage
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      // Optionally: next({ message: errorMessage, code: 'chat_smart_error' });
      return;
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Smart Brain chat error:', errorMessage);
    // errorResponse(res, errorMessage || 'Failed to process chat message');
    next({ message: errorMessage || 'Failed to process chat message', code: 'chat_smart_error' });
  }
});

// Chat endpoint with Smart Brain integration
router.post('/', chatRateLimiter, authMiddleware, checkWorkspaceAccess('viewer'), validateChatRequest, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // Input is validated by validateChatRequest middleware (see /middleware/validation.ts)
  try {
    const { message, sessionId, mode, fileFilter, workspace_id } = req.body;
    const userId = req.user?.id || 'unknown';
    const workspaceId = (req as any).workspaceId || workspace_id;
    const messageId = `${userId}_${Date.now()}`;
    
    // Log chat message
    await logChatMessage(
      userId,
      messageId,
      message.length,
      true, // isUserMessage
      { sessionId, workspaceId }
    );

    // Log chat message event
    try {
      await analyticsService.logEvent({
        user_id: userId,
        event_type: 'chat_message',
        metadata: {
          message_length: message.length,
          model: 'gpt-4o', // Placeholder, will be updated with actual model
          session_id: sessionId
        },
        session_id: sessionId
      });
    } catch (logError) {
      logger.warn('Failed to log analytics event:', logError);
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${userId}_${Date.now()}`;
    // Process message with Smart Brain (pass workspaceId)
    const start = Date.now();
    const brainResponse = await smartBrainService.processMessage(
      message,
      userId,
      finalSessionId,
      {
        mode: mode || 'auto',
        fileFilter: fileFilter || undefined,
        includeHistory: true,
        workspaceId
      }
    );
    const latency = Date.now() - start;
    // Log LLM usage
    await logLLMUsage(
      userId,
      {
        model: brainResponse.metadata.modelUsed,
        promptTokens: brainResponse.metadata.tokensUsed * 0.7, // Estimate
        completionTokens: brainResponse.metadata.tokensUsed * 0.3, // Estimate
        totalTokens: brainResponse.metadata.tokensUsed,
        costEstimate: 0, // Will be calculated by the function
        responseTime: latency
      },
      {
        messageId,
        sessionId,
        workspaceId,
        mode: mode || 'auto',
        responseLength: brainResponse.response.length
      }
    );
    logger.info(`Smart Brain chat - User: ${userId}, Workspace: ${workspaceId}, Mode: ${brainResponse.context.mode}, Documents: ${brainResponse.context.retrievedDocuments.length}`);

    // --- Smart Auto-Evaluation Layer ---
    const contextChunks = (brainResponse.context.retrievedDocuments || []).map((doc: any) => doc.content);
    let evaluation = null;
    try {
      evaluation = await evaluateResponse({
        userId,
        chatId: workspaceId,
        messageId,
        userQuery: message,
        contextChunks,
        aiResponse: brainResponse.response
      });
    } catch (e) {
      logger.error('Evaluation service failed:', (e as Error).message);
    }
    // --- End Smart Auto-Evaluation Layer ---

    successResponse(res, {
      response: brainResponse.response,
      context: brainResponse.context,
      metadata: brainResponse.metadata,
      sessionId: finalSessionId,
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      evaluation // <-- include evaluation in response for frontend
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Chat error:', errorMessage);
    await logAnalyticsEvent({
      userId: (req as AuthenticatedRequest).user?.id || 'unknown',
      eventType: 'error_occurred',
      metadata: {
        workspace_id: (req as any).workspaceId,
        session_id: (req.body?.sessionId || req.query?.sessionId),
        error_message: errorMessage,
        error_type: 'chat_error',
        stacktrace: (error as any)?.stack
      }
    });
    // errorResponse(res, errorMessage || 'Failed to process chat message');
    next({ message: errorMessage || 'Failed to process chat message', code: 'chat_error' });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    // errorResponse(res, errorMessage || 'Failed to get chat history');
    next({ message: errorMessage || 'Failed to get chat history', code: 'chat_history_error' });
  }
});

// Get Smart Brain status and capabilities
router.get('/brain-status', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    // errorResponse(res, errorMessage || 'Failed to get brain status');
    next({ message: errorMessage || 'Failed to get brain status', code: 'brain_status_error' });
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
    // errorResponse(res, errorMessage || 'Failed to clear chat history');
    next({ message: errorMessage || 'Failed to clear chat history', code: 'chat_history_clear_error' });
  }
});

export default router; 
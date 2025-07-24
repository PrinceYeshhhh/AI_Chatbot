// Agent Tools API Routes
import express from 'express';
import { AgentToolsFramework } from '../agent';
import { logger } from '../utils/logger';
import { z } from 'zod';
import xss from 'xss';

const router = express.Router();

// Initialize the Agent Tools Framework
const agentFramework = new AgentToolsFramework();

const executeSchema = z.object({
  prompt: z.string().min(1).max(2000),
  userId: z.string().min(1).max(255),
  agentId: z.string().min(1).max(255).optional(),
  context: z.any().optional()
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

/**
 * POST /api/agent-tools/execute
 * Execute agent tools based on user prompt
 */
router.post('/execute', validateBody(executeSchema), async (req, res) => {
  try {
    const { prompt, context, agentId, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, userId'
      });
    }

    logger.info(`[AGENT_TOOLS] Processing request for user: ${userId}, agent: ${agentId || 'auto'}`);

    const result = await agentFramework.processRequest(prompt, {
      userId,
      agentId,
      workspaceId: context?.workspaceId,
      sessionId: context?.sessionId,
      userPreferences: context?.userPreferences,
      conversationHistory: context?.conversationHistory
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[AGENT_TOOLS] Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/agent-tools/agents
 * Get all available agents
 */
router.get('/agents', async (req, res) => {
  try {
    const agents = agentFramework.getAvailableAgents();
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('[AGENT_TOOLS] Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/agent-tools/tools
 * Get all available tools
 */
router.get('/tools', async (req, res) => {
  try {
    const tools = agentFramework.getAvailableTools();
    res.json({
      success: true,
      data: tools
    });
  } catch (error) {
    logger.error('[AGENT_TOOLS] Error fetching tools:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/agent-tools/agents/:agentId
 * Get specific agent details
 */
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentFramework.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error('[AGENT_TOOLS] Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/agent-tools/tools/:toolName
 * Get specific tool details
 */
router.get('/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const tool = agentFramework.getTool(toolName);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: 'Tool not found'
      });
    }

    res.json({
      success: true,
      data: tool
    });
  } catch (error) {
    logger.error('[AGENT_TOOLS] Error fetching tool:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/agent-tools/agents/:agentId/execute
 * Execute tools for a specific agent
 */
router.post('/agents/:agentId/execute', validateBody(executeSchema), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { prompt, context, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, userId'
      });
    }

    logger.info(`[AGENT_TOOLS] Processing request for agent: ${agentId}, user: ${userId}`);

    const result = await agentFramework.executeAgent(agentId, prompt, {
      userId,
      workspaceId: context?.workspaceId,
      sessionId: context?.sessionId,
      userPreferences: context?.userPreferences,
      conversationHistory: context?.conversationHistory
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[AGENT_TOOLS] Error executing agent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/agent-tools/stats
 * Get framework statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = agentFramework.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('[AGENT_TOOLS] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 
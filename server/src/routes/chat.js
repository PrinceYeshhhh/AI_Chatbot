import express from 'express';
import { OpenAI } from 'openai';
import { logger, wrapAsync } from '../utils/logger.js';
import { validateChatRequest } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory log for conversations
const conversationLog = [];

// Per-IP rate limiter for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: { error: 'Too many chat requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Throttle repeated requests
const chatSpeedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 10, // allow 10 requests at full speed, then...
  delayMs: 500, // ...add 500ms per request above 10
});

// Load prompt template from env or use default
const PROMPT_TEMPLATE = process.env.PROMPT_TEMPLATE || 'You are a helpful assistant. Answer concisely and clearly.';

/**
 * @openapi
 * /chat:
 *   post:
 *     summary: Send a chat message and receive a streamed AI response
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: Streamed AI response (SSE)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                 done:
 *                   type: boolean
 *       400:
 *         description: Invalid request data
 *       429:
 *         description: Too many requests (rate limited)
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 *
 * /chat/history:
 *   get:
 *     summary: Get conversation history (in-memory, for demo)
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Conversation history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   bot:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *     security:
 *       - bearerAuth: []
 */
/**
 * POST /api/chat
 * Handles chat messages, streams responses from OpenAI.
 */
router.post('/', chatLimiter, chatSpeedLimiter, validateChatRequest, wrapAsync(async (req, res) => {
  const { message, history = [] } = req.body;
  const userMessage = { role: 'user', content: message };

  // Prepend prompt template as system message
  const systemPrompt = { role: 'system', content: PROMPT_TEMPLATE };
  const messages = [systemPrompt, ...history, userMessage];

  let retryCount = 0;
  const maxRetries = 2;
  let usageLogged = false;

  async function callOpenAI() {
    try {
      // Request a streaming completion from the OpenAI API
      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: messages,
        stream: true, // Enable streaming
      });

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush the headers to establish the connection

      let fullResponse = '';
      let totalTokens = 0;
      // Process the stream from OpenAI
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
        // Track token usage if available
        if (chunk.usage && chunk.usage.total_tokens) {
          totalTokens = chunk.usage.total_tokens;
        }
      }

      // Log usage/cost if available
      if (!usageLogged) {
        logger.info(`OpenAI usage: ${totalTokens} tokens for this request.`);
        usageLogged = true;
      }

      logger.info(`Full AI response: "${fullResponse}"`);
      conversationLog.push({ user: message, bot: fullResponse, timestamp: new Date() });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      // Handle OpenAI rate limit errors with fallback/queue
      if (error.status === 429 && retryCount < maxRetries) {
        retryCount++;
        logger.warn('OpenAI rate limit hit, retrying after delay...');
        await new Promise(r => setTimeout(r, 1000 * retryCount));
        return callOpenAI();
      }
      logger.error('Error in chat endpoint:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to get response from AI' });
      } else {
        res.end();
      }
    }
  }

  // Log the user's message
  logger.info(`Received message from user: "${message}"`);
  await callOpenAI();
}));

/**
 * GET /api/chat/history
 * Returns the logged conversation history.
 */
router.get('/history', (req, res) => {
  res.status(200).json(conversationLog);
});

export default router;
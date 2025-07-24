import express, { Request, Response } from 'express';
import multer from 'multer';
import { parseFile } from '../utils/parseFile';
import { getChatHistoryForUser, clearChatHistoryForUser, saveChatToHistory } from '../services/chatHistoryService';
import { deleteFile, buildDynamicContext } from '../services/fileService';
import fetch from 'node-fetch';
import { logger } from '../utils/logger';
import { LLMService } from '../services/llmService';
import { checkSafety } from '../llm/safety';
import { detectHallucination } from '../llm/hallucination_check';
import { getUserMemory, saveUserMemory } from '../llm/memory/userMemory';
import { prepareFineTuneData } from '../llm/fine_tuning';
import memoryRouter from './memory';
import { createCustomer, createCheckoutSession, getStripe } from '../services/stripeService';
import { detectLanguage, translateText } from '../llm/tools/translator';
import complianceRouter from './compliance';
import translateRouter from './translate';
import whisperRouter from './whisper';
import { updateUserFeedback } from '../services/responseEvaluationService';
import { authMiddleware } from '../middleware/auth.middleware';
import { executeWorkflow } from '../services/workflowEngine';
import { authorizeRole, requireWorkspaceRole, requireOrgRole, requireRole } from '../middleware/rbac.middleware';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { requireActiveSubscription } from '../middleware/subscription.middleware';
import { checkWorkspaceAccess } from '../middleware/auth';
import { logAnalyticsEvent } from '../services/analyticsService';
import { NeonDatabaseService } from '../services/neonDatabaseService';
import { QdrantService } from '../services/qdrantService';
import { saveChatContext } from '../services/chatContextService';
import { saveEmbeddingsMemory } from '../services/embeddingService';
import { logLLMCall } from '../services/llmCallService';
import { validateFileUpload } from '../middleware/validation';
import rateLimit from 'express-rate-limit';
import { rateLimiterMiddleware, chatRateLimiter, uploadRateLimiter } from '../rateLimiter/rateLimiterMiddleware';
import { z } from 'zod';
import xss from 'xss';
import { setInterval } from 'timers';
import path from 'path';
import { supportedFileTypes } from '../utils/parseFile';
import { EmbeddingService } from '../services/embeddingService';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Initialize the new services
const llmService = new LLMService();
const dbService = new NeonDatabaseService();
const embeddingService = new EmbeddingService();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API root endpoint
 *     description: Returns API information and available endpoints
 *     tags: [API]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Smart Brain AI Chatbot API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      chat: '/api/chat (coming soon)',
      upload: '/api/upload (coming soon)',
      brain: '/api/brain (coming soon)'
    }
  });
});

/**
 * @swagger
 * /api/ping:
 *   get:
 *     summary: Ping endpoint
 *     description: Simple ping endpoint for testing connectivity
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Pong response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "pong"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Zod schemas for validation
const parseFileBodySchema = z.object({
  url: z.string().url().optional(),
  fileName: z.string().min(1).max(255).optional()
});
const fileIdParamSchema = z.object({
  fileId: z.string().min(1).max(255)
});
const askFileBodySchema = z.object({
  question: z.string().min(1).max(2000),
  chat_history: z.any().optional(),
  temperature: z.number().min(0).max(1).optional(),
  strategy: z.string().optional(),
  feedback: z.any().optional()
});

function validateBody(schema: z.ZodSchema<any>) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.errors });
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
function validateParams(schema: z.ZodSchema<any>) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid params', details: result.error.errors });
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

// POST /api/parse-file
router.post('/parse-file', upload.single('file'), validateBody(parseFileBodySchema), async (req, res) => {
  try {
    let fileName: string;
    let buffer: Buffer | undefined;
    let url: string | undefined;

    if (req.file) {
      fileName = xss(req.file.originalname);
      buffer = req.file.buffer;
    } else if (req.body && req.body.url && req.body.fileName) {
      url = xss(req.body.url);
      fileName = xss(req.body.fileName);
    } else {
      res.status(400).json({ error: 'No file uploaded or URL provided' });
      return;
    }

    let parseInput: { fileName: string; buffer?: Buffer; url?: string } = { fileName };
    if (buffer) parseInput.buffer = buffer;
    if (url) parseInput.url = url;
    const result = await parseFile(parseInput);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Parse error' });
  }
});

// GET /api/chat/history
router.get('/chat/history', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const history = await getChatHistoryForUser(userId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch chat history' });
  }
});

// DELETE /api/chat/clear
router.delete('/chat/clear', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await clearChatHistoryForUser(userId);
    res.status(200).json({ message: 'Chat cleared successfully.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to clear chat history' });
  }
});

// DELETE /api/files/:fileId
router.delete('/files/:fileId', validateParams(fileIdParamSchema), async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Mark file as deleted
    await markFileAsDeleted(fileId, userId);
    // Delete all related embeddings for this file/user
    await deleteEmbeddingsForFile(fileId, userId);
    res.status(200).json({ message: 'File and embeddings deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete file and embeddings.' });
  }
});

// POST /api/ask-file/:fileId
router.post('/ask-file/:fileId', validateParams(fileIdParamSchema), chatRateLimiter, validateBody(askFileBodySchema), async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    const { question, chat_history, temperature = 0.7, strategy = 'single-shot', feedback } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // 1. Retrieve user memory and chat context
    let userMemory = {};
    let chatContext = {};
    try {
      userMemory = await getUserMemory(userId);
      chatContext = await getChatContext(fileId + ':' + userId); // sessionId = fileId:userId
    } catch (e) { /* ignore for now */ }

    // 2. Query embeddings for this user and file using Qdrant
    const qdrantService = new QdrantService();
    const embeddings = await qdrantService.searchEmbeddings(userId, fileId);
    const chunks = embeddings.map((emb: any) => emb.payload?.chunkText || '').filter(Boolean);

    // 3. Retrieve top-K relevant chunks
    const contextChunks = Array.isArray(chunks) ? chunks : [];
    const context = contextChunks.slice(0, 5).join('\n---\n');

    // 4. Build prompt with memory/context
    const systemPrompt = `You are an AI assistant. Use the following context from uploaded documents, user memory, and chat context to answer the user's query accurately. If the answer isn't found, say you don't know.\n\nUser Memory:\n${JSON.stringify(userMemory)}\n\nChat Context:\n${JSON.stringify(chatContext)}\n\nContext:\n${context}\n\nUser Question:\n${question}`;

    // 5. Call LLM via Groq
    const start = Date.now();
    const llmResponse = await llmService.chatCompletion([
      { role: 'system', content: systemPrompt },
      ...((chat_history || []).map((m: any) => ({ role: m.role, content: m.content }))),
      { role: 'user', content: question }
    ], {
      temperature,
      max_tokens: 1024
    });
    const content = llmResponse && typeof llmResponse === 'object' && 'content' in llmResponse ? llmResponse.content : '';
    const latency = Date.now() - start;

    // 7. Safety check
    const safety = await checkSafety(content || '');
    if (!safety.safe) {
      return res.status(200).json({ answer: '⚠️ Sorry, this answer may be unsafe or inappropriate.', issues: safety.issues });
    }

    // 8. Hallucination detection
    const hallucination = await detectHallucination(content || '', contextChunks);

    // 9. Save updated chat context and embeddings memory
    try {
      await saveChatContext(fileId + ':' + userId, userId, { ...chatContext, lastQ: question, lastA: content });
      await saveEmbeddingsMemory(fileId + ':' + userId, userId, Array.isArray(chunks) ? chunks.map((c: any) => c.embedding_vector) : []);
    } catch (e) { /* ignore for now */ }

    // 10. Save feedback/fine-tune data if provided
    if (feedback && feedback.type) {
      await prepareFineTuneData(userId, { question, context, chat_history }, { answer: content }, feedback.type);
    }

    // 11. Log call
    await logLLMCall({ provider: 'groq', model: 'llama3-70b-8192', latency, cost: 0, userId, taskType: 'file_qa' });

    // 12. Return answer, hallucination, and issues
    res.json({
      answer: content,
      hallucination,
      issues: safety.issues,
      model: 'llama3-70b-8192',
      provider: 'groq',
      latency,
      contextUsed: contextChunks.slice(0, 5),
      feedback: feedback || null,
      functionCalls: llmResponse.functionCalls || []
    });

    // Add this after sending the response:
    const fileMeta = await dbService.getFileById(fileId);
    if (fileMeta && fileMeta.storage_mode === 'temporary') {
      setTimeout(async () => {
        try {
          // Delete file from storage (implement deleteFileFromStorage as needed)
          if (fileMeta.storage_url) {
            await deleteFileFromStorage(fileMeta.storage_url);
          }
          // Delete embeddings from Qdrant
          const qdrantService = new QdrantService();
          await qdrantService.deleteEmbeddings(fileId);
          // Delete metadata from DB
          await dbService.deleteFileById(fileId);
        } catch (cleanupErr) {
          console.error('Temporary file cleanup error:', cleanupErr);
        }
      }, 1000);
    }
    // In /api/ask-file/:fileId endpoint, after answering:
    await dbService.logFileActivity(userId, fileId, 'answer', 'File used for answering a query');
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to answer file question' });
  }
});

// POST /api/query
router.post('/query', async (req, res) => {
  try {
    const { user_id, query, file_id, top_k } = req.body;
    if (!user_id || !query) {
      return res.status(400).json({ error: 'user_id and query are required' });
    }
    const k = typeof top_k === 'number' && top_k > 0 && top_k <= 20 ? top_k : 6;
    
    // 1. Generate embedding using new service
    const queryEmbedding = await llmService.generateEmbeddings(query);
    
    // 2. Search similar vectors using Qdrant
    const chunks = await llmService.searchSimilar(queryEmbedding, k);
    
    res.json({ chunks });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ask-file-stream/:fileId
router.post('/ask-file-stream/:fileId', chatRateLimiter, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    const { question, chat_history } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // 1. Get embedding for the question using new service
    const questionEmbedding = await llmService.generateEmbeddings(question);

    // 2. Search similar vectors using Qdrant
    const chunks = await llmService.searchSimilar(questionEmbedding, 5);
    
    if (!chunks || chunks.length === 0) return res.status(404).json({ error: 'No embeddings found for this file.' });

    // 3. Build dynamic prompt
    const topK = chunks.map((chunk: any) => ({
      ...chunk,
      chunk_text: chunk.payload?.text || chunk.text || ''
    }));
    
    const { prompt: dynamicPrompt } = buildDynamicContext({
      topChunks: topK,
      chatHistory: chat_history || [],
      userQuery: question,
      model: 'llama3-70b-8192',
      maxTokens: 8000
    });

    // 4. Call Groq and stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
      const response = await llmService.chatCompletion([
        { role: 'user', content: dynamicPrompt }
      ], {
        stream: true,
        onToken: (token: string) => {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      });
      res.write('data: [DONE]\n\n');
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Failed to get response' })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`);
    res.end();
  }
});

// POST /api/chat/file/:fileId
router.post('/chat/file/:fileId', chatRateLimiter, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    const { message: question, chat_history, feedback, userLang } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // 1. Detect input language
    let detectedLang = 'en';
    try {
      detectedLang = await detectLanguage(question);
    } catch (e) { /* fallback to en */ }

    // 2. Translate input to English if needed
    let translatedInput = question;
    let inputTranslated = false;
    if (detectedLang !== 'en') {
      try {
        translatedInput = await translateText(question, 'en');
        inputTranslated = true;
      } catch (e) { /* fallback to original */ }
    }

    // 1. Retrieve user memory and chat context
    let userMemory = {};
    let chatContext = {};
    try {
      userMemory = await getUserMemory(userId);
      chatContext = await getChatContext(fileId + ':' + userId); // sessionId = fileId:userId
    } catch (e) { /* ignore for now */ }

    // 2. Query embeddings for this user and file using Qdrant
    const qdrantService = new QdrantService();
    const embeddings = await qdrantService.searchEmbeddings(userId, fileId);
    const chunks = embeddings.map((emb: any) => emb.payload?.chunkText || '').filter(Boolean);

    // 3. Retrieve top-K relevant chunks (simple cosine sim, can optimize later)
    // Context window config
    const contextConfig = {
      free: 4,
      pro: 8,
      enterprise: 12,
      longFormQuestion: 15,
    };

    // Helper to detect query type (simple heuristic)
    function detectQueryType(question: string) {
      if (!question) return 'default';
      if (question.length > 200 || /essay|report|long|detailed|explain|analyze|summarize/i.test(question)) {
        return 'longFormQuestion';
      }
      return 'default';
    }
    // Get user plan
    let userPlan = 'free';
    try {
      const { data: subData } = await getUserSubscription(userId);
      if (subData && subData.plan_type) userPlan = subData.plan_type;
    } catch (e) { /* fallback to free */ }
    // Detect query type
    const queryType = detectQueryType(question);
    let K = contextConfig[userPlan] || 4;
    if (queryType === 'longFormQuestion') K = contextConfig.longFormQuestion;
    const contextChunks = Array.isArray(chunks) ? chunks.map((c) => c.chunk_text) : [];
    const context = contextChunks.slice(0, K).join('\n---\n');

    // 4. Build prompt with memory/context
    const systemPrompt = `You are an AI assistant. Use the following context from uploaded documents, user memory, and chat context to answer the user's query accurately. If the answer isn't found, say you don't know.\n\nUser Memory:\n${JSON.stringify(userMemory)}\n\nChat Context:\n${JSON.stringify(chatContext)}\n\nContext:\n${context}\n\nUser Question:\n${translatedInput}`;

    // 5. Call LLM via router
    const start = Date.now();
    const llmResponse = await callLLM({
      provider: 'groq',
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...((chat_history || []).map((m: any) => ({ role: m.role, content: m.content }))),
        { role: 'user', content: translatedInput }
      ],
      temperature,
      strategy,
      userId,
      taskType: 'file_qa'
    });
    const content = llmResponse && typeof llmResponse === 'object' && 'content' in llmResponse ? llmResponse.content : '';
    const latency = Date.now() - start;

    // 6. Safety check
    const safety = await checkSafety(content || '');
    if (!safety.safe) {
      return res.status(200).json({ answer: '⚠️ Sorry, this answer may be unsafe or inappropriate.', issues: safety.issues });
    }

    // 7. Hallucination detection
    const hallucination = await detectHallucination(content || '', contextChunks);

    // 8. Save updated chat context and embeddings memory
    try {
      await saveChatContext(fileId + ':' + userId, userId, { ...chatContext, lastQ: question, lastA: content });
      await saveEmbeddingsMemory(fileId + ':' + userId, userId, Array.isArray(chunks) ? chunks.map((c: any) => c.embedding_vector) : []);
    } catch (e) { /* ignore for now */ }

    // 9. Save feedback/fine-tune data if provided
    if (feedback && feedback.type) {
      await prepareFineTuneData(userId, { question, context, chat_history }, { answer: content }, feedback.type);
    }

    // 10. Log call
    await logLLMCall({ provider: 'groq', model: 'llama3-70b-8192', latency, cost: 0, userId, taskType: 'file_qa' });

    // 11. Return answer, hallucination, and issues
    let finalAnswer = content;
    let outputTranslated = false;
    if (userLang && userLang !== 'en') {
      try {
        finalAnswer = await translateText(content, userLang);
        outputTranslated = true;
      } catch (e) { /* fallback to original */ }
    }

    const explanation = `Model: ${'llama3-70b-8192'}. Used ${contextChunks.slice(0, K).length} context chunks. Tools called: ${(llmResponse.functionCalls || []).map(f => f.name).join(', ') || 'none'}.`;
    res.json({
      answer: finalAnswer,
      hallucination,
      issues: safety.issues,
      model: 'llama3-70b-8192',
      provider: 'groq',
      latency,
      contextUsed: contextChunks.slice(0, K),
      feedback: feedback || null,
      detectedLang,
      translated: outputTranslated,
      explanation
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to answer file question' });
  }
});

// POST /api/agent-chain - Execute a chain of agents in sequence
router.post('/agent-chain', chatRateLimiter, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { agents, input, workspace_id } = req.body;
    if (!userId || !Array.isArray(agents) || agents.length === 0 || !workspace_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    let currentInput = input;
    const results = [];
    for (const agent of agents) {
      // For demo: callLLM with agent persona as system prompt
      const systemPrompt = `You are ${agent.name}. ${agent.description || ''}`;
      const llmResponse = await callLLM({
        provider: agent.provider || 'groq',
        model: agent.model || 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentInput }
        ],
        userId,
        workspace_id
      });
      results.push({ agent, input: currentInput, output: llmResponse.content });
      currentInput = llmResponse.content;
    }
    res.json({ results, final: currentInput });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute agent chain' });
  }
});

// POST /api/workflows/execute - Execute a workflow
router.post('/workflows/execute', authMiddleware, requireWorkspaceRole(['owner', 'admin', 'member']), async (req, res) => {
  const { workflowConfig, workflowId } = req.body;
  const userId = req.user?.id;
  if (!workflowConfig || !workflowId) {
    return res.status(400).json({ error: 'Missing workflowConfig or workflowId' });
  }
  try {
    const result = await executeWorkflow({ workflowConfig, userId, workflowId });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/workflows/:id/logs - Get logs for a workflow run
router.get('/workflows/:id/logs', authMiddleware, requireWorkspaceRole(['owner', 'admin', 'member']), async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  // This endpoint will need to be updated to fetch from a new DB or storage
  // For now, returning a placeholder
  res.json({ logs: [], steps: [], status: 'not_implemented', started_at: null, finished_at: null });
});

// Stripe: Create Checkout Session
router.post('/stripe/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { priceId, successUrl, cancelUrl, customerId } = req.body;
    const session = await createCheckoutSession({
      priceId,
      successUrl,
      cancelUrl,
      customerId,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Stripe checkout session' });
  }
});

// Stripe: Webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
  // TODO: Handle subscription events and update Supabase
  res.json({ received: true });
});

// --- STRIPE BILLING ENDPOINTS ---
// POST /api/billing/create-customer
router.post('/billing/create-customer', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const customer = await createCustomer(email);
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Stripe customer' });
  }
});

// POST /api/billing/create-checkout-session
router.post('/billing/create-checkout-session', async (req, res) => {
  try {
    const { customerId, priceId, successUrl, cancelUrl } = req.body;
    if (!customerId || !priceId || !successUrl || !cancelUrl) return res.status(400).json({ error: 'Missing required fields' });
    const session = await createCheckoutSession({ customerId, priceId, successUrl, cancelUrl });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Stripe checkout session' });
  }
});

// POST /api/billing/webhook
router.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // NOTE: You must set up Stripe webhook secret and signature verification in production
  const event = req.body;
  // Handle events: invoice.paid, customer.subscription.created, usage_record.summary.created, etc.
  // For demo, just log the event
  console.log('Stripe webhook event:', event.type);
  res.json({ received: true });
});

// GET /api/billing/status - Return current user's billing tier and status
router.get('/billing/status', async (req, res) => {
  // TODO: Integrate with Stripe subscription lookup
  // For now, return mock data
  const userId = req.user?.id || 'unknown';
  // Example: fetch from subscriptions table or Stripe
  res.json({
    tier: 'Pro',
    status: 'Active',
    userId
  });
});

// --- BILLING ENDPOINTS ---
// POST /api/billing/checkout - Create Stripe Checkout session
router.post('/billing/checkout', authMiddleware, requireWorkspaceRole(['owner', 'admin']), async (req, res) => {
  const { priceId, workspaceId, successUrl, cancelUrl } = req.body;
  const userId = req.user?.id;
  if (!priceId || !workspaceId || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Find or create Stripe customer for user
  let customerId = req.user?.stripe_customer_id;
  if (!customerId) {
    // This part will need to be updated to fetch user from a new DB or storage
    // For now, returning a placeholder
    customerId = 'cus_mock'; // Mock customer ID
  }
  const session = await createCheckoutSession({ customerId, priceId, successUrl, cancelUrl });
  res.json({ url: session.url });
});

// POST /api/billing/portal - Create Stripe Customer Portal session
router.post('/billing/portal', authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  let customerId = req.user?.stripe_customer_id;
  if (!customerId) {
    // This part will need to be updated to fetch user from a new DB or storage
    // For now, returning a placeholder
    customerId = 'cus_mock'; // Mock customer ID
  }
  if (!customerId) return res.status(400).json({ error: 'No Stripe customer found' });
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: req.body.returnUrl || 'https://your-app.com/billing',
  });
  res.json({ url: portalSession.url });
});

// POST /api/billing/webhook - Stripe webhook handler
router.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env['STRIPE_WEBHOOK_SECRET']);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
  // Handle subscription events
  if (event.type.startsWith('customer.subscription.')) {
    const subscription = event.data.object;
    // Find workspace by stripe_customer_id
    // This part will need to be updated to fetch workspace from a new DB or storage
    // For now, returning a placeholder
    const workspace = { workspace_id: 'ws_mock' }; // Mock workspace
    if (workspace) {
      // This part will need to be updated to update a new DB or storage
      // For now, just logging
      console.log('Stripe subscription updated:', subscription.status, subscription.id);
    }
  }
  res.json({ received: true });
});

// Organization: Create Org
router.post('/org', requireActiveSubscription, async (req: Request, res: Response) => {
  const { name } = req.body;
  const ownerUserId = req.user?.id;
  if (!name || !ownerUserId) return res.status(400).json({ error: 'Missing org name or user' });
  // This part will need to be updated to create org in a new DB or storage
  // For now, returning a placeholder
  const org = { org_id: 'org_mock', name, ownerUserId };
  res.json({ org });
});

// Organization: Invite Member
router.post('/org/:orgId/invite', requireOrgRole(['owner', 'admin']), async (req: Request, res: Response) => {
  const { orgId } = req.params;
  const { userId, role } = req.body;
  const invitedBy = req.user?.id;
  if (!orgId || !userId || !role || !invitedBy) return res.status(400).json({ error: 'Missing invite params' });
  // This part will need to be updated to invite member in a new DB or storage
  // For now, returning a placeholder
  const member = { orgId, userId, role, invitedBy };
  res.json({ member });
});

// Organization: Assign Role
router.post('/org/:orgId/assign-role', authMiddleware, requireOrgRole(['owner']), async (req: Request, res: Response) => {
  const { orgId } = req.params;
  const { userId, role } = req.body;
  if (!orgId || !userId || !role) return res.status(400).json({ error: 'Missing assign params' });
  // This part will need to be updated to assign role in a new DB or storage
  // For now, returning a placeholder
  const member = { orgId, userId, role, assignedBy: req.user?.id };
  res.json({ member });
});

// Organization: Remove Member
router.delete('/org/:orgId/member/:userId', requireOrgRole(['owner', 'admin']), async (req: Request, res: Response) => {
  const { orgId, userId } = req.params;
  if (!orgId || !userId) return res.status(400).json({ error: 'Missing remove params' });
  // This part will need to be updated to remove member in a new DB or storage
  // For now, returning a placeholder
  res.json({ removed: true });
});

// Organization: List Orgs for User
router.get('/orgs', requireActiveSubscription, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(400).json({ error: 'Missing user' });
  // This part will need to be updated to fetch orgs from a new DB or storage
  // For now, returning a placeholder
  const orgs = [{ org_id: 'org_mock', name: 'My Org', ownerUserId: userId }];
  res.json({ orgs });
});

// Organization: List Members
router.get('/org/:orgId/members', requireOrgRole(['owner', 'admin', 'member']), async (req: Request, res: Response) => {
  const { orgId } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' });
  // This part will need to be updated to fetch members from a new DB or storage
  // For now, returning a placeholder
  const members = [{ orgId, userId: req.user?.id, role: 'owner', status: 'active', accepted_at: new Date().toISOString() }];
  res.json({ members });
});

// GET enabled models for workspace (admin only)
router.get('/workspace/:workspaceId/models', async (req, res) => {
  const { workspaceId } = req.params;
  // TODO: Add admin check
  // This part will need to be updated to fetch enabled models from a new DB or storage
  // For now, returning a placeholder
  const models = [{ id: 'llama3-70b-8192', label: 'Groq LLaMA 3 70B' }];
  res.json({ enabledModels: models });
});
// POST set enabled models for workspace (admin only)
router.post('/workspace/:workspaceId/models', async (req, res) => {
  const { workspaceId } = req.params;
  const { enabledModels } = req.body;
  // TODO: Add admin check
  // This part will need to be updated to set enabled models in a new DB or storage
  // For now, returning a placeholder
  const ok = true;
  res.json({ success: ok });
});

// --- FEEDBACK ENDPOINT ---
// POST /api/feedback - Save feedback/rating for a message
router.post('/feedback', authMiddleware, requireWorkspaceRole(['owner', 'admin', 'member']), async (req: Request, res: Response) => {
  try {
    const { user_id, response_id, feedback, message_text, timestamp } = req.body;
    if (!user_id || !response_id || !feedback) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (req.user?.id !== user_id) {
      return res.status(403).json({ error: 'User ID mismatch or not authenticated' });
    }
    if (!['positive', 'negative'].includes(feedback)) {
      return res.status(400).json({ error: 'Invalid feedback value' });
    }
    // Insert feedback into Supabase
    // This part will need to be updated to insert feedback into a new DB or storage
    // For now, returning a placeholder
    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit feedback' });
  }
});

// --- MEMORY MANAGEMENT ENDPOINTS ---

// GET /api/memory/files - List all files for the user with chunk counts
router.get('/memory/files', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Get all files for user
    // This part will need to be updated to fetch files from a new DB or storage
    // For now, returning a placeholder
    const files = [{ id: 'file_mock', file_name: 'test.pdf', created_at: new Date().toISOString() }];
    const fileIds = files.map(f => f.id);
    // This part will need to be updated to fetch chunk counts from a new DB or storage
    // For now, returning a placeholder
    const chunkCounts = [{ file_id: 'file_mock', count: 10 }];
    const chunkCountMap = {};
    (chunkCounts || []).forEach(row => {
      chunkCountMap[row.file_id] = row.count;
    });
    const result = files.map(f => ({ ...f, chunkCount: chunkCountMap[f.id] || 0 }));
    res.json({ files: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// GET /api/memory/file/:fileId/chunks - List all chunks/embeddings for a file
router.get('/memory/file/:fileId/chunks', async (req, res) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.fileId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // This part will need to be updated to fetch chunks from a new DB or storage
    // For now, returning a placeholder
    const chunks = [{ id: 'chunk_mock', chunk_index: 0, chunk_text: 'Test chunk', embedding_vector: [0.1, 0.2, 0.3] }];
    res.json({ chunks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chunks' });
  }
});

// DELETE /api/memory/file/:fileId - Delete a file and its memory
router.delete('/memory/file/:fileId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.fileId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // This part will need to be updated to delete file and memory from a new DB or storage
    // For now, returning a placeholder
    res.json({ message: 'File and memory deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete file and memory' });
  }
});

// DELETE /api/memory/chunk/:chunkId - Delete a specific chunk and its vector row
router.delete('/memory/chunk/:chunkId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const chunkId = req.params.chunkId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // This part will need to be updated to delete chunk from a new DB or storage
    // For now, returning a placeholder
    res.json({ message: 'Chunk deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chunk' });
  }
});

// --- USER SETTINGS ENDPOINTS ---

// GET /api/user-settings
router.get('/user-settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // This part will need to be updated to fetch user settings from a new DB or storage
    // For now, returning a placeholder
    const { data } = { data: { selected_model: 'gpt-4o' } };
    if (data) {
      res.json({ selected_model: data.selected_model || 'gpt-4o' });
    } else {
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// POST /api/user-settings
router.post('/user-settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { selected_model } = req.body;
    if (!selected_model) {
      return res.status(400).json({ error: 'selected_model is required' });
    }
    // Upsert user setting
    // This part will need to be updated to upsert user setting in a new DB or storage
    // For now, returning a placeholder
    res.json({ message: 'Model selection updated', selected_model });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// --- USAGE ANALYTICS ENDPOINTS ---
// GET /api/usage/summary - Aggregated usage stats for the current user
router.get('/usage/summary', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // This part will need to be updated to fetch chat and file stats from a new DB or storage
    // For now, returning a placeholder
    const chatStats = { total_messages: 100, total_tokens: 100000 };
    const fileStats = { total_files: 10, total_chunks: 1000 };
    res.json({
      chatStats,
      fileStats,
      // tokenStats: ...
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch usage stats' });
  }
});

// GET /api/usage/trends - Time-series usage data for the current user
router.get('/usage/trends', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Example: Fetch chat and file activity over the last 30 days
    // (You may need to implement aggregation in supabaseService)
    // Placeholder response:
    res.json({
      chatTrends: [],
      fileTrends: [],
      // tokenTrends: []
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch usage trends' });
  }
});

// GET /api/analytics/alerts - Fetch latest system alerts for the current user (or all if admin)
router.get('/analytics/alerts', async (req, res) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin' || req.user?.is_admin;
    // This part will need to be updated to fetch alerts from a new DB or storage
    // For now, returning a placeholder
    const alerts = [{ id: 'alert_mock', message: 'System is running smoothly.', created_at: new Date().toISOString() }];
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch system alerts' });
  }
});

// --- WORKSPACE & MEMBER MANAGEMENT ---
// POST /api/workspaces - Create workspace
router.post('/workspaces', authMiddleware, requireWorkspaceRole(['owner', 'admin']), async (req, res) => {
  const { name, plan } = req.body;
  const userId = req.user?.id;
  if (!name) return res.status(400).json({ error: 'Workspace name required' });
  // This part will need to be updated to create workspace in a new DB or storage
  // For now, returning a placeholder
  const ws = { workspace_id: 'ws_mock', name, created_by: userId, plan: plan || 'free' };
  res.json({ workspace: ws });
});

// GET /api/workspaces - List workspaces for user
router.get('/workspaces', authMiddleware, requireWorkspaceRole(['owner', 'admin', 'member']), async (req, res) => {
  const userId = req.user?.id;
  // This part will need to be updated to fetch workspaces from a new DB or storage
  // For now, returning a placeholder
  const workspaces = [{ workspace_id: 'ws_mock', name: 'My Workspace', created_by: userId }];
  res.json({ workspaces });
});

// POST /api/workspaces/:workspaceId/invite - Invite member
router.post('/workspaces/:workspaceId/invite', authMiddleware, requireWorkspaceRole(['owner', 'admin']), async (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;
  if (!email || !role) return res.status(400).json({ error: 'User email and role required' });
  try {
    // Check if user exists, else create
    let user = await dbService.query('SELECT * FROM users WHERE email = $1', [email]);
    let userId;
    if (user.rows.length === 0) {
      userId = uuidv4();
      await dbService.createUser(userId, email);
    } else {
      userId = user.rows[0].id;
    }
    // Add to workspace_members (create table if not exists)
    await dbService.query(`CREATE TABLE IF NOT EXISTS workspace_members (workspace_id VARCHAR(255), user_id VARCHAR(255), role VARCHAR(50), joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (workspace_id, user_id))`);
    await dbService.query(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = $3`, [workspaceId, userId, role]);
    // Audit log
    await logAnalyticsEvent({ user_id: req.user.id, event_type: 'invite_member', event_data: { workspaceId, userId, role }, timestamp: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to invite member' });
  }
});

// POST /api/workspaces/:workspaceId/accept - Accept invite
router.post('/workspaces/:workspaceId/accept', authMiddleware, async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user?.id;
  // This part will need to be updated to accept invite in a new DB or storage
  // For now, returning a placeholder
  res.json({ success: true });
});

// POST /api/workspaces/:workspaceId/role - Change member role
router.post('/workspaces/:workspaceId/role', authMiddleware, requireWorkspaceRole(['owner', 'admin']), async (req, res) => {
  const { workspaceId } = req.params;
  const { user_id, role } = req.body;
  if (!user_id || !role) return res.status(400).json({ error: 'User and role required' });
  try {
    await dbService.query(`UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3`, [role, workspaceId, user_id]);
    await logAnalyticsEvent({ user_id: req.user.id, event_type: 'change_role', event_data: { workspaceId, user_id, role }, timestamp: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update role' });
  }
});

// DELETE /api/workspaces/:workspaceId/members/:user_id - Remove member
router.delete('/workspaces/:workspaceId/members/:user_id', authMiddleware, requireWorkspaceRole(['owner', 'admin']), async (req, res) => {
  const { workspaceId, user_id } = req.params;
  try {
    await dbService.query(`DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`, [workspaceId, user_id]);
    await logAnalyticsEvent({ user_id: req.user.id, event_type: 'remove_member', event_data: { workspaceId, user_id }, timestamp: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to remove member' });
  }
});

// GET /api/workspaces/:workspaceId/members - List members
router.get('/workspaces/:workspaceId/members', authMiddleware, requireWorkspaceRole(['owner', 'admin', 'member']), async (req, res) => {
  const { workspaceId } = req.params;
  // This part will need to be updated to fetch members from a new DB or storage
  // For now, returning a placeholder
  const members = [{ workspaceId, user_id: req.user?.id, role: 'owner', status: 'active', invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() }];
  res.json({ members });
});

// --- CUSTOM AGENT BUILDER ENDPOINTS ---
// POST /api/custom-agents - Create custom agent
router.post('/custom-agents', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { workspace_id, name, description, model, tools } = req.body;
    if (!userId || !workspace_id || !name) return res.status(400).json({ error: 'Missing fields' });
    // This part will need to be updated to create custom agent in a new DB or storage
    // For now, returning a placeholder
    const agent = { id: 'agent_mock', workspace_id, name, description, model, tools, created_by: userId };
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create custom agent' });
  }
});
// GET /api/custom-agents - List custom agents for workspace
router.get('/custom-agents', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { workspace_id } = req.query;
    if (!userId || !workspace_id) return res.status(400).json({ error: 'Missing workspace_id' });
    // This part will need to be updated to fetch custom agents from a new DB or storage
    // For now, returning a placeholder
    const agents = [{ id: 'agent_mock', workspace_id, name: 'My Agent', description: 'A helpful assistant', model: 'llama3-70b-8192', tools: [], created_by: userId }];
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch custom agents' });
  }
});
// PATCH /api/custom-agents/:id - Update custom agent
router.patch('/custom-agents/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const agentId = req.params.id;
    const { name, description, model, tools } = req.body;
    if (!userId || !agentId) return res.status(400).json({ error: 'Missing fields' });
    // This part will need to be updated to update custom agent in a new DB or storage
    // For now, returning a placeholder
    const agent = { id: agentId, name, description, model, tools };
    res.json({ agent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update custom agent' });
  }
});
// DELETE /api/custom-agents/:id - Delete custom agent
router.delete('/custom-agents/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const agentId = req.params.id;
    if (!userId || !agentId) return res.status(400).json({ error: 'Missing fields' });
    // This part will need to be updated to delete custom agent in a new DB or storage
    // For now, returning a placeholder
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete custom agent' });
  }
});

// --- AGENT PLUGIN MANAGEMENT ENDPOINTS ---
// POST /api/agent-plugins - Register plugin
router.post('/agent-plugins', async (req, res) => {
  try {
    const { name, description, version, author, manifest_url, metadata } = req.body;
    if (!name || !manifest_url) return res.status(400).json({ error: 'Missing fields' });
    // This part will need to be updated to register plugin in a new DB or storage
    // For now, returning a placeholder
    const plugin = { id: 'plugin_mock', name, description, version, author, manifest_url, metadata };
    res.json({ plugin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register plugin' });
  }
});
// GET /api/agent-plugins - List plugins
router.get('/agent-plugins', async (req, res) => {
  try {
    // This part will need to be updated to fetch plugins from a new DB or storage
    // For now, returning a placeholder
    const plugins = [{ id: 'plugin_mock', name: 'Test Plugin', description: 'A test plugin', version: '1.0.0', author: 'Test Author', manifest_url: 'http://localhost:3000/plugin.json' }];
    res.json({ plugins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
});
// PATCH /api/agent-plugins/:id - Update plugin
router.patch('/agent-plugins/:id', async (req, res) => {
  try {
    const pluginId = req.params.id;
    const { name, description, version, author, manifest_url, enabled, metadata } = req.body;
    if (!pluginId) return res.status(400).json({ error: 'Missing plugin id' });
    // This part will need to be updated to update plugin in a new DB or storage
    // For now, returning a placeholder
    const plugin = { id: pluginId, name, description, version, author, manifest_url, enabled, metadata };
    res.json({ plugin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plugin' });
  }
});
// DELETE /api/agent-plugins/:id - Delete plugin
router.delete('/agent-plugins/:id', async (req, res) => {
  try {
    const pluginId = req.params.id;
    if (!pluginId) return res.status(400).json({ error: 'Missing plugin id' });
    // This part will need to be updated to delete plugin in a new DB or storage
    // For now, returning a placeholder
    res.json({ message: 'Plugin deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plugin' });
  }
});

// --- AGENT CRUD ENDPOINTS ---
// POST /api/agents - Create agent
router.post('/agents', authMiddleware, requireOrgRole(['admin', 'team-lead']), async (req, res) => {
  const { name, role, prompt, tools_allowed, permissions } = req.body;
  const userId = req.user?.id;
  if (!name || !role || !prompt || !Array.isArray(tools_allowed)) {
    return res.status(400).json({ error: 'Missing required agent fields' });
  }
  // This part will need to be updated to create agent in a new DB or storage
  // For now, returning a placeholder
  const agent = { id: 'agent_mock', user_id: userId, name, role, prompt, tools_allowed, permissions: permissions || {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  res.json({ agent });
});

// GET /api/agents - List agents for user/team
router.get('/agents', authMiddleware, requireOrgRole(['admin', 'team-lead', 'member']), async (req, res) => {
  const userId = req.user?.id;
  // This part will need to be updated to fetch agents from a new DB or storage
  // For now, returning a placeholder
  const agents = [{ id: 'agent_mock', user_id: userId, name: 'My Agent', role: 'assistant', prompt: 'You are a helpful assistant.', tools_allowed: [], permissions: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
  res.json({ agents });
});

// PUT /api/agents/:id - Update agent
router.put('/agents/:id', authMiddleware, requireOrgRole(['admin', 'team-lead']), async (req, res) => {
  const { id } = req.params;
  const { name, role, prompt, tools_allowed, permissions } = req.body;
  const userId = req.user?.id;
  // This part will need to be updated to update agent in a new DB or storage
  // For now, returning a placeholder
  const agent = { id: id, user_id: userId, name, role, prompt, tools_allowed, permissions, updated_at: new Date().toISOString() };
  res.json({ agent });
});

// DELETE /api/agents/:id - Delete agent
router.delete('/agents/:id', authMiddleware, requireOrgRole(['admin', 'team-lead']), async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  // This part will need to be updated to delete agent in a new DB or storage
  // For now, returning a placeholder
  res.json({ success: true });
});

// POST /api/summarize
router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { file_id, chat_id, text } = req.body;
    if (!file_id && !chat_id && !text) {
      return res.status(400).json({ error: 'file_id, chat_id, or text is required' });
    }
    // Compose input for summarization
    let inputText = text;
    // TODO: Fetch file or chat content if only file_id or chat_id is provided
    if (!inputText && file_id) {
      // Fetch file content from DB or storage (stub)
      inputText = `Contents of file ${file_id}`;
    }
    if (!inputText && chat_id) {
      // Fetch chat content from DB (stub)
      inputText = `Chat history for chat ${chat_id}`;
    }
    // Call Groq for summarization
    const groq = require('../llm/groq');
    const prompt = `Summarize the following in 3-5 bullet points:\n${inputText}`;
    const result = await groq.callGroqChat(groq.GROQ_MODEL, [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ], { stream: false });
    res.json({ summary: result.content });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/extract
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { file_id, chat_id, text } = req.body;
    if (!file_id && !chat_id && !text) {
      return res.status(400).json({ error: 'file_id, chat_id, or text is required' });
    }
    // Compose input for extraction
    let inputText = text;
    // TODO: Fetch file or chat content if only file_id or chat_id is provided
    if (!inputText && file_id) {
      // Fetch file content from DB or storage (stub)
      inputText = `Contents of file ${file_id}`;
    }
    if (!inputText && chat_id) {
      // Fetch chat content from DB (stub)
      inputText = `Chat history for chat ${chat_id}`;
    }
    // Call Groq for entity/key concept extraction
    const groq = require('../llm/groq');
    const prompt = `Extract all named entities (people, companies, dates, locations) and key concepts from the following text. Return as a JSON object with arrays for each.`;
    const result = await groq.callGroqChat(groq.GROQ_MODEL, [
      { role: 'system', content: 'You are an information extraction assistant.' },
      { role: 'user', content: `${prompt}\n${inputText}` }
    ], { stream: false });
    res.json({ extraction: result.content });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// In-memory global model config (stub for demo; replace with DB in production)
let globalModel = process.env.GROQ_MODEL || 'llama3-70b-8192';
const availableModels = [
  { id: 'llama3-70b-8192', label: 'Groq LLaMA 3 70B' },
  { id: 'llama3-8b-8192', label: 'Groq LLaMA 3 8B' },
  { id: 'mixtral-8x7b-32768', label: 'Groq Mixtral 8x7B' }
];

// GET /api/config/model - Get current global/default model and available models
router.get('/config/model', (req: Request, res: Response) => {
  res.json({
    current_model: globalModel,
    available_models: availableModels
  });
});

// POST /api/config/model - Set global/default model (admin only, stubbed)
router.post('/config/model', (req: Request, res: Response) => {
  // TODO: Replace with real admin check
  const isAdmin = true; // Stub: allow all
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });
  const { model } = req.body;
  if (!model || !availableModels.some(m => m.id === model)) {
    return res.status(400).json({ error: 'Invalid model' });
  }
  globalModel = model;
  res.json({ message: 'Global model updated', current_model: globalModel });
});

router.use('/memory', memoryRouter);
router.use('/compliance', complianceRouter);
router.use('/translate', translateRouter);
router.use('/whisper', whisperRouter);

// Example: Admin-only analytics route
router.get('/admin/analytics', authorizeRole(['admin']), (req, res) => {
  res.json({ message: 'Admin analytics data (stub)' });
});

// --- Upload Progress SSE ---
const uploadProgressMap: Record<string, number> = {};

router.get('/file/upload/progress/:id', (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const sendProgress = () => {
    const progress = uploadProgressMap[id] || 0;
    res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    if (progress >= 100) {
      clearInterval(interval);
      res.end();
    }
  };
  const interval = setInterval(sendProgress, 500);
  req.on('close', () => clearInterval(interval));
});

// Enhanced file upload with progress tracking
router.post('/file/upload', uploadRateLimiter, authorizeRole(['user', 'admin', 'analyst']), (req, res, next) => {
  // Generate a unique upload ID for this request
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  (req as any).uploadId = uploadId;
  uploadProgressMap[uploadId] = 0;
  let bytesReceived = 0;
  const totalBytes = parseInt(req.headers['content-length'] || '0', 10);
  req.on('data', (chunk) => {
    bytesReceived += chunk.length;
    uploadProgressMap[uploadId] = Math.min(100, Math.round((bytesReceived / totalBytes) * 100));
  });
  req.on('end', () => {
    uploadProgressMap[uploadId] = 100;
    setTimeout(() => { delete uploadProgressMap[uploadId]; }, 10000);
  });
  (req as any).uploadId = uploadId;
  next();
}, upload.single('file'), validateFileUpload, async (req, res) => {
  const storageMode = req.body.storage_mode || 'permanent';
  try {
    const file = req.file;
    const userId = req.user?.id;
    const workspaceId = req.body.workspace_id; // Assuming workspace_id is passed in req.body

    if (!file || !userId || !workspaceId) {
      return res.status(400).json({ error: 'Missing file or user/workspace' });
    }

    const fileName = xss(file.originalname);
    const fileBuffer = file.buffer;
    const fileSize = file.size;
    const fileType = file.mimetype;

    const fileId = uuidv4();
    const createdAt = new Date().toISOString();

    // Insert into files table
    await dbService.insertFile(fileId, userId, workspaceId, fileName, fileSize, fileType, storageMode, createdAt);

    // Insert into embeddings table (assuming embeddingService handles this)
    // await saveEmbeddingsMemory(fileId + ':' + userId, userId, []); // Placeholder for embeddingService call

    res.json({ message: 'File uploaded successfully', uploadId: (req as any).uploadId });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to upload file' });
  }
  // In upload endpoint, after successful upload:
  await dbService.logFileActivity(userId, fileId, 'upload', 'File uploaded');
});

// Example: Team insights (analyst, admin)
router.get('/team/insights', authorizeRole(['analyst', 'admin']), (req, res) => {
  res.json({ message: 'Team insights data (stub)' });
});

// Example: Shared chats (viewer, analyst, admin, user)
router.get('/shared/chats', authorizeRole(['viewer', 'analyst', 'admin', 'user']), (req, res) => {
  res.json({ message: 'Shared chats (stub)' });
});

// POST /api/impersonate - Admin-only, generate JWT for another user, log event
router.post('/impersonate', authMiddleware, requireRole('admin'), async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Target userId required' });
  try {
    const user = await dbService.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, impersonated: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await logAnalyticsEvent({ user_id: req.user.id, event_type: 'impersonate', event_data: { targetUserId: user.id }, timestamp: new Date() });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to impersonate user' });
  }
});

// GET /api/profile - Return authenticated user's profile and workspaces
router.get('/profile', authMiddleware, requireWorkspaceRole(['owner', 'admin', 'member']), async (req, res) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Fetch workspaces for user (reuse logic from /api/workspaces)
    // This part should be replaced with real DB call
    const workspaces = [{ workspace_id: 'ws_mock', name: 'My Workspace', role: role || 'user' }];
    res.json({
      id: userId,
      email,
      role,
      workspaces
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- HEALTH CHECK ENDPOINTS ---
router.get('/health', async (req: Request, res: Response) => {
  try {
    const vectorStats = await llmService.getVectorStats();
    // Neon DB check
    let dbStatus = 'unknown';
    try {
      await dbService.query('SELECT 1');
      dbStatus = 'healthy';
    } catch {
      dbStatus = 'unhealthy';
    }
    // LLM check (basic)
    let llmStatus = 'unknown';
    try {
      await llmService.chatCompletion([
        { role: 'system', content: 'ping' },
        { role: 'user', content: 'ping' }
      ], { max_tokens: 1 });
      llmStatus = 'healthy';
    } catch {
      llmStatus = 'unhealthy';
    }
    // File storage check (env/config only)
    const fileStorageStatus = process.env['CLOUDINARY_CLOUD_NAME'] ? 'configured' : 'not_configured';
    // Auth check (env/config only)
    const authStatus = process.env['CLERK_SECRET_KEY'] || process.env['JWT_SECRET'] ? 'configured' : 'not_configured';
    // Compose health object
    const health = {
      status: dbStatus === 'healthy' && llmStatus === 'healthy' && vectorStats.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      services: {
        database: dbStatus,
        vector: vectorStats.status,
        llm: llmStatus,
        fileStorage: fileStorageStatus,
        auth: authStatus
      }
    };
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/health/details', async (req: Request, res: Response) => {
  try {
    const vectorStats = await llmService.getVectorStats();
    let dbStatus = 'unknown';
    try {
      await dbService.query('SELECT 1');
      dbStatus = 'healthy';
    } catch {
      dbStatus = 'unhealthy';
    }
    let llmStatus = 'unknown';
    try {
      await llmService.chatCompletion([
        { role: 'system', content: 'ping' },
        { role: 'user', content: 'ping' }
      ], { max_tokens: 1 });
      llmStatus = 'healthy';
    } catch {
      llmStatus = 'unhealthy';
    }
    const fileStorageStatus = process.env['CLOUDINARY_CLOUD_NAME'] ? 'configured' : 'not_configured';
    const authStatus = process.env['CLERK_SECRET_KEY'] || process.env['JWT_SECRET'] ? 'configured' : 'not_configured';
    res.status(200).json({
      status: dbStatus === 'healthy' && llmStatus === 'healthy' && vectorStats.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      database: dbStatus,
      vector: vectorStats,
      llm: llmStatus,
      fileStorage: fileStorageStatus,
      auth: authStatus,
      env: process.env['NODE_ENV']
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router; 

// Background cleanup for expired temporary files
setInterval(async () => {
  try {
    const expiredFiles = await dbService.getExpiredTemporaryFiles();
    for (const fileMeta of expiredFiles) {
      try {
        if (fileMeta.storage_url) {
          await deleteFileFromStorage(fileMeta.storage_url);
        }
        const qdrantService = new QdrantService();
        await qdrantService.deleteEmbeddings(fileMeta.id);
        await dbService.deleteFileById(fileMeta.id);
        console.log(`Cleaned up expired temporary file: ${fileMeta.id}`);
      } catch (cleanupErr) {
        console.error('Error cleaning up expired temporary file:', fileMeta.id, cleanupErr);
      }
    }
  } catch (err) {
    console.error('Error running expired temporary file cleanup:', err);
  }
}, 10 * 60 * 1000); // Every 10 minutes

// Add a new endpoint to fetch file activity log:
router.get('/files/:fileId/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.fileId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const log = await dbService.getFileActivityLog(userId, fileId);
    res.json({ activity: log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch file activity log' });
  }
});

// Add admin-only endpoint to trigger expired temporary file cleanup
router.post('/admin/cleanup-temporary-files', requireRole('admin'), async (req, res) => {
  try {
    const dbService = new NeonDatabaseService();
    const qdrantService = new QdrantService();
    const expiredFiles = await dbService.getExpiredTemporaryFiles();
    let deleted = 0;
    for (const file of expiredFiles) {
      try {
        // Delete file from disk
        if (file.user_id && file.file_name) {
          const filePath = require('path').join(__dirname, '../../uploads', file.user_id, 'temporary', file.file_name);
          require('fs').unlinkSync(filePath);
        }
        // Delete embeddings from Qdrant
        if (file.id) {
          await qdrantService.deleteEmbeddings(file.id);
        }
        // Delete metadata from DB
        await dbService.deleteFileById(file.id);
        deleted++;
      } catch (err) {
        // Ignore individual errors
      }
    }
    res.json({ deleted });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Cleanup failed' });
  }
});

// Endpoint to fetch file activity log for a file
router.get('/file-activity-log/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const dbService = new NeonDatabaseService();
    const query = `SELECT * FROM file_activity_log WHERE file_id = $1 ORDER BY created_at ASC`;
    const result = await dbService.query(query, [fileId]);
    res.json({ log: result.rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch activity log' });
  }
});

// Find the upload endpoint (pseudo, adapt to your actual endpoint):
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    // Check supported file types
    if (!supportedFileTypes[ext] || !supportedFileTypes[ext].includes(mimeType)) {
      return res.status(422).json({ error: `Unsupported file type: ${ext}` });
    }
    // Call parseFile and handle errors
    let parseResult;
    try {
      parseResult = await parseFile({ buffer: file.buffer, fileName: file.originalname, userId: req.user?.id, mimeType });
    } catch (err: any) {
      if (err.status === 422) {
        return res.status(422).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
    // ...proceed with chunking, embedding, storing, etc.
    res.status(200).json({ success: true, ...parseResult });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add after other file endpoints
router.get('/files/:fileId/status', async (req, res) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.fileId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Fetch real status from DB
    const statusObj = await dbService.getFileStatus(fileId);
    res.json(statusObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch file status' });
  }
});
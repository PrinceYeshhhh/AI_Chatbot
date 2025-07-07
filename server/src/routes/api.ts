import express, { Request, Response } from 'express';
import multer from 'multer';
import { parseFile } from '../utils/parseFile';
import { getChatHistoryForUser, clearChatHistoryForUser } from '../services/chatHistoryService';
import { deleteFile, deleteFileEmbeddings, buildDynamicContext } from '../services/supabaseService';
import fetch from 'node-fetch';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { callGPT } from '../services/gptService';
import { callLLM } from '../llm/router';
import { checkSafety } from '../llm/safety';
import { detectHallucination } from '../llm/hallucination_check';
import { logLLMCall } from '../llm/logs';
import { getUserMemory, saveUserMemory } from '../llm/memory/userMemory';
import { getChatContext, saveChatContext } from '../llm/memory/chatContext';
import { getEmbeddingsMemory, saveEmbeddingsMemory } from '../llm/memory/embeddingsMemory';
import { prepareFineTuneData } from '../llm/fine_tuning';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

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

// POST /api/parse-file
router.post('/parse-file', upload.single('file'), async (req, res) => {
  try {
    let fileName: string;
    let buffer: Buffer | undefined;
    let url: string | undefined;

    if (req.file) {
      fileName = req.file.originalname;
      buffer = req.file.buffer;
    } else if (req.body && req.body.url && req.body.fileName) {
      url = req.body.url;
      fileName = req.body.fileName;
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
    // Assume user is authenticated and user ID is available on req.user.id
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
router.delete('/files/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete embeddings first
    await deleteFileEmbeddings(fileId, userId);

    // Delete file metadata and physical file
    await deleteFile(fileId, userId);

    res.status(200).json({ message: 'File and embeddings deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete file and embeddings.' });
  }
});

// POST /api/ask-file/:fileId
router.post('/ask-file/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    const { question, chat_history, provider = 'openai', model = 'gpt-4o', temperature = 0.7, strategy = 'single-shot', feedback } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // 1. Retrieve user memory and chat context
    let userMemory = {};
    let chatContext = {};
    try {
      userMemory = await getUserMemory(userId);
      chatContext = await getChatContext(fileId + ':' + userId); // sessionId = fileId:userId
    } catch (e) { /* ignore for now */ }

    // 2. Query file_embeddings for this user and file
    const { data: chunksRaw, error } = await supabase
      .from('file_embeddings')
      .select('chunk_text, embedding_vector')
      .eq('file_id', fileId)
      .eq('user_id', userId);
    const chunks = chunksRaw || [];
    if (error) return res.status(500).json({ error: error.message });
    if (!chunks || chunks.length === 0) return res.status(404).json({ error: 'No embeddings found for this file.' });

    // 3. Retrieve top-K relevant chunks (simple cosine sim, can optimize later)
    const contextChunks = Array.isArray(chunks) ? chunks.map((c: any) => c.chunk_text) : [];
    const context = contextChunks.slice(0, 5).join('\n---\n');

    // 4. Build prompt with memory/context
    const systemPrompt = `You are an AI assistant. Use the following context from uploaded documents, user memory, and chat context to answer the user's query accurately. If the answer isn't found, say you don't know.\n\nUser Memory:\n${JSON.stringify(userMemory)}\n\nChat Context:\n${JSON.stringify(chatContext)}\n\nContext:\n${context}\n\nUser Question:\n${question}`;

    // 5. Call LLM via router
    const start = Date.now();
    const llmResponse = await callLLM({
      provider,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...((chat_history || []).map((m: any) => ({ role: m.role, content: m.content }))),
        { role: 'user', content: question }
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
    await logLLMCall({ provider, model, latency, cost: 0, userId, taskType: 'file_qa' });

    // 11. Return answer, hallucination, and issues
    res.json({
      answer: content,
      hallucination,
      issues: safety.issues,
      model,
      provider,
      latency,
      contextUsed: contextChunks.slice(0, 5),
      feedback: feedback || null
    });
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
    // 1. Embed the query
    const openaiApiKey = process.env['OPENAI_API_KEY'];
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small'
      })
    });
    const embeddingJson: any = await embeddingRes.json();
    if (!embeddingRes.ok) return res.status(500).json({ error: embeddingJson.error?.message || 'Failed to get query embedding' });
    if (!embeddingJson.data || !embeddingJson.data[0] || !embeddingJson.data[0].embedding) {
      return res.status(500).json({ error: 'OpenAI embedding API did not return a valid embedding' });
    }
    const queryEmbedding = embeddingJson.data[0].embedding;
    // 2. Call Supabase RPC for semantic search
    const { data: chunks, error }: { data?: any[]; error?: any } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_count: k,
      user_id,
      file_id: file_id || null
    });
    if (error) return res.status(500).json({ error: 'Failed to fetch relevant chunks' });
    res.json({ chunks });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/ask-file-stream/:fileId
router.post('/ask-file-stream/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user?.id;
    const { question, chat_history } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!question) return res.status(400).json({ error: 'Question is required' });

    // 1. Query file_embeddings for this user and file (reuse logic)
    const { data: chunks, error } = await supabase
      .from('file_embeddings')
      .select('chunk_text, embedding_vector, chunk_index, file_id, file_name')
      .eq('file_id', fileId)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    if (!chunks || chunks.length === 0) return res.status(404).json({ error: 'No embeddings found for this file.' });

    // 2. Get embedding for the question
    const openaiApiKey = process.env['OPENAI_API_KEY'];
    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        input: question,
        model: 'text-embedding-3-small'
      })
    });
    const embeddingJson: any = await embeddingRes.json();
    if (!embeddingRes.ok) return res.status(500).json({ error: embeddingJson.error?.message || 'Failed to get question embedding' });
    if (!embeddingJson.data || !embeddingJson.data[0] || !embeddingJson.data[0].embedding) {
      return res.status(500).json({ error: 'OpenAI embedding API did not return a valid embedding' });
    }
    const questionEmbedding = embeddingJson.data[0].embedding;

    // 3. Compute cosine similarity and get top K
    function cosineSim(a: number[], b: number[]): number {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    const scored = chunks.map(chunk => ({
      ...chunk,
      score: cosineSim(questionEmbedding, chunk.embedding_vector)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, 5);

    // 4. Build dynamic prompt
    const { prompt: dynamicPrompt } = buildDynamicContext({
      topChunks: topK,
      chatHistory: chat_history || [],
      userQuery: question,
      model: 'gpt-4o',
      maxTokens: 8000
    });

    // 5. Call GPT and stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
      const gptStream = await callGPT({
        prompt: dynamicPrompt,
        user_id: userId,
        model: 'gpt-4o',
        stream: true
      });
      gptStream.pipe(res);
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Failed to get GPT response' })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`);
    res.end();
  }
});

export default router; 
import express from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { vectorService } from '../services/vectorService.js';
import { logger } from '../utils/logger.js';
import { validateChatRequest } from '../middleware/validation.js';
import { cacheService } from '../services/cacheService.js';

const router = express.Router();

// Initialize OpenAI services
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
  streaming: true,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
});

// Chat prompt template
const chatPromptTemplate = PromptTemplate.fromTemplate(`
You are an advanced AI assistant with access to uploaded documents and training data. 
Use the provided context to answer questions accurately and helpfully.

Context from uploaded documents:
{context}

Conversation history:
{history}

Current question: {question}

Instructions:
- Answer based on the provided context when relevant
- If the context doesn't contain relevant information, use your general knowledge
- Be conversational and helpful
- Cite specific information from the context when applicable
- If you're unsure about something, say so

Answer:
`);

// POST /api/chat - Main chat endpoint
router.post('/', validateChatRequest, async (req, res) => {
  try {
    const { message, conversationHistory = [], useContext = true } = req.body;
    
    logger.info(`Chat request received: ${message.substring(0, 100)}...`);

    // Check cache first
    const cacheKey = `chat:${message}:${JSON.stringify(conversationHistory)}`;
    const cachedResponse = cacheService.get(cacheKey);
    
    if (cachedResponse) {
      logger.info('Returning cached response');
      return res.json({
        response: cachedResponse,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Set up SSE headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    let context = '';
    let retrievedDocs = [];

    // Retrieve relevant context from vector store if enabled
    if (useContext) {
      try {
        const similarityThreshold = parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD) || 0.7;
        const maxResults = parseInt(process.env.MAX_RETRIEVAL_RESULTS) || 5;
        
        retrievedDocs = await vectorService.similaritySearch(message, maxResults);
        
        if (retrievedDocs.length > 0) {
          context = retrievedDocs
            .filter(doc => doc.score >= similarityThreshold)
            .map(doc => `Document: ${doc.metadata.filename || 'Unknown'}\nContent: ${doc.content}`)
            .join('\n\n');
          
          logger.info(`Retrieved ${retrievedDocs.length} relevant documents`);
        }
      } catch (error) {
        logger.warn('Error retrieving context from vector store:', error.message);
        // Continue without context
      }
    }

    // Format conversation history
    const history = conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Create the chain
    const chain = RunnableSequence.from([
      chatPromptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Stream the response
    let fullResponse = '';
    const stream = await chain.stream({
      context: context || 'No specific context available.',
      history: history || 'No previous conversation.',
      question: message,
    });

    // Send initial metadata
    res.write(`data: ${JSON.stringify({
      type: 'metadata',
      retrievedDocs: retrievedDocs.length,
      hasContext: context.length > 0,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Stream response chunks
    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({
        type: 'chunk',
        content: chunk
      })}\n\n`);
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      fullResponse,
      metadata: {
        retrievedDocs: retrievedDocs.length,
        hasContext: context.length > 0,
        responseLength: fullResponse.length
      }
    })}\n\n`);

    res.write('data: [DONE]\n\n');
    res.end();

    // Cache the response
    if (fullResponse.length > 0) {
      cacheService.set(cacheKey, fullResponse);
    }

    logger.info(`Chat response completed. Length: ${fullResponse.length} characters`);

  } catch (error) {
    logger.error('Error in chat endpoint:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to complete response'
      })}\n\n`);
      res.end();
    }
  }
});

// POST /api/chat/simple - Non-streaming chat endpoint
router.post('/simple', validateChatRequest, async (req, res) => {
  try {
    const { message, conversationHistory = [], useContext = true } = req.body;
    
    logger.info(`Simple chat request: ${message.substring(0, 100)}...`);

    let context = '';
    
    if (useContext) {
      try {
        const retrievedDocs = await vectorService.similaritySearch(message, 3);
        if (retrievedDocs.length > 0) {
          context = retrievedDocs
            .map(doc => doc.content)
            .join('\n\n');
        }
      } catch (error) {
        logger.warn('Error retrieving context:', error.message);
      }
    }

    const history = conversationHistory
      .slice(-5)
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = await chatPromptTemplate.format({
      context: context || 'No specific context available.',
      history: history || 'No previous conversation.',
      question: message,
    });

    const response = await llm.invoke(prompt);
    
    res.json({
      response: response.content,
      metadata: {
        hasContext: context.length > 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in simple chat endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat request'
    });
  }
});

// GET /api/chat/context/:query - Get relevant context for a query
router.get('/context/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    const results = await vectorService.similaritySearch(query, limit);
    
    res.json({
      query,
      results: results.map(doc => ({
        content: doc.content.substring(0, 500) + '...',
        score: doc.score,
        metadata: doc.metadata
      })),
      count: results.length
    });

  } catch (error) {
    logger.error('Error retrieving context:', error);
    res.status(500).json({
      error: 'Failed to retrieve context',
      message: error.message
    });
  }
});

export default router;
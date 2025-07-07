import { vectorService } from './vectorService';
import { documentProcessor } from './documentProcessor';
import { logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { SecurityUtils } from '../utils/security';
import { callLLM, generateEmbeddings } from '../llm';

interface SmartBrainConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  embeddingModel: string;
  maxContextLength: number;
  similarityThreshold: number;
  maxRetrievedDocuments: number;
}

interface ChatContext {
  userId: string;
  sessionId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  uploadedFiles: Array<{
    fileId: string;
    filename: string;
    fileType: string;
    uploadDate: Date;
    documentCount: number;
  }>;
  currentMode: 'general' | 'document' | 'hybrid';
}

interface BrainResponse {
  response: string;
  context: {
    retrievedDocuments: Array<{
      content: string;
      source: string;
      relevance: number;
      metadata: Record<string, any>;
    }>;
    reasoning: string;
    confidence: number;
    mode: 'general' | 'document' | 'hybrid';
  };
  metadata: {
    processingTime: number;
    tokensUsed: number;
    modelUsed: string;
    timestamp: Date;
  };
}

interface DocumentAnalysis {
  fileId: string;
  filename: string;
  summary: string;
  keyTopics: string[];
  documentType: string;
  wordCount: number;
  chunkCount: number;
  uploadDate: Date;
}

export class SmartBrainService {
  private config: SmartBrainConfig;
  private activeSessions: Map<string, ChatContext> = new Map();
  private documentAnalytics: Map<string, DocumentAnalysis> = new Map();

  constructor() {
    this.config = {
      model: process.env['OPENAI_MODEL'] || 'gpt-4o',
      temperature: parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.7'),
      maxTokens: parseInt(process.env['OPENAI_MAX_TOKENS'] || '4000'),
      embeddingModel: process.env['OPENAI_EMBEDDING_MODEL'] || 'text-embedding-3-small',
      maxContextLength: parseInt(process.env['MAX_CONTEXT_LENGTH'] || '8000'),
      similarityThreshold: parseFloat(process.env['SIMILARITY_THRESHOLD'] || '0.7'),
      maxRetrievedDocuments: parseInt(process.env['MAX_RETRIEVED_DOCUMENTS'] || '5')
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    const timer = PerformanceMonitor.startTimer('smartBrainInitialize');
    
    try {
      const openAIApiKey = process.env['OPENAI_API_KEY'];
      if (!openAIApiKey) {
        throw new Error('OPENAI_API_KEY is required for Smart Brain service');
      }

      logger.info('🧠 Smart Brain Service initialized successfully');
      logger.info(`📊 Configuration: Model=${this.config.model}, Temp=${this.config.temperature}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize Smart Brain service:', errorMessage);
      throw new Error(`Smart Brain initialization failed: ${errorMessage}`);
    } finally {
      timer();
    }
  }

  /**
   * Main method to process user messages with Smart Brain intelligence
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId: string,
    options?: {
      mode?: 'general' | 'document' | 'hybrid';
      fileFilter?: string[];
      includeHistory?: boolean;
    }
  ): Promise<BrainResponse> {
    const timer = PerformanceMonitor.startTimer('smartBrainProcessMessage');
    
    try {
      // Get or create session context
      const context = this.getOrCreateSession(userId, sessionId);
      
      // Determine processing mode
      const mode = options?.mode || this.determineMode(message, context);
      context.currentMode = mode;

      // Add user message to history
      context.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      let response: BrainResponse;

      switch (mode) {
        case 'document':
          response = await this.processDocumentQuery(message, context, options);
          break;
        case 'hybrid':
          response = await this.processHybridQuery(message, context, options);
          break;
        default:
          response = await this.processGeneralQuery(message, context);
      }

      // Add assistant response to history
      context.conversationHistory.push({
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: {
          mode: response.context.mode,
          confidence: response.context.confidence,
          documentsUsed: response.context.retrievedDocuments.length
        }
      });

      // Update session
      this.activeSessions.set(sessionId, context);

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Smart Brain processing error:', errorMessage);
      throw new Error(`Smart Brain processing failed: ${errorMessage}`);
    } finally {
      timer();
    }
  }

  /**
   * Process document-specific queries using RAG
   */
  private async processDocumentQuery(
    message: string,
    context: ChatContext,
    options?: { fileFilter?: string[] }
  ): Promise<BrainResponse> {
    const startTime = Date.now();

    // Retrieve relevant documents
    const retrievedDocs = await this.retrieveRelevantDocuments(message, context, options?.fileFilter);
    
    if (retrievedDocs.length === 0) {
      return {
        response: "I don't have any relevant documents to answer your question. Please upload some files first or ask a general question.",
        context: {
          retrievedDocuments: [],
          reasoning: "No relevant documents found in vector store",
          confidence: 0.1,
          mode: 'document'
        },
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          modelUsed: this.config.model,
          timestamp: new Date()
        }
      };
    }

    // Build context from retrieved documents
    const documentContext = this.buildDocumentContext(retrievedDocs);
    
    // Generate response using LLM
    const response = await this.generateResponseWithContext(message, documentContext, context);

    return {
      response: response.content,
      context: {
        retrievedDocuments: retrievedDocs.map(doc => ({
          content: doc.pageContent,
          source: doc.metadata.source || 'Unknown',
          relevance: doc.metadata.relevance || 0.8,
          metadata: doc.metadata
        })),
        reasoning: `Retrieved ${retrievedDocs.length} relevant documents and generated response using ${this.config.model}`,
        confidence: this.calculateConfidence(retrievedDocs),
        mode: 'document'
      },
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: response.tokenUsage?.totalTokens || 0,
        modelUsed: this.config.model,
        timestamp: new Date()
      }
    };
  }

  /**
   * Process hybrid queries (general + document context)
   */
  private async processHybridQuery(
    message: string,
    context: ChatContext,
    options?: { fileFilter?: string[] }
  ): Promise<BrainResponse> {
    const startTime = Date.now();

    // Retrieve relevant documents
    const retrievedDocs = await this.retrieveRelevantDocuments(message, context, options?.fileFilter);
    
    // Build hybrid context (general knowledge + documents)
    const hybridContext = this.buildHybridContext(message, retrievedDocs, context);
    
    // Generate response
    const response = await this.generateResponseWithContext(message, hybridContext, context);

    return {
      response: response.content,
      context: {
        retrievedDocuments: retrievedDocs.map(doc => ({
          content: doc.pageContent,
          source: doc.metadata.source || 'Unknown',
          relevance: doc.metadata.relevance || 0.8,
          metadata: doc.metadata
        })),
        reasoning: `Combined general knowledge with ${retrievedDocs.length} relevant documents`,
        confidence: this.calculateConfidence(retrievedDocs),
        mode: 'hybrid'
      },
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: response.tokenUsage?.totalTokens || 0,
        modelUsed: this.config.model,
        timestamp: new Date()
      }
    };
  }

  /**
   * Process general conversational queries
   */
  private async processGeneralQuery(
    message: string,
    context: ChatContext
  ): Promise<BrainResponse> {
    const startTime = Date.now();

    // Generate general response
    const response = await this.generateGeneralResponse(message, context);

    return {
      response: response.content,
      context: {
        retrievedDocuments: [],
        reasoning: "Generated response using general knowledge and conversation history",
        confidence: 0.9,
        mode: 'general'
      },
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: response.tokenUsage?.totalTokens || 0,
        modelUsed: this.config.model,
        timestamp: new Date()
      }
    };
  }

  /**
   * Retrieve relevant documents using vector similarity search
   */
  private async retrieveRelevantDocuments(
    query: string,
    context: ChatContext,
    fileFilter?: string[]
  ): Promise<any[]> {
    try {
      // Build filter for specific files if provided
      const filter: Record<string, any> = {};
      if (fileFilter && fileFilter.length > 0) {
        filter.filename = { $in: fileFilter };
      }
      if (context.userId) {
        filter.userId = context.userId;
      }

      // Perform similarity search
      const results = await vectorService.similaritySearchWithScore(
        query,
        this.config.maxRetrievedDocuments,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      // Filter by similarity threshold
      const filteredResults = results
        .filter(([_, score]) => score >= this.config.similarityThreshold)
        .map(([doc, score]) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            relevance: score
          }
        }));

      logger.info(`Retrieved ${filteredResults.length} relevant documents for query: "${query}"`);
      return filteredResults;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error retrieving relevant documents:', errorMessage);
      return [];
    }
  }

  /**
   * Build context from retrieved documents
   */
  private buildDocumentContext(documents: any[]): string {
    if (documents.length === 0) return '';

    const contextParts = documents.map((doc, index) => {
      const source = doc.metadata?.filename || doc.metadata?.source || 'Document';
      const relevance = doc.metadata?.relevance || 0.8;
      return `[Document ${index + 1} - ${source} (Relevance: ${(relevance * 100).toFixed(1)}%)]:\n${doc.pageContent}`;
    });

    return contextParts.join('\n\n');
  }

  /**
   * Build hybrid context combining general knowledge and documents
   */
  private buildHybridContext(
    message: string,
    documents: any[],
    context: ChatContext
  ): string {
    const documentContext = this.buildDocumentContext(documents);
    const conversationContext = this.buildConversationContext(context);
    
    return `You are an intelligent AI assistant with access to both general knowledge and specific documents. 

${documentContext ? `Relevant document information:\n${documentContext}\n\n` : ''}
${conversationContext ? `Recent conversation context:\n${conversationContext}\n\n` : ''}

Please provide a comprehensive answer that combines general knowledge with the specific document information when relevant.`;
  }

  /**
   * Build conversation context from recent history
   */
  private buildConversationContext(context: ChatContext): string {
    const recentMessages = context.conversationHistory
      .slice(-6) // Last 6 messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    return recentMessages;
  }

  /**
   * Generate response with context using LLM
   */
  private async generateResponseWithContext(
    message: string,
    context: string,
    chatContext: ChatContext
  ): Promise<any> {
    const systemPrompt = `You are an intelligent AI assistant with access to specific document information. 

${context ? `Context Information:\n${context}\n\n` : ''}

Instructions:
1. Answer the user's question based on the provided context
2. If the context contains relevant information, use it to provide specific, accurate answers
3. If the context doesn't contain relevant information, acknowledge this and provide a general response
4. Always cite the source documents when using their information
5. Be conversational and helpful
6. If you're unsure about something, say so rather than guessing

User Question: ${message}`;

    try {
      const response = await callLLM({
        provider: 'openai',
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating response with context:', errorMessage);
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  }

  /**
   * Generate general conversational response
   */
  private async generateGeneralResponse(
    message: string,
    context: ChatContext
  ): Promise<any> {
    const conversationHistory = context.conversationHistory
      .slice(-10) // Last 10 messages
      .map(msg => ({ role: msg.role, content: msg.content }));

    const systemPrompt = `You are a helpful, intelligent AI assistant. You can engage in general conversation, answer questions, and provide assistance on a wide range of topics. Be conversational, friendly, and helpful.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await callLLM({
        provider: 'openai',
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating general response:', errorMessage);
      throw new Error(`Failed to generate general response: ${errorMessage}`);
    }
  }

  /**
   * Determine the processing mode based on message and context
   */
  private determineMode(message: string, context: ChatContext): 'general' | 'document' | 'hybrid' {
    const hasUploadedFiles = context.uploadedFiles.length > 0;
    
    // Check for document-specific keywords
    const documentKeywords = [
      'document', 'file', 'upload', 'pdf', 'docx', 'content', 'information',
      'data', 'report', 'analysis', 'find', 'search', 'what does it say',
      'according to', 'in the document', 'from the file'
    ];

    const hasDocumentKeywords = documentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    if (hasUploadedFiles && hasDocumentKeywords) {
      return 'document';
    } else if (hasUploadedFiles) {
      return 'hybrid';
    } else {
      return 'general';
    }
  }

  /**
   * Calculate confidence based on retrieved documents
   */
  private calculateConfidence(documents: any[]): number {
    if (documents.length === 0) return 0.1;
    
    const avgRelevance = documents.reduce((sum, doc) => 
      sum + (doc.metadata?.relevance || 0.8), 0
    ) / documents.length;
    
    return Math.min(avgRelevance, 0.95);
  }

  /**
   * Get or create session context
   */
  private getOrCreateSession(userId: string, sessionId: string): ChatContext {
    if (!this.activeSessions.has(sessionId)) {
      const newContext: ChatContext = {
        userId,
        sessionId,
        conversationHistory: [],
        uploadedFiles: [],
        currentMode: 'general'
      };
      this.activeSessions.set(sessionId, newContext);
    }
    
    return this.activeSessions.get(sessionId)!;
  }

  /**
   * Add uploaded file to session context
   */
  async addUploadedFile(
    sessionId: string,
    fileInfo: {
      fileId: string;
      filename: string;
      fileType: string;
      documentCount: number;
    }
  ): Promise<void> {
    const context = this.activeSessions.get(sessionId);
    if (context) {
      context.uploadedFiles.push({
        ...fileInfo,
        uploadDate: new Date()
      });
      this.activeSessions.set(sessionId, context);
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    messageCount: number;
    fileCount: number;
    currentMode: string;
    lastActivity: Date | null;
  } {
    const context = this.activeSessions.get(sessionId);
    if (!context) {
      return {
        messageCount: 0,
        fileCount: 0,
        currentMode: 'general',
        lastActivity: null
      };
    }

    return {
      messageCount: context.conversationHistory.length,
      fileCount: context.uploadedFiles.length,
      currentMode: context.currentMode,
      lastActivity: context.conversationHistory.length > 0 
        ? context.conversationHistory[context.conversationHistory.length - 1].timestamp 
        : null
    };
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'error' | 'initializing';
    llmAvailable: boolean;
    embeddingsAvailable: boolean;
    vectorStoreAvailable: boolean;
    activeSessions: number;
  } {
    return {
      status: vectorService.isServiceAvailable() ? 'healthy' : 'error',
      llmAvailable: true,
      embeddingsAvailable: true,
      vectorStoreAvailable: vectorService.isServiceAvailable(),
      activeSessions: this.activeSessions.size
    };
  }
}

// Export singleton instance
export const smartBrainService = new SmartBrainService(); 
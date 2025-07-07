import { Message, TrainingData } from '../types';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { SecurityUtils } from '../utils/security';
import { cacheService } from './cacheService';
import { errorTrackingService } from './errorTrackingService';

interface SmartBrainConfig {
  endpoint: string;
  timeout: number;
  streaming: boolean;
  sessionId?: string;
  mode?: 'general' | 'document' | 'hybrid' | 'auto';
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
  sessionId: string;
}

class ChatService {
  private apiConfig: SmartBrainConfig = {
    endpoint: process.env.VITE_API_URL || 'http://localhost:3001/api/chat',
    timeout: 30000,
    streaming: true
  };

  private trainingData: TrainingData[] = [];
  private sessionId: string | null = null;

  constructor() {
    this.loadApiConfig();
    this.generateSessionId();
  }

  private generateSessionId(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadApiConfig(): void {
    try {
      const saved = localStorage.getItem('chatbot-api-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.apiConfig = { ...this.apiConfig, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    }
  }

  private saveApiConfig(): void {
    try {
      localStorage.setItem('chatbot-api-config', JSON.stringify(this.apiConfig));
    } catch (error) {
      console.error('Failed to save API config:', error);
    }
  }

  async sendMessage(
    message: string, 
    conversationHistory: Message[],
    options?: {
      mode?: 'general' | 'document' | 'hybrid' | 'auto';
      fileFilter?: string[];
      sessionId?: string;
      provider?: string;
      model?: string;
      temperature?: number;
      strategy?: string;
    }
  ): Promise<Message> {
    const timer = PerformanceMonitor.startTimer('sendMessage');
    
    try {
      // Add breadcrumb for debugging
      errorTrackingService.addBreadcrumb('chat', 'Sending message', { 
        messageLength: message.length,
        mode: options?.mode || 'auto'
      });

      // Check cache first for similar messages
      const cacheKey = `message_response_${SecurityUtils.hashString(message)}`;
      const cachedResponse = await cacheService.get('chat', cacheKey);
      
      if (cachedResponse) {
        console.log('📦 Using cached response');
        return cachedResponse as Message;
      }

      // Create user message
      const userMessage: Message = {
        id: SecurityUtils.generateSecureId(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
        intent: 'general',
        metadata: {}
      };

      // Add to current conversation
      if (conversationHistory) {
        conversationHistory.push(userMessage);
      }

      // Make API call to Smart Brain backend
      const brainResponse = await this.makeSmartBrainRequest(message, conversationHistory, options);

      // Create bot message from Smart Brain response
      const botMessage: Message = {
        id: SecurityUtils.generateSecureId(),
        content: brainResponse.response,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
        intent: brainResponse.context.mode,
        metadata: {
          brainResponse: brainResponse,
          confidence: brainResponse.context.confidence,
          documentsUsed: brainResponse.context.retrievedDocuments.length,
          processingTime: brainResponse.metadata.processingTime,
          modelUsed: brainResponse.metadata.modelUsed
        }
      };

      // Add bot message to conversation
      if (conversationHistory) {
        conversationHistory.push(botMessage);
      }

      // Cache the response
      await cacheService.set('chat', cacheKey, botMessage, {
        intent: botMessage.intent,
        confidence: brainResponse.context.confidence,
        documentsUsed: brainResponse.context.retrievedDocuments.length,
        timestamp: new Date().toISOString()
      });

      timer();
      return botMessage;

    } catch (error: unknown) {
      timer();
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), {
        component: 'chatService',
        severity: 'high',
        tags: ['smart-brain', 'message-processing']
      });

      // Fallback to local processing
      console.warn('Smart Brain unavailable, using fallback response');
      return this.processMessageLocally(message, conversationHistory);
    }
  }

  private async makeSmartBrainRequest(
    message: string, 
    conversationHistory: Message[],
    options?: {
      mode?: 'general' | 'document' | 'hybrid' | 'auto';
      fileFilter?: string[];
      sessionId?: string;
      provider?: string;
      model?: string;
      temperature?: number;
      strategy?: string;
    }
  ): Promise<BrainResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout || 30000);

    try {
      const response = await fetch(this.apiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10), // Send last 10 messages for context
          sessionId: options?.sessionId || this.sessionId,
          mode: options?.mode || 'auto',
          fileFilter: options?.fileFilter,
          useContext: true,
          provider: options?.provider,
          model: options?.model,
          temperature: options?.temperature,
          strategy: options?.strategy
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Smart Brain API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data as BrainResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Streaming version for real-time responses
  async sendMessageStreaming(
    message: string,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    options?: {
      mode?: 'general' | 'document' | 'hybrid' | 'auto';
      fileFilter?: string[];
      sessionId?: string;
    }
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.apiConfig.timeout || 30000);

    try {
      const response = await fetch(`${this.apiConfig.endpoint}/smart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10),
          sessionId: options?.sessionId || this.sessionId,
          mode: options?.mode || 'auto',
          fileFilter: options?.fileFilter,
          useContext: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Smart Brain streaming request failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              reader.releaseLock();
              onComplete(fullResponse);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'response') {
                fullResponse = parsed.content;
                onChunk(parsed.content);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error || 'Streaming error');
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      clearTimeout(timeoutId);
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), {
        component: 'chatService',
        severity: 'medium',
        tags: ['smart-brain', 'streaming']
      });
      throw error;
    }
  }

  private async processMessageLocally(_message: string, _conversationHistory: Message[]): Promise<Message> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simple local fallback responses
    const responses = [
      "I'm currently running in offline mode. For full Smart Brain capabilities, please ensure the backend server is running on port 3001.",
      "Smart Brain service is not available. I can provide basic responses, but for advanced AI features with document learning, please start the server.",
      "I'm operating with limited functionality. To access the full Smart Brain with instant document learning and RAG capabilities, please run 'npm run dev:backend'.",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    return {
      id: SecurityUtils.generateSecureId(),
      content: response,
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent',
      intent: 'fallback_response'
    };
  }

  // Get Smart Brain status
  async getBrainStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.apiConfig.endpoint}/brain-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get brain status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get brain status:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get session statistics
  async getSessionStats(sessionId?: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiConfig.endpoint}/history?sessionId=${sessionId || this.sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get session stats: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Training methods with Web Worker integration
  async addTrainingData(input: string, expectedOutput: string, intent: string): Promise<TrainingData> {
    try {
      const response = await fetch(`${this.apiConfig.endpoint.replace('/chat', '/training')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          expectedOutput,
          intent,
          confidence: 0.98
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add training data: ${response.status}`);
      }

      const result = await response.json();
      
      const trainingData: TrainingData = {
        id: SecurityUtils.generateSecureId(),
        input,
        expectedOutput,
        intent,
        confidence: 0.98,
        dateAdded: new Date(),
        validationStatus: 'pending'
      };

      // Add to local array for immediate UI updates
      this.trainingData.push(trainingData);

      return trainingData;
    } catch (error) {
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), { 
        component: 'chatService', 
        severity: 'medium',
        tags: ['training-data']
      });
      throw error;
    }
  }

  async trainModel(onProgress?: (progress: any) => void): Promise<any> {
    const timer = PerformanceMonitor.startTimer('trainModel');
    
    try {
      errorTrackingService.addBreadcrumb('training', 'Starting model training');

      const trainingData = this.getTrainingData();
      
      if (trainingData.length === 0) {
        throw new Error('No training data available');
      }

      // Use Web Worker for model training
      const modelConfig = {
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        modelType: 'intent_classifier'
      };

      const { workerService } = await import('./workerService');
      const result = await workerService.trainModel(trainingData, modelConfig, onProgress);

      // Cache the trained model info
      await cacheService.set('models', `trained_${result.modelId}`, {
        ...result,
        trainingDataCount: trainingData.length,
        timestamp: new Date().toISOString()
      });

      timer();
      return result;

    } catch (error) {
      timer();
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), {
        component: 'chatService',
        severity: 'high',
        tags: ['training', 'model-training']
      });
      throw error;
    }
  }

  async optimizeHyperparameters(onProgress?: (progress: any) => void): Promise<any> {
    const timer = PerformanceMonitor.startTimer('optimizeHyperparameters');
    
    try {
      errorTrackingService.addBreadcrumb('training', 'Starting hyperparameter optimization');

      const trainingData = this.getTrainingData();
      
      if (trainingData.length === 0) {
        throw new Error('No training data available for optimization');
      }

      const optimizationConfig = {
        trials: 20,
        modelType: 'intent_classifier',
        searchSpace: {
          learningRate: [0.0001, 0.001, 0.01],
          batchSize: [16, 32, 64, 128],
          epochs: [5, 10, 15, 20],
          dropout: [0.1, 0.2, 0.3, 0.4]
        }
      };

      const { workerService } = await import('./workerService');
      const result = await workerService.optimizeHyperparameters(
        'intent_classifier',
        trainingData,
        optimizationConfig,
        onProgress
      );

      // Cache the optimization results
      await cacheService.set('optimization', `best_params_${Date.now()}`, {
        ...result,
        trainingDataCount: trainingData.length,
        timestamp: new Date().toISOString()
      });

      timer();
      return result;

    } catch (error) {
      timer();
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), {
        component: 'chatService',
        severity: 'high',
        tags: ['training', 'hyperparameter-optimization']
      });
      throw error;
    }
  }

  // Enhanced training data methods with validation
  private async syncTrainingDataToBackend(data: TrainingData): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/api/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: data.input,
          expectedOutput: data.expectedOutput,
          intent: data.intent,
          confidence: data.confidence
        }),
      });

      if (response.ok) {
        data.validationStatus = 'validated';
        data.validationScore = 0.95;
      } else {
        data.validationStatus = 'rejected';
      }
    } catch (error) {
      console.warn('Failed to sync training data to backend:', error);
      data.validationStatus = 'rejected';
    }
  }

  getTrainingData(): TrainingData[] {
    return [...this.trainingData];
  }

  async deleteTrainingData(id: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3001/api/training/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        this.trainingData = this.trainingData.filter(data => data.id !== id);
      }
    } catch (error) {
      console.error('Failed to delete training data:', error);
      throw error;
    }
  }

  async exportTrainingData(): Promise<string> {
    try {
      const response = await fetch('http://localhost:3001/api/training/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to export training data: ${response.status}`);
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export training data:', error);
      throw error;
    }
  }

  // Configuration methods
  updateApiConfig(config: Partial<SmartBrainConfig>): void {
    this.apiConfig = { ...this.apiConfig, ...config };
    this.saveApiConfig();
  }

  getApiConfig(): SmartBrainConfig {
    return { ...this.apiConfig };
  }

  // Session management
  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  generateNewSession(): void {
    this.generateSessionId();
  }

  private getUserId(): string {
    // Simple user identification - in a real app, this would come from auth
    return localStorage.getItem('chatbot-user-id') || 'anonymous';
  }
}

export const chatService = new ChatService();
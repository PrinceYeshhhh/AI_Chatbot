import { Message, ApiConfig, TrainingData, IntentClassificationResult } from '../types';
import { SecurityUtils } from '../utils/security';
import { PerformanceMonitor, timer } from '../utils/performanceMonitor';
import { workerService } from './workerService';
import { cacheService } from './cacheService';
import { errorTrackingService } from './errorTrackingService';

class ChatService {
  private apiConfig: ApiConfig = {
    endpoint: 'http://localhost:3001/api/chat',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 30000,
    retryAttempts: 3
  };

  private trainingData: TrainingData[] = [];
  private rateLimiter = SecurityUtils.createRateLimiter(10, 60000); // 10 requests per minute

  constructor() {
    this.loadTrainingData();
    this.loadApiConfig();
  }

  private loadTrainingData(): void {
    try {
      const saved = localStorage.getItem('chatbot-training-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.trainingData = parsed.map((item: any) => ({
            ...item,
            dateAdded: new Date(item.dateAdded)
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load training data:', error);
      this.trainingData = [];
    }
  }

  private saveTrainingData(): void {
    try {
      localStorage.setItem('chatbot-training-data', JSON.stringify(this.trainingData));
    } catch (error) {
      console.error('Failed to save training data:', error);
    }
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
    conversationHistory: Message[]
  ): Promise<Message> {
    const timer = PerformanceMonitor.startTimer('sendMessage');
    
    try {
      // Add breadcrumb for debugging
      errorTrackingService.addBreadcrumb('chat', 'Sending message', { messageLength: message.length });

      // Check cache first for similar messages
      const cacheKey = `message_response_${SecurityUtils.hashString(message)}`;
      const cachedResponse = await cacheService.get('chat', cacheKey);
      
      if (cachedResponse) {
        console.log('📦 Using cached response');
        return cachedResponse as Message;
      }

      // Use Web Worker for intent classification
      let intent = 'general';
      try {
        const intentResult = await workerService.classifyIntent(message);
        intent = intentResult.intent;
        console.log(`🎯 Intent classified: ${intent} (${(intentResult.confidence * 100).toFixed(1)}%)`);
      } catch (error) {
        console.warn('Intent classification failed, using fallback:', error);
        errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), { 
          component: 'chatService', 
          severity: 'low',
          tags: ['intent-classification']
        });
      }

      // Use Web Worker for entity extraction
      let entities: any[] = [];
      try {
        const entityResult = await workerService.extractEntities(message);
        entities = entityResult.entities;
        if (entities.length > 0) {
          console.log(`🏷️ Entities extracted: ${entities.map(e => e.entity).join(', ')}`);
        }
      } catch (error) {
        console.warn('Entity extraction failed:', error);
        errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), { 
          component: 'chatService', 
          severity: 'low',
          tags: ['entity-extraction']
        });
      }

      // Create user message
      const userMessage: Message = {
        id: SecurityUtils.generateSecureId(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
        intent,
        metadata: { entities }
      };

      // Add to current conversation
      if (conversationHistory) {
        conversationHistory.push(userMessage);
      }

      // Simulate bot response (replace with actual API call)
      const botMessage: Message = {
        id: SecurityUtils.generateSecureId(),
        content: `I understand you're asking about "${intent}". Here's a helpful response...`,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
        intent,
        metadata: { entities }
      };

      // Add bot message to conversation
      if (conversationHistory) {
        conversationHistory.push(botMessage);
      }

      // Cache the response
      await cacheService.set('chat', cacheKey, botMessage, {
        intent,
        entities: entities.length,
        timestamp: new Date().toISOString()
      });

      timer();
      return botMessage;

    } catch (error) {
      timer();
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), { 
        component: 'chatService', 
        severity: 'high',
        tags: ['send-message'],
        metadata: { messageLength: message.length }
      });
      
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeApiRequest(message: string, conversationHistory: Message[]): Promise<Response> {
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
          useContext: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async handleStreamingResponse(response: Response): Promise<Message> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk') {
                fullResponse += parsed.content;
              } else if (parsed.type === 'complete') {
                fullResponse = parsed.fullResponse;
                break;
              }
            } catch (e) {
              // Ignore parsing errors for individual chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      id: SecurityUtils.generateSecureId(),
      content: fullResponse || 'I apologize, but I encountered an issue processing your request.',
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent',
      intent: 'streaming_response'
    };
  }

  private async processMessageLocally(message: string, conversationHistory: Message[]): Promise<Message> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simple local fallback responses
    const responses = [
      "I'm currently running in offline mode. For full AI capabilities, please ensure the backend server is running on port 3001.",
      "Backend service is not available. I can provide basic responses, but for advanced AI features, please start the server.",
      "I'm operating with limited functionality. To access the full AI assistant with document processing and vector search, please run 'npm run dev:backend'.",
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

  // Training methods with Web Worker integration
  async addTrainingData(input: string, expectedOutput: string, intent: string): Promise<TrainingData> {
    const timer = PerformanceMonitor.startTimer('addTrainingData');
    
    try {
      errorTrackingService.addBreadcrumb('training', 'Adding training data', { 
        inputLength: input.length, 
        outputLength: expectedOutput.length,
        intent 
      });

      // Use Web Worker to process training data
      const processedData = await workerService.processTrainingData([{
        input,
        expectedOutput,
        intent,
        confidence: 0.98
      }]);

      const trainingData: TrainingData = {
        id: SecurityUtils.generateSecureId(),
        input,
        expectedOutput,
        intent,
        confidence: processedData.processedData[0]?.confidence || 0.98,
        dateAdded: new Date()
      };

      // Store in localStorage
      const existingData = this.getTrainingData();
      existingData.push(trainingData);
      localStorage.setItem('trainingData', JSON.stringify(existingData));

      // Cache the processed data
      await cacheService.set('training', `processed_${trainingData.id}`, processedData);

      timer();
      return trainingData;

    } catch (error) {
      timer();
      errorTrackingService.trackError(error instanceof Error ? error : new Error(String(error)), {
        component: 'chatService',
        severity: 'medium',
        tags: ['training', 'add-data'],
        metadata: { inputLength: input.length, intent }
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

      const result = await workerService.trainModel(trainingData, modelConfig, onProgress);

      // Cache the trained model info
      await cacheService.set('models', `trained_${result.modelId}`, {
        ...result,
        trainingDataCount: trainingData.length,
        timestamp: new Date().toISOString()
      });

      console.log(`🎯 Model trained successfully: ${result.modelId}`);
      console.log(`📊 Final accuracy: ${(result.finalAccuracy * 100).toFixed(1)}%`);
      console.log(`⏱️ Training time: ${(result.trainingTime / 1000).toFixed(1)}s`);

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

      console.log(`🎯 Hyperparameter optimization completed`);
      console.log(`📊 Best score: ${(result.bestScore * 100).toFixed(1)}%`);
      console.log(`⚙️ Best parameters:`, result.bestParams);

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

  removeTrainingData(id: string): void {
    this.trainingData = this.trainingData.filter(item => item.id !== id);
    this.saveTrainingData();
  }

  getTrainingData(): TrainingData[] {
    return [...this.trainingData]; // Return copy to prevent external modification
  }

  importTrainingData(data: TrainingData[]): void {
    // Validate imported data
    for (const item of data) {
      const validation = SecurityUtils.validateTrainingData(item.input, item.expectedOutput, item.intent);
      if (!validation.isValid) {
        throw new Error(`Invalid training data: ${validation.error}`);
      }
    }
    
    this.trainingData.push(...data);
    this.saveTrainingData();
  }

  exportTrainingData(): TrainingData[] {
    return [...this.trainingData];
  }

  updateApiConfig(config: Partial<ApiConfig>): void {
    // Validate API key if provided
    if (config.apiKey && !SecurityUtils.validateApiKey(config.apiKey)) {
      throw new Error('Invalid API key format');
    }

    this.apiConfig = { ...this.apiConfig, ...config };
    this.saveApiConfig();
  }

  getApiConfig(): ApiConfig {
    return { ...this.apiConfig }; // Return copy to prevent external modification
  }

  getTrainingStats() {
    const total = this.trainingData.length;
    const validated = this.trainingData.filter(item => item.validationStatus === 'validated').length;
    const pending = this.trainingData.filter(item => item.validationStatus === 'pending').length;
    const rejected = this.trainingData.filter(item => item.validationStatus === 'rejected').length;

    return {
      total,
      validated,
      pending,
      rejected,
      validationRate: total > 0 ? (validated / total) * 100 : 0
    };
  }

  private getUserId(): string {
    // Simple user identification - in a real app, this would come from auth
    return localStorage.getItem('chatbot-user-id') || 'anonymous';
  }

  // Performance monitoring
  getPerformanceStats() {
    return PerformanceMonitor.getPerformanceSummary();
  }

  // Security utilities
  validateApiKey(key: string): boolean {
    return SecurityUtils.validateApiKey(key);
  }

  maskApiKey(key: string): string {
    return SecurityUtils.maskApiKey(key);
  }
}

// Export singleton instance
export const chatService = new ChatService();
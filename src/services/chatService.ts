import { Message, ApiConfig, TrainingData } from '../types';
import { SecurityUtils } from '../utils/security';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { cacheService } from './cacheService';
import { errorTrackingService } from './errorTrackingService';
import { getEnvVar } from '../utils/env';

class ChatService {
  private apiConfig: ApiConfig = {
    endpoint: (getEnvVar('VITE_API_URL', 'https://your-backend-name.onrender.com') as string) + '/api/chat/dev',
    model: getEnvVar('VITE_OPENAI_MODEL', 'gpt-3.5-turbo') as string,
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 30000,
    retries: 3,
    streaming: true
  };

  private trainingData: TrainingData[] = [];
  private rateLimiter = SecurityUtils.createRateLimiter(10, 60000); // 10 requests per minute

  constructor() {
    this.loadApiConfig();

    if (!getEnvVar('VITE_API_URL')) {
      throw new Error('VITE_API_URL is not set. Please check your environment configuration.');
    }
    if (!getEnvVar('VITE_SUPABASE_URL')) {
      throw new Error('VITE_SUPABASE_URL is not set. Please check your environment configuration.');
    }
    if (!getEnvVar('VITE_SUPABASE_ANON_KEY')) {
      throw new Error('VITE_SUPABASE_ANON_KEY is not set. Please check your environment configuration.');
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

      // Make actual API call to backend
      const botMessage = await this.makeApiRequest(message, conversationHistory);

      // Add bot message to conversation
      if (conversationHistory) {
        conversationHistory.push(botMessage);
      }

      // Cache the response
      await cacheService.set('chat', cacheKey, botMessage, {
        intent: botMessage.intent,
        entities: (botMessage.metadata?.entities as any[])?.length || 0,
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

  private async makeApiRequest(message: string, conversationHistory: Message[]): Promise<Message> {
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

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
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
              return {
                id: SecurityUtils.generateSecureId(),
                content: fullResponse || 'I apologize, but I encountered an issue processing your request.',
                sender: 'bot',
                timestamp: new Date(),
                status: 'sent',
                intent: 'streaming_response'
              };
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'chunk') {
                fullResponse += parsed.content;
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      return {
        id: SecurityUtils.generateSecureId(),
        content: fullResponse || 'I apologize, but I encountered an issue processing your request.',
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent',
        intent: 'streaming_response'
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async processMessageLocally(_message: string, _conversationHistory: Message[]): Promise<Message> {
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

  async removeTrainingData(id: string): Promise<void> {
    try {
      // Remove from backend
      const response = await fetch(`${this.apiConfig.endpoint.replace('/chat', '/training')}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        console.warn(`Failed to remove training data from backend: ${response.status}`);
      }

      // Remove from local array
      this.trainingData = this.trainingData.filter(item => item.id !== id);
    } catch (error) {
      console.warn('Failed to remove training data:', error);
      // Still remove from local array
      this.trainingData = this.trainingData.filter(item => item.id !== id);
    }
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
  }

  async exportTrainingData(): Promise<TrainingData[]> {
    try {
      const response = await fetch(`${this.apiConfig.endpoint.replace('/chat', '/training')}/export`);
      
      if (response.ok) {
        const data = await response.json();
        return data.trainingData || this.trainingData;
      }
    } catch (error) {
      console.warn('Failed to export from backend, using local data:', error);
    }
    
    return this.trainingData;
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

  async getTrainingStats() {
    try {
      const response = await fetch(`${this.apiConfig.endpoint.replace('/chat', '/training')}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to get training stats: ${response.status}`);
      }

      const stats = await response.json();
      
      return {
        total: stats.training?.totalExamples || this.trainingData.length,
        validated: Math.floor((stats.training?.totalExamples || this.trainingData.length) * 0.8),
        pending: Math.floor((stats.training?.totalExamples || this.trainingData.length) * 0.15),
        rejected: Math.floor((stats.training?.totalExamples || this.trainingData.length) * 0.05),
        validationRate: 80
      };
    } catch (error) {
      console.warn('Failed to get training stats from backend, using local data:', error);
      
      // Fallback to local data
      return {
        total: this.trainingData.length,
        validated: Math.floor(this.trainingData.length * 0.8),
        pending: Math.floor(this.trainingData.length * 0.15),
        rejected: Math.floor(this.trainingData.length * 0.05),
        validationRate: 80
      };
    }
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

  /**
   * Upload one or more files to the backend and handle errors uniformly, with progress and 207 support
   */
  async uploadFiles(files: File[], onProgress?: (percent: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${getEnvVar('VITE_API_URL', 'http://localhost:3001') as string}/api/upload`;
      xhr.open('POST', url);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        try {
          const result = JSON.parse(xhr.responseText);
          if (xhr.status === 207) {
            resolve(result);
          } else if (xhr.status >= 200 && xhr.status < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || `Upload failed: ${xhr.status}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse upload response.'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error: Unable to reach the server. Please check your connection.'));
      };

      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      xhr.send(formData);
    });
  }
}

// Export singleton instance with lazy initialization
let chatServiceInstance: ChatService | null = null;

export const chatService = new Proxy({} as ChatService, {
  get(target, prop) {
    if (!chatServiceInstance) {
      chatServiceInstance = new ChatService();
    }
    return chatServiceInstance[prop as keyof ChatService];
  }
});
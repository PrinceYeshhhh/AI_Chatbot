import { Message, ApiConfig, TrainingData, IntentClassificationResult } from '../types';
import { SecurityUtils } from '../utils/security';
import { PerformanceMonitor, timer } from '../utils/performanceMonitor';

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
    const performanceTimer = timer('sendMessage');
    
    try {
      // Security validation
      const sanitizedMessage = SecurityUtils.sanitizeInput(message);
      const validation = SecurityUtils.validateMessageContent(sanitizedMessage);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Rate limiting
      const userId = this.getUserId();
      if (!this.rateLimiter(userId)) {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
      }

      // Validate conversation history
      const historyValidation = SecurityUtils.validateConversationHistory(conversationHistory);
      if (!historyValidation.isValid) {
        throw new Error(historyValidation.error);
      }

      // Try backend API first
      const response = await this.makeApiRequest(sanitizedMessage, conversationHistory);
      
      if (response.ok) {
        // Handle streaming response
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          return await this.handleStreamingResponse(response);
        } else {
          // Handle simple JSON response
          const data = await response.json();
          return {
            id: SecurityUtils.generateSecureId(),
            content: data.response,
            sender: 'bot',
            timestamp: new Date(),
            status: 'sent',
            intent: 'api_response'
          };
        }
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('Backend API not available, using fallback:', error);
      
      // Fallback to local processing
      const sanitizedMessage = SecurityUtils.sanitizeInput(message);
      return this.processMessageLocally(sanitizedMessage, conversationHistory);
    } finally {
      performanceTimer();
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

  // Enhanced training data methods with validation
  addTrainingData(input: string, expectedOutput: string, intent: string): TrainingData {
    const performanceTimer = timer('addTrainingData');
    
    try {
      // Validate input
      const validation = SecurityUtils.validateTrainingData(input, expectedOutput, intent);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check for malicious content
      if (SecurityUtils.containsMaliciousContent(input) || SecurityUtils.containsMaliciousContent(expectedOutput)) {
        throw new Error('Training data contains potentially malicious content');
      }

      const newData: TrainingData = {
        id: SecurityUtils.generateSecureId(),
        input: input.trim(),
        expectedOutput: expectedOutput.trim(),
        intent: intent.trim(),
        confidence: 0.98,
        dateAdded: new Date(),
        validationStatus: 'pending'
      };

      this.trainingData.push(newData);
      this.saveTrainingData();
      
      // Try to send to backend
      this.syncTrainingDataToBackend(newData);
      
      return newData;
    } finally {
      performanceTimer();
    }
  }

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
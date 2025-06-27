import { Message, ApiConfig, TrainingData } from '../types';

class ChatService {
  private apiConfig: ApiConfig = {
    endpoint: 'http://localhost:3001/api/chat',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  };

  private trainingData: TrainingData[] = [];

  constructor() {
    this.loadTrainingData();
    this.loadApiConfig();
  }

  private loadTrainingData(): void {
    const saved = localStorage.getItem('chatbot-training-data');
    if (saved) {
      this.trainingData = JSON.parse(saved).map((item: any) => ({
        ...item,
        dateAdded: new Date(item.dateAdded)
      }));
    }
  }

  private saveTrainingData(): void {
    localStorage.setItem('chatbot-training-data', JSON.stringify(this.trainingData));
  }

  private loadApiConfig(): void {
    const saved = localStorage.getItem('chatbot-api-config');
    if (saved) {
      this.apiConfig = { ...this.apiConfig, ...JSON.parse(saved) };
    }
  }

  private saveApiConfig(): void {
    localStorage.setItem('chatbot-api-config', JSON.stringify(this.apiConfig));
  }

  async sendMessage(message: string, conversationHistory: Message[]): Promise<Message> {
    try {
      // Try backend API first
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
      });

      if (response.ok) {
        // Handle streaming response
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          return this.handleStreamingResponse(response);
        } else {
          // Handle simple JSON response
          const data = await response.json();
          return {
            id: Date.now().toString() + '_bot_' + Math.random().toString(36).substr(2, 9),
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
      return this.processMessageLocally(message, conversationHistory);
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
      id: Date.now().toString() + '_bot_' + Math.random().toString(36).substr(2, 9),
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
      id: Date.now().toString() + '_bot_' + Math.random().toString(36).substr(2, 9),
      content: response,
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent',
      intent: 'fallback_response'
    };
  }

  // Training data methods (kept for compatibility)
  addTrainingData(input: string, expectedOutput: string, intent: string): TrainingData {
    const newData: TrainingData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      input: input.trim(),
      expectedOutput: expectedOutput.trim(),
      intent: intent.trim(),
      confidence: 0.98,
      dateAdded: new Date()
    };

    this.trainingData.push(newData);
    this.saveTrainingData();
    
    // Try to send to backend
    this.syncTrainingDataToBackend(newData);
    
    return newData;
  }

  private async syncTrainingDataToBackend(data: TrainingData): Promise<void> {
    try {
      await fetch('http://localhost:3001/api/training', {
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
    } catch (error) {
      console.warn('Failed to sync training data to backend:', error);
    }
  }

  removeTrainingData(id: string): void {
    this.trainingData = this.trainingData.filter(item => item.id !== id);
    this.saveTrainingData();
  }

  getTrainingData(): TrainingData[] {
    return [...this.trainingData];
  }

  importTrainingData(data: TrainingData[]): void {
    this.trainingData = data.map(item => ({
      ...item,
      dateAdded: new Date(item.dateAdded)
    }));
    this.saveTrainingData();
  }

  exportTrainingData(): TrainingData[] {
    return this.getTrainingData();
  }

  updateApiConfig(config: Partial<ApiConfig>): void {
    this.apiConfig = { ...this.apiConfig, ...config };
    this.saveApiConfig();
  }

  getApiConfig(): ApiConfig {
    return { ...this.apiConfig };
  }

  getTrainingStats() {
    const intentCounts = new Map<string, number>();
    this.trainingData.forEach(item => {
      intentCounts.set(item.intent, (intentCounts.get(item.intent) || 0) + 1);
    });

    const avgConfidence = this.trainingData.reduce((sum, item) => sum + item.confidence, 0) / this.trainingData.length;

    return {
      totalExamples: this.trainingData.length,
      uniqueIntents: intentCounts.size,
      intentDistribution: Object.fromEntries(intentCounts),
      averageConfidence: avgConfidence || 0,
      exactMatches: this.trainingData.length, // Simplified for frontend
      keywordMatches: this.trainingData.length,
      lastTrainingUpdate: this.trainingData.length > 0 
        ? Math.max(...this.trainingData.map(d => d.dateAdded.getTime()))
        : null
    };
  }
}

export const chatService = new ChatService();
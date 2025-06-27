export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  intent?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingData {
  id: string;
  input: string;
  expectedOutput: string;
  intent: string;
  confidence: number;
  dateAdded: Date;
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}
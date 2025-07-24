export type MessageStatus = 'sending' | 'sent' | 'failed';
export type MessageSender = 'user' | 'bot';

export interface EvaluationResult {
  score: number;
  flagged: boolean;
  reason: string;
  maxSimilarity?: number;
}

export interface Message<T = Record<string, unknown>> {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  status?: MessageStatus;
  intent?: string;
  metadata?: T;
  // Multilingual and voice fields
  lang?: string; // Language code (e.g., 'en', 'es')
  voiceGender?: 'neutral' | 'female' | 'male';
  voiceRate?: number;
  voicePitch?: number;
  voiceProvider?: 'native' | 'elevenlabs';
  translatedFrom?: string; // Original language if translated
  // Evaluation and feedback
  evaluation?: EvaluationResult;
  userFeedback?: 'up' | 'down';
}

export interface Conversation<T = Record<string, unknown>> {
  id: string;
  title: string;
  messages: Message<T>[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: T;
}

export interface TrainingData {
  id: string;
  input: string;
  expectedOutput: string;
  intent: string;
  confidence: number;
  dateAdded: Date;
  validationStatus?: 'pending' | 'validated' | 'rejected';
  validationScore?: number;
}

export interface ApiConfig {
  endpoint: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout?: number;
  retryAttempts?: number;
}

export interface MLResult<T = unknown> {
  confidence: number;
  result: T;
  method: string;
  metadata?: Record<string, unknown>;
  processingTime?: number;
}

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
  method: string;
  alternatives: Array<{ intent: string; confidence: number }>;
  processingTime: number;
}

export interface EntityRecognitionResult {
  entity: string;
  type: string;
  position: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetric {
  label: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
}

export class AppError extends Error {
  public code: string;
  public details?: Record<string, unknown>;
  public timestamp: Date;

  constructor(data: { code: string; message: string; details?: Record<string, unknown>; timestamp?: Date }) {
    super(data.message);
    this.name = 'AppError';
    this.code = data.code;
    if (data.details) {
      this.details = data.details;
    }
    this.timestamp = data.timestamp || new Date();
  }
}

export interface ValidationSchema<T> {
  validate: (data: unknown) => data is T;
  errors?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
  accessCount: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  enableVoiceInput: boolean;
  enableAutoSave: boolean;
  maxConversationHistory: number;
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AppError;
  timestamp: Date;
  requestId: string;
}

export interface StreamingChunk {
  type: 'chunk' | 'complete' | 'error';
  content?: string;
  fullResponse?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}
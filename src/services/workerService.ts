import { PerformanceMonitor } from '../utils/performanceMonitor';

interface WorkerMessage {
  type: string;
  data: any;
  id: string;
}

interface WorkerResponse {
  type: string;
  data?: any;
  error?: string | undefined;
  id: string;
}

type WorkerCallback = (response: WorkerResponse) => void;

/**
 * Service for managing Web Worker communications
 * Handles heavy ML computations without blocking the UI
 */
class WorkerService {
  private worker: Worker | null = null;
  private callbacks: Map<string, WorkerCallback> = new Map();
  private isInitialized = false;
  private messageIdCounter = 0;

  /**
   * Initialize the Web Worker
   */
  public initialize(): void {
    if (this.isInitialized) return;

    try {
      this.worker = new Worker('/worker.js');
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      this.isInitialized = true;
      
      console.log('🚀 Web Worker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Web Worker:', error);
      throw new Error('Web Worker initialization failed');
    }
  }

  /**
   * Terminate the Web Worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.callbacks.clear();
      console.log('🛑 Web Worker terminated');
    }
  }

  /**
   * Send message to worker and return a promise
   */
  public async sendMessage<T = any>(
    type: string, 
    data: any, 
    timeout: number = 30000
  ): Promise<T> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Web Worker not initialized');
    }

    const messageId = this.generateMessageId();
    const timer = PerformanceMonitor.startTimer(`worker-${type}`);

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.callbacks.delete(messageId);
        reject(new Error(`Worker operation timed out: ${type}`));
      }, timeout);

      // Register callback
      this.callbacks.set(messageId, (response: WorkerResponse) => {
        clearTimeout(timeoutId);
        this.callbacks.delete(messageId);
        timer();

        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data as T);
        }
      });

      // Send message to worker
      this.worker!.postMessage({
        type,
        data,
        id: messageId
      });
    });
  }

  /**
   * Process training data in background
   */
  public async processTrainingData(
    trainingData: any[], 
    options: any = {}
  ): Promise<{
    processedData: any[];
    statistics: {
      totalExamples: number;
      averageConfidence: number;
      processingTime: number;
    };
  }> {
    return this.sendMessage('PROCESS_TRAINING_DATA', { trainingData, options });
  }

  /**
   * Compute embeddings for text
   */
  public async computeEmbeddings(
    text: string, 
    modelType: string = 'default'
  ): Promise<{
    embeddings: number[];
    modelType: string;
    processingTime: number;
    textLength: number;
  }> {
    return this.sendMessage('COMPUTE_EMBEDDINGS', { text, modelType });
  }

  /**
   * Train ML model with progress updates
   */
  public async trainModel(
    trainingData: any[], 
    modelConfig: any,
    onProgress?: (progress: any) => void
  ): Promise<{
    modelId: string;
    trainingTime: number;
    finalAccuracy: number;
    finalLoss: number;
    modelSize: number;
    config: any;
  }> {
    const messageId = this.generateMessageId();
    const timer = PerformanceMonitor.startTimer('worker-train-model');

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.callbacks.delete(messageId);
        reject(new Error('Model training timed out'));
      }, 300000); // 5 minutes timeout for training

      this.callbacks.set(messageId, (response: WorkerResponse) => {
        if (response.type === 'TRAINING_PROGRESS') {
          onProgress?.(response.data);
        } else if (response.type === 'MODEL_TRAINED') {
          clearTimeout(timeoutId);
          this.callbacks.delete(messageId);
          timer();
          resolve(response.data);
        } else if (response.error) {
          clearTimeout(timeoutId);
          this.callbacks.delete(messageId);
          timer();
          reject(new Error(response.error));
        }
      });

      this.worker!.postMessage({
        type: 'TRAIN_MODEL',
        data: { trainingData, modelConfig },
        id: messageId
      });
    });
  }

  /**
   * Classify intent with worker
   */
  public async classifyIntent(
    text: string, 
    context?: string
  ): Promise<{
    intent: string;
    confidence: number;
    processingTime: number;
    text: string;
    context?: string;
  }> {
    return this.sendMessage('CLASSIFY_INTENT', { text, context });
  }

  /**
   * Extract entities from text
   */
  public async extractEntities(text: string): Promise<{
    entities: Array<{
      entity: string;
      type: string;
      position: number;
      confidence: number;
    }>;
    processingTime: number;
    text: string;
  }> {
    return this.sendMessage('EXTRACT_ENTITIES', { text });
  }

  /**
   * Optimize hyperparameters with progress updates
   */
  public async optimizeHyperparameters(
    modelType: string,
    trainingData: any[],
    optimizationConfig: any,
    onProgress?: (progress: any) => void
  ): Promise<{
    bestParams: any;
    bestScore: number;
    optimizationTime: number;
    trials: number;
    modelType: string;
  }> {
    const messageId = this.generateMessageId();
    const timer = PerformanceMonitor.startTimer('worker-optimize-hyperparameters');

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.callbacks.delete(messageId);
        reject(new Error('Hyperparameter optimization timed out'));
      }, 600000); // 10 minutes timeout for optimization

      this.callbacks.set(messageId, (response: WorkerResponse) => {
        if (response.type === 'OPTIMIZATION_PROGRESS') {
          onProgress?.(response.data);
        } else if (response.type === 'HYPERPARAMETERS_OPTIMIZED') {
          clearTimeout(timeoutId);
          this.callbacks.delete(messageId);
          timer();
          resolve(response.data);
        } else if (response.error) {
          clearTimeout(timeoutId);
          this.callbacks.delete(messageId);
          timer();
          reject(new Error(response.error));
        }
      });

      this.worker!.postMessage({
        type: 'OPTIMIZE_HYPERPARAMETERS',
        data: { modelType, trainingData, optimizationConfig },
        id: messageId
      });
    });
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, type, data, error } = event.data;
    
    const callback = this.callbacks.get(id);
    if (callback) {
      callback({ type, data, error, id });
    } else {
      console.warn('Received worker message with no callback:', event.data);
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('❌ Web Worker error:', error);
    
    // Notify all pending callbacks of the error
    for (const [id, callback] of this.callbacks) {
      callback({
        type: 'ERROR',
        error: error.message || 'Worker error occurred',
        id
      });
    }
    
    this.callbacks.clear();
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${++this.messageIdCounter}_${Date.now()}`;
  }

  /**
   * Check if worker is available
   */
  public isAvailable(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  /**
   * Get worker status
   */
  public getStatus(): {
    isInitialized: boolean;
    isAvailable: boolean;
    pendingCallbacks: number;
  } {
    return {
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable(),
      pendingCallbacks: this.callbacks.size
    };
  }
}

// Export singleton instance
export const workerService = new WorkerService();

// Auto-initialize worker service
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  try {
    workerService.initialize();
  } catch (error) {
    console.warn('Web Worker initialization failed, falling back to main thread:', error);
  }
} 
// Web Worker for heavy ML computations
// This worker handles computationally expensive operations to prevent UI blocking

// Import the worker context
self.importScripts('/src/utils/mlWorkerUtils.js');

// Message handler for worker communication
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'PROCESS_TRAINING_DATA':
        processTrainingData(data, id);
        break;
      case 'COMPUTE_EMBEDDINGS':
        computeEmbeddings(data, id);
        break;
      case 'TRAIN_MODEL':
        trainModel(data, id);
        break;
      case 'CLASSIFY_INTENT':
        classifyIntent(data, id);
        break;
      case 'EXTRACT_ENTITIES':
        extractEntities(data, id);
        break;
      case 'OPTIMIZE_HYPERPARAMETERS':
        optimizeHyperparameters(data, id);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      id
    });
  }
};

// Process training data in background
function processTrainingData(data, id) {
  const { trainingData, options } = data;
  
  // Simulate heavy processing
  const startTime = performance.now();
  
  // Process each training example
  const processedData = trainingData.map((example, index) => {
    // Simulate processing time
    const processingTime = Math.random() * 10 + 5; // 5-15ms per example
    
    return {
      ...example,
      processed: true,
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    };
  });
  
  const totalTime = performance.now() - startTime;
  
  self.postMessage({
    type: 'TRAINING_DATA_PROCESSED',
    data: {
      processedData,
      statistics: {
        totalExamples: processedData.length,
        averageConfidence: processedData.reduce((sum, ex) => sum + ex.confidence, 0) / processedData.length,
        processingTime: totalTime
      }
    },
    id
  });
}

// Compute embeddings for text
function computeEmbeddings(data, id) {
  const { text, modelType = 'default' } = data;
  
  // Simulate embedding computation
  const startTime = performance.now();
  
  // Generate random embeddings (in real implementation, this would use actual ML models)
  const embeddingSize = modelType === 'large' ? 768 : 384;
  const embeddings = new Array(embeddingSize).fill(0).map(() => Math.random() * 2 - 1);
  
  // Normalize embeddings
  const magnitude = Math.sqrt(embeddings.reduce((sum, val) => sum + val * val, 0));
  const normalizedEmbeddings = embeddings.map(val => val / magnitude);
  
  const processingTime = performance.now() - startTime;
  
  self.postMessage({
    type: 'EMBEDDINGS_COMPUTED',
    data: {
      embeddings: normalizedEmbeddings,
      modelType,
      processingTime,
      textLength: text.length
    },
    id
  });
}

// Train ML model
function trainModel(data, id) {
  const { trainingData, modelConfig } = data;
  
  // Simulate model training
  const startTime = performance.now();
  
  // Simulate training epochs
  const epochs = modelConfig.epochs || 10;
  const batchSize = modelConfig.batchSize || 32;
  
  for (let epoch = 0; epoch < epochs; epoch++) {
    // Simulate epoch training
    const epochTime = Math.random() * 100 + 50; // 50-150ms per epoch
    
    // Report progress
    self.postMessage({
      type: 'TRAINING_PROGRESS',
      data: {
        epoch: epoch + 1,
        totalEpochs: epochs,
        progress: ((epoch + 1) / epochs) * 100,
        loss: Math.random() * 0.5 + 0.1, // Decreasing loss
        accuracy: Math.min(0.95, 0.7 + (epoch / epochs) * 0.25), // Increasing accuracy
        epochTime
      },
      id
    });
    
    // Simulate processing delay
    const delay = new Promise(resolve => setTimeout(resolve, epochTime));
    // Note: In a real implementation, you'd use actual training logic here
  }
  
  const totalTime = performance.now() - startTime;
  
  self.postMessage({
    type: 'MODEL_TRAINED',
    data: {
      modelId: `model_${Date.now()}`,
      trainingTime: totalTime,
      finalAccuracy: 0.92 + Math.random() * 0.05,
      finalLoss: 0.08 + Math.random() * 0.02,
      modelSize: trainingData.length * 0.1, // Simulated model size
      config: modelConfig
    },
    id
  });
}

// Classify intent
function classifyIntent(data, id) {
  const { text, context } = data;
  
  // Simulate intent classification
  const startTime = performance.now();
  
  // Simple keyword-based classification (in real implementation, use actual ML model)
  const intents = [
    { name: 'greeting', keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'] },
    { name: 'farewell', keywords: ['bye', 'goodbye', 'see you', 'take care'] },
    { name: 'question', keywords: ['what', 'how', 'why', 'when', 'where', 'who'] },
    { name: 'help', keywords: ['help', 'support', 'assist', 'guide'] },
    { name: 'complaint', keywords: ['problem', 'issue', 'error', 'bug', 'broken'] }
  ];
  
  const textLower = text.toLowerCase();
  let bestIntent = { name: 'general', confidence: 0.5 };
  
  for (const intent of intents) {
    const matches = intent.keywords.filter(keyword => textLower.includes(keyword));
    if (matches.length > 0) {
      const confidence = Math.min(0.95, 0.7 + matches.length * 0.1);
      if (confidence > bestIntent.confidence) {
        bestIntent = { name: intent.name, confidence };
      }
    }
  }
  
  const processingTime = performance.now() - startTime;
  
  self.postMessage({
    type: 'INTENT_CLASSIFIED',
    data: {
      intent: bestIntent.name,
      confidence: bestIntent.confidence,
      processingTime,
      text,
      context
    },
    id
  });
}

// Extract entities
function extractEntities(data, id) {
  const { text } = data;
  
  // Simulate entity extraction
  const startTime = performance.now();
  
  const entities = [];
  
  // Simple pattern matching (in real implementation, use NER model)
  const patterns = [
    { type: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    { type: 'url', pattern: /https?:\/\/[^\s]+/g },
    { type: 'phone', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
    { type: 'date', pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g }
  ];
  
  for (const { type, pattern } of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        entities.push({
          entity: match,
          type,
          position: text.indexOf(match),
          confidence: 0.8 + Math.random() * 0.2
        });
      }
    }
  }
  
  const processingTime = performance.now() - startTime;
  
  self.postMessage({
    type: 'ENTITIES_EXTRACTED',
    data: {
      entities,
      processingTime,
      text
    },
    id
  });
}

// Optimize hyperparameters
function optimizeHyperparameters(data, id) {
  const { modelType, trainingData, optimizationConfig } = data;
  
  // Simulate hyperparameter optimization
  const startTime = performance.now();
  
  const trials = optimizationConfig.trials || 10;
  const bestParams = {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    dropout: 0.2
  };
  let bestScore = 0;
  
  for (let trial = 0; trial < trials; trial++) {
    // Generate random hyperparameters
    const params = {
      learningRate: Math.random() * 0.01 + 0.0001,
      batchSize: [16, 32, 64, 128][Math.floor(Math.random() * 4)],
      epochs: Math.floor(Math.random() * 20) + 5,
      dropout: Math.random() * 0.5
    };
    
    // Simulate training with these parameters
    const score = Math.random() * 0.3 + 0.7; // 0.7-1.0 score
    
    if (score > bestScore) {
      bestScore = score;
      Object.assign(bestParams, params);
    }
    
    // Report progress
    self.postMessage({
      type: 'OPTIMIZATION_PROGRESS',
      data: {
        trial: trial + 1,
        totalTrials: trials,
        progress: ((trial + 1) / trials) * 100,
        currentScore: score,
        bestScore,
        currentParams: params
      },
      id
    });
  }
  
  const totalTime = performance.now() - startTime;
  
  self.postMessage({
    type: 'HYPERPARAMETERS_OPTIMIZED',
    data: {
      bestParams,
      bestScore,
      optimizationTime: totalTime,
      trials,
      modelType
    },
    id
  });
}

// Error handler
self.onerror = function(error) {
  self.postMessage({
    type: 'WORKER_ERROR',
    error: error.message,
    stack: error.stack
  });
}; 
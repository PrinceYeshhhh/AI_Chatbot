# 🎓 AI Model Training Guide

## Supported File Types

| Format | Extension | Use Case | Max Size |
|--------|-----------|----------|----------|
| **CSV** | `.csv` | Structured data, analytics queries | 50MB |
| **PDF** | `.pdf` | Documents, manuals, reports | 25MB |
| **Markdown** | `.md` | Documentation, knowledge base | 10MB |
| **Text** | `.txt` | Plain text data, logs | 10MB |
| **JSON** | `.json` | API responses, structured data | 25MB |

## Training Pipeline

### 1. File Upload & Processing

```typescript
// Automatic file processing
const processFile = async (file: File) => {
  const content = await extractContent(file);
  const chunks = chunkContent(content, {
    maxSize: 1000,
    overlap: 100
  });
  
  return chunks.map(chunk => ({
    content: chunk,
    metadata: {
      filename: file.name,
      type: file.type,
      timestamp: new Date()
    }
  }));
};
```

### 2. Content Chunking Strategy

#### CSV Files
```typescript
// Each row becomes a training example
const processCSV = (content: string) => {
  const rows = parseCSV(content);
  return rows.map(row => ({
    input: generateQuestion(row),
    expectedOutput: generateAnswer(row),
    intent: 'data_query'
  }));
};
```

#### PDF Documents
```typescript
// Extract text and create Q&A pairs
const processPDF = (content: string) => {
  const sections = splitIntoSections(content);
  return sections.map(section => ({
    input: `What does the document say about ${extractTopic(section)}?`,
    expectedOutput: section,
    intent: 'document_query'
  }));
};
```

### 3. Embedding Generation

```typescript
// Transform text into vector embeddings
const generateEmbeddings = async (text: string) => {
  const tokens = tokenize(text);
  const embeddings = await transformerModel.encode(tokens);
  
  return {
    vector: embeddings,
    dimensions: 512,
    model: 'custom-transformer'
  };
};
```

### 4. Vector Storage & Indexing

```typescript
// Efficient similarity search
class VectorStore {
  private index: Map<string, number[]> = new Map();
  
  async upsert(id: string, vector: number[], metadata: any) {
    this.index.set(id, vector);
    await this.saveMetadata(id, metadata);
  }
  
  async similaritySearch(query: number[], topK: number = 5) {
    const results = [];
    for (const [id, vector] of this.index) {
      const similarity = cosineSimilarity(query, vector);
      results.push({ id, similarity });
    }
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }
}
```

## Environment Variables

### Required Configuration

```bash
# API Configuration
VITE_GOOGLE_API_KEY=your-google-api-key-here
VITE_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
VITE_MODEL_NAME=gpt-3.5-turbo

# Training Configuration
VITE_MAX_TRAINING_EXAMPLES=10000
VITE_EMBEDDING_DIMENSIONS=512
VITE_CHUNK_SIZE=1000
VITE_CHUNK_OVERLAP=100

# Performance Settings
VITE_USE_GPU=false
VITE_BATCH_SIZE=32
VITE_LEARNING_RATE=0.001
VITE_DROPOUT_RATE=0.1

# Storage Configuration
VITE_STORAGE_TYPE=localStorage
VITE_MAX_STORAGE_SIZE=100MB
VITE_AUTO_CLEANUP=true

# Debug Settings
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
VITE_ENABLE_METRICS=true
```

### Optional Advanced Settings

```bash
# ML Model Configuration
VITE_TRANSFORMER_HEADS=8
VITE_TRANSFORMER_LAYERS=6
VITE_HIDDEN_DIMENSIONS=256
VITE_VOCABULARY_SIZE=50000

# Training Constraints
VITE_GRADIENT_CLIP_THRESHOLD=1.0
VITE_EARLY_STOPPING_PATIENCE=10
VITE_MIN_DELTA=0.001

# Reinforcement Learning
VITE_REWARD_DECAY=0.95
VITE_EXPLORATION_RATE=0.1
VITE_POLICY_UPDATE_FREQUENCY=100
```

## Training Workflow

### Step 1: Data Preparation

```bash
# 1. Prepare your training data
mkdir training_data
cp your_data.csv training_data/

# 2. Validate file format
npm run validate-data training_data/your_data.csv

# 3. Preview training examples
npm run preview-training training_data/your_data.csv
```

### Step 2: Model Training

```typescript
// Programmatic training
import { chatService } from './services/chatService';

const trainModel = async () => {
  // Add training examples
  const examples = [
    {
      input: "What is our Q4 revenue?",
      expectedOutput: "Q4 revenue was $2.5M, up 15% from Q3",
      intent: "revenue_query"
    },
    {
      input: "Show me customer satisfaction scores",
      expectedOutput: "Customer satisfaction is 4.2/5 with 89% positive feedback",
      intent: "satisfaction_query"
    }
  ];

  // Batch training
  for (const example of examples) {
    chatService.addTrainingData(
      example.input,
      example.expectedOutput,
      example.intent
    );
  }

  console.log('Training complete!');
};
```

### Step 3: Model Validation

```typescript
// Test model performance
const validateModel = async () => {
  const testCases = [
    { input: "revenue", expectedIntent: "revenue_query" },
    { input: "customer feedback", expectedIntent: "satisfaction_query" }
  ];

  for (const test of testCases) {
    const result = await chatService.classifyIntent(test.input);
    console.log(`Input: ${test.input}`);
    console.log(`Expected: ${test.expectedIntent}`);
    console.log(`Predicted: ${result.intent} (${result.confidence})`);
  }
};
```

## Troubleshooting

### Out of Memory (OOM) Issues

```typescript
// Reduce memory usage
const optimizeMemory = {
  // Reduce batch size
  batchSize: 8,
  
  // Enable gradient checkpointing
  gradientCheckpointing: true,
  
  // Use mixed precision
  mixedPrecision: true,
  
  // Clear cache regularly
  clearCache: true
};
```

### Rate Limit Handling

```typescript
// Implement exponential backoff
const handleRateLimit = async (apiCall: () => Promise<any>) => {
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
};
```

### Training Performance Issues

```typescript
// Performance optimization strategies
const optimizeTraining = {
  // Use incremental learning
  incrementalUpdates: true,
  
  // Implement early stopping
  earlyStopping: {
    patience: 10,
    minDelta: 0.001
  },
  
  // Enable model compression
  compression: {
    quantization: true,
    pruning: 0.1
  },
  
  // Use efficient data loading
  dataLoader: {
    batchSize: 32,
    shuffle: true,
    numWorkers: 4
  }
};
```

### Common Error Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `CORS Error` | API endpoint blocking requests | Configure CORS headers or use proxy |
| `Token Limit Exceeded` | Input too long | Implement text chunking |
| `Model Not Found` | Incorrect model name | Verify model name in settings |
| `Training Failed` | Invalid data format | Validate input data structure |
| `Memory Error` | Dataset too large | Reduce batch size or use streaming |

### Debug Mode

```typescript
// Enable detailed logging
const debugConfig = {
  logLevel: 'debug',
  enableMetrics: true,
  saveTrainingLogs: true,
  profilePerformance: true
};

// View training metrics
const metrics = chatService.getTrainingStats();
console.log('Training Metrics:', {
  accuracy: metrics.accuracy,
  loss: metrics.loss,
  examples: metrics.totalExamples,
  intents: metrics.uniqueIntents
});
```

## Best Practices

### Data Quality
- **Clean Data**: Remove duplicates and inconsistencies
- **Balanced Dataset**: Ensure even distribution across intents
- **Quality Examples**: Use clear, representative training examples
- **Regular Updates**: Continuously improve with new data

### Model Performance
- **Validation Split**: Reserve 20% of data for testing
- **Cross-Validation**: Use k-fold validation for robust metrics
- **Hyperparameter Tuning**: Experiment with learning rates and architectures
- **Regular Evaluation**: Monitor performance over time

### Production Deployment
- **Model Versioning**: Track model versions and rollback capability
- **A/B Testing**: Compare model performance in production
- **Monitoring**: Set up alerts for performance degradation
- **Backup Strategy**: Regular model and data backups
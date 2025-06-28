# 🚀 Advanced Features Usage Guide

## 🎯 **How to Test All Features**

### **1. Quick Test Panel**
- Click the **🧪** button in the header (top-right)
- Or navigate to `/test` in your browser
- Click **"Test All Features"** to run all tests at once

### **2. Individual Feature Tests**
- **🤖 Web Worker**: Test intent classification
- **🏷️ Entity Extraction**: Test named entity recognition  
- **💾 Advanced Caching**: Test caching strategies
- **📊 Error Tracking**: Test error monitoring
- **⚡ Performance Monitoring**: Test performance metrics

---

## 🔧 **How to Use Each Feature**

### **1. Virtual Scrolling (Automatic)**
✅ **Already Active** - No setup needed!

- **Sidebar**: Automatically uses virtual scrolling for conversations
- **Chat Window**: Uses virtual scrolling when you have 30+ messages
- **Training Modal**: Uses virtual scrolling when you have 30+ training examples

### **2. Web Worker for Heavy ML Operations**

```typescript
import { workerService } from './services/workerService';

// Intent Classification
const intent = await workerService.classifyIntent("Hello, how can you help me?");
console.log(`Intent: ${intent.intent} (${intent.confidence * 100}% confidence)`);

// Entity Extraction
const entities = await workerService.extractEntities("My email is john@example.com");
console.log(`Found entities: ${entities.entities.map(e => e.entity).join(', ')}`);

// Model Training (with progress updates)
const result = await workerService.trainModel(trainingData, config, (progress) => {
  console.log(`Training: ${progress.progress}% complete`);
});

// Hyperparameter Optimization
const optimization = await workerService.optimizeHyperparameters(
  'intent_classifier', 
  trainingData, 
  config, 
  (progress) => {
    console.log(`Trial ${progress.trial}/${progress.totalTrials}`);
  }
);
```

### **3. Advanced Caching**

```typescript
import { cacheService } from './services/cacheService';

// Create a cache
cacheService.createCache('myCache', {
  maxSize: 1000,
  strategy: 'LRU',
  enableCompression: true
});

// Store data
await cacheService.set('myCache', 'key', { data: 'value' });

// Retrieve data
const cached = await cacheService.get('myCache', 'key');

// Check if exists
const exists = cacheService.has('myCache', 'key');

// Get cache statistics
const stats = cacheService.getStats('myCache');
```

### **4. Error Tracking**

```typescript
import { errorTrackingService } from './services/errorTrackingService';

// Track an error
errorTrackingService.trackError(error, {
  component: 'MyComponent',
  severity: 'high',
  tags: ['critical', 'user-facing'],
  metadata: { userId: '123', action: 'save' }
});

// Add breadcrumbs for debugging
errorTrackingService.addBreadcrumb('user', 'User clicked save button', { buttonId: 'save' });

// Set user context
errorTrackingService.setUser('user123', { plan: 'premium' });

// Get error report
const report = errorTrackingService.getErrorReport();
```

### **5. Performance Monitoring**

```typescript
import { PerformanceMonitor } from './utils/performanceMonitor';

// Monitor an operation
const timer = PerformanceMonitor.startTimer('my-operation');
// ... do work ...
timer();

// Get performance summary
const stats = PerformanceMonitor.getPerformanceSummary();
console.log(`Total operations: ${stats.totalOperations}`);
console.log(`Slow operations: ${stats.slowOperations}`);

// Get metrics for specific operation
const metrics = PerformanceMonitor.getMetricStats('my-operation');
```

---

## 🎮 **Real-World Usage Examples**

### **Example 1: Smart Chat with Caching**

```typescript
async function sendSmartMessage(message: string) {
  // Check cache first
  const cacheKey = `chat_${hash(message)}`;
  const cached = await cacheService.get('chat', cacheKey);
  
  if (cached) {
    console.log('📦 Using cached response');
    return cached;
  }

  // Use Web Worker for intent classification
  const intent = await workerService.classifyIntent(message);
  
  // Use Web Worker for entity extraction
  const entities = await workerService.extractEntities(message);
  
  // Generate response
  const response = await generateResponse(message, intent, entities);
  
  // Cache the response
  await cacheService.set('chat', cacheKey, response);
  
  return response;
}
```

### **Example 2: Training with Progress**

```typescript
async function trainModelWithProgress() {
  const trainingData = getTrainingData();
  
  // Use Web Worker for training
  const result = await workerService.trainModel(trainingData, {
    epochs: 10,
    batchSize: 32
  }, (progress) => {
    // Update UI with progress
    updateProgressBar(progress.progress);
    updateMetrics(progress.loss, progress.accuracy);
  });
  
  // Cache the trained model
  await cacheService.set('models', result.modelId, result);
  
  console.log(`Model trained: ${result.finalAccuracy * 100}% accuracy`);
}
```

### **Example 3: Error Handling with Tracking**

```typescript
async function safeOperation() {
  try {
    const timer = PerformanceMonitor.startTimer('safe-operation');
    
    // Add breadcrumb
    errorTrackingService.addBreadcrumb('operation', 'Starting safe operation');
    
    // Do work
    const result = await riskyOperation();
    
    timer();
    return result;
    
  } catch (error) {
    // Track error with context
    errorTrackingService.trackError(error, {
      component: 'SafeOperation',
      severity: 'high',
      tags: ['critical-operation'],
      metadata: { operationType: 'risky' }
    });
    
    // Fallback
    return fallbackResult();
  }
}
```

---

## 📊 **Monitoring & Debugging**

### **Performance Dashboard**
- Check browser console for performance metrics
- Look for `🐌 Slow operation detected` warnings
- Monitor memory usage and long tasks

### **Error Tracking**
- Errors are automatically tracked and logged
- Check browser console for error details
- Use breadcrumbs to trace user actions

### **Cache Statistics**
- Monitor cache hit rates
- Check cache sizes and evictions
- Optimize cache strategies based on usage

---

## 🎯 **Best Practices**

### **1. Web Workers**
- Use for CPU-intensive operations
- Always provide progress callbacks for long operations
- Handle worker failures gracefully

### **2. Caching**
- Choose appropriate cache strategies (LRU, LFU, TTL)
- Set reasonable cache sizes
- Use compression for large data

### **3. Error Tracking**
- Track errors with appropriate severity levels
- Include relevant context and metadata
- Use breadcrumbs for debugging

### **4. Performance Monitoring**
- Monitor critical user paths
- Set up alerts for slow operations
- Regularly review performance metrics

---

## 🚀 **Your App Now Has:**

✅ **Lightning-fast** virtual scrolling for large lists  
✅ **Non-blocking** ML operations via Web Workers  
✅ **Smart caching** with multiple strategies  
✅ **Comprehensive error tracking** for debugging  
✅ **Real-time performance monitoring**  
✅ **Advanced ML capabilities** (intent, entities, training)  

**Everything is integrated and ready to use!** 🎉 
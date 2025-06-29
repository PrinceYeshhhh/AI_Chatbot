// ML Worker Utilities
// This file contains utility functions for ML operations in the web worker

// Utility functions for ML operations
const MLUtils = {
  // Normalize vector
  normalizeVector: (vector) => {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  },

  // Calculate cosine similarity
  cosineSimilarity: (vec1, vec2) => {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }
    
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (mag1 * mag2);
  },

  // Generate random embeddings
  generateEmbeddings: (text, size = 384) => {
    // Simple hash-based embedding generation
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use hash as seed for consistent embeddings
    const embeddings = new Array(size).fill(0).map((_, i) => {
      const seed = (hash + i * 12345) % 2147483647;
      return (seed / 2147483647) * 2 - 1;
    });
    
    return MLUtils.normalizeVector(embeddings);
  },

  // Simple text preprocessing
  preprocessText: (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
  },

  // Extract keywords from text
  extractKeywords: (text, maxKeywords = 10) => {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};
    
    words.forEach(word => {
      if (word.length > 2) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }
};

// Export utilities for worker use
if (typeof self !== 'undefined') {
  // In web worker context
  self.MLUtils = MLUtils;
} else if (typeof module !== 'undefined' && module.exports) {
  // In Node.js context
  module.exports = MLUtils;
} else if (typeof window !== 'undefined') {
  // In browser context
  window.MLUtils = MLUtils;
} 
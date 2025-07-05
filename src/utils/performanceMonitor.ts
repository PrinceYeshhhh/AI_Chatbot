import React from 'react';
import { PerformanceMetric } from '../types';

/**
 * Performance monitoring utility for tracking and optimizing slow operations
 */
export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric[]> = new Map();
  private static isEnabled: boolean = process.env.NODE_ENV === 'development';
  private static slowOperationThreshold: number = 1000; // 1 second
  private static maxMetricsPerLabel: number = 100;

  /**
   * Start a performance timer
   * @param label - Label for the operation being timed
   * @returns Function to call when operation completes
   */
  static startTimer(label: string): () => void {
    if (!this.isEnabled) {
      return () => {}; // No-op in production
    }

    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      
      if (duration > this.slowOperationThreshold) {
        console.warn(`🐌 Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Record a performance metric
   * @param label - Operation label
   * @param duration - Duration in milliseconds
   * @param metadata - Additional metadata
   */
  static recordMetric(label: string, duration: number, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      label,
      duration,
      timestamp: new Date(),
      ...(metadata && { metadata })
    };

    const existing = this.metrics.get(label) || [];
    existing.push(metric);
    
    // Keep only the most recent metrics
    if (existing.length > this.maxMetricsPerLabel) {
      existing.splice(0, existing.length - this.maxMetricsPerLabel);
    }
    
    this.metrics.set(label, existing);
  }

  /**
   * Get performance statistics for all recorded metrics
   */
  static getMetrics(): Record<string, { 
    avg: number; 
    max: number; 
    min: number;
    count: number; 
    recent: PerformanceMetric[];
  }> {
    const result: Record<string, { 
      avg: number; 
      max: number; 
      min: number;
      count: number; 
      recent: PerformanceMetric[];
    }> = {};
    
    for (const [label, metrics] of this.metrics) {
      if (metrics.length === 0) continue;
      
      const durations = metrics.map(m => m.duration);
      const recent = metrics.slice(-10); // Last 10 metrics
      
      result[label] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
        count: durations.length,
        recent
      };
    }
    
    return result;
  }

  /**
   * Get performance statistics for a specific label
   */
  static getMetricStats(label: string): { 
    avg: number; 
    max: number; 
    min: number;
    count: number; 
    recent: PerformanceMetric[];
  } | null {
    const metrics = this.metrics.get(label);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const recent = metrics.slice(-10);

    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      max: Math.max(...durations),
      min: Math.min(...durations),
      count: durations.length,
      recent
    };
  }

  /**
   * Clear all performance metrics
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific label
   */
  static clearMetricsForLabel(label: string): void {
    this.metrics.delete(label);
  }

  /**
   * Enable or disable performance monitoring
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set the threshold for slow operation warnings
   */
  static setSlowOperationThreshold(threshold: number): void {
    this.slowOperationThreshold = threshold;
  }

  /**
   * Get a summary of performance issues
   */
  static getPerformanceSummary(): {
    totalOperations: number;
    slowOperations: number;
    averageResponseTime: number;
    slowestOperation: string | null;
    operations: Record<string, { avg: number; max: number; min: number; count: number; recent: any[] }>;
  } {
    let totalOperations = 0;
    let slowOperations = 0;
    let totalTime = 0;
    let slowestOperation: { label: string; duration: number } | null = null;
    const operations: Record<string, { avg: number; max: number; min: number; count: number; recent: any[] }> = {};

    for (const [label, metrics] of this.metrics) {
      if (metrics.length === 0) continue;
      const durations = metrics.map(m => m.duration);
      operations[label] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
        count: durations.length,
        recent: metrics.slice(-10)
      };
      for (const metric of metrics) {
        totalOperations++;
        totalTime += metric.duration;
        if (metric.duration > this.slowOperationThreshold) {
          slowOperations++;
        }
        if (!slowestOperation || metric.duration > slowestOperation.duration) {
          slowestOperation = { label, duration: metric.duration };
        }
      }
    }

    return {
      totalOperations,
      slowOperations,
      averageResponseTime: totalOperations > 0 ? totalTime / totalOperations : 0,
      slowestOperation: slowestOperation ? slowestOperation.label : null,
      operations
    };
  }

  /**
   * Export metrics for debugging
   */
  static exportMetrics(): Record<string, unknown> {
    return {
      metrics: Object.fromEntries(this.metrics),
      summary: this.getPerformanceSummary(),
      settings: {
        isEnabled: this.isEnabled,
        slowOperationThreshold: this.slowOperationThreshold,
        maxMetricsPerLabel: this.maxMetricsPerLabel
      }
    };
  }
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(label?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const operationLabel = label || `${target.constructor.name}.${propertyKey}`;
      const timer = PerformanceMonitor.startTimer(operationLabel);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle both synchronous and asynchronous functions
        if (result instanceof Promise) {
          return result.finally(timer);
        } else {
          timer();
          return result;
        }
      } catch (error) {
        timer();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Hook for measuring React component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const timer = PerformanceMonitor.startTimer(`${componentName} render`);
  
  React.useEffect(() => {
    timer();
  });
}

// Export a simple timer function for easy use
export const timer = PerformanceMonitor.startTimer.bind(PerformanceMonitor); 
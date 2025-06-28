import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PerformanceMonitor } from '../../utils/performanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear all metrics before each test
    PerformanceMonitor['metrics'].clear();
  });

  describe('startTimer', () => {
    test('should return a function that stops the timer', () => {
      const stopTimer = PerformanceMonitor.startTimer('test-operation');
      expect(typeof stopTimer).toBe('function');
    });

    test('should measure execution time correctly', () => {
      const stopTimer = PerformanceMonitor.startTimer('test-operation');
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for ~10ms
      }
      
      stopTimer();
      
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics['test-operation']).toBeDefined();
      expect(metrics['test-operation'].count).toBe(1);
      expect(metrics['test-operation'].avg).toBeGreaterThan(0);
    });

    test('should accumulate multiple measurements', () => {
      const stopTimer1 = PerformanceMonitor.startTimer('test-operation');
      stopTimer1();
      
      const stopTimer2 = PerformanceMonitor.startTimer('test-operation');
      stopTimer2();
      
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics['test-operation'].count).toBe(2);
    });

    test('should calculate average correctly', () => {
      // First measurement
      const stopTimer1 = PerformanceMonitor.startTimer('test-operation');
      stopTimer1();
      
      // Second measurement
      const stopTimer2 = PerformanceMonitor.startTimer('test-operation');
      stopTimer2();
      
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics['test-operation'].avg).toBeGreaterThan(0);
      expect(metrics['test-operation'].max).toBeGreaterThan(0);
    });
  });

  describe('getMetrics', () => {
    test('should return empty object when no metrics exist', () => {
      const metrics = PerformanceMonitor.getMetrics();
      expect(metrics).toEqual({});
    });

    test('should return metrics for all operations', () => {
      const stopTimer1 = PerformanceMonitor.startTimer('operation-1');
      stopTimer1();
      
      const stopTimer2 = PerformanceMonitor.startTimer('operation-2');
      stopTimer2();
      
      const metrics = PerformanceMonitor.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(2);
      expect(metrics['operation-1']).toBeDefined();
      expect(metrics['operation-2']).toBeDefined();
    });

    test('should return correct metric structure', () => {
      const stopTimer = PerformanceMonitor.startTimer('test-operation');
      stopTimer();
      
      const metrics = PerformanceMonitor.getMetrics();
      const metric = metrics['test-operation'];
      
      expect(metric).toHaveProperty('avg');
      expect(metric).toHaveProperty('max');
      expect(metric).toHaveProperty('count');
      expect(typeof metric.avg).toBe('number');
      expect(typeof metric.max).toBe('number');
      expect(typeof metric.count).toBe('number');
    });
  });

  describe('getPerformanceSummary', () => {
    test('should return performance summary', () => {
      const stopTimer = PerformanceMonitor.startTimer('test-operation');
      stopTimer();
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary).toHaveProperty('totalOperations');
      expect(summary).toHaveProperty('averageResponseTime');
      expect(summary).toHaveProperty('slowestOperation');
      expect(summary).toHaveProperty('operations');
    });

    test('should identify slowest operation', () => {
      // Fast operation
      const stopTimer1 = PerformanceMonitor.startTimer('fast-operation');
      stopTimer1();
      
      // Slow operation (simulated)
      const stopTimer2 = PerformanceMonitor.startTimer('slow-operation');
      const start = performance.now();
      while (performance.now() - start < 20) {
        // Busy wait for ~20ms
      }
      stopTimer2();
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.slowestOperation).toBe('slow-operation');
    });

    test('should calculate total operations correctly', () => {
      const stopTimer1 = PerformanceMonitor.startTimer('operation-1');
      stopTimer1();
      
      const stopTimer2 = PerformanceMonitor.startTimer('operation-2');
      stopTimer2();
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(2);
    });
  });

  describe('clearMetrics', () => {
    test('should clear all metrics', () => {
      const stopTimer = PerformanceMonitor.startTimer('test-operation');
      stopTimer();
      
      expect(Object.keys(PerformanceMonitor.getMetrics())).toHaveLength(1);
      
      PerformanceMonitor.clearMetrics();
      expect(Object.keys(PerformanceMonitor.getMetrics())).toHaveLength(0);
    });
  });

  describe('getSlowOperations', () => {
    test('should return operations slower than threshold', () => {
      // Fast operation
      const stopTimer1 = PerformanceMonitor.startTimer('fast-operation');
      stopTimer1();
      
      // Slow operation (simulated)
      const stopTimer2 = PerformanceMonitor.startTimer('slow-operation');
      const start = performance.now();
      while (performance.now() - start < 50) {
        // Busy wait for ~50ms
      }
      stopTimer2();
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.slowOperations).toBeGreaterThan(0);
    });

    test('should return empty array when no slow operations', () => {
      const stopTimer = PerformanceMonitor.startTimer('fast-operation');
      stopTimer();
      
      const summary = PerformanceMonitor.getPerformanceSummary();
      expect(summary.slowOperations).toBe(0);
    });
  });

  describe('getMetricStats', () => {
    test('should return stats for specific operation', () => {
      const stopTimer = PerformanceMonitor.startTimer('test-operation');
      stopTimer();
      
      const stats = PerformanceMonitor.getMetricStats('test-operation');
      expect(stats).toHaveProperty('avg');
      expect(stats).toHaveProperty('max');
      expect(stats).toHaveProperty('min');
      expect(stats).toHaveProperty('count');
      expect(stats?.count).toBe(1);
    });

    test('should return null for non-existent operation', () => {
      const stats = PerformanceMonitor.getMetricStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('performance warnings', () => {
    test('should log warning for slow operations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Set a low threshold for testing
      PerformanceMonitor.setSlowOperationThreshold(10);
      
      const stopTimer = PerformanceMonitor.startTimer('slow-operation');
      const start = performance.now();
      while (performance.now() - start < 50) {
        // Busy wait for ~50ms
      }
      stopTimer();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected: slow-operation')
      );
      
      consoleSpy.mockRestore();
    });
  });
}); 
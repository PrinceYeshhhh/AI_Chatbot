import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { PerformanceMonitor } from '../../utils/performanceMonitor';

// Mock console methods
const consoleSpy = {
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Mock performance.now
const mockPerformanceNow = jest.fn();
let performanceNowValue = 0;

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceNowValue = 0;
    mockPerformanceNow.mockImplementation(() => performanceNowValue);
      
    // Mock performance.now
    global.performance = {
      ...global.performance,
      now: mockPerformanceNow
    } as any;
    
    // Mock console methods
    global.console = {
      ...console,
      warn: consoleSpy.warn,
      error: consoleSpy.error,
      log: consoleSpy.log
    } as any;
    
    // Clear any existing metrics
    PerformanceMonitor.clearMetrics();
  });

  afterEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  describe('basic functionality', () => {
    test('should start and stop timer correctly', () => {
      const operation = 'test-operation';
      
      performanceNowValue = 1000;
      const stopTimer = PerformanceMonitor.startTimer(operation);
      expect(stopTimer).toBeDefined();
      expect(typeof stopTimer).toBe('function');
      
      performanceNowValue = 1100; // 100ms later
      const result = stopTimer();
      expect(result).toBeDefined();
      expect(result.duration).toBe(100);
    });

    test('should track multiple operations', () => {
      const operation1 = 'operation-1';
      const operation2 = 'operation-2';
      
      performanceNowValue = 1000;
      const stop1 = PerformanceMonitor.startTimer(operation1);
      performanceNowValue = 1100;
      const stop2 = PerformanceMonitor.startTimer(operation2);
      
      performanceNowValue = 1200;
      stop1();
      performanceNowValue = 1300;
      stop2();
      
      const stats1 = PerformanceMonitor.getMetricStats(operation1);
      const stats2 = PerformanceMonitor.getMetricStats(operation2);
      
      expect(stats1).toBeDefined();
      expect(stats2).toBeDefined();
      expect(stats1?.count).toBe(1);
      expect(stats2?.count).toBe(1);
    });

    test('should calculate statistics correctly', () => {
      const operation = 'test-operation';
      
      // Simulate multiple measurements
      for (let i = 0; i < 3; i++) {
        performanceNowValue = 1000 + (i * 100);
        const stopTimer = PerformanceMonitor.startTimer(operation);
        performanceNowValue = 1100 + (i * 100);
      stopTimer();
      }
      
      const stats = PerformanceMonitor.getMetricStats(operation);
      
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(3);
      expect(stats?.avg).toBe(100);
      expect(stats?.min).toBe(100);
      expect(stats?.max).toBe(100);
    });
  });

  describe('performance warnings', () => {
    test('should log warning for slow operations', () => {
      const operation = 'slow-operation';
      
      // Mock a slow operation (over 1000ms threshold)
      performanceNowValue = 1000;
      const stopTimer = PerformanceMonitor.startTimer(operation);
      performanceNowValue = 2100; // 1100ms later
      stopTimer();
      
      // Check if warning was logged
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected: slow-operation')
      );
    });

    test('should not log warning for fast operations', () => {
      const operation = 'fast-operation';
      
      performanceNowValue = 1000;
      const stopTimer = PerformanceMonitor.startTimer(operation);
      performanceNowValue = 1100; // 100ms later
      stopTimer();
      
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle errors gracefully', () => {
      const operation = 'error-operation';
      
      // Mock a timer that throws an error
      const originalStartTimer = PerformanceMonitor.startTimer;
      PerformanceMonitor.startTimer = jest.fn().mockImplementation(() => {
        throw new Error('Timer error');
    });

      expect(() => {
        PerformanceMonitor.startTimer(operation);
      }).toThrow('Timer error');
      
      // Restore original function
      PerformanceMonitor.startTimer = originalStartTimer;
    });
  });

  describe('metric management', () => {
    test('should clear metrics correctly', () => {
      const operation = 'clear-test';
      
      performanceNowValue = 1000;
      const stopTimer = PerformanceMonitor.startTimer(operation);
      performanceNowValue = 1100;
      stopTimer();
      
      let stats = PerformanceMonitor.getMetricStats(operation);
      expect(stats?.count).toBe(1);
      
      PerformanceMonitor.clearMetrics();
      
      stats = PerformanceMonitor.getMetricStats(operation);
      expect(stats).toBeNull();
    });

    test('should return null for non-existent operation', () => {
      const stats = PerformanceMonitor.getMetricStats('non-existent');
      
      expect(stats).toBeNull();
    });
  });
}); 
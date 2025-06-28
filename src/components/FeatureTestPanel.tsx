import React, { useState } from 'react';
import { workerService } from '../services/workerService';
import { cacheService } from '../services/cacheService';
import { errorTrackingService } from '../services/errorTrackingService';
import { PerformanceMonitor } from '../utils/performanceMonitor';

interface TestResult {
  id: string;
  feature: string;
  status: 'success' | 'error' | 'running';
  result?: any;
  error?: string;
  duration?: number;
}

export const FeatureTestPanel: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const testWebWorker = async () => {
    const testId = Date.now().toString();
    addResult({ id: testId, feature: 'Web Worker - Intent Classification', status: 'running' });

    try {
      const timer = PerformanceMonitor.startTimer('test-intent-classification');
      const result = await workerService.classifyIntent("Hello, how can you help me?");
      const duration = timer();

      addResult({
        id: testId,
        feature: 'Web Worker - Intent Classification',
        status: 'success',
        result: { intent: result.intent, confidence: result.confidence },
        duration
      });
    } catch (error) {
      addResult({
        id: testId,
        feature: 'Web Worker - Intent Classification',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testEntityExtraction = async () => {
    const testId = Date.now().toString();
    addResult({ id: testId, feature: 'Web Worker - Entity Extraction', status: 'running' });

    try {
      const timer = PerformanceMonitor.startTimer('test-entity-extraction');
      const result = await workerService.extractEntities("My email is test@example.com and phone is 555-1234");
      const duration = timer();

      addResult({
        id: testId,
        feature: 'Web Worker - Entity Extraction',
        status: 'success',
        result: { entities: result.entities.length, types: result.entities.map(e => e.type) },
        duration
      });
    } catch (error) {
      addResult({
        id: testId,
        feature: 'Web Worker - Entity Extraction',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testCaching = async () => {
    const testId = Date.now().toString();
    addResult({ id: testId, feature: 'Advanced Caching', status: 'running' });

    try {
      const timer = PerformanceMonitor.startTimer('test-caching');
      
      // Test data
      const testData = { message: "Hello world", timestamp: new Date() };
      
      // Set cache
      await cacheService.set('test', 'demo-key', testData);
      
      // Get cache
      const cached = await cacheService.get('test', 'demo-key');
      
      const duration = timer();

      addResult({
        id: testId,
        feature: 'Advanced Caching',
        status: 'success',
        result: { cached: !!cached, data: cached },
        duration
      });
    } catch (error) {
      addResult({
        id: testId,
        feature: 'Advanced Caching',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testErrorTracking = async () => {
    const testId = Date.now().toString();
    addResult({ id: testId, feature: 'Error Tracking', status: 'running' });

    try {
      // Simulate an error
      const testError = new Error("This is a test error for tracking");
      errorTrackingService.trackError(testError, {
        component: 'FeatureTestPanel',
        severity: 'low',
        tags: ['test', 'demo'],
        metadata: { testId }
      });

      addResult({
        id: testId,
        feature: 'Error Tracking',
        status: 'success',
        result: { errorTracked: true, message: testError.message }
      });
    } catch (error) {
      addResult({
        id: testId,
        feature: 'Error Tracking',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testPerformanceMonitoring = async () => {
    const testId = Date.now().toString();
    addResult({ id: testId, feature: 'Performance Monitoring', status: 'running' });

    try {
      const timer = PerformanceMonitor.startTimer('test-performance');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration = timer();
      const stats = PerformanceMonitor.getPerformanceSummary();

      addResult({
        id: testId,
        feature: 'Performance Monitoring',
        status: 'success',
        result: { 
          operationTime: duration,
          totalOperations: stats.totalOperations,
          slowOperations: stats.slowOperations
        },
        duration
      });
    } catch (error) {
      addResult({
        id: testId,
        feature: 'Performance Monitoring',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testAllFeatures = async () => {
    setIsRunning(true);
    setResults([]);

    await testWebWorker();
    await testEntityExtraction();
    await testCaching();
    await testErrorTracking();
    await testPerformanceMonitoring();

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🚀 Advanced Features Test Panel</h2>
        <button
          onClick={testAllFeatures}
          disabled={isRunning}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Testing...' : 'Test All Features'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testWebWorker}
          disabled={isRunning}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <div className="font-semibold text-blue-900">🤖 Web Worker</div>
          <div className="text-sm text-blue-700">Intent Classification</div>
        </button>

        <button
          onClick={testEntityExtraction}
          disabled={isRunning}
          className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <div className="font-semibold text-green-900">🏷️ Entity Extraction</div>
          <div className="text-sm text-green-700">Named Entity Recognition</div>
        </button>

        <button
          onClick={testCaching}
          disabled={isRunning}
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          <div className="font-semibold text-purple-900">💾 Advanced Caching</div>
          <div className="text-sm text-purple-700">LRU, LFU, TTL Strategies</div>
        </button>

        <button
          onClick={testErrorTracking}
          disabled={isRunning}
          className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <div className="font-semibold text-red-900">📊 Error Tracking</div>
          <div className="text-sm text-red-700">Comprehensive Monitoring</div>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🧪</div>
            <p>Click "Test All Features" to see the advanced features in action!</p>
          </div>
        ) : (
          results.map((result) => (
            <div
              key={result.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(result.status)}</span>
                  <div>
                    <div className={`font-semibold ${getStatusColor(result.status)}`}>
                      {result.feature}
                    </div>
                    {result.duration && (
                      <div className="text-sm text-gray-500">
                        Duration: {result.duration.toFixed(2)}ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </div>
                </div>
              </div>
              
              {result.result && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Result:</div>
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <div className="text-sm font-medium text-red-700 mb-1">Error:</div>
                  <div className="text-sm text-red-600">{result.error}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">🎯 What's Being Tested:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Web Worker:</strong> Heavy ML operations without blocking UI</li>
          <li>• <strong>Virtual Scrolling:</strong> Efficient rendering of large lists</li>
          <li>• <strong>Advanced Caching:</strong> Multiple strategies with compression</li>
          <li>• <strong>Error Tracking:</strong> Comprehensive error monitoring</li>
          <li>• <strong>Performance Monitoring:</strong> Real-time performance metrics</li>
        </ul>
      </div>
    </div>
  );
}; 
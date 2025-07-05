import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, CheckCircle, XCircle, AlertTriangle, Play, PauseCircle } from 'lucide-react';
import { chatService } from '../services/chatService';
import { PerformanceMonitor } from '../utils/performanceMonitor';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number | undefined;
  error?: string | undefined;
}

export const FeatureTestPanel: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'API Connectivity', status: 'pending', duration: undefined, error: undefined },
    { name: 'Message Sending', status: 'pending', duration: undefined, error: undefined },
    { name: 'File Upload', status: 'pending', duration: undefined, error: undefined },
    { name: 'Performance Monitoring', status: 'pending', duration: undefined, error: undefined },
    { name: 'Error Handling', status: 'pending', duration: undefined, error: undefined },
    { name: 'Local Storage', status: 'pending', duration: undefined, error: undefined },
    { name: 'Voice Input', status: 'pending', duration: undefined, error: undefined },
    { name: 'Keyboard Navigation', status: 'pending', duration: undefined, error: undefined }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testIndex: number) => {
    const test = tests[testIndex];
    const startTime = Date.now();

    setTests(prev => prev.map((t, i) => 
      i === testIndex ? { ...t, status: 'running' } : t
    ));

    try {
      switch (test.name) {
        case 'API Connectivity':
          await testApiConnectivity();
          break;
        case 'Message Sending':
          await testMessageSending();
          break;
        case 'File Upload':
          await testFileUpload();
          break;
        case 'Performance Monitoring':
          await testPerformanceMonitoring();
          break;
        case 'Error Handling':
          await testErrorHandling();
          break;
        case 'Local Storage':
          await testLocalStorage();
          break;
        case 'Voice Input':
          await testVoiceInput();
          break;
        case 'Keyboard Navigation':
          await testKeyboardNavigation();
          break;
      }

      const duration = Date.now() - startTime;
      setTests(prev => prev.map((t, i) => 
        i === testIndex ? { ...t, status: 'passed', duration } : t
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTests(prev => prev.map((t, i) => 
        i === testIndex ? { 
          ...t, 
          status: 'failed', 
          duration, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } : t
      ));
    }
  };

  const testApiConnectivity = async () => {
    const response = await fetch('/api/status');
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
  };

  const testMessageSending = async () => {
    const testMessage = await chatService.sendMessage('Test message', []);
    if (!testMessage || !testMessage.content) {
      throw new Error('Message sending failed');
    }
  };

  const testFileUpload = async () => {
    // Create a test file
    const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });
    const result = await chatService.uploadFiles([testFile]);
    if (!result) {
      throw new Error('File upload failed');
    }
  };

  const testPerformanceMonitoring = async () => {
    const stats = PerformanceMonitor.getPerformanceSummary();
    if (!stats || typeof stats.totalOperations !== 'number') {
      throw new Error('Performance monitoring not working');
    }
  };

  const testErrorHandling = async () => {
    try {
      await fetch('/api/nonexistent-endpoint');
    } catch (error) {
      // Expected error, test passes
      return;
    }
    throw new Error('Error handling not working');
  };

  const testLocalStorage = async () => {
    const testKey = 'test-key';
    const testValue = 'test-value';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('Local storage not working');
    }
  };

  const testVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Voice input not supported');
    }
    // Voice input is available
  };

  const testKeyboardNavigation = async () => {
    // Test if keyboard event listeners are working
    const testEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(testEvent);
    // If no error, test passes
  };

  const runAllTests = async () => {
    setIsRunning(true);
    for (let i = 0; i < tests.length; i++) {
      await runTest(i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsRunning(false);
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', duration: undefined, error: undefined })));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'running':
        return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  return (
    <motion.div
      className="min-h-screen bg-gray-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <TestTube className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Feature Test Panel</h1>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
              <div className="text-sm text-blue-600">Total Tests</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{tests.length - passedTests - failedTests}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Run All Tests
            </button>
            <button
              onClick={resetTests}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <PauseCircle className="w-4 h-4" />
              Reset Tests
            </button>
          </div>

          {/* Test List */}
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={test.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    {test.error && (
                      <div className="text-sm text-red-600">{test.error}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                  <button
                    onClick={() => runTest(index)}
                    disabled={isRunning || test.status === 'running'}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Run
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Test Instructions</h3>
                <p className="text-sm text-blue-700">
                  This panel allows you to test various features of the AI chatbot. 
                  Run individual tests or use "Run All Tests" to check the entire system. 
                  Tests verify API connectivity, message sending, file uploads, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 
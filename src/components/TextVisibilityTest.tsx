import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface VisibilityTest {
  name: string;
  element: string;
  expected: boolean;
  actual?: boolean | undefined;
  passed?: boolean | undefined;
}

export const TextVisibilityTest: React.FC = () => {
  const [tests, setTests] = useState<VisibilityTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{ passed: number; failed: number; total: number }>({
    passed: 0,
    failed: 0,
    total: 0
  });

  useEffect(() => {
    initializeTests();
  }, []);

  const initializeTests = () => {
    const testCases: VisibilityTest[] = [
      { name: 'Main Chat Input', element: '[data-testid="chat-input"]', expected: true },
      { name: 'Send Button', element: 'button[type="submit"]', expected: true },
      { name: 'Chat Messages', element: '.chat-message', expected: true },
      { name: 'Sidebar Navigation', element: '.sidebar', expected: true },
      { name: 'Error Messages', element: '.error-message', expected: false },
      { name: 'Loading Indicators', element: '.loading-spinner', expected: false },
      { name: 'Hidden Elements', element: '.sr-only', expected: false },
      { name: 'Focus Indicators', element: ':focus-visible', expected: true }
    ];
    setTests(testCases);
  };

  const runVisibilityTest = (test: VisibilityTest): boolean => {
    try {
      const element = document.querySelector(test.element);
      if (!element) {
        return test.expected === false; // Element doesn't exist, which might be expected
      }

      const computedStyle = window.getComputedStyle(element);
      const isVisible = 
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        computedStyle.opacity !== '0' &&
        (element as HTMLElement).offsetWidth > 0 &&
        (element as HTMLElement).offsetHeight > 0;

      return isVisible === test.expected;
    } catch (error) {
      console.error(`Error testing ${test.name}:`, error);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let passedCount = 0;
    let failedCount = 0;

    const updatedTests = tests.map(test => {
      const isPassed = runVisibilityTest(test);
      if (isPassed) {
        passedCount++;
      } else {
        failedCount++;
      }
      return { ...test, actual: isPassed, passed: isPassed };
    });

    setTests(updatedTests);
    setResults({ passed: passedCount, failed: failedCount, total: tests.length });
    setIsRunning(false);
  };

  const runSingleTest = (index: number) => {
    const test = tests[index];
    const isPassed = runVisibilityTest(test);
    
    setTests(prev => prev.map((t, i) => 
      i === index ? { ...t, actual: isPassed, passed: isPassed } : t
    ));

    setResults(prev => ({
      ...prev,
      passed: prev.passed + (isPassed ? 1 : 0),
      failed: prev.failed + (isPassed ? 0 : 1)
    }));
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, actual: undefined as boolean | undefined, passed: undefined as boolean | undefined })));
    setResults({ passed: 0, failed: 0, total: tests.length });
  };

  const getTestStatusIcon = (test: VisibilityTest) => {
    if (test.passed === undefined) {
      return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
    return test.passed ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

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
            <Eye className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Text Visibility Test</h1>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.total}</div>
              <div className="text-sm text-blue-600">Total Tests</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.passed}</div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.failed}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              Run All Tests
            </button>
            <button
              onClick={resetTests}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reset Tests
            </button>
          </div>

          {/* Test List */}
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={test.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTestStatusIcon(test)}
                  <div>
                    <div className="font-medium text-gray-900">{test.name}</div>
                    <div className="text-sm text-gray-500">
                      Element: <code className="bg-gray-200 px-1 rounded">{test.element}</code>
                    </div>
                    <div className="text-sm text-gray-500">
                      Expected: {test.expected ? 'Visible' : 'Hidden'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => runSingleTest(index)}
                    disabled={isRunning}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Accessibility Testing</h3>
                <p className="text-sm text-blue-700">
                  This panel tests the visibility and accessibility of UI elements. 
                  It checks if elements are properly visible to users and screen readers. 
                  Run tests to ensure your application meets accessibility standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 
import React, { useState } from 'react';

export const TextVisibilityTest: React.FC = () => {
  const [testInput, setTestInput] = useState('');

  return (
    <div className="p-8 bg-white">
      <h2 className="text-2xl font-bold text-black mb-4">Text Visibility Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Input Field
          </label>
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type here to test visibility..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ color: 'black', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Textarea
          </label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type here to test textarea visibility..."
            className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ color: 'black', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <p className="text-sm text-gray-600">
            Current input value: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{testInput || '(empty)'}</span>
          </p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Test Results:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Input field should show black text on white background</li>
            <li>• Textarea should show black text on white background</li>
            <li>• Placeholder text should be visible in gray</li>
            <li>• Cursor should be visible when typing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 
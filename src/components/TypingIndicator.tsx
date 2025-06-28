import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-purple-200">
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex flex-col">
        <div className="px-5 py-4 bg-white rounded-2xl rounded-bl-sm border border-gray-200 shadow-lg">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span className="font-medium">AI is typing...</span>
        </div>
      </div>
    </div>
  );
};
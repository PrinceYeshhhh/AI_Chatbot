import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex flex-col">
        <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm border border-gray-200 shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <span>AI is typing...</span>
        </div>
      </div>
    </div>
  );
};
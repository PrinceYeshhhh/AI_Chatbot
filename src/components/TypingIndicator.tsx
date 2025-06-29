import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  isTyping: boolean;
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, message = "AI is thinking..." }) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-start space-x-3 mb-4 animate-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      {/* Typing Bubble */}
      <div className="flex flex-col space-y-1">
        {/* Sender Label */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">AI Assistant</span>
          <span>•</span>
          <span className="text-purple-600 font-medium">{message}</span>
        </div>
        
        {/* Typing Animation */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">typing...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
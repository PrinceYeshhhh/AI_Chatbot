import React from 'react';
import { Message } from '../types';
import { User, Bot, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onRetry?: (messageId: string) => void;
}

// Memoized component for performance optimization
export const ChatMessage = React.memo<ChatMessageProps>(({ 
  message, 
  isTyping = false, 
  onRetry 
}) => {
  const isUser = message.sender === 'user';

  const getStatusIcon = (): React.ReactNode => {
    switch (message.status) {
      case 'sending':
        return (
          <Clock 
            className="w-3 h-3 text-gray-400 animate-spin" 
            aria-hidden="true"
            aria-label="Message sending"
          />
        );
      case 'sent':
        return (
          <CheckCircle 
            className="w-3 h-3 text-green-500" 
            aria-hidden="true"
            aria-label="Message sent"
          />
        );
      case 'failed':
        return (
          <XCircle 
            className="w-3 h-3 text-red-500" 
            aria-hidden="true"
            aria-label="Message failed"
          />
        );
      default:
        return null;
    }
  };

  const handleRetry = (): void => {
    if (onRetry && message.status === 'failed') {
      onRetry(message.id);
    }
  };

  const messageId = `message-${message.id}`;
  const timestampId = `timestamp-${message.id}`;

  return (
    <div 
      className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-labelledby={messageId}
      aria-describedby={timestampId}
    >
      <div 
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-200' 
            : 'bg-gradient-to-br from-purple-500 to-purple-600 ring-2 ring-purple-200'
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" aria-hidden="true" />
        ) : (
          <Bot className="w-5 h-5 text-white" aria-hidden="true" />
        )}
      </div>
      
      <div className={`flex flex-col max-w-xs sm:max-w-md lg:max-w-2xl xl:max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`px-5 py-4 rounded-2xl ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]' 
              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]'
          } ${
            message.status === 'failed' ? 'border-red-300 bg-red-50 shadow-red-100' : ''
          }`}
          id={messageId}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
            {message.content}
            {isTyping && (
              <span className="inline-block ml-1">
                <span className="animate-pulse text-blue-300">●</span>
              </span>
            )}
          </p>
          
          {message.intent && !isUser && (
            <div className="mt-3 text-xs opacity-70 bg-gray-50 px-2 py-1 rounded-full inline-block" aria-label="Detected intent">
              Intent: {message.intent}
            </div>
          )}
          
          {message.status === 'failed' && onRetry && (
            <button
              onClick={handleRetry}
              className="mt-3 text-xs text-red-600 hover:text-red-800 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded transition-colors duration-200"
              aria-label="Retry sending message"
            >
              Click to retry
            </button>
          )}
        </div>
        
        <div 
          className={`flex items-center gap-2 mt-2 text-xs text-gray-500 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
          id={timestampId}
          aria-label={`Message timestamp: ${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        >
          <span className="font-medium">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isTyping === nextProps.isTyping
  );
});

// Add display name for debugging
ChatMessage.displayName = 'ChatMessage';
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
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-purple-600'
        }`}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" aria-hidden="true" />
        ) : (
          <Bot className="w-4 h-4 text-white" aria-hidden="true" />
        )}
      </div>
      
      <div className={`flex flex-col max-w-xs sm:max-w-md lg:max-w-2xl xl:max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : 'bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200'
          } shadow-sm hover:shadow-md transition-shadow duration-200 ${
            message.status === 'failed' ? 'border-red-300 bg-red-50' : ''
          }`}
          id={messageId}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
            {isTyping && (
              <span className="inline-block ml-1">
                <span className="animate-pulse">●</span>
              </span>
            )}
          </p>
          
          {message.intent && !isUser && (
            <div className="mt-2 text-xs opacity-60" aria-label="Detected intent">
              Intent: {message.intent}
            </div>
          )}
          
          {message.status === 'failed' && onRetry && (
            <button
              onClick={handleRetry}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              aria-label="Retry sending message"
            >
              Click to retry
            </button>
          )}
        </div>
        
        <div 
          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
          id={timestampId}
          aria-label={`Message timestamp: ${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        >
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
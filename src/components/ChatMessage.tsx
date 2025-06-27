import React from 'react';
import { Message } from '../types';
import { User, Bot, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-spin" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-600' : 'bg-purple-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className={`flex flex-col max-w-xs sm:max-w-md lg:max-w-2xl xl:max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm border border-gray-200'
        } shadow-sm hover:shadow-md transition-shadow duration-200`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          {message.intent && !isUser && (
            <div className="mt-2 text-xs opacity-60">
              Intent: {message.intent}
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { OnboardingMessage } from './OnboardingMessage';
import { ChatTemplates } from './ChatTemplates';
import { VirtualList } from './VirtualList';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  showOnboarding: boolean;
  onDismissOnboarding: () => void;
  onTemplateSelect: (template: string) => void;
  onRetry?: (messageId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isTyping,
  showOnboarding,
  onDismissOnboarding,
  onTemplateSelect,
  onRetry
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Home') {
        e.preventDefault();
        chatContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        e.preventDefault();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = formatDate(message.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-6"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
    >
      {showOnboarding && (
        <OnboardingMessage onDismiss={onDismissOnboarding} />
      )}
      {messages.length === 0 && !showOnboarding && (
        <ChatTemplates onTemplateSelect={onTemplateSelect} />
      )}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
          <p className="text-sm text-gray-600 max-w-md">
            Ask me anything! I'm here to help with questions, provide information, or just chat.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {[
              "What can you help me with?",
              "Tell me a joke",
              "How does AI work?",
              "What's the weather like?"
            ].map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // This would trigger a message with the suggestion
                  console.log('Suggestion clicked:', suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              {/* Date Separator */}
              <div className="flex items-center justify-center">
                <div className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600">{date}</span>
                </div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLastMessage={index === dateMessages.length - 1 && !isTyping}
                  onRetry={onRetry}
                />
              ))}
            </div>
          ))}
          
          {/* Typing Indicator */}
          <TypingIndicator isTyping={isTyping} />
        </>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
      
      {/* Keyboard shortcuts help */}
      <div className="text-center text-xs text-gray-400 mt-4">
        <span>Home: Scroll to top • End: Scroll to bottom</span>
      </div>
    </div>
  );
};

export default ChatWindow; 
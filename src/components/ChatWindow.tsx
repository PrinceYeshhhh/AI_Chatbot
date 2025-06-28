import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { OnboardingMessage } from './OnboardingMessage';
import { ChatTemplates } from './ChatTemplates';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  intent?: string;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  showOnboarding: boolean;
  onDismissOnboarding: () => void;
  onTemplateSelect: (template: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isTyping,
  showOnboarding,
  onDismissOnboarding,
  onTemplateSelect
}) => {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  return (
    <div ref={chatRef} className="max-w-4xl mx-auto px-4 lg:px-6 py-8 h-full overflow-y-auto">
      {showOnboarding && (
        <OnboardingMessage onDismiss={onDismissOnboarding} />
      )}
      {messages.length === 0 && !showOnboarding && (
        <ChatTemplates onTemplateSelect={onTemplateSelect} />
      )}
      {messages.length > 0 && (
        <div className="space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      )}
    </div>
  );
};

export default ChatWindow; 
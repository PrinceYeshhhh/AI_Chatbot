import React from 'react';
import { ChatInput } from './ChatInput';
import { VoiceInputButton } from './VoiceInputButton';
import { SaveChatButton } from './SaveChatButton';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  currentConversation: any;
}

const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  disabled,
  placeholder,
  currentConversation
}) => {
  if (!currentConversation) return null;
  return (
    <div className="border-t border-gray-200 bg-white sticky bottom-0 z-10">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-2 py-2">
          <VoiceInputButton />
          <SaveChatButton conversation={currentConversation} />
        </div>
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={disabled}
          placeholder={placeholder || ''}
        />
      </div>
    </div>
  );
};

export default InputBar; 
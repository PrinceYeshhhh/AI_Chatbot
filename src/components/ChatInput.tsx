import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording functionality would be implemented here
    if (!isRecording) {
      console.log('Starting voice recording...');
    } else {
      console.log('Stopping voice recording...');
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      setMessage(prev => prev + ` [File: ${file.name}]`);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="py-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-20 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleVoiceRecord}
              className={`p-1.5 transition-all duration-200 rounded-md ${
                isRecording 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={isRecording ? "Stop recording" : "Voice message"}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleFileAttach}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-md hover:bg-gray-100"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,text/*,.pdf,.doc,.docx"
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
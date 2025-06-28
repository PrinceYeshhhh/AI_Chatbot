import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';
import { SecurityUtils } from '../utils/security';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { useFocusManagement } from '../hooks/useKeyboardNavigation';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  onError?: (error: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 4000,
  onError
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  const { updateFocusableElements, focusFirstElement } = useFocusManagement();

  useEffect(() => {
    if (containerRef.current) {
      updateFocusableElements(containerRef.current);
    }
  }, [updateFocusableElements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || isProcessing) {
      return;
    }

    const performanceTimer = PerformanceMonitor.startTimer('messageSubmission');
    setIsProcessing(true);

    try {
      // Security validation
      const sanitizedMessage = SecurityUtils.sanitizeInput(message.trim());
      const validation = SecurityUtils.validateMessageContent(sanitizedMessage);
      
      if (!validation.isValid) {
        onError?.(validation.error || 'Invalid message');
        return;
      }

      // Check for malicious content
      if (SecurityUtils.containsMaliciousContent(sanitizedMessage)) {
        onError?.('Message contains potentially harmful content');
        return;
      }

      await onSendMessage(sanitizedMessage);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsProcessing(false);
      performanceTimer();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift + Enter for new line
    else if (e.key === 'Enter' && e.shiftKey) {
      // Allow default behavior (new line)
      return;
    }
    // Enter to send message
    else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceRecord = () => {
    if (disabled || isProcessing) return;

    const performanceTimer = PerformanceMonitor.startTimer('voiceRecording');
    
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      console.log('Starting voice recording...');
      // Voice recording functionality would be implemented here
    } else {
      console.log('Stopping voice recording...');
      // Process recorded audio
    }
    
    performanceTimer();
  };

  const handleFileAttach = () => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security validation for file
      const fileName = SecurityUtils.sanitizeInput(file.name);
      const fileSize = file.size;
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      
      if (fileSize > maxFileSize) {
        onError?.('File size too large. Maximum size is 10MB.');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/markdown', 'text/csv',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        onError?.('File type not supported. Please select a valid file.');
        return;
      }

      console.log('File selected:', fileName);
      setMessage(prev => prev + ` [File: ${fileName}]`);
    }
    
    // Reset file input
    e.target.value = '';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [message]);

  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;
  const remainingChars = maxLength - characterCount;

  return (
    <div ref={containerRef} className="py-4" role="region" aria-label="Chat input">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            rows={1}
            maxLength={maxLength}
            aria-label="Message input"
            aria-describedby="message-help message-counter"
            aria-invalid={isOverLimit}
            data-testid="chat-input"
            className={`w-full resize-none rounded-xl border px-4 py-3 pr-20 focus:ring-2 focus:ring-blue-200 transition-all duration-200 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed ${
              isOverLimit 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          
          {/* Character counter */}
          <div 
            id="message-counter"
            className={`absolute right-2 top-2 text-xs ${
              isOverLimit ? 'text-red-500' : 'text-gray-400'
            }`}
            aria-live="polite"
          >
            {characterCount}/{maxLength}
          </div>
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleVoiceRecord}
              disabled={disabled || isProcessing}
              aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
              aria-pressed={isRecording}
              className={`p-2 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 ${
                isRecording 
                  ? 'text-red-600 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 ring-2 ring-red-200' 
                  : 'text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 hover:text-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleFileAttach}
              disabled={disabled || isProcessing}
              aria-label="Attach file"
              className="p-2 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 hover:text-gray-700 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Paperclip className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,text/*,.pdf,.doc,.docx"
            aria-label="File input"
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled || isProcessing || isOverLimit}
          aria-label="Send message"
          aria-describedby="send-button-help"
          className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
        >
          <Send className="w-5 h-5" aria-hidden="true" />
          {isProcessing && (
            <span className="sr-only">Sending message...</span>
          )}
        </button>
      </form>
      
      {/* Help text */}
      <div id="message-help" className="sr-only">
        Type your message here. Use Enter to send, Shift+Enter for new line, or Ctrl+Enter to send.
      </div>
      
      <div id="send-button-help" className="sr-only">
        Click to send your message. Use Ctrl+Enter as a keyboard shortcut.
      </div>
      
      {/* Character limit warning */}
      {isOverLimit && (
        <div className="mt-2 text-sm text-red-600" role="alert" aria-live="assertive">
          Message is too long. Please remove {Math.abs(remainingChars)} characters.
        </div>
      )}
      
      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-2 text-sm text-blue-600" role="status" aria-live="polite">
          Sending message...
        </div>
      )}
    </div>
  );
};
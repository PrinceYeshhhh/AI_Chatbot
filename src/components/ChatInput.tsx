import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X } from 'lucide-react';

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
  const [showAttachments, setShowAttachments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      const trimmedMessage = message.trim();
      
      // Basic validation
      if (trimmedMessage.length === 0) {
        onError?.('Message cannot be empty');
        return;
      }

      if (trimmedMessage.length > maxLength) {
        onError?.(`Message is too long. Maximum ${maxLength} characters allowed.`);
        return;
      }

      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
    // Shift + Enter for new line
    else if (e.key === 'Enter' && e.shiftKey) {
      // Allow default behavior (new line)
      return;
    }
    // Enter to send message
    else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
    // Escape to clear message
    else if (e.key === 'Escape') {
      setMessage('');
      setShowAttachments(false);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsRecording(true);
      // Voice recognition logic would go here
      // For now, just simulate
      setTimeout(() => {
        setIsRecording(false);
        setMessage(prev => prev + ' Voice input placeholder');
      }, 2000);
    } else {
      alert('Voice input is not supported in this browser');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File upload logic would go here
      setMessage(prev => prev + ` [Attached: ${file.name}]`);
    }
  };

  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;
  const remainingChars = maxLength - characterCount;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Attachment Panel */}
      {showAttachments && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
            <button
              onClick={() => setShowAttachments(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Paperclip className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">File</span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              />
            </label>
            <button
              onClick={handleVoiceInput}
              disabled={isRecording}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              <span className="text-sm">{isRecording ? 'Recording...' : 'Voice'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => setShowAttachments(!showAttachments)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Attach files or use voice input"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              console.log('Typing:', e.target.value); // Debug log
              setMessage(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-h-[44px] max-h-[120px] text-black bg-white"
            rows={1}
            aria-label="Message input"
            aria-describedby="message-help message-counter"
            aria-invalid={isOverLimit}
            data-testid="chat-input"
            style={{ color: 'black', backgroundColor: 'white' }}
          />
          
          {/* Debug: Show current message state */}
          <div className="text-xs text-gray-500 mt-1">
            Debug: Message length: {message.length} | Content: "{message.substring(0, 50)}"
          </div>
          
          {/* Character Count */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {characterCount}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || isProcessing || isOverLimit}
          className={`p-3 rounded-lg transition-all duration-200 ${
            message.trim() && !disabled && !isProcessing && !isOverLimit
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Send message (Ctrl+Enter)"
        >
          <Send className="w-5 h-5" />
          {isProcessing && (
            <span className="sr-only">Sending message...</span>
          )}
        </button>
      </form>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
        <span>Ctrl+Enter: Send</span>
        <span>Shift+Enter: New line</span>
        <span>Esc: Clear</span>
      </div>

      {/* Help text */}
      <div id="message-help" className="sr-only">
        Type your message here. Use Enter to send, Shift+Enter for new line, or Ctrl+Enter to send.
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
import React, { useState, useRef, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { Send, Mic, Paperclip, X, Pause, Play } from 'lucide-react';
import { chatService } from '../services/chatService';

interface ChatInputProps {
  onSendMessage: (message: string, options?: { provider: string; model: string; temperature: number; strategy: string }) => void;
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Advanced LLM controls
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [strategy, setStrategy] = useState('single-shot');

  // --- Voice Input (Speech-to-Text) ---
  const [transcription, setTranscription] = useState('');
  const [recordingLang, setRecordingLang] = useState('en');
  const [isPaused, setIsPaused] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_FILE_TYPES = [
    // Documents
    '.pdf', '.docx', '.txt', '.csv', '.xls', '.xlsx',
    // Images
    '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
    // Audio
    '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm'
  ];

  // Debounced message setter
  const debouncedSetMessage = useRef(debounce((val: string) => setMessage(val), 200)).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    debouncedSetMessage(e.target.value);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const validateMessage = (msg: string): string | null => {
    if (!msg.trim()) return 'Message cannot be empty or whitespace.';
    if (msg.length > maxLength) return `Message is too long. Maximum ${maxLength} characters allowed.`;
    if (/\b(script|<script|<\/script)\b/i.test(msg)) return 'Message contains potentially malicious content.';
    if (msg.split(/\s+/).some(word => word.length > 100)) return 'Message contains an unusually long word.';
    if (new Blob([msg]).size > 16 * 1024) return 'Message is too large. Please shorten your input.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    // Stricter validation
    const validationError = validateMessage(trimmedMessage);
    if (validationError) {
      onError?.(validationError);
      return;
    }
    if (disabled || isProcessing) return;
    setIsProcessing(true);
    try {
      await onSendMessage(trimmedMessage, {
        provider,
        model,
        temperature,
        strategy
      });
      setMessage('');
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
    // Voice input is now handled by VoiceInputButton component
    // This function is kept for backward compatibility
    console.log('Voice input handled by VoiceInputButton component');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Validate files before upload
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        onError?.(`File ${file.name} is too large. Maximum allowed size is 50MB.`);
        return;
      }
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(ext)) {
        onError?.(`File type not allowed: ${file.name}`);
        return;
      }
    }
    setUploadProgress(0);
    setUploadStatus(null);
    try {
      const result = await chatService.uploadFiles(files, (percent) => setUploadProgress(percent));
      setUploadProgress(null);
      // Handle 207 multi-status
      if (result.errors && result.errors.length > 0) {
        setUploadStatus(`Some files failed: ${result.errors.map((err: any) => err.filename + ': ' + err.error).join('; ')}`);
        onError?.(result.errors.map((err: any) => err.error).join('; '));
      } else {
        setUploadStatus('Upload successful!');
      }
      // Add a reference to the uploaded files in the message
      setMessage(prev => prev + files.map(file => ` [Uploaded: ${file.name} - ${result.summary?.totalChunks || 0} chunks processed]`).join(''));
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadProgress(null);
      setUploadStatus('Upload failed');
      console.error('File upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const startRecording = () => {
    setRecordingError(null);
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = recordingLang;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscription(prev => prev + event.results[i][0].transcript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscription(prev => prev.split(' [interim]')[0] + (interim ? ' [interim]' + interim : ''));
      };
      recognition.onerror = (event: any) => {
        setRecordingError(event.error || 'Speech recognition error');
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setIsPaused(false);
    } else {
      // Fallback: whisper.js (not implemented here, placeholder)
      setRecordingError('Web Speech API not supported. Whisper.js fallback not implemented.');
    }
  };
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  };
  const pauseRecording = () => {
    if (recognitionRef.current && recognitionRef.current.stop) {
      recognitionRef.current.stop();
      setIsPaused(true);
    }
  };
  const resumeRecording = () => {
    if (!isPaused) return;
    startRecording();
  };
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  const handleTranscriptionSend = () => {
    setMessage(transcription.replace(/ \[interim\].*$/, ''));
    setTranscription('');
    setIsRecording(false);
  };
  // --- Language selection for Whisper ---
  const LANG_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'hi', label: 'हिन्दी' },
    // ... add more as needed
  ];

  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;
  const remainingChars = maxLength - characterCount;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Voice Input Controls */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          className={`p-2 rounded-full ${isRecording ? 'bg-red-100' : 'bg-gray-100'} hover:bg-blue-100`}
          onClick={handleMicClick}
          aria-label={isRecording ? 'Mic: Stop voice input' : 'Mic: Start voice input'}
        >
          <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-700'}`} />
        </button>
        {isRecording && (
          <>
            <button type="button" className="p-2" onClick={pauseRecording} aria-label="Pause recording"><Pause /></button>
            <button type="button" className="p-2" onClick={resumeRecording} aria-label="Resume recording"><Play /></button>
            <select value={recordingLang} onChange={e => setRecordingLang(e.target.value)} className="border rounded px-2 py-1 ml-2" aria-label="Voice input language">
              {LANG_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </>
        )}
        {transcription && (
          <div className="ml-2 flex-1">
            <span className="text-gray-700">{transcription}</span>
            <button type="button" className="ml-2 px-2 py-1 bg-blue-500 text-white rounded" onClick={handleTranscriptionSend}>Send</button>
          </div>
        )}
        {recordingError && <span className="text-red-500 ml-2">{recordingError}</span>}
      </div>
      {/* Advanced LLM controls */}
      <div className="flex flex-wrap gap-2 mb-3">
        <select value={provider} onChange={e => setProvider(e.target.value)} className="border rounded px-2 py-1">
          <option value="groq">Groq</option>
          <option value="together">Together.ai</option>
          <option value="anthropic">Anthropic</option>
          <option value="local">Local</option>
        </select>
        <select value={model} onChange={e => setModel(e.target.value)} className="border rounded px-2 py-1">
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3">Claude 3</option>
          <option value="llama-3">LLaMA 3</option>
        </select>
        <select value={strategy} onChange={e => setStrategy(e.target.value)} className="border rounded px-2 py-1">
          <option value="single-shot">Single Shot</option>
          <option value="chain-of-thought">Chain of Thought</option>
          <option value="multi-agent">Multi-Agent</option>
          <option value="reflexion">Reflexion</option>
        </select>
        <input
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={e => setTemperature(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
          placeholder="Temperature"
        />
      </div>
      {/* Attachment Panel */}
      {showAttachments && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
            <button
              onClick={() => setShowAttachments(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close"
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
                multiple
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
          {/* Upload Progress Indicator */}
          {uploadProgress !== null && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
              <div className="text-xs text-gray-600 mt-1">Uploading: {uploadProgress}%</div>
            </div>
          )}
          {/* Upload Status */}
          {uploadStatus && (
            <div className="mt-2 text-xs text-red-600" role="alert">{uploadStatus}</div>
          )}
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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 min-h-[44px] max-h-[120px] text-black bg-white"
            rows={1}
            aria-label="Message input"
            aria-describedby="message-help message-counter"
            aria-invalid={isOverLimit}
            data-testid="chat-input"
            style={{ 
              color: 'black', 
              backgroundColor: 'white',
              caretColor: 'black'
            }}
          />
          
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
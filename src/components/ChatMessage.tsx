import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot, Clock, CheckCircle, XCircle, Copy, Check, Volume2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  onRetry?: (messageId: string) => void;
  isLastMessage: boolean;
}

// Memoized component for performance optimization
export const ChatMessage = React.memo<ChatMessageProps>(({ 
  message, 
  isTyping = false, 
  onRetry,
  isLastMessage
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [speechError, setSpeechError] = React.useState<string | null>(null);

  useEffect(() => {
    if (isLastMessage && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isLastMessage]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // --- TTS Voice Output ---
  const speak = (text: string, lang: string = 'en', gender: string = 'neutral', rate: number = 1, pitch: number = 1, provider: string = 'native') => {
    setSpeechError(null);
    setIsSpeaking(true);
    if (provider === 'native' && 'speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = rate;
      utter.pitch = pitch;
      // Gender selection (best effort)
      const voices = window.speechSynthesis.getVoices();
      if (gender !== 'neutral') {
        utter.voice = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes(gender)) || null;
      }
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = (e) => { setSpeechError('Speech error'); setIsSpeaking(false); };
      window.speechSynthesis.speak(utter);
    } else {
      // TODO: ElevenLabs or other provider fallback
      setSpeechError('TTS provider not available');
      setIsSpeaking(false);
    }
  };

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
      ref={messageRef}
      className={`group flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in slide-in-from-bottom-2 duration-300`}
      role="article"
      aria-labelledby={messageId}
      aria-describedby={timestampId}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
        } shadow-md`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
          {/* Sender Label */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">{isUser ? 'You' : 'AI Assistant'}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(message.timestamp)}</span>
            </div>
      </div>
      
          {/* Message Bubble */}
          <div
            className={`relative group/message ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-800 shadow-sm hover:shadow-md'
            } rounded-2xl px-4 py-3 max-w-full transition-all duration-200 hover:scale-[1.02]`}
            aria-label={isUser ? 'user message' : 'bot message'}
            tabIndex={0}
          >
            
            {/* Copy Button (for AI messages) */}
            {!isUser && (
              <button
                onClick={copyToClipboard}
                className="absolute -top-2 -right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full opacity-0 group-hover/message:opacity-100 transition-all duration-200 shadow-sm"
                title="Copy message"
                aria-label="Copy message to clipboard"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-600" />
                )}
              </button>
            )}
            {/* Speaker Button for TTS */}
            {!isUser && (
              <button
                onClick={() => speak(message.content, message.lang || 'en', message.voiceGender || 'neutral', message.voiceRate || 1, message.voicePitch || 1, message.voiceProvider || 'native')}
                className="absolute -top-2 left-2 p-1.5 bg-gray-100 hover:bg-blue-200 rounded-full opacity-0 group-hover/message:opacity-100 transition-all duration-200 shadow-sm"
                title="Read message aloud"
                aria-label="Read message aloud"
                disabled={isSpeaking}
              >
                <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse text-blue-600' : 'text-gray-600'}`} />
              </button>
            )}
            {/* Message Text */}
            <div className="prose prose-sm max-w-none">
              <p className={`whitespace-pre-wrap break-words ${
                isUser ? 'text-white' : 'text-gray-800'
              }`}>
                {message.content}
              </p>
            </div>
            {/* Translation Tooltip */}
            {!isUser && message.translatedFrom && (
              <div className="absolute bottom-0 right-0 bg-yellow-100 text-xs text-yellow-800 px-2 py-1 rounded-tl-lg" title={`Translated from ${message.translatedFrom}`}>🈯 Translated from {message.translatedFrom}</div>
            )}
            {/* Message Status (for user messages) */}
            {isUser && (
              <div className="flex items-center justify-end mt-2 text-xs opacity-70">
                <span>✓ Sent</span>
              </div>
          )}
          {/* TTS Error */}
          {speechError && <div className="text-xs text-red-500 mt-1">{speechError}</div>}
        </div>
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
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.isLastMessage === nextProps.isLastMessage
  );
});

// Add display name for debugging
ChatMessage.displayName = 'ChatMessage';
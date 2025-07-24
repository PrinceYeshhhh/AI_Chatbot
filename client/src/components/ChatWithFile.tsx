import React, { useState } from 'react';
import { useAuth, useE2EE } from '../context/AuthContext';
import { useEncryptionKey } from '../lib/useEncryptionKey';
import { encryptData, decryptData } from '../lib/crypto';
import { LoadingSpinner } from './ui/loading-spinner';
import { Alert } from './ui/alert';
import { useToast } from '../App';

interface ChatWithFileProps {
  fileId: string;
  onClose: () => void;
  userLang?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hallucination?: boolean;
  confidence?: number;
  detectedLang?: string;
  translated?: boolean;
}

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  // Add more models as needed
];

export default function ChatWithFile({ fileId, onClose, userLang = 'en' }: ChatWithFileProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState('anthropic'); // Changed default provider
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [strategy, setStrategy] = useState('single-shot');
  const [feedback, setFeedback] = useState<Record<number, 'positive' | 'negative' | null>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<Record<number, boolean>>({});

  const { password, salt } = useE2EE();
  const key = useEncryptionKey(password, salt);

  const handleSend = async () => {
    if (!input.trim() || !key) return;
    setError(null);
    const question = input.trim();
    // Encrypt user message
    const encrypted = await encryptData(key, question);
    setChatHistory((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`/api/ask-file/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedQuery: encrypted,
          chat_history: chatHistory,
          user_id: user?.id,
          provider,
          model,
          temperature,
          strategy,
          userLang
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');
      // Decrypt AI response
      const decrypted = await decryptData(key, data.encryptedResponse);
      setChatHistory((prev) => [...prev, { role: 'assistant', content: decrypted, hallucination: data.hallucination?.isHallucination, confidence: data.hallucination?.confidence, detectedLang: data.detectedLang, translated: data.translated }]);
      showToast('Response received successfully!', 'success');
    } catch (err: any) {
      const errorMessage = err.message || 'Error getting response';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (idx: number, feedbackType: 'positive' | 'negative', message: Message) => {
    if (!user) return;
    setSubmittingFeedback(prev => ({ ...prev, [idx]: true }));
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          response_id: `${fileId}-msg-${idx}`,
          feedback: feedbackType,
          message_text: message.content,
          timestamp: new Date().toISOString()
        })
      });
      setFeedback(prev => ({ ...prev, [idx]: feedbackType }));
      showToast('Thanks for your feedback!', 'success');
    } catch (e) {
      showToast('Failed to submit feedback.', 'error');
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Chat with File</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
          aria-label="Close chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select 
            id="provider-select"
            value={provider} 
            onChange={e => setProvider(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="anthropic">Anthropic</option>
            <option value="local">Local</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            id="model-select"
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {MODEL_OPTIONS.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="strategy-select" className="block text-sm font-medium text-gray-700 mb-1">
            Strategy
          </label>
          <select 
            id="strategy-select"
            value={strategy} 
            onChange={e => setStrategy(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="single-shot">Single Shot</option>
            <option value="chain-of-thought">Chain of Thought</option>
            <option value="multi-agent">Multi-Agent</option>
            <option value="reflexion">Reflexion</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="temperature-input" className="block text-sm font-medium text-gray-700 mb-1">
            Temperature
          </label>
          <input
            id="temperature-input"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={e => setTemperature(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.7"
          />
        </div>
      </div>
      <div className="h-64 overflow-y-auto bg-white rounded border p-3 mb-3">
        {chatHistory.length === 0 && (
          <div className="text-gray-400 text-center mt-16">No messages yet. Ask something about this file!</div>
        )}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left'}`}>
              <div>{msg.content}</div>
              {msg.hallucination !== undefined && (
                <div className="text-xs mt-1">
                  <span className={msg.hallucination ? 'text-red-500' : 'text-green-600'}>
                    {msg.hallucination ? 'Possible Hallucination' : 'Factual'}
                  </span>
                  {msg.confidence !== undefined && (
                    <span className="ml-2">Confidence: {(msg.confidence * 100).toFixed(1)}%</span>
                  )}
                </div>
              )}
              {msg.detectedLang && (
                <div className="text-xs text-gray-500 mt-1">
                  {msg.translated ? `Translated from ${msg.detectedLang}` : `Language: ${msg.detectedLang}`}
                </div>
              )}
              {/* Feedback UI for assistant messages only */}
              {msg.role === 'assistant' && (
                <div className="mt-2">
                  {feedback[idx] ? (
                    <div className="text-xs text-green-700">Thank you for your feedback!</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-700">Was this answer helpful?</span>
                      <button
                        className="text-green-600 hover:text-green-800 text-xl disabled:opacity-50"
                        disabled={submittingFeedback[idx]}
                        onClick={() => handleFeedback(idx, 'positive', msg)}
                        title="Helpful"
                      >
                        👍
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-xl disabled:opacity-50"
                        disabled={submittingFeedback[idx]}
                        onClick={() => handleFeedback(idx, 'negative', msg)}
                        title="Not Helpful"
                      >
                        👎
                      </button>
                      {submittingFeedback[idx] && <span className="text-xs text-gray-500 ml-2">Submitting...</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 text-center">Thinking...</div>
        )}
      </div>
      <div className="flex gap-3">
        <input
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Ask a question about this file..."
          disabled={loading}
          aria-label="Chat input"
        />
        <button
          onClick={handleSend}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" color="white" />
              <span>Sending...</span>
            </div>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
}; 
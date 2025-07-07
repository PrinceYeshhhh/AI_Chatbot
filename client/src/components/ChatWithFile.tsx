import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ChatWithFileProps {
  fileId: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatWithFile: React.FC<ChatWithFileProps> = ({ fileId, onClose }) => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [strategy, setStrategy] = useState('single-shot');

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    const question = input.trim();
    setChatHistory((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`/api/ask-file/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          chat_history: chatHistory,
          user_id: user?.id,
          provider,
          model,
          temperature,
          strategy
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get response');
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setError(err.message || 'Error getting response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Chat with File</h3>
        <button onClick={onClose} className="text-sm text-red-500 hover:underline">Close</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <select value={provider} onChange={e => setProvider(e.target.value)} className="border rounded px-2 py-1">
          <option value="openai">OpenAI</option>
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
      <div className="h-64 overflow-y-auto bg-white rounded border p-3 mb-3">
        {chatHistory.length === 0 && (
          <div className="text-gray-400 text-center mt-16">No messages yet. Ask something about this file!</div>
        )}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 text-center">Thinking...</div>
        )}
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Ask a question about this file..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWithFile; 
import React, { useEffect, useState } from 'react';

interface ChatEntry {
  query_text: string;
  ai_response: string;
  created_at: string;
}

const ChatHistory: React.FC = () => {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/chat/history');
        if (!res.ok) throw new Error('Failed to fetch chat history');
        const data = await res.json();
        // Support both { history: [...] } and [...]
        setHistory(Array.isArray(data) ? data : data.history || []);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div>Loading chat history...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      {history.length === 0 && <div className="text-gray-500">No chat history found.</div>}
      {history.map((chat) => (
        <div key={chat.created_at + chat.query_text} className="p-4 border rounded-md bg-white shadow-sm">
          <p><b>You:</b> {chat.query_text}</p>
          <p><b>AI:</b> {chat.ai_response}</p>
          <p className="text-xs text-gray-500">{new Date(chat.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory; 
import React, { useEffect, useState } from 'react';
import { useEncryptionKey } from '../lib/useEncryptionKey';
import { decryptData } from '../lib/crypto';
import { useE2EE } from '../context/AuthContext';

interface ChatEntry {
  encrypted_query: any;
  encrypted_response: any;
  created_at: string;
}

const ChatHistory: React.FC = () => {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [decryptedHistory, setDecryptedHistory] = useState<{ query: string; response: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { password, salt } = useE2EE();
  const key = useEncryptionKey(password, salt);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/chat/history');
        if (!res.ok) throw new Error('Failed to fetch chat history');
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : data.history || []);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const decryptHistory = async () => {
      if (!key) return;
      const decrypted = await Promise.all(
        history.map(async (chat) => {
          try {
            const query = await decryptData(key, chat.encrypted_query);
            const response = await decryptData(key, chat.encrypted_response);
            return { query, response, created_at: chat.created_at };
          } catch {
            return { query: '[Decryption failed]', response: '[Decryption failed]', created_at: chat.created_at };
          }
        })
      );
      setDecryptedHistory(decrypted);
    };
    if (history.length && key) decryptHistory();
  }, [history, key]);

  if (loading) return <div>Loading chat history...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      {decryptedHistory.length === 0 && <div className="text-gray-500">No chat history found.</div>}
      {decryptedHistory.map((chat) => (
        <div key={chat.created_at + chat.query} className="p-4 border rounded-md bg-white shadow-sm">
          <p><b>You:</b> {chat.query}</p>
          <p><b>AI:</b> {chat.response}</p>
          <p className="text-xs text-gray-500">{new Date(chat.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory; 
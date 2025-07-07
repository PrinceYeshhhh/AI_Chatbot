import React, { useState } from 'react';

interface ClearChatButtonProps {
  onClear: () => void;
}

const ClearChatButton: React.FC<ClearChatButtonProps> = ({ onClear }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear the chat?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat/clear', { method: 'DELETE' });
      if (res.ok) {
        onClear();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to clear chat');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClearChat}
        className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Clearing...' : 'Clear Chat'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default ClearChatButton; 
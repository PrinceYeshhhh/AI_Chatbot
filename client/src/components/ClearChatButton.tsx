import React, { useState } from 'react';
import { useToast } from '../App';

interface ClearChatButtonProps {
  onClear: () => void;
}

const ClearChatButton: React.FC<ClearChatButtonProps> = ({ onClear }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear the chat?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/chat/clear', { method: 'DELETE' });
      if (res.ok) {
        onClear();
        showToast('Chat cleared successfully.', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to clear chat', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Unknown error', 'error');
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
    </div>
  );
};

export default ClearChatButton; 
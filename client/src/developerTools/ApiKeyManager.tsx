import React, { useState } from 'react';
import { generateApiKey } from '../services/analyticsService';

export const ApiKeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateApiKey = async () => {
    setLoading(true);
    try {
      const res = await generateApiKey();
      setApiKey(res.api_key);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Developer API Key</h3>
      {apiKey ? (
        <div><strong>Your API Key:</strong> <code>{apiKey}</code></div>
      ) : (
        <button onClick={handleGenerateApiKey} disabled={loading}>
          {loading ? 'Generating...' : 'Generate API Key'}
        </button>
      )}
    </div>
  );
}; 
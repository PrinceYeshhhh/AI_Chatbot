import React, { useEffect, useState } from 'react';
import { getUserConfig, updateUserConfig } from '../services/userConfigService';

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude' },
  { value: 'groq', label: 'Groq' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'ollama', label: 'Ollama' },
];
const MEMORY_MODES = [
  { value: 'auto', label: 'Auto' },
  { value: 'full', label: 'Full' },
  { value: 'none', label: 'None' },
];

const UserConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getUserConfig()
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load config');
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateUserConfig(config);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading user preferences...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '2em auto', background: '#f6f6fa', padding: 24, borderRadius: 10, boxShadow: '0 1px 4px #eee' }}>
      <h2>User Preferences</h2>
      <div style={{ marginBottom: 16 }}>
        <label>LLM Provider:<br />
          <select name="llmProvider" value={config.llmProvider} onChange={handleChange} style={{ width: '100%', padding: 6 }}>
            {LLM_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Streaming:
          <input type="checkbox" name="streaming" checked={!!config.streaming} onChange={handleChange} style={{ marginLeft: 8 }} />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>System Prompt:<br />
          <textarea name="systemPrompt" value={config.systemPrompt} onChange={handleChange} rows={3} style={{ width: '100%', padding: 6 }} />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Max Tokens:<br />
          <input type="number" name="maxTokens" value={config.maxTokens} onChange={handleChange} min={1} max={32768} style={{ width: '100%', padding: 6 }} />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Temperature:<br />
          <input type="number" name="temperature" value={config.temperature} onChange={handleChange} min={0} max={2} step={0.01} style={{ width: '100%', padding: 6 }} />
        </label>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label>Memory Mode:<br />
          <select name="memoryMode" value={config.memoryMode} onChange={handleChange} style={{ width: '100%', padding: 6 }}>
            {MEMORY_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <button type="submit" disabled={saving} style={{ padding: '8px 24px', fontSize: 16 }}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
      {success && <div style={{ color: 'green', marginTop: 12 }}>Preferences saved!</div>}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </form>
  );
};

export default UserConfigPanel; 
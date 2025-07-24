import React, { useEffect, useState } from 'react';
import { fetchPlugins } from '../services/pluginRegistryService';

const PluginList: React.FC = () => {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins()
      .then((data) => {
        setPlugins(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load plugins');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading plugins...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: '2em auto' }}>
      <h2>Available Plugins & Tools</h2>
      {plugins.length === 0 && <div>No plugins found.</div>}
      {plugins.map((plugin) => (
        <div key={plugin.name} style={{ background: '#f6f6fa', borderRadius: 10, padding: 20, marginBottom: 18, boxShadow: '0 1px 4px #eee' }}>
          <h3 style={{ margin: 0 }}>{plugin.name}</h3>
          <div style={{ color: '#666', marginBottom: 8 }}>{plugin.description}</div>
          <div><strong>Inputs:</strong> {plugin.inputs.map((input: any) => `${input.name} (${input.type}${input.required ? ', required' : ''})`).join(', ')}</div>
          <div><strong>Output Format:</strong> {plugin.outputFormat}</div>
          {plugin.endpoint && <div><strong>Endpoint:</strong> <code>{plugin.endpoint}</code></div>}
        </div>
      ))}
    </div>
  );
};

export default PluginList; 
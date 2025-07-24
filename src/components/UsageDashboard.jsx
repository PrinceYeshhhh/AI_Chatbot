import React, { useEffect, useState } from 'react';

const UsageDashboard = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/usage')
      .then(res => res.json())
      .then(data => {
        setUsage(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading usage...</div>;
  if (!usage) return <div>No usage data available.</div>;

  const { api_calls, tokens_estimated, file_mb, api_limit, token_limit, file_limit } = usage;
  const overLimit = api_calls > api_limit || tokens_estimated > token_limit || file_mb > file_limit;

  return (
    <div style={{ border: '1px solid #ccc', padding: 24, borderRadius: 8 }}>
      <h2>Your Usage</h2>
      <ul>
        <li>API Calls: {api_calls} / {api_limit}</li>
        <li>Tokens Used: {tokens_estimated} / {token_limit}</li>
        <li>Files Uploaded (MB): {file_mb} / {file_limit}</li>
      </ul>
      {overLimit && (
        <div style={{ color: 'red', marginTop: 16 }}>
          <strong>You've reached your usage limit!</strong>
          <br />
          <a href="/upgrade">Upgrade your plan</a>
        </div>
      )}
    </div>
  );
};

export default UsageDashboard; 
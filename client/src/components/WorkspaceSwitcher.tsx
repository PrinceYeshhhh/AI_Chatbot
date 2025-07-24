import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceSwitcher({ currentWorkspace, onSwitch }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line
  }, [user]);

  async function fetchWorkspaces() {
    setLoading(true);
    const res = await fetch('/api/workspaces', { headers: { 'Authorization': `Bearer ${user?.token}` } });
    const data = await res.json();
    setWorkspaces(data.workspaces || []);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-gray-700">Workspace:</span>
      <select
        className="border rounded px-2 py-1"
        value={currentWorkspace?.workspace_id || ''}
        onChange={e => {
          const ws = workspaces.find(w => w.workspace_id === e.target.value);
          if (ws) onSwitch(ws);
        }}
        disabled={loading}
      >
        {workspaces.map(ws => (
          <option key={ws.workspace_id} value={ws.workspace_id}>{ws.name}</option>
        ))}
      </select>
    </div>
  );
} 
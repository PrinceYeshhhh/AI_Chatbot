import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

const TOOL_OPTIONS = [
  'RAG',
  'File Memory',
  'Calculator',
  'External API',
  'HR',
  'Legal',
  'Analyst',
  'Product Manager',
];

type Agent = {
  agent_id: string;
  name: string;
  role: string;
  prompt: string;
  tools_allowed: string[];
  avatar?: string;
  description?: string;
  permissions?: any;
};

type AgentForm = {
  name: string;
  role: string;
  prompt: string;
  tools_allowed: string[];
  avatar?: string;
  description?: string;
  permissions: string;
  editingId: string | null;
};

export default function AgentManager() {
  const { user } = useAuth();
  const { workspaceId, role, loading: wsLoading, error: wsError } = useWorkspace();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState<AgentForm>({
    name: '',
    role: '',
    prompt: '',
    tools_allowed: [],
    avatar: '',
    description: '',
    permissions: '',
    editingId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // No hardcoded role or workspaceId logic to remove; already uses context.

  useEffect(() => {
    if (wsLoading || !workspaceId || !role) return;
    fetchAgents();
    // eslint-disable-next-line
  }, [wsLoading, workspaceId, role]);

  async function fetchAgents() {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/agent-tool/agents/${workspaceId}`);
    if (!res.ok) {
      setError('Failed to fetch agents');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAgents(data.agents || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      name: form.name,
      role: form.role,
      prompt: form.prompt,
      tools_allowed: form.tools_allowed,
      avatar: form.avatar,
      description: form.description,
      permissions: form.permissions ? JSON.parse(form.permissions) : {},
      workspace_id: workspaceId,
    };
    let res;
    if (form.editingId) {
      res = await fetch(`/api/agent-tool/agent/${form.editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/agent-tool/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    if (res.ok) {
      setForm({ name: '', role: '', prompt: '', tools_allowed: [], avatar: '', description: '', permissions: '', editingId: null });
      fetchAgents();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to save agent');
    }
    setLoading(false);
  }

  function handleEdit(agent: Agent) {
    setForm({
      name: agent.name,
      role: agent.role,
      prompt: agent.prompt,
      tools_allowed: agent.tools_allowed || [],
      avatar: agent.avatar || '',
      description: agent.description || '',
      permissions: JSON.stringify(agent.permissions || {}),
      editingId: agent.agent_id,
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this agent?')) return;
    setLoading(true);
    await fetch(`/api/agent-tool/agent/${id}`, { method: 'DELETE' });
    fetchAgents();
    setLoading(false);
  }

  async function handleAddTool(agent_id: string, tool_id: string) {
    setLoading(true);
    await fetch(`/api/agent-tool/agent/${agent_id}/tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_id }),
    });
    fetchAgents();
    setLoading(false);
  }
  async function handleRemoveTool(agent_id: string, tool_id: string) {
    setLoading(true);
    await fetch(`/api/agent-tool/agent/${agent_id}/tool/${tool_id}`, { method: 'DELETE' });
    fetchAgents();
    setLoading(false);
  }
  async function handleAddFile(agent_id: string, file_id: string) {
    setLoading(true);
    await fetch(`/api/agent-tool/agent/${agent_id}/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id }),
    });
    fetchAgents();
    setLoading(false);
  }
  async function handleRemoveFile(agent_id: string, file_id: string) {
    setLoading(true);
    await fetch(`/api/agent-tool/agent/${agent_id}/file/${file_id}`, { method: 'DELETE' });
    fetchAgents();
    setLoading(false);
  }
  async function handlePurgeMemory(agent_id: string) {
    if (!window.confirm('Purge all memory for this agent?')) return;
    setLoading(true);
    await fetch(`/api/agent-tool/agent/${agent_id}/memory`, { method: 'DELETE' });
    fetchAgents();
    setLoading(false);
  }

  if (wsLoading) return <div className="p-8">Loading workspace...</div>;
  if (wsError) return <div className="p-8 text-red-600">{wsError}</div>;
  if (!role) return <div className="p-8 text-red-600">You do not have permission to manage agents.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Agent Manager</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block font-semibold">Name</label>
          <input className="border rounded px-2 py-1 w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="block font-semibold">Role</label>
          <input className="border rounded px-2 py-1 w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
        </div>
        <div>
          <label className="block font-semibold">Persona Prompt</label>
          <textarea className="border rounded px-2 py-1 w-full" value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} required />
        </div>
        <div>
          <label className="block font-semibold">Tools Allowed</label>
          <select multiple className="border rounded px-2 py-1 w-full" value={form.tools_allowed} onChange={e => setForm(f => ({ ...f, tools_allowed: Array.from(e.target.selectedOptions, o => o.value) }))}>
            {TOOL_OPTIONS.map(tool => <option key={tool} value={tool}>{tool}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold">Permissions (JSON)</label>
          <textarea className="border rounded px-2 py-1 w-full" value={form.permissions} onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))} placeholder='{"folders": ["/hr", "/legal"]}' />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>{form.editingId ? 'Update' : 'Create'} Agent</button>
        {form.editingId && <button type="button" className="ml-2 text-xs underline" onClick={() => setForm({ name: '', role: '', prompt: '', tools_allowed: [], permissions: '', editingId: null })}>Cancel</button>}
        {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      </form>
      <h2 className="text-xl font-semibold mt-8 mb-2">Your Agents</h2>
      {loading ? <div>Loading...</div> : (
        <table className="w-full text-sm border mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th>Name</th><th>Role</th><th>Tools</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => (
              <tr key={agent.agent_id} className="border-b">
                <td>{agent.name}</td>
                <td>{agent.role}</td>
                <td>{(agent.tools_allowed || []).join(', ')}</td>
                <td>
                  <button className="text-blue-600 underline mr-2" onClick={() => handleEdit(agent)}>Edit</button>
                  <button className="text-red-600 underline" onClick={() => handleDelete(agent.agent_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 
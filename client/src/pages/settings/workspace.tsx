import { useEffect, useState } from 'react';
// REMOVE: import { createClient } from '@supabase/supabase-js';
import { useWorkspace } from '../../context/WorkspaceContext';
// Remove or fix the import for MODEL_OPTIONS
const MODEL_OPTIONS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-v2', label: 'Claude v2' },
  { value: 'local-llm', label: 'Local LLM' },
];
import Badge from '../../components/Badge';
import InfoCard from '../../components/InfoCard';
import Tooltip from '../../components/Tooltip';
import { Users, Zap, Shield } from 'lucide-react';

// REMOVE: const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// REMOVE: const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// REMOVE: const supabase = createClient(supabaseUrl, supabaseKey);

export default function WorkspaceSettings() {
  const { workspaceId, role, loading: wsLoading, error: wsError } = useWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const [enabledModels, setEnabledModels] = useState<string[]>(MODEL_OPTIONS.map(opt => opt.value));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [impersonateId, setImpersonateId] = useState('');
  const [impersonationToken, setImpersonationToken] = useState<string | null>(null);
  const [impersonationError, setImpersonationError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/workspaces/${workspaceId}/members`)
      .then(res => res.json())
      .then(data => {
        setMembers(data.members || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to fetch members');
        setLoading(false);
      });
  }, [workspaceId]);

  const invite = async () => {
    if (!email) return;
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: inviteRole })
    });
    if (res.ok) {
      setEmail('');
      setInviteRole('viewer');
      fetch(`/api/workspaces/${workspaceId}/members`)
        .then(res => res.json())
        .then(data => setMembers(data.members || []));
      setSuccess('Invite sent!');
    } else {
      setError('Failed to invite member');
    }
    setLoading(false);
  };

  const changeRole = async (user_id: string, newRole: string) => {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, role: newRole })
    });
    if (res.ok) {
      fetch(`/api/workspaces/${workspaceId}/members`)
        .then(res => res.json())
        .then(data => setMembers(data.members || []));
      setSuccess('Role updated!');
    } else {
      setError('Failed to update role');
    }
    setLoading(false);
  };

  const remove = async (user_id: string) => {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/members/${user_id}`, { method: 'DELETE' });
    if (res.ok) {
      fetch(`/api/workspaces/${workspaceId}/members`)
        .then(res => res.json())
        .then(data => setMembers(data.members || []));
      setSuccess('Member removed!');
    } else {
      setError('Failed to remove member');
    }
    setLoading(false);
  };

  const handleImpersonate = async () => {
    setImpersonationError(null);
    if (!impersonateId) return;
    const res = await fetch('/api/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: impersonateId })
    });
    if (res.ok) {
      const data = await res.json();
      setImpersonationToken(data.token);
      localStorage.setItem('impersonationToken', data.token);
      window.location.reload();
    } else {
      setImpersonationError('Failed to impersonate user');
    }
  };

  const handleStopImpersonate = () => {
    setImpersonationToken(null);
    localStorage.removeItem('impersonationToken');
    window.location.reload();
  };

  const isAdmin = role === 'admin' || role === 'owner';
  const workspaceName = workspaceId || 'Personal';
  const planType = 'free'; // TODO: fetch from backend
  const memberLimit = 10; // TODO: fetch from backend

  if (wsLoading || loading) return <div className="p-8">Loading workspace settings...</div>;
  if (wsError || error) return <div className="p-8 text-red-600">{wsError || error}</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {impersonationToken && (
        <div className="bg-yellow-200 text-yellow-900 p-4 mb-4 rounded shadow flex items-center justify-between">
          <span>Impersonating user: {impersonateId}</span>
          <button className="ml-4 bg-red-600 text-white px-3 py-1 rounded" onClick={handleStopImpersonate}>Stop Impersonating</button>
        </div>
      )}
      {/* Constraint InfoCard */}
      <InfoCard
        title="Workspace Constraints"
        description="Your current workspace, plan, and member limits."
        color="primary"
        icon={<Users />}
        action={<Tooltip content="Upgrade plan or manage workspace in dashboard."><span className="underline text-primary-600 cursor-pointer">Manage</span></Tooltip>}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <Tooltip content="Current workspace name">
            <Badge color="primary" icon={<Users />}>{workspaceName}</Badge>
          </Tooltip>
          <Tooltip content="Your current workspace plan">
            <Badge color="secondary" icon={<Zap />} pulse={planType === 'free'}>{planType.charAt(0).toUpperCase() + planType.slice(1)} Plan</Badge>
          </Tooltip>
          <Tooltip content="Maximum members allowed in this workspace">
            <Badge color="primary" icon={<Shield />}>{memberLimit} members</Badge>
          </Tooltip>
        </div>
        <div className="text-xs text-gray-500">Upgrade your plan or workspace for higher member limits.</div>
      </InfoCard>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 mb-8 border border-blue-100">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-6">Workspace Members</h1>
        {isAdmin && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">Available LLM Models</h2>
            <div className="space-y-2">
              {MODEL_OPTIONS.map((opt: { value: string; label: string }) => (
                <label key={opt.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enabledModels.includes(opt.value)}
                    onChange={e => {
                      setEnabledModels(models => e.target.checked ? [...models, opt.value] : models.filter(m => m !== opt.value));
                    }}
                    className="mr-2"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">(Backend integration coming next step)</div>
          </div>
        )}
        {role === 'admin' && (
          <div className="mb-8 flex gap-2 items-end">
            <input className="border border-blue-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all" placeholder="User Email or ID" value={email} onChange={e => setEmail(e.target.value)} />
            <select className="border border-blue-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow transition-all duration-150" onClick={invite}>Invite</button>
          </div>
        )}
        {isAdmin && (
          <div className="mb-4 flex gap-2 items-end">
            <input className="border border-blue-200 p-2 rounded-lg" placeholder="User ID or Email to Impersonate" value={impersonateId} onChange={e => setImpersonateId(e.target.value)} />
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-bold" onClick={handleImpersonate}>Impersonate</button>
            {impersonationError && <span className="text-red-600 ml-2">{impersonationError}</span>}
          </div>
        )}
        {loading ? <div className="text-blue-700 font-semibold">Loading...</div> : (
          <div className="overflow-x-auto rounded-xl shadow">
            <table className="min-w-full border border-blue-100 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-3 border-b text-left font-bold text-blue-800">User</th>
                  <th className="p-3 border-b text-left font-bold text-blue-800">Role</th>
                  <th className="p-3 border-b text-left font-bold text-blue-800">Joined</th>
                  {role === 'admin' && <th className="p-3 border-b text-left font-bold text-blue-800">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.user_id} className="border-b hover:bg-blue-50 transition-all">
                    <td className="p-3">{m.user_id}</td>
                    <td className="p-3">
                      {role === 'admin' ? (
                        <select value={m.role} onChange={e => changeRole(m.user_id, e.target.value)} className="border border-blue-200 p-1 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all">
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.role === 'admin' ? 'bg-blue-600 text-white' : m.role === 'editor' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>{m.role}</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-blue-700">{new Date(m.joined_at).toLocaleString()}</td>
                    {role === 'admin' && (
                      <td className="p-3">
                        <button className="text-red-600 hover:underline font-bold" onClick={() => remove(m.user_id)}>Remove</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { getAdminConfig, updateAdminConfig } from '../services/adminConfigService';

const ROLES = ['admin', 'member'];
const TOOLS = ['all', 'chat', 'image', 'audio'];
const FEATURE_FLAGS = [
  { key: 'enablePlugins', label: 'Enable Plugins' },
  { key: 'enableAdvancedAnalytics', label: 'Enable Advanced Analytics' },
];

const AdminConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newMember, setNewMember] = useState({ id: '', name: '', role: 'member' });

  useEffect(() => {
    getAdminConfig()
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load config');
        setLoading(false);
      });
  }, []);

  const handleMemberChange = (idx: number, field: string, value: string) => {
    setConfig((prev: any) => {
      const teamMembers = [...prev.teamMembers];
      teamMembers[idx] = { ...teamMembers[idx], [field]: value };
      return { ...prev, teamMembers };
    });
  };

  const handleRemoveMember = (idx: number) => {
    setConfig((prev: any) => {
      const teamMembers = prev.teamMembers.filter((_: any, i: number) => i !== idx);
      return { ...prev, teamMembers };
    });
  };

  const handleAddMember = () => {
    if (!newMember.id || !newMember.name) return;
    setConfig((prev: any) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { ...newMember }],
    }));
    setNewMember({ id: '', name: '', role: 'member' });
  };

  const handleToolAccessChange = (role: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      toolAccess: {
        ...prev.toolAccess,
        [role]: value.split(',').map((t: string) => t.trim()).filter(Boolean),
      },
    }));
  };

  const handleFeatureFlagChange = (key: string, checked: boolean) => {
    setConfig((prev: any) => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [key]: checked,
      },
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await updateAdminConfig(config);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading admin controls...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '2em auto', background: '#f6f6fa', padding: 24, borderRadius: 10, boxShadow: '0 1px 4px #eee' }}>
      <h2>Admin Controls</h2>
      <h3>Team Members</h3>
      <table style={{ width: '100%', marginBottom: 16 }}>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Role</th><th></th></tr>
        </thead>
        <tbody>
          {config.teamMembers.map((member: any, idx: number) => (
            <tr key={member.id}>
              <td><input value={member.id} onChange={e => handleMemberChange(idx, 'id', e.target.value)} style={{ width: 80 }} /></td>
              <td><input value={member.name} onChange={e => handleMemberChange(idx, 'name', e.target.value)} style={{ width: 120 }} /></td>
              <td>
                <select value={member.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td><button type="button" onClick={() => handleRemoveMember(idx)} style={{ color: 'red' }}>Remove</button></td>
            </tr>
          ))}
          <tr>
            <td><input value={newMember.id} onChange={e => setNewMember(n => ({ ...n, id: e.target.value }))} style={{ width: 80 }} placeholder="ID" /></td>
            <td><input value={newMember.name} onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))} style={{ width: 120 }} placeholder="Name" /></td>
            <td>
              <select value={newMember.role} onChange={e => setNewMember(n => ({ ...n, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </td>
            <td><button type="button" onClick={handleAddMember}>Add</button></td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginBottom: 16 }}>
        <label>File Size Limit (MB):
          <input type="number" name="fileSizeLimitMB" value={config.fileSizeLimitMB} onChange={handleChange} min={1} max={1000} style={{ marginLeft: 8, width: 80 }} />
        </label>
      </div>
      <h3>Tool Access</h3>
      {ROLES.map(role => (
        <div key={role} style={{ marginBottom: 8 }}>
          <label>{role}:
            <input
              type="text"
              value={config.toolAccess[role]?.join(', ') || ''}
              onChange={e => handleToolAccessChange(role, e.target.value)}
              placeholder="Comma-separated tools"
              style={{ marginLeft: 8, width: 220 }}
            />
          </label>
        </div>
      ))}
      <h3>Feature Flags</h3>
      {FEATURE_FLAGS.map(flag => (
        <div key={flag.key} style={{ marginBottom: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={!!config.featureFlags[flag.key]}
              onChange={e => handleFeatureFlagChange(flag.key, e.target.checked)}
              style={{ marginRight: 8 }}
            />
            {flag.label}
          </label>
        </div>
      ))}
      <button type="submit" disabled={saving} style={{ padding: '8px 24px', fontSize: 16, marginTop: 16 }}>
        {saving ? 'Saving...' : 'Save Admin Config'}
      </button>
      {success && <div style={{ color: 'green', marginTop: 12 }}>Admin config saved!</div>}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </form>
  );
};

export default AdminConfigPanel; 
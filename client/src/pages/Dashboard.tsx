import { useEffect, useState } from 'react';
import Badge from '../components/Badge';
import InfoCard from '../components/InfoCard';
import Tooltip from '../components/Tooltip';
import { User, Users, Layers, Zap } from 'lucide-react';

export default function Dashboard() {
  const [subscription, setSubscription] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [loggingOptOut, setLoggingOptOut] = useState(false);
  const [userAuditLogs, setUserAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/billing/subscription').then(res => res.json()).then(data => setSubscription(data));
    fetch('/api/org/members').then(res => res.json()).then(data => {
      setOrgs(data || []);
      if (data && data.length > 0) setSelectedOrg(data[0].org_id);
    });
  }, []);

  useEffect(() => {
    if (!selectedOrg) return;
    fetch(`/api/org/${selectedOrg}/members`).then(res => res.json()).then(data => setMembers(data || []));
    fetch(`/api/org/${selectedOrg}/audit-logs`).then(res => res.json()).then(data => setAuditLogs(data || []));
  }, [selectedOrg]);

  useEffect(() => {
    // Fetch user privacy flags from backend
    fetch('/api/profile').then(res => res.json()).then(data => {
      setGdprConsent(!!data.gdpr_consent);
      setLoggingOptOut(!!data.logging_opt_out);
    });
  }, []);

  useEffect(() => {
    // Fetch user audit logs from backend
    fetch('/api/audit-logs').then(res => res.json()).then(data => setUserAuditLogs(data || []));
  }, []);

  const updatePrivacy = async (field: 'gdpr_consent' | 'logging_opt_out', value: boolean) => {
    await fetch('/api/profile/privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    if (field === 'gdpr_consent') setGdprConsent(value);
    if (field === 'logging_opt_out') setLoggingOptOut(value);
  };

  const invite = async () => {
    setError(''); setSuccess('');
    if (!inviteEmail) return setError('Email required');
    const res = await fetch(`/api/org/${selectedOrg}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: inviteEmail, role: inviteRole })
    });
    if (res.ok) {
      setSuccess('Invite sent!'); setInviteEmail('');
      // Refresh members
      const data = await fetch(`/api/org/${selectedOrg}/members`).then(r => r.json());
      setMembers(data || []);
    } else {
      setError('Failed to invite member');
    }
  };

  const changeRole = async (user_id: string, newRole: string) => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/org/${selectedOrg}/assign-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user_id, role: newRole })
    });
    if (res.ok) {
      setSuccess('Role updated');
      const data = await fetch(`/api/org/${selectedOrg}/members`).then(r => r.json());
      setMembers(data || []);
    } else {
      setError('Failed to update role');
    }
  };

  const remove = async (user_id: string) => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/org/${selectedOrg}/member/${user_id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Member removed');
      const data = await fetch(`/api/org/${selectedOrg}/members`).then(r => r.json());
      setMembers(data || []);
    } else {
      setError('Failed to remove member');
    }
  };

  const upgradePlan = async () => {
    setUpgrading(true); setError('');
    // Call backend to create Stripe checkout session
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
        successUrl: window.location.href,
        cancelUrl: window.location.href
      })
    });
    const data = await res.json();
    setUpgrading(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError('Failed to start upgrade');
    }
  };

  // Feature gating: restrict premium features for free plan
  const isPro = subscription?.plan_type === 'pro' || subscription?.plan_type === 'enterprise';

  // Example constraint values (replace with real values from backend if available)
  const contextWindow = subscription?.context_window || 4096;
  const planType = subscription?.plan_type || 'free';
  const workspaceName = orgs.find(o => o.org_id === selectedOrg)?.organizations?.name || 'Personal';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Constraint InfoCard */}
      <InfoCard
        title="Account & Workspace Constraints"
        description="Your current plan, workspace, and context window limits."
        color="primary"
        icon={<Zap />}
        action={<Tooltip content="Upgrade plan or manage workspace in settings."><span className="underline text-primary-600 cursor-pointer">Manage</span></Tooltip>}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <Tooltip content="Your current subscription plan">
            <Badge color="primary" icon={<Zap />} pulse={planType === 'free'}>{planType.charAt(0).toUpperCase() + planType.slice(1)} Plan</Badge>
          </Tooltip>
          <Tooltip content="Maximum context window (tokens) for your plan">
            <Badge color="secondary" icon={<Layers />}>{contextWindow} tokens</Badge>
          </Tooltip>
          <Tooltip content="Current workspace">
            <Badge color="primary" icon={<Users />}>{workspaceName}</Badge>
          </Tooltip>
        </div>
        <div className="text-xs text-gray-500">Upgrade your plan or join a workspace for higher limits.</div>
      </InfoCard>
      <h1 className="text-3xl font-extrabold mb-6">Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Subscription</h2>
        {subscription ? (
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            <span className="font-bold">Plan:</span> <span>{subscription.plan_type}</span>
            <span className="font-bold">Status:</span> <span>{subscription.status}</span>
            {!isPro && <button className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold" onClick={upgradePlan} disabled={upgrading}>{upgrading ? 'Redirecting...' : 'Upgrade to Pro'}</button>}
            {error && <span className="text-red-600 ml-4">{error}</span>}
            {success && <span className="text-green-600 ml-4">{success}</span>}
          </div>
        ) : <div>Loading subscription...</div>}
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Organizations</h2>
        <select className="border p-2 rounded" value={selectedOrg || ''} onChange={e => setSelectedOrg(e.target.value)}>
          {orgs.map(o => <option key={o.org_id} value={o.org_id}>{o.organizations?.name || o.org_id}</option>)}
        </select>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Team Members</h2>
        <div className="mb-4 flex gap-2 items-end">
          <input className="border p-2 rounded" placeholder="User Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <select className="border p-2 rounded" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold" onClick={invite}>Invite</button>
        </div>
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-3 border-b text-left font-bold">User</th>
              <th className="p-3 border-b text-left font-bold">Role</th>
              <th className="p-3 border-b text-left font-bold">Joined</th>
              <th className="p-3 border-b text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user_id} className="border-b hover:bg-blue-50 transition-all">
                <td className="p-3">{m.user_id}</td>
                <td className="p-3">
                  <select value={m.role} onChange={e => changeRole(m.user_id, e.target.value)} className="border p-1 rounded">
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </td>
                <td className="p-3 text-xs">{new Date(m.joined_at).toLocaleString()}</td>
                <td className="p-3">
                  <button className="text-red-600 hover:underline font-bold" onClick={() => remove(m.user_id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Audit Logs</h2>
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border-b text-left font-bold">Event</th>
              <th className="p-3 border-b text-left font-bold">User</th>
              <th className="p-3 border-b text-left font-bold">Details</th>
              <th className="p-3 border-b text-left font-bold">Time</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className="border-b hover:bg-gray-50 transition-all">
                <td className="p-3">{log.event_type}</td>
                <td className="p-3">{log.user_id}</td>
                <td className="p-3 text-xs">{JSON.stringify(log.details)}</td>
                <td className="p-3 text-xs">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">My Audit Logs</h2>
        <table className="min-w-full border rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border-b text-left font-bold">Event</th>
              <th className="p-3 border-b text-left font-bold">Details</th>
              <th className="p-3 border-b text-left font-bold">Time</th>
            </tr>
          </thead>
          <tbody>
            {userAuditLogs.map(log => (
              <tr key={log.id} className="border-b hover:bg-gray-50 transition-all">
                <td className="p-3">{log.event_type}</td>
                <td className="p-3 text-xs">{JSON.stringify(log.details)}</td>
                <td className="p-3 text-xs">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Privacy & Compliance</h2>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={gdprConsent} onChange={e => updatePrivacy('gdpr_consent', e.target.checked)} />
            I consent to data processing (GDPR/CCPA)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={loggingOptOut} onChange={e => updatePrivacy('logging_opt_out', e.target.checked)} />
            Opt out of analytics/logging
          </label>
        </div>
      </div>
      {!isPro && (
        <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 font-semibold rounded">
          You are on the Free plan. Upgrade to Pro to unlock premium features like advanced analytics, autonomous agents, and unlimited uploads.
        </div>
      )}
    </div>
  );
} 
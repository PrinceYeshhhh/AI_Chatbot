import { useEffect, useState } from 'react';

export default function AgentSwitcher({ activeAgent, setActiveAgent, workspaceId }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      setLoading(true);
      const res = await fetch(`/api/agent-tool/agents/${workspaceId}`);
      const data = await res.json();
      setAgents(data.agents || []);
      setLoading(false);
    }
    if (workspaceId) fetchAgents();
  }, [workspaceId]);

  if (loading) return <div>Loading agents...</div>;

  const active = agents.find(a => a.agent_id === activeAgent);

  return (
    <div className="mb-4 flex items-center gap-2">
      <label className="font-bold">Role:</label>
      <select className="border p-2 rounded" value={activeAgent} onChange={e => setActiveAgent(e.target.value)}>
        {agents.map(a => (
          <option key={a.agent_id} value={a.agent_id}>{a.name}</option>
        ))}
      </select>
      {active && (
        <span className="ml-2 flex items-center gap-2">
          {active.avatar && <img src={active.avatar} alt="avatar" className="w-6 h-6 rounded-full" />}
          <span className="text-xs text-gray-600">{active.role}: {active.description}</span>
        </span>
      )}
    </div>
  );
} 
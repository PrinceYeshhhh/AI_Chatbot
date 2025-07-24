import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface WorkflowStep {
  id: string;
  agent_id: string;
  name: string;
  next: string;
  condition: string;
  retries: number;
  params: Record<string, any>;
}

export default function WorkflowBuilder() {
  const { user } = useAuth();
  const { workspaceId, role, loading: wsLoading, error: wsError } = useWorkspace();
  const [agents, setAgents] = useState<any[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [execError, setExecError] = useState<string | null>(null);
  const isAdmin = role === 'admin' || role === 'team-lead';

  useEffect(() => {
    if (wsLoading || !workspaceId || !isAdmin) return;
    fetchAgents();
    // eslint-disable-next-line
  }, [wsLoading, workspaceId, isAdmin]);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      setAgents(data);
    } catch (err: any) {
      console.error("Error fetching agents:", err);
      setError('Failed to load agents.');
    }
  }

  function addStep() {
    setSteps(s => [...s, { id: `step${s.length + 1}`, agent_id: '', name: '', next: '', condition: '', retries: 0, params: {} }]);
  }

  function updateStep(idx: number, field: keyof WorkflowStep, value: any) {
    setSteps(s => s.map((step, i) => i === idx ? { ...step, [field]: value } : step));
  }

  function removeStep(idx: number) {
    setSteps(s => s.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const config = {
      name: workflowName,
      steps,
      start: steps[0]?.id || '',
    };
    try {
      const res = await fetch('/api/workflow/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowConfig: config, userId: user?.id || '', workflowId: `wf-${Date.now()}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Workflow save failed');
      alert('Workflow saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Workflow save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleExecute() {
    setExecuting(true);
    setExecError(null);
    setExecResult(null);
    try {
      const config = {
        name: workflowName,
        steps,
        start: steps[0]?.id || '',
      };
      const res = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowConfig: config, userId: user?.id || '', workflowId: `wf-${Date.now()}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Workflow execution failed');
      setExecResult(data);
    } catch (err: any) {
      setExecError(err.message || 'Workflow execution failed');
    } finally {
      setExecuting(false);
    }
  }

  if (wsLoading) return <div className="p-8">Loading workspace...</div>;
  if (wsError) return <div className="p-8 text-red-600">{wsError}</div>;
  if (!isAdmin) return <div className="p-8 text-red-600">You do not have permission to build workflows.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Workflow Builder</h1>
      <div className="mb-4">
        <label className="block font-semibold">Workflow Name</label>
        <input className="border rounded px-2 py-1 w-full" value={workflowName} onChange={e => setWorkflowName(e.target.value)} required />
      </div>
      <div className="mb-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={addStep}>Add Step</button>
      </div>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="bg-white p-4 rounded shadow flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <span className="font-bold">Step {idx + 1}</span>
              <button className="text-red-600 underline ml-auto" onClick={() => removeStep(idx)}>Remove</button>
            </div>
            <div>
              <label className="block font-semibold">Agent</label>
              <select className="border rounded px-2 py-1 w-full" value={step.agent_id} onChange={e => updateStep(idx, 'agent_id', e.target.value)}>
                <option value="">Select agent</option>
                {agents.map(agent => <option key={agent.agent_id} value={agent.agent_id}>{agent.name} ({agent.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold">Step Name</label>
              <input className="border rounded px-2 py-1 w-full" value={step.name} onChange={e => updateStep(idx, 'name', e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold">Next Step ID</label>
              <input className="border rounded px-2 py-1 w-full" value={step.next} onChange={e => updateStep(idx, 'next', e.target.value)} placeholder="step2 or step3,step4 for branching" />
            </div>
            <div>
              <label className="block font-semibold">Condition (optional)</label>
              <input className="border rounded px-2 py-1 w-full" value={step.condition} onChange={e => updateStep(idx, 'condition', e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold">Retries</label>
              <input type="number" className="border rounded px-2 py-1 w-full" value={step.retries} onChange={e => updateStep(idx, 'retries', Number(e.target.value))} min={0} />
            </div>
            <div>
              <label className="block font-semibold">Params (JSON)</label>
              <textarea className="border rounded px-2 py-1 w-full" value={JSON.stringify(step.params)} onChange={e => updateStep(idx, 'params', JSON.parse(e.target.value || '{}'))} />
            </div>
          </div>
        ))}
      </div>
      <button className="bg-green-600 text-white px-4 py-2 rounded mt-6" onClick={handleSave} disabled={saving || !workflowName || steps.length === 0}>Save Workflow</button>
      <button className="bg-purple-600 text-white px-4 py-2 rounded mt-6 ml-4" onClick={handleExecute} disabled={executing || steps.length === 0}>Run Workflow</button>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      {execError && <div className="text-red-600 text-xs mt-2">{execError}</div>}
      {executing && <div className="text-blue-600 text-xs mt-2">Executing workflow...</div>}
      {execResult && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-bold mb-2">Workflow Run Log</h3>
          <table className="w-full text-xs border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Step</th>
                <th className="p-2">Agent</th>
                <th className="p-2">Name</th>
                <th className="p-2">Status</th>
                <th className="p-2">Output</th>
                <th className="p-2">Error</th>
                <th className="p-2">Started</th>
                <th className="p-2">Finished</th>
                <th className="p-2">Retries</th>
              </tr>
            </thead>
            <tbody>
              {execResult.logs.map((log: any, idx: number) => (
                <tr key={idx} className={log.status === 'fail' ? 'bg-red-50' : log.status === 'success' ? 'bg-green-50' : ''}>
                  <td className="p-2">{log.stepId}</td>
                  <td className="p-2">{log.agentId}</td>
                  <td className="p-2">{log.name}</td>
                  <td className="p-2 font-bold">{log.status}</td>
                  <td className="p-2 whitespace-pre-wrap max-w-xs">{typeof log.output === 'object' ? JSON.stringify(log.output, null, 2) : String(log.output)}</td>
                  <td className="p-2 text-red-600">{log.error}</td>
                  <td className="p-2">{log.startedAt}</td>
                  <td className="p-2">{log.finishedAt}</td>
                  <td className="p-2">{log.retries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export default function WorkflowRunView() {
  const { user } = useAuth();
  const { workspaceId, role, loading: wsLoading, error: wsError } = useWorkspace();
  const isAdmin = role === 'admin' || role === 'team-lead';
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [polling, setPolling] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) fetchWorkflows();
    // eslint-disable-next-line
  }, [isAdmin]);

  async function fetchWorkflows() {
    const res = await fetch('/api/workflows/list');
    const data = await res.json();
    if (res.ok) {
      setWorkflows(data);
    } else {
      setError(data.error || 'Failed to fetch workflows');
    }
  }

  async function startRun() {
    if (!selectedWorkflow) return;
    setLoading(true);
    setError('');
    setLogs([]);
    setRunId(null);
    try {
      const res = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowConfig: selectedWorkflow.config,
          workflowId: selectedWorkflow.workflow_id,
          testMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRunId(data.runId);
        setPolling(true);
      } else {
        setError(data.error || 'Failed to start workflow run');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    let interval: any;
    if (runId && polling) {
      interval = setInterval(fetchLogs, 2000);
    }
    return () => interval && clearInterval(interval);
    // eslint-disable-next-line
  }, [runId, polling]);

  async function fetchLogs() {
    if (!runId) return;
    const res = await fetch(`/api/workflows/${runId}/logs`);
    const data = await res.json();
    if (res.ok) {
      setLogs(data.steps || []);
      setStatus(data.status);
      if (data.status === 'success' || data.status === 'fail') setPolling(false);
    }
  }

  if (wsLoading) return <div className="p-8">Loading workspace...</div>;
  if (wsError) return <div className="p-8 text-red-600">{wsError}</div>;
  if (!isAdmin) return <div className="p-8 text-red-600">You do not have permission to run workflows.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Workflow Execution</h1>
      <div className="mb-4">
        <label className="block font-semibold">Select Workflow</label>
        <select className="border rounded px-2 py-1 w-full" value={selectedWorkflow?.workflow_id || ''} onChange={e => setSelectedWorkflow(workflows.find(w => w.workflow_id === e.target.value))}>
          <option value="">Select workflow</option>
          {workflows.map(wf => <option key={wf.workflow_id} value={wf.workflow_id}>{wf.name}</option>)}
        </select>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={testMode} onChange={e => setTestMode(e.target.checked)} />
          Test Mode (simulate run)
        </label>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={startRun} disabled={!selectedWorkflow || loading}>Start Run</button>
      </div>
      {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
      {logs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Run Steps</h2>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th>Step</th><th>Agent</th><th>Status</th><th>Summary</th><th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.stepId} className={log.status === 'success' ? 'bg-green-50' : log.status === 'fail' ? 'bg-red-50' : ''}>
                  <td>{idx + 1}</td>
                  <td>{log.name}</td>
                  <td>{log.status}</td>
                  <td>{log.output ? JSON.stringify(log.output).slice(0, 60) : ''}</td>
                  <td>
                    <details>
                      <summary>View</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(log, null, 2)}</pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 font-bold">Run Status: <span className={status === 'success' ? 'text-green-700' : status === 'fail' ? 'text-red-700' : ''}>{status}</span></div>
        </div>
      )}
    </div>
  );
} 
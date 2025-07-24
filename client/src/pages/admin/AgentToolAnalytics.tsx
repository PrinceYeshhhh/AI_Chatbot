import { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import { logFrontendEvent } from '../../services/analyticsService';

function downloadCSV(logs: any[]) {
  const header = ['User', 'Agent', 'Tool', 'Input', 'Output', 'Time'];
  const rows = logs.map((l: any) => [l.user_id, l.agent_name, l.tool_name, JSON.stringify(l.input), JSON.stringify(l.output), new Date(l.used_at).toLocaleString()]);
  const csv = [header, ...rows].map((r: any) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'agent_tool_logs.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AgentToolAnalytics() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/agent-tool/logs').then((res: any) => {
      setLogs(res.data.logs || []);
      setLoading(false);
      logFrontendEvent('dashboard_view', { dashboard: 'agent_tool' });
    });
    setAlertsLoading(true);
    fetch('/api/analytics/alerts').then((r: any) => r.json()).then((res: any) => {
      setAlerts(res.alerts || []);
      setAlertsLoading(false);
    });
  }, []);

  function exportAnalytics(format: any) {
    logFrontendEvent('dashboard_export', { dashboard: 'agent_tool', format });
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent_tool_logs.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      downloadCSV(logs);
    }
  }

  // Chart data
  const toolCounts = logs.reduce((acc: Record<string, number>, l: any) => { acc[l.tool_name] = (acc[l.tool_name] || 0) + 1; return acc; }, {} as Record<string, number>);
  const agentCounts = logs.reduce((acc: Record<string, number>, l: any) => { acc[l.agent_name] = (acc[l.agent_name] || 0) + 1; return acc; }, {} as Record<string, number>);
  const userCounts = logs.reduce((acc: Record<string, number>, l: any) => { acc[l.user_id] = (acc[l.user_id] || 0) + 1; return acc; }, {} as Record<string, number>);
  const toolBar = {
    labels: Object.keys(toolCounts),
    datasets: [{ label: 'Tool Usage', data: Object.values(toolCounts), backgroundColor: '#60a5fa' }]
  };
  const agentBar = {
    labels: Object.keys(agentCounts),
    datasets: [{ label: 'Agent Usage', data: Object.values(agentCounts), backgroundColor: '#fbbf24' }]
  };
  const userBar = {
    labels: Object.keys(userCounts),
    datasets: [{ label: 'User Activity', data: Object.values(userCounts), backgroundColor: '#34d399' }]
  };
  const trendLine = {
    labels: logs.map((l: any) => new Date(l.used_at).toLocaleDateString()),
    datasets: [{ label: 'Tool Usage Over Time', data: logs.map((_: any, i: number) => i + 1), borderColor: 'purple', fill: false }]
  };

  // Error/success rate (assume output.error exists if error)
  const errorCount = logs.filter((l: any) => l.output && l.output.error).length;
  const successCount = logs.length - errorCount;
  const errorRate = logs.length ? (errorCount / logs.length) * 100 : 0;
  const userErrorRates = Object.fromEntries(Object.entries(userCounts).map(([user, count]: [any, any]) => {
    const userErrors = logs.filter((l: any) => l.user_id === user && l.output && l.output.error).length;
    return [user, count ? (userErrors / count) * 100 : 0];
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Agent Tool Usage Analytics</h1>
      <div className="flex gap-4 mb-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded shadow" onClick={() => exportAnalytics('csv')}>Export CSV</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded shadow" onClick={() => exportAnalytics('json')}>Export JSON</button>
      </div>
      {/* System Alerts */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">System Alerts</h2>
        {alertsLoading ? <div>Loading alerts...</div> : (
          alerts.length === 0 ? <div className="text-gray-500">No alerts.</div> : (
            <div className="space-y-2">
              {alerts.filter((a: any) => !a.resolved).map((alert: any) => (
                <div key={alert.id} className={`border-l-4 p-4 rounded shadow ${alert.severity === 'critical' ? 'border-red-600 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <div className="font-bold">{alert.alert_type} <span className="ml-2 text-xs font-normal text-gray-500">{new Date(alert.created_at).toLocaleString()}</span></div>
                  <div className="text-sm">{alert.message}</div>
                  {alert.metadata && <pre className="text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(alert.metadata, null, 2)}</pre>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h2 className="font-bold mb-2">Tool Usage Frequency</h2>
          <Bar data={toolBar} />
        </div>
        <div>
          <h2 className="font-bold mb-2">Agent Usage</h2>
          <Bar data={agentBar} />
        </div>
        <div>
          <h2 className="font-bold mb-2">User Activity</h2>
          <Bar data={userBar} />
        </div>
        <div className="md:col-span-3">
          <h2 className="font-bold mb-2">Usage Trend</h2>
          <Line data={trendLine} />
        </div>
      </div>
      <div className="mb-8">
        <h2 className="font-bold mb-2">Error/Success Rate</h2>
        <div className="text-sm">Success: {successCount} | Errors: {errorCount} | Error Rate: {errorRate.toFixed(1)}%</div>
        <div className="mt-2 text-xs">User Error Rates: {Object.entries(userErrorRates).map(([u, r]: [any, any]) => `${u}: ${r.toFixed(1)}%`).join(', ')}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">User</th>
              <th className="p-2 border">Agent</th>
              <th className="p-2 border">Tool</th>
              <th className="p-2 border">Input</th>
              <th className="p-2 border">Output</th>
              <th className="p-2 border">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id}>
                <td className="p-2 border text-xs">{l.user_id}</td>
                <td className="p-2 border text-xs">{l.agent_name}</td>
                <td className="p-2 border text-xs">{l.tool_name}</td>
                <td className="p-2 border text-xs max-w-xs truncate" title={JSON.stringify(l.input)}>{JSON.stringify(l.input)}</td>
                <td className="p-2 border text-xs max-w-xs truncate" title={JSON.stringify(l.output)}>{JSON.stringify(l.output)}</td>
                <td className="p-2 border text-xs">{new Date(l.used_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
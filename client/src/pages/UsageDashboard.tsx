import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { logFrontendEvent } from '../services/analyticsService';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function UsageDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState<any>(null);
  const [quotas, setQuotas] = useState<any>(null);
  const [flagged, setFlagged] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/usage/summary').then(r => r.json()),
      fetch('/api/usage/trends').then(r => r.json()),
      fetch('/api/billing/status').then(r => r.json()),
      fetch('/api/usage/quotas').then(r => r.json()),
      fetch('/api/abuse/flagged').then(r => r.json()),
    ]).then(([summaryData, trendsData, billingData, quotasData, flaggedData]) => {
      setSummary(summaryData);
      setTrends(trendsData);
      setBilling(billingData);
      setQuotas(quotasData);
      setFlagged(flaggedData);
      setLoading(false);
      logFrontendEvent('dashboard_view', { dashboard: 'usage' });
    }).catch(e => {
      setError('Failed to load usage analytics');
      setLoading(false);
    });
  }, []);

  function exportAnalytics(format: 'csv' | 'json') {
    logFrontendEvent('dashboard_export', { dashboard: 'usage', format });
    const data = { summary, trends, billing };
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'usage_analytics.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV: Only export trends as CSV for simplicity
      let csv = 'Date,Chats,Files\n';
      if (trends?.chatTrends && trends?.fileTrends) {
        for (let i = 0; i < trends.chatTrends.length; i++) {
          const date = trends.chatTrends[i]?.date || '';
          const chats = trends.chatTrends[i]?.count || 0;
          const files = trends.fileTrends[i]?.count || 0;
          csv += `${date},${chats},${files}\n`;
        }
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'usage_trends.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Prepare chart data
  const chatTrendData = trends?.chatTrends || [];
  const fileTrendData = trends?.fileTrends || [];
  const labels = chatTrendData.map((d: any) => d.date);
  const chatCounts = chatTrendData.map((d: any) => d.count);
  const fileCounts = fileTrendData.map((d: any) => d.count);
  const lineData = {
    labels,
    datasets: [
      {
        label: 'Chats',
        data: chatCounts,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Files Uploaded',
        data: fileCounts,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  if (loading) return <div className="p-8">Loading usage analytics...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Usage Analytics Dashboard</h1>
      {flagged?.flagged && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded">
          <b>Warning:</b> Your account has been flagged for abuse: {flagged.reason || 'See admin for details.'}
        </div>
      )}
      {quotas && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded">
          <b>Usage Quotas:</b>
          <ul className="ml-4 mt-1 text-sm">
            <li>Chats: {summary?.chatStats?.totalMessages ?? 0} / {quotas.chatsSoft} (soft), {quotas.chatsHard} (hard)</li>
            <li>Files: {summary?.fileStats?.total ?? 0} / {quotas.filesSoft} (soft), {quotas.filesHard} (hard)</li>
            <li>Tokens: {summary?.tokenStats?.total ?? 0} / {quotas.tokensSoft} (soft), {quotas.tokensHard} (hard)</li>
          </ul>
          {(summary?.chatStats?.totalMessages >= quotas.chatsSoft || summary?.fileStats?.total >= quotas.filesSoft || summary?.tokenStats?.total >= quotas.tokensSoft) && (
            <div className="mt-2">
              <span className="text-orange-700 font-semibold">You are near your usage limit. </span>
              <a href="/upgrade" className="ml-2 px-3 py-1 bg-blue-600 text-white rounded shadow">Upgrade Plan</a>
            </div>
          )}
          {(summary?.chatStats?.totalMessages >= quotas.chatsHard || summary?.fileStats?.total >= quotas.filesHard || summary?.tokenStats?.total >= quotas.tokensHard) && (
            <div className="mt-2 text-red-700 font-bold">You have reached your hard usage limit. Please upgrade to continue using the service.</div>
          )}
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded shadow" onClick={() => exportAnalytics('csv')}>Export CSV</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded shadow" onClick={() => exportAnalytics('json')}>Export JSON</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Billing Tier</h2>
          <div className="text-3xl font-extrabold">{billing?.tier ?? '-'}</div>
          <div className="text-xs text-gray-500 mt-1">{billing?.status ?? ''}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Total Chats</h2>
          <div className="text-3xl font-extrabold">{summary?.chatStats?.totalMessages ?? '-'}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Files Uploaded</h2>
          <div className="text-3xl font-extrabold">{summary?.fileStats?.total ?? '-'}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Tokens Used</h2>
          <div className="text-3xl font-extrabold">{summary?.tokenStats?.total ?? 'N/A'}</div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="font-bold mb-4">Usage Trends (Last 30 Days)</h2>
        <div className="bg-gray-50 p-4 rounded shadow">
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>
      <div className="mb-8">
        <h2 className="font-bold mb-4">Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">Chat Stats</h3>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(summary?.chatStats, null, 2)}</pre>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-2">File Stats</h3>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(summary?.fileStats, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
} 
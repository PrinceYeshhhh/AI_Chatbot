import { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';

export default function EvaluationLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ user_id: '', file_id: '', flag: '', date_from: '', date_to: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/evaluation/logs', { params: filters }).then(res => {
      setLogs(res.data.logs || []);
      setLoading(false);
    });
  }, [filters]);

  // Chart data
  const scores = logs.map(l => l.score);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const flagged = logs.filter(l => l.flag).length;
  const flaggedPct = scores.length ? (flagged / scores.length) * 100 : 0;
  const scoreTrend = {
    labels: logs.map(l => new Date(l.created_at).toLocaleDateString()),
    datasets: [{ label: 'Score', data: scores, borderColor: 'blue', fill: false }]
  };
  const flagPie = {
    labels: ['Flagged', 'Not Flagged'],
    datasets: [{ data: [flagged, scores.length - flagged], backgroundColor: ['#f87171', '#34d399'] }]
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Evaluation Logs</h1>
      <div className="flex gap-4 mb-6">
        <input className="border p-2 rounded" placeholder="User ID" value={filters.user_id} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))} />
        <input className="border p-2 rounded" placeholder="File ID" value={filters.file_id} onChange={e => setFilters(f => ({ ...f, file_id: e.target.value }))} />
        <select className="border p-2 rounded" value={filters.flag} onChange={e => setFilters(f => ({ ...f, flag: e.target.value }))}>
          <option value="">All</option>
          <option value="true">Flagged</option>
          <option value="false">Not Flagged</option>
        </select>
        <input type="date" className="border p-2 rounded" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
        <input type="date" className="border p-2 rounded" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold mb-2">Score Trend</h2>
          <Line data={scoreTrend} />
        </div>
        <div>
          <h2 className="font-bold mb-2">Flagged %</h2>
          <Pie data={flagPie} />
          <div className="mt-2 text-sm">Avg Score: {avgScore.toFixed(2)} | Flagged: {flagged} / {scores.length} ({flaggedPct.toFixed(1)}%)</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">User</th>
              <th className="p-2 border">File</th>
              <th className="p-2 border">Query</th>
              <th className="p-2 border">Response</th>
              <th className="p-2 border">Score</th>
              <th className="p-2 border">Flag</th>
              <th className="p-2 border">Feedback</th>
              <th className="p-2 border">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className={l.flag ? 'bg-red-50' : ''}>
                <td className="p-2 border text-xs">{l.user_id}</td>
                <td className="p-2 border text-xs">{l.file_id}</td>
                <td className="p-2 border text-xs max-w-xs truncate" title={l.query}>{l.query}</td>
                <td className="p-2 border text-xs max-w-xs truncate" title={l.response}>{l.response}</td>
                <td className="p-2 border text-xs font-bold text-center">{l.score}</td>
                <td className="p-2 border text-xs text-center">{l.flag ? '⚠️' : ''}</td>
                <td className="p-2 border text-xs max-w-xs truncate" title={l.feedback}>{l.feedback}</td>
                <td className="p-2 border text-xs">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
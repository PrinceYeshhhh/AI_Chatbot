import React, { useEffect, useState } from 'react';
import { fetchAnalyticsMetrics } from '../services/analyticsDashboardService';

const metricLabels = [
  { key: 'chats', label: 'Chats' },
  { key: 'toolsUsed', label: 'Tools Used' },
  { key: 'filesUploaded', label: 'Files Uploaded' },
  { key: 'llmTokenUsage', label: 'LLM Token Usage' },
  { key: 'costEstimate', label: 'Cost Estimate ($)' },
  { key: 'errors', label: 'Errors' },
  { key: 'failedWorkflows', label: 'Failed Workflows' },
  { key: 'timeouts', label: 'Timeouts' },
];

const barChartMetrics = ['chats', 'toolsUsed', 'filesUploaded', 'errors', 'failedWorkflows', 'timeouts'];

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const data = await fetchAnalyticsMetrics();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!metrics) return <div>Loading analytics...</div>;

  // Bar chart data
  const maxValue = Math.max(...barChartMetrics.map((k) => metrics[k] || 0), 1);
  const barWidth = 40;
  const barGap = 20;
  const chartHeight = 120;

  return (
    <div style={{ padding: 24 }}>
      <h2>Realtime Analytics Dashboard</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        {metricLabels.map(({ key, label }) => (
          <div key={key} style={{ background: '#f6f6fa', borderRadius: 8, padding: 16, minWidth: 140, textAlign: 'center', boxShadow: '0 1px 4px #eee' }}>
            <div style={{ fontSize: 14, color: '#888' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{metrics[key]}</div>
          </div>
        ))}
      </div>
      <h3>Key Metrics (Bar Chart)</h3>
      <svg width={(barWidth + barGap) * barChartMetrics.length} height={chartHeight + 40}>
        {barChartMetrics.map((key, i) => {
          const value = metrics[key] || 0;
          const barHeight = (value / maxValue) * chartHeight;
          return (
            <g key={key}>
              <rect
                x={i * (barWidth + barGap)}
                y={chartHeight - barHeight + 20}
                width={barWidth}
                height={barHeight}
                fill="#4f8cff"
                rx={6}
              />
              <text
                x={i * (barWidth + barGap) + barWidth / 2}
                y={chartHeight + 36}
                textAnchor="middle"
                fontSize={13}
                fill="#333"
              >
                {metricLabels.find((m) => m.key === key)?.label}
              </text>
              <text
                x={i * (barWidth + barGap) + barWidth / 2}
                y={chartHeight - barHeight + 12}
                textAnchor="middle"
                fontSize={14}
                fill="#222"
                fontWeight={600}
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: 24, color: '#888', fontSize: 13 }}>
        Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 
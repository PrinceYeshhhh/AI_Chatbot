import React, { useEffect, useState } from 'react';
import { fetchVideoAnalytics } from '../services/videoAnalyticsService';

interface VideoAnalyticsPanelProps {
  userId?: string;
  sessionId?: string;
}

const VideoAnalyticsPanel: React.FC<VideoAnalyticsPanelProps> = ({ userId, sessionId }) => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoAnalytics({ userId, sessionId })
      .then(setAnalytics)
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [userId, sessionId]);

  if (loading) return <div>Loading video analytics...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2em auto' }}>
      <h2>Video Q&A Analytics</h2>
      {analytics.length === 0 ? (
        <div>No analytics found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Timestamp</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Query</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Video</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Chunk</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((a, i) => (
              <tr key={i}>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{new Date(a.timestamp).toLocaleString()}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{a.query}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{a.videoName}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{a.chunkId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VideoAnalyticsPanel; 
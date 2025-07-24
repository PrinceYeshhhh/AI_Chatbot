export async function fetchVideoAnalytics({ userId, sessionId }: { userId?: string; sessionId?: string }) {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (sessionId) params.append('sessionId', sessionId);
  const res = await fetch(`/api/video-analytics?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch video analytics');
  }
  return res.json();
} 
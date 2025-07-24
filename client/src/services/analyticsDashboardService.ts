export async function fetchAnalyticsMetrics() {
  const res = await fetch('/api/analytics-dashboard');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch analytics metrics');
  }
  return res.json();
} 
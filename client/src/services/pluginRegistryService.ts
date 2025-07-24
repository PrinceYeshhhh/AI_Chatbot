export async function fetchPlugins() {
  const res = await fetch('/api/plugins');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch plugins');
  }
  return res.json();
} 
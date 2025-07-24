export async function getAdminConfig() {
  const res = await fetch('/api/admin-config');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin config');
  }
  return res.json();
}

export async function updateAdminConfig(config: any) {
  const res = await fetch('/api/admin-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update admin config');
  }
  return res.json();
} 
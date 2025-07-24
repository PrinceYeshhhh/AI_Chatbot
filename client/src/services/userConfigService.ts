export async function getUserConfig() {
  const res = await fetch('/api/user-config');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch user config');
  }
  return res.json();
}

export async function updateUserConfig(config: any) {
  const res = await fetch('/api/user-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update user config');
  }
  return res.json();
} 
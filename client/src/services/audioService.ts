export async function uploadAudio(file: File): Promise<{ transcript: string }> {
  const formData = new FormData();
  formData.append('audio', file);
  const res = await fetch('/api/audio-upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Audio upload failed');
  }
  return res.json();
} 
export async function uploadVideo(file: File): Promise<{ jobId: string; status: string }> {
  const formData = new FormData();
  formData.append('video', file);
  const res = await fetch('/api/video-upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Video upload failed');
  }
  return res.json();
}

export async function getVideoStatus(jobId: string) {
  const res = await fetch(`/api/video-upload-status/${jobId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch video status');
  }
  return res.json();
} 
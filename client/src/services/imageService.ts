export async function uploadImage(file: File): Promise<{ ocrText: string; caption: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/image-upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Image upload failed');
  }
  return res.json();
} 
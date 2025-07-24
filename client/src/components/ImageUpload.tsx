import React, { useState } from 'react';
import { uploadImage } from '../services/imageService';

interface ImageUploadProps {
  onResult?: (result: { ocrText: string; caption: string }) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ocrText: string; caption: string } | null>(null);
  const [storageMode, setStorageMode] = useState<'permanent' | 'temporary'>('permanent');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('storage_mode', storageMode);
      const res = await fetch('/api/image-upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResult(data);
      if (onResult) onResult(data);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '1em 0' }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ marginRight: 8 }}>How long do you want to keep this memory?</label>
        <label style={{ marginRight: 8 }}>
          <input type="radio" name="storage_mode" value="permanent" checked={storageMode === 'permanent'} onChange={() => setStorageMode('permanent')} /> Permanent
        </label>
        <label>
          <input type="radio" name="storage_mode" value="temporary" checked={storageMode === 'temporary'} onChange={() => setStorageMode('temporary')} /> Temporary
        </label>
      </div>
      <input
        type="file"
        accept="image/png,image/jpg,image/jpeg,image/webp"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button type="submit" disabled={!file || loading} style={{ marginLeft: 8 }}>
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 8 }}>
          <div><strong>OCR Text:</strong> {result.ocrText}</div>
          <div><strong>Caption:</strong> {result.caption}</div>
        </div>
      )}
    </form>
  );
};

export default ImageUpload; 
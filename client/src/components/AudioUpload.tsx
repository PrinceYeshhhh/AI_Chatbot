import React, { useState } from 'react';
import { uploadAudio } from '../services/audioService';

interface AudioUploadProps {
  onResult?: (result: { transcript: string }) => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ transcript: string } | null>(null);
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
      formData.append('audio', file);
      formData.append('storage_mode', storageMode);
      const res = await fetch('/api/audio-upload', {
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
        accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/x-m4a,audio/mp4,audio/ogg,audio/webm"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button type="submit" disabled={!file || loading} style={{ marginLeft: 8 }}>
        {loading ? 'Uploading...' : 'Upload Audio'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 8 }}>
          <div><strong>Transcript:</strong> {result.transcript}</div>
        </div>
      )}
    </form>
  );
};

export default AudioUpload; 
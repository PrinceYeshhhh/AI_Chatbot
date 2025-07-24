import React, { useState } from 'react';
import { uploadVideo, getVideoStatus } from '../services/videoService';

interface VideoUploadProps {
  onResult?: (result: { transcript: string; summary: string }) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onResult }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'permanent' | 'temporary'>('permanent');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setStatus('Uploading...');
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('storage_mode', storageMode);
      const res = await fetch('/api/video-upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploading(false);
      setProcessing(true);
      setStatus('Processing...');
      // Poll for status
      const poll = async () => {
        try {
          const res = await getVideoStatus(data.jobId);
          if (res.status === 'done') {
            setProcessing(false);
            setStatus('Complete!');
            if (onResult) onResult({ transcript: res.transcript, summary: res.summary });
          } else {
            setTimeout(poll, 3000);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to check status');
          setProcessing(false);
        }
      };
      poll();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setProcessing(false);
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
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
        onChange={handleFileChange}
        disabled={uploading || processing}
      />
      <button type="submit" disabled={!file || uploading || processing} style={{ marginLeft: 8 }}>
        {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload Video'}
      </button>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </form>
  );
};

export default VideoUpload; 
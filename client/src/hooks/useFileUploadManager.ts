import { useState, useRef } from 'react';
import axios from 'axios';

export type FileUploadStatus = 'queued' | 'uploading' | 'chunking' | 'parsing' | 'embedding' | 'complete' | 'error';

export interface UploadFile {
  file: File;
  id: string; // backend file id
  status: FileUploadStatus;
  progress: number;
  error?: string;
}

// Add type for user (use any if no User type is available)
export function useFileUploadManager(user: any) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const pollingRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Add files to queue
  const queueFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      id: '',
      status: 'queued' as FileUploadStatus,
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  // Start upload for a file
  const uploadFile = async (fileToUpload: UploadFile) => {
    setFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'uploading', progress: 0 } : f));
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload.file);
      formData.append('user_id', user?.id || '');
      // Use fetch to get uploadId and subscribe to SSE
      const res = await fetch('/api/file/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.access_token}` },
        body: formData
      });
      const data = await res.json();
      const uploadId = data.uploadId;
      // Subscribe to SSE for progress
      if (uploadId) {
        const evtSource = new EventSource(`/api/file/upload/progress/${uploadId}`);
        evtSource.onmessage = (event) => {
          const { progress } = JSON.parse(event.data);
          setFiles(prev => prev.map(f => f === fileToUpload ? { ...f, progress } : f));
          if (progress >= 100) {
            evtSource.close();
            setFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'chunking' } : f));
            // Optionally, poll file status here
          }
        };
        evtSource.onerror = () => {
          evtSource.close();
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'error', error: errorMsg } : f));
    }
  };

  // Poll backend for file status
  const pollFileStatus = (fileId: string, uploadFile: UploadFile) => {
    const poll = async () => {
      try {
        const res = await axios.get(`/api/files/${fileId}/status`, {
          headers: { Authorization: `Bearer ${user?.access_token}` }
        });
        const { status, progress, error } = res.data;
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status, progress, error } : f));
        if (["uploading", "parsing", "chunking", "embedding"].includes(status)) {
          pollingRefs.current[fileId] = setTimeout(poll, 1500);
        } else if (status === 'complete' || status === 'error') {
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status, progress, error } : f));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to poll file status';
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', error: errorMsg } : f));
      }
    };
    poll();
  };

  // Retry upload
  const retryFile = (fileToRetry: UploadFile) => {
    setFiles(prev => prev.map(f => f === fileToRetry ? { ...f, status: 'queued', error: undefined, progress: 0 } : f));
    uploadFile(fileToRetry);
  };

  // Remove file from list
  const removeFile = (uploadFile: UploadFile) => {
    setFiles(prev => prev.filter(f => f !== uploadFile));
    if (uploadFile.id && pollingRefs.current[uploadFile.id]) {
      clearTimeout(pollingRefs.current[uploadFile.id]);
      delete pollingRefs.current[uploadFile.id];
    }
  };

  // Start all queued uploads
  const startAll = () => {
    files.filter(f => f.status === 'queued').forEach(f => uploadFile(f));
  };

  return {
    files,
    queueFiles,
    uploadFile,
    retryFile,
    removeFile,
    startAll
  };
} 
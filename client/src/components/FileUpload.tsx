import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth, useE2EE } from '../context/AuthContext'
import Badge from './Badge';
import InfoCard from './InfoCard';
import Tooltip from './Tooltip';
import { useEncryptionKey } from '../lib/useEncryptionKey';
import { encryptData } from '../lib/crypto';
import { useFileUploadManager } from '../hooks/useFileUploadManager';
import { useToast } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import FilePreview from './FilePreview';
import imageCompression from 'browser-image-compression';
import { LoadingSpinner } from './ui/loading-spinner';
import { Alert } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { cn } from '../lib/utils';
import axios from 'axios';

// Enhance UploadedFile type for granular status
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'uploading' | 'parsing' | 'embedding' | 'complete' | 'error';
  progress: number;
  error?: string;
  chunkCount?: number;
  step?: number; // 0: uploading, 1: parsing, 2: embedding, 3: complete
}

// Update FileUploadStatus type to include 'parsing'
export type FileUploadStatus = 'queued' | 'uploading' | 'chunking' | 'parsing' | 'embedding' | 'complete' | 'error';

const statusSteps = ['Uploading', 'Parsing', 'Embedding', 'Complete'];

const STT_PROVIDERS = [
  { value: 'assemblyai', label: 'AssemblyAI' },
  { value: 'whispercpp', label: 'Whisper.cpp (local)' },
  { value: 'google', label: 'Google STT' },
  { value: 'deepgram', label: 'Deepgram' }
];

// Add language options (reuse from SettingsModal or define here)
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'ko', label: '한국어' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'pl', label: 'Polski' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'sv', label: 'Svenska' },
  { value: 'fi', label: 'Suomi' },
  { value: 'no', label: 'Norsk' },
  { value: 'da', label: 'Dansk' },
  { value: 'cs', label: 'Čeština' },
  { value: 'el', label: 'Ελληνικά' },
  { value: 'he', label: 'עברית' },
  { value: 'th', label: 'ไทย' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

const FileUpload: React.FC = () => {
  const { user, session } = useAuth();
  const { password, salt } = useE2EE();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const key = useEncryptionKey(password, salt);
  const { showToast } = useToast();

  // Use the new upload manager hook
  const {
    files,
    queueFiles,
    uploadFile,
    removeFile,
    retryFile,
    // deleteFile, // removed
    // isUploading, status, progress: compute locally
    // status,
    // progress
  } = useFileUploadManager(user);

  // Derived state
  const isUploading = files.some(f => ['uploading', 'chunking', 'embedding'].includes(f.status));
  const progress = files.length > 0 ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length) : 0;
  const status = files.find(f => ['uploading', 'chunking', 'embedding'].includes(f.status))?.status || '';

  // Add state for drag hover
  const [isDragActive, setIsDragActive] = useState(false);
  const [sttProvider, setSttProvider] = useState('assemblyai');
  const [sttResult, setSttResult] = useState<any>(null);
  const [sttLoading, setSttLoading] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [ocrLang, setOcrLang] = useState('en');
  const [storageMode, setStorageMode] = useState<'permanent' | 'temporary'>('permanent');
  // Add state for query mode toggle
  const [queryMode, setQueryMode] = useState<'all' | 'single'>('all');

  // File history state
  const [fileHistory, setFileHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch file history
  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await axios.get('/api/memory/files');
        setFileHistory(res.data.files || []);
      } catch (e: any) {
        setHistoryError(e?.response?.data?.error || 'Failed to load file history');
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Delete file from history
  const handleDeleteHistoryFile = async (fileId: string) => {
    const prev = fileHistory;
    setFileHistory(f => f.filter(fh => fh.id !== fileId));
    try {
      await axios.delete(`/api/memory/file/${fileId}`);
    } catch (e: any) {
      setFileHistory(prev); // revert
      showToast(e?.response?.data?.error || 'Failed to delete file', 'error');
    }
  };

  // Allowed file types
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/aac',
    'audio/ogg',
    'audio/webm'
  ];
  const allowedExtensions = [
    // Documents
    '.pdf', '.docx', '.txt', '.csv', '.xls', '.xlsx',
    // Images
    '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
    // Audio
    '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm'
  ];

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return 'File type not supported. Please upload PDF, DOCX, TXT, CSV, XLSX, images (JPG, PNG, WebP), or audio files (MP3, WAV, M4A).';
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('This file exceeds the 50MB limit. Please upload a smaller file.', 'error');
      return 'File size too large. Maximum size is 50MB.';
    }
    return null;
  };

  // Add handler for audio transcription
  const handleAudioTranscription = async (file: File) => {
    setSttLoading(true);
    setSttError(null);
    setSttResult(null);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language', ocrLang);
      formData.append('storage_mode', storageMode);
      const res = await fetch(`/api/whisper?provider=${sttProvider}&language=${ocrLang}&storage_mode=${storageMode}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      setSttResult(data);
    } catch (err: any) {
      setSttError(err.message || 'Transcription failed');
    } finally {
      setSttLoading(false);
    }
  };

  // Extend handleFiles to auto-transcribe audio
  const handleFiles = async (files: FileList) => {
    if (!user) {
      showToast('Please log in to upload files', 'error');
      return;
    }
    const fileArray = Array.from(files);
    let validFiles = fileArray.filter(file => {
      const error = validateFile(file);
      if (error) {
        showToast(error, 'error');
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    // If audio, transcribe instead of upload
    const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/webm'];
    const audioFile = validFiles.find(f => audioTypes.includes(f.type));
    if (audioFile) {
      handleAudioTranscription(audioFile);
      return;
    }
    // Compress images before upload
    const compressedFiles = await Promise.all(validFiles.map(async (file) => {
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920 });
          // If linter error persists for 'new File([compressed], file.name, { type: file.type })', add a ts-ignore comment above it.
          // @ts-ignore
          return new File([compressed], file.name, { type: file.type });
        } catch (e) {
          showToast('Image compression failed, uploading original.', 'warning');
          return file;
        }
      }
      return file;
    }));
    // Attach storage_mode to each file upload (if using custom upload logic)
    // If using queueFiles, ensure it supports passing extra metadata
    // For now, just pass as any
    (compressedFiles as any).storage_mode = storageMode;
    queueFiles(compressedFiles as any);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    // Documents
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('csv')) return '📋';
    if (type.includes('text')) return '📄';
    
    // Images
    if (type.includes('image')) return '🖼️';
    
    // Audio
    if (type.includes('audio')) return '🎵';
    
    return '📁';
  };

  // Example: show error toast on upload error
  const handleUploadError = (error: string) => {
    showToast(error, 'error');
  };
  // Example: show success toast on upload success
  const handleUploadSuccess = (msg: string) => {
    showToast(msg, 'success');
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8 shadow-lg border border-gray-200">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center justify-between">
          <span>Smart File Upload</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">All Files</span>
            <Switch
              checked={queryMode === 'single'}
              onCheckedChange={v => setQueryMode(v ? 'single' : 'all')}
              aria-label="Toggle query mode"
            />
            <span className="text-xs font-medium text-gray-500">Single File</span>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-500">Upload multiple files (PDF, DOCX, TXT, CSV, XLSX, MP3, MP4, PNG, JPG). Track progress for each stage. Only active files are used for queries.</p>
      </CardHeader>
      <CardContent>
        {/* Drag & Drop Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors',
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
          )}
          onDragOver={e => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragActive(false); }}
          onDrop={e => {
            e.preventDefault();
            setIsDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          tabIndex={0}
          aria-label="File upload dropzone"
        >
          <Upload className="w-8 h-8 text-blue-500 mb-2" />
          <span className="font-medium">Drag & drop files here</span>
          <span className="text-xs text-gray-400 mt-1">or</span>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Open file picker"
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.xlsx,.mp3,.mp4,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileInput}
            aria-label="File picker"
          />
        </div>
        {/* File List */}
        <div className="mt-6 space-y-4">
          {files.length === 0 && (
            <div className="text-center text-gray-400 text-sm">No files uploaded yet.</div>
          )}
          {files.map((file, idx) => (
            <div key={file.id || file.file.name + idx} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
              {/* File icon */}
              <div className="flex-shrink-0">
                {getFileIcon(file.file.type)}
              </div>
              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{file.file.name}</div>
                <div className="text-xs text-gray-400">{formatFileSize(file.file.size)}</div>
              </div>
              {/* Status chip */}
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  file.status === 'uploading' && 'bg-blue-100 text-blue-700',
                  file.status === 'parsing' && 'bg-yellow-100 text-yellow-700',
                  file.status === 'chunking' && 'bg-purple-100 text-purple-700',
                  file.status === 'embedding' && 'bg-pink-100 text-pink-700',
                  file.status === 'complete' && 'bg-green-100 text-green-700',
                  file.status === 'error' && 'bg-red-100 text-red-700'
                )}>
                  {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                </span>
                {/* Progress bar */}
                {['uploading', 'parsing', 'chunking', 'embedding'].includes(file.status) && (
                  <Progress value={file.progress} className="w-24 h-2 mt-1" />
                )}
                {/* Error message */}
                {file.status === 'error' && file.error && (
                  <span className="text-xs text-red-500 mt-1">{file.error}</span>
                )}
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-1 ml-2">
                {file.status === 'error' && (
                  <Button size="sm" variant="outline" onClick={() => retryFile(file)} aria-label="Retry upload">Retry</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => removeFile(file)} aria-label="Remove file">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {/* File History Section */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-2">File History</h3>
          {historyLoading && <div className="text-gray-400 text-sm">Loading...</div>}
          {historyError && <div className="text-red-500 text-sm">{historyError}</div>}
          {!historyLoading && fileHistory.length === 0 && <div className="text-gray-400 text-sm">No file history yet.</div>}
          <div className="space-y-2">
            {fileHistory.map(fh => (
              <div key={fh.id} className="flex items-center gap-4 p-2 rounded border border-gray-100 bg-white shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{fh.file_name}</div>
                  <div className="text-xs text-gray-400">Uploaded: {new Date(fh.created_at).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Chunks: {fh.chunkCount}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDeleteHistoryFile(fh.id)} aria-label="Delete file">Delete</Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FileUpload 
import React, { useState, useEffect } from 'react'
import { Download, Trash2, Eye, File, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { fileService, FileMetadata } from '../services/fileService'
import { useAuth, useE2EE } from '../context/AuthContext'
import { Modal } from './Modal';
import { useEncryptionKey } from '../lib/useEncryptionKey';
import { decryptData } from '../lib/crypto';

const PAGE_SIZE = 10;

interface FileListProps {
  onChatWithFile?: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onChatWithFile }) => {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showChunks, setShowChunks] = useState<{ open: boolean; fileId: string | null }>({ open: false, fileId: null });
  const [chunks, setChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const { password, salt } = useE2EE();
  const key = useEncryptionKey(password, salt);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [undoFile, setUndoFile] = useState<FileMetadata | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activityLog, setActivityLog] = useState<Record<string, any[]>>({});
  const [showLogFor, setShowLogFor] = useState<string | null>(null);

  useEffect(() => {
    loadFiles(page);
  }, [page]);

  const loadFiles = async (pageNum: number) => {
    try {
      setLoading(true)
      setError(null)
      const { files, total } = await fileService.getUploadedFilesPaginated(pageNum, PAGE_SIZE);
      setFiles(files);
      setTotal(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setUndoFile(fileToDelete);
    if (undoTimeout) clearTimeout(undoTimeout);
    setUndoTimeout(setTimeout(async () => {
      try {
        await fileService.deleteFile(fileId);
        setTotal(t => t - 1);
        setUndoFile(null);
      } catch (err) {
        setFiles(prev => [...prev, fileToDelete]);
        setUndoFile(null);
      }
    }, 5000));
  };

  const handleUndoDelete = () => {
    if (undoTimeout) clearTimeout(undoTimeout);
    setFiles(prev => undoFile ? [undoFile, ...prev] : prev);
    setUndoFile(null);
  };

  const handleDownloadFile = async (file: FileMetadata) => {
    try {
      const downloadUrl = await fileService.getFileDownloadUrl(file.upload_path);
      const response = await fetch(downloadUrl);
      const encryptedBlob = await response.blob();
      const encryptedText = await encryptedBlob.text();
      const encrypted = JSON.parse(encryptedText);
      if (!key) throw new Error('Encryption key not ready');
      const decrypted = await decryptData(key, encrypted);
      setDecryptedContent(decrypted);
      // Optionally, trigger download as plaintext file:
      // const blob = new Blob([decrypted], { type: 'text/plain' });
      // const link = document.createElement('a');
      // link.href = URL.createObjectURL(blob);
      // link.download = file.original_name;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download or decrypt file');
    }
  };

  const handleShowChunks = async (fileId: string) => {
    setShowChunks({ open: true, fileId });
    setLoadingChunks(true);
    try {
      const data = await fileService.getFileChunks(fileId);
      setChunks(data);
    } catch (err) {
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  const closeChunks = () => {
    setShowChunks({ open: false, fileId: null });
    setChunks([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Processed'
      case 'failed':
        return 'Failed'
      case 'processing':
        return 'Processing'
      default:
        return 'Pending'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'processing':
        return 'text-yellow-600'
      default:
        return 'text-gray-500'
    }
  }

  const fetchActivityLog = async (fileId: string) => {
    const res = await fetch(`/api/file-activity-log/${fileId}`);
    const data = await res.json();
    setActivityLog((prev) => ({ ...prev, [fileId]: data.log || [] }));
    setShowLogFor(fileId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 w-full">
        <div className="w-full max-w-2xl space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
              <div className="w-24 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadFiles}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <File className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No files uploaded yet</h3>
        <p className="text-gray-600 mb-4">Upload your first file to get started with Smart Brain</p>
        <button onClick={() => document.querySelector('input[type=file]')?.click()} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors text-lg font-semibold" aria-label="Upload file">Upload File</button>
      </div>
    )
  }

  return (
    <>
      {/* Remove password/salt prompt UI */}
      {decryptedContent && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <b>Decrypted Content:</b>
          <pre className="whitespace-pre-wrap text-xs mt-2">{decryptedContent}</pre>
        </div>
      )}
      {undoFile && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-4 animate-fade-in" role="alert">
          <span>File deleted</span>
          <button onClick={handleUndoDelete} className="ml-4 px-3 py-1 bg-blue-600 rounded text-white font-semibold" aria-label="Undo delete">Undo</button>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Files ({total})
          </h3>
          <button
            onClick={loadFiles}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">{fileService.getFileIcon(file.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {file.original_name}
                    </span>
                    {getStatusIcon(file.processing_status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{fileService.formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span className={getStatusColor(file.processing_status)}>
                      {getStatusText(file.processing_status)}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="text-blue-700 font-bold">Chunks: {file.chunk_count ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors min-w-[48px] min-h-[48px]"
                  title="Download file"
                  aria-label="Download file"
                >
                  <Download className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors min-w-[48px] min-h-[48px]"
                  title="Delete file"
                  aria-label="Delete file"
                >
                  <Trash2 className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => onChatWithFile && onChatWithFile(file.id)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors min-w-[48px] min-h-[48px]"
                  title="Chat with file"
                  aria-label="Chat with file"
                >
                  <Eye className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => handleShowChunks(file.id)}
                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors min-w-[48px] min-h-[48px]"
                  title="View chunks"
                  aria-label="View chunks"
                >
                  <File className="w-5 h-5 mx-auto" />
                </button>
                <button onClick={() => fetchActivityLog(file.id)} style={{ marginLeft: 8 }}>
                  View Activity Log
                </button>
                {showLogFor === file.id && activityLog[file.id] && (
                  <div style={{ background: '#f6f6fa', margin: '8px 0', padding: 8, borderRadius: 6 }}>
                    <strong>Activity Log:</strong>
                    <ul>
                      {activityLog[file.id].length === 0 && <li>No activity yet.</li>}
                      {activityLog[file.id].map((log, idx) => (
                        <li key={idx}>{log.event} - {log.details} ({new Date(log.created_at).toLocaleString()})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * PAGE_SIZE >= total}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {/* Chunk Explorer Modal */}
        {showChunks.open && (
          <Modal isOpen={showChunks.open} onClose={closeChunks}>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">Chunks for File</h3>
              {loadingChunks ? (
                <div>Loading...</div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {chunks.map((chunk, idx) => (
                    <div key={chunk.id || idx} className="bg-gray-50 p-2 rounded border text-xs">
                      <div className="font-mono text-gray-700 mb-1">Chunk {chunk.chunk_index}</div>
                      <div className="text-gray-900 whitespace-pre-wrap">{chunk.chunk_text.slice(0, 500)}{chunk.chunk_text.length > 500 ? '...' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={closeChunks}>Close</button>
            </div>
          </Modal>
        )}
      </div>
    </>
  )
}

export default FileList 
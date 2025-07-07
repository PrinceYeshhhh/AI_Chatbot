import React, { useState, useEffect } from 'react'
import { Download, Trash2, Eye, File, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { fileService, FileMetadata } from '../services/fileService'
import { useAuth } from '../context/AuthContext'

interface FileListProps {
  onChatWithFile?: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onChatWithFile }) => {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const uploadedFiles = await fileService.getUploadedFiles()
      setFiles(uploadedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      await fileService.deleteFile(fileId)
      setFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  const handleDownloadFile = async (file: FileMetadata) => {
    try {
      const downloadUrl = await fileService.getFileDownloadUrl(file.upload_path)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download file')
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading files...</span>
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
      <div className="text-center py-8">
        <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
        <p className="text-gray-600">
          Upload your first file to get started with Smart Brain
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Files ({files.length})
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadFile(file)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChatWithFile && onChatWithFile(file.id)}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Chat with file"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileList 
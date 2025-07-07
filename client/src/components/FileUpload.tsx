import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  status: 'uploading' | 'parsing' | 'embedding' | 'complete' | 'error'
  progress: number
  error?: string
  chunkCount?: number
}

const FileUpload: React.FC = () => {
  const { user } = useAuth()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv', '.xls', '.xlsx']

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return 'File type not supported. Please upload PDF, DOCX, TXT, CSV, XLS, or XLSX files.'
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return 'File size too large. Maximum size is 50MB.'
    }
    
    return null
  }

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const fileId = crypto.randomUUID()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${fileId}.${fileExtension}`
    const filePath = `user-${user.id}/${fileName}`

    // Create initial file entry
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      status: 'uploading',
      progress: 0
    }

    setUploadedFiles(prev => [...prev, uploadedFile])

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath)

      // Store metadata in database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size,
          upload_path: filePath,
          processing_status: 'pending',
          metadata: {
            uploaded_at: new Date().toISOString(),
            file_extension: fileExtension
          }
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't throw here as file was uploaded successfully
      }

      // Call backend to process file and get chunk count/status
      const formData = new FormData()
      formData.append('files', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${user.access_token}` } })
      const data = await res.json()
      const backendFile = data.files?.find((f: any) => f.originalName === file.name)

      return {
        ...uploadedFile,
        url: urlData.publicUrl,
        status: backendFile?.status === 'processed' ? 'complete' : 'error',
        chunkCount: backendFile?.chunks || 0,
        error: backendFile?.error || undefined,
        progress: 100
      }

    } catch (error) {
      console.error('Upload error:', error)
      return {
        ...uploadedFile,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
        progress: 100
      }
    }
  }

  const handleFiles = async (files: FileList) => {
    if (!user) {
      alert('Please log in to upload files')
      return
    }

    setIsUploading(true)
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const error = validateFile(file)
      if (error) {
        alert(`Error with ${file.name}: ${error}`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const uploadPromises = validFiles.map(uploadFile)
    const results = await Promise.all(uploadPromises)

    setUploadedFiles(prev => 
      prev.map(file => {
        const result = results.find(r => r.id === file.id)
        return result || file
      })
    )

    setIsUploading(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const deleteFile = async (fileId: string) => {
    if (!user) return
    try {
      // Call backend to delete file and vectors
      await fetch(`/api/upload/${fileId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.access_token}` } })
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      alert('Failed to delete file')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('csv')) return '📋'
    if (type.includes('text')) return '📄'
    return '📁'
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.xls,.xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Files to Smart Brain
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            browse files
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: PDF, DOCX, TXT, CSV, XLS, XLSX (Max 50MB per file)
        </p>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">Uploading files...</span>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getFileIcon(file.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{file.name}</span>
                      {file.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      )}
                      {file.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {file.type}
                    </div>
                    {file.error && (
                      <div className="text-sm text-red-600 mt-1">{file.error}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.chunkCount && (
                    <span className="text-sm text-gray-500">
                      Chunks: {file.chunkCount}
                    </span>
                  )}
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload 
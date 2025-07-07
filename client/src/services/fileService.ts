import { supabase } from '../lib/supabase'
import { api } from './api'
import { useState } from 'react'

export interface FileMetadata {
  id: string
  user_id: string
  filename: string
  original_name: string
  file_type: string
  file_size: number
  upload_path: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at?: string
  created_at: string
  metadata?: any
}

export interface UploadResponse {
  success: boolean
  file?: FileMetadata
  error?: string
}

class FileService {
  /**
   * Get all uploaded files for the current user
   */
  async getUploadedFiles(): Promise<FileMetadata[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching uploaded files:', error)
      throw error
    }
  }

  /**
   * Delete a file from storage and database via backend API
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const res = await api.delete(`/files/${fileId}`)
      return res.data.success
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  /**
   * Get file download URL
   */
  async getFileDownloadUrl(filePath: string): Promise<string> {
    try {
      const { data } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error getting download URL:', error)
      throw error
    }
  }

  /**
   * Update file processing status
   */
  async updateProcessingStatus(
    fileId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    processedAt?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const updateData: any = {
        processing_status: status
      }

      if (processedAt) {
        updateData.processed_at = processedAt
      }

      const { error } = await supabase
        .from('file_uploads')
        .update(updateData)
        .eq('id', fileId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating processing status:', error)
      throw error
    }
  }

  /**
   * Get file statistics for the current user
   */
  async getFileStats(): Promise<{
    totalFiles: number
    totalSize: number
    byType: Record<string, number>
  }> {
    try {
      const files = await this.getUploadedFiles()
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.file_size, 0),
        byType: {} as Record<string, number>
      }

      files.forEach(file => {
        const type = file.file_type
        stats.byType[type] = (stats.byType[type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting file stats:', error)
      throw error
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('csv')) return '📋'
    if (type.includes('text')) return '📄'
    return '📁'
  }

  async fetchFiles() {
    try {
      const res = await api.get('/files')
      return res.data
    } catch (error) {
      throw error
    }
  }

  async uploadFiles(formData: FormData) {
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (error) {
      throw error
    }
  }
}

export const fileService = new FileService()
export default fileService

export function useFileUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fileService.uploadFiles(formData)
      setLoading(false)
      return data
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setLoading(false)
      throw err
    }
  }

  return { upload, loading, error }
}

export function useFileDelete() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (fileId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fileService.deleteFile(fileId)
      setLoading(false)
      return data
    } catch (err: any) {
      setError(err.message || 'Delete failed')
      setLoading(false)
      throw err
    }
  }

  return { remove, loading, error }
} 
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import FileList from '../FileList'
import { AuthContext } from '../../context/AuthContext'

// Mock fileService
vi.mock('../../services/fileService', () => ({
  fileService: {
    getUploadedFiles: vi.fn(),
    deleteFile: vi.fn(),
    getFileDownloadUrl: vi.fn(),
    formatFileSize: vi.fn((bytes) => `${bytes} bytes`),
    getFileIcon: vi.fn(() => '📄')
  }
}))

// Mock AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
}

const mockAuthContext = {
  user: mockUser,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  loading: false
}

describe('FileList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderFileList = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <FileList />
      </AuthContext.Provider>
    )
  }

  it('renders loading state initially', () => {
    const { fileService } = require('../../services/fileService')
    vi.mocked(fileService.getUploadedFiles).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to simulate loading
    )
    
    renderFileList()
    
    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('renders empty state when no files', async () => {
    const { fileService } = require('../../services/fileService')
    vi.mocked(fileService.getUploadedFiles).mockResolvedValue([])
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('No files uploaded yet')).toBeInTheDocument()
    })
  })

  it('renders files list when files exist', async () => {
    const { fileService } = require('../../services/fileService')
    const mockFiles = [
      {
        id: '1',
        user_id: 'test-user-id',
        filename: 'test1.pdf',
        original_name: 'test1.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_path: 'user-test-user-id/test1.pdf',
        processing_status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      },
      {
        id: '2',
        user_id: 'test-user-id',
        filename: 'test2.docx',
        original_name: 'test2.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 2048,
        upload_path: 'user-test-user-id/test2.docx',
        processing_status: 'pending',
        created_at: '2024-01-02T00:00:00Z',
        metadata: {}
      }
    ]
    
    vi.mocked(fileService.getUploadedFiles).mockResolvedValue(mockFiles)
    vi.mocked(fileService.formatFileSize).mockReturnValue('1 KB')
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('Your Files (2)')).toBeInTheDocument()
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      expect(screen.getByText('test2.docx')).toBeInTheDocument()
    })
  })

  it('handles file deletion', async () => {
    const { fileService } = require('../../services/fileService')
    const mockFiles = [
      {
        id: '1',
        user_id: 'test-user-id',
        filename: 'test1.pdf',
        original_name: 'test1.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_path: 'user-test-user-id/test1.pdf',
        processing_status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      }
    ]
    
    vi.mocked(fileService.getUploadedFiles).mockResolvedValue(mockFiles)
    vi.mocked(fileService.deleteFile).mockResolvedValue(true)
    vi.mocked(fileService.formatFileSize).mockReturnValue('1 KB')
    
    // Mock window.confirm
    const mockConfirm = vi.fn(() => true)
    Object.defineProperty(window, 'confirm', {
      value: mockConfirm,
      writable: true
    })
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    })
    
    const deleteButton = screen.getByTitle('Delete file')
    fireEvent.click(deleteButton)
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this file?')
    expect(fileService.deleteFile).toHaveBeenCalledWith('1')
  })

  it('handles download functionality', async () => {
    const { fileService } = require('../../services/fileService')
    const mockFiles = [
      {
        id: '1',
        user_id: 'test-user-id',
        filename: 'test1.pdf',
        original_name: 'test1.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_path: 'user-test-user-id/test1.pdf',
        processing_status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      }
    ]
    
    vi.mocked(fileService.getUploadedFiles).mockResolvedValue(mockFiles)
    vi.mocked(fileService.getFileDownloadUrl).mockResolvedValue('https://example.com/file.pdf')
    vi.mocked(fileService.formatFileSize).mockReturnValue('1 KB')
    
    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    const mockCreateElement = vi.fn(() => mockLink)
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    
    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
      writable: true
    })
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
      writable: true
    })
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
      writable: true
    })
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    })
    
    const downloadButton = screen.getByTitle('Download file')
    fireEvent.click(downloadButton)
    
    expect(fileService.getFileDownloadUrl).toHaveBeenCalledWith('user-test-user-id/test1.pdf')
    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockLink.href).toBe('https://example.com/file.pdf')
    expect(mockLink.download).toBe('test1.pdf')
  })

  it('shows error state when loading fails', async () => {
    const { fileService } = require('../../services/fileService')
    vi.mocked(fileService.getUploadedFiles).mockRejectedValue(new Error('Failed to load files'))
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load files')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('shows correct status indicators', async () => {
    const { fileService } = require('../../services/fileService')
    const mockFiles = [
      {
        id: '1',
        user_id: 'test-user-id',
        filename: 'test1.pdf',
        original_name: 'test1.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_path: 'user-test-user-id/test1.pdf',
        processing_status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      },
      {
        id: '2',
        user_id: 'test-user-id',
        filename: 'test2.pdf',
        original_name: 'test2.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_path: 'user-test-user-id/test2.pdf',
        processing_status: 'failed',
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      }
    ]
    
    vi.mocked(fileService.getUploadedFiles).mockResolvedValue(mockFiles)
    vi.mocked(fileService.formatFileSize).mockReturnValue('1 KB')
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('Processed')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
  })

  it('handles refresh functionality', async () => {
    const { fileService } = require('../../services/fileService')
    const mockFiles = [
      {
        id: '1',
        user_id: 'test-user-id',
        filename: 'test1.pdf',
        original_name: 'test1.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_path: 'user-test-user-id/test1.pdf',
        processing_status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        metadata: {}
      }
    ]
    
    vi.mocked(fileService.getUploadedFiles).mockResolvedValue(mockFiles)
    vi.mocked(fileService.formatFileSize).mockReturnValue('1 KB')
    
    renderFileList()
    
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    })
    
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)
    
    expect(fileService.getUploadedFiles).toHaveBeenCalledTimes(2) // Initial load + refresh
  })
}) 
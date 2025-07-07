import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, User, Upload, Files } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import FileList from '../components/FileList'
import ChatWithFile from '../components/ChatWithFile'

const ChatPage: React.FC = () => {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('upload')
  const [activeFileId, setActiveFileId] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Smart Brain AI Chatbot
            </h1>
            <p className="text-lg text-gray-600">
              Instant File Learning & RAG Technology
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'files'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Files className="w-4 h-4" />
              My Files
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {activeTab === 'upload' ? (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Upload Files to Smart Brain 🧠
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Upload your documents and let Smart Brain learn from them instantly. 
                    Supported formats: PDF, DOCX, TXT, CSV, XLS, XLSX
                  </p>
                </div>
                <FileUpload />
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Files className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Your Uploaded Files 📁
                  </h2>
                  <p className="text-gray-600 mb-6">
                    View and manage your uploaded files. These files will be processed for AI learning.
                  </p>
                </div>
                {activeFileId ? (
                  <ChatWithFile fileId={activeFileId} onClose={() => setActiveFileId(null)} />
                ) : (
                  <FileList onChatWithFile={setActiveFileId} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage 
import React from 'react';
import { Settings, Database, Sparkles, MessageSquare, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenTraining: () => void;
  onOpenChat: () => void;
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenTraining, onOpenChat, activeTab }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">AI Chatbot</h1>
              <p className="text-xs text-blue-100 opacity-80">Powered by Advanced ML</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={onOpenChat}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">Chat</span>
            </button>
            <button
              onClick={onOpenTraining}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'training'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="font-medium">Training</span>
            </button>
          </nav>

          {/* Action Buttons + Auth */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenTraining}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
              title="Open Training Portal"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Train AI</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            {/* Auth Info */}
            {user && (
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm font-medium text-white bg-blue-700/60 px-3 py-1 rounded-lg">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
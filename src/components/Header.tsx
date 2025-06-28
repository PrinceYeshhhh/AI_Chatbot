import React from 'react';
import { Bot, Sparkles, Brain, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => (
  <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 lg:px-6 py-4 shadow-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-200 transform hover:scale-105 transition-all duration-300">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Imperial AI Chatboard
              </h1>
              <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200 shadow-sm">
                Beta
              </span>
            </div>
            <p className="text-sm text-gray-600 hidden sm:flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              Advanced AI Assistant with ML/NLP
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Status Indicators - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">AI Active</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
            <Brain className="w-3 h-3 text-purple-500" />
            <span className="font-medium">Neural Networks</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span className="font-medium">Learning</span>
          </div>
        </div>
        {/* Login Button (route to /login) */}
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Login</span>
        </Link>
      </div>
    </div>
  </div>
);

export default Header; 
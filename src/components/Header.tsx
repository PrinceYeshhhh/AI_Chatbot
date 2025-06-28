import React from 'react';
import { Bot, Sparkles, Brain, Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => (
  <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Imperial AI Chatboard
              </h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Beta
              </span>
            </div>
            <p className="text-sm text-gray-600 hidden sm:flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Advanced AI Assistant with ML/NLP
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Status Indicators - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>AI Active</span>
          </div>
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>Neural Networks</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Learning</span>
          </div>
        </div>
        {/* Login Button (route to /login) */}
        <Link
          to="/login"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Login</span>
        </Link>
      </div>
    </div>
  </div>
);

export default Header; 
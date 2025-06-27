import React from 'react';
import { Bot, Upload, MessageSquare, Sparkles, X } from 'lucide-react';

interface OnboardingMessageProps {
  onDismiss: () => void;
}

export const OnboardingMessage: React.FC<OnboardingMessageProps> = ({ onDismiss }) => {
  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg relative">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors duration-200"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            👋 Hi, I'm your AI Assistant!
          </h3>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            I'm powered by advanced machine learning and can help you with anything. 
            You can upload files to train me on your specific data, or start chatting right away.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Upload Files</h4>
                <p className="text-xs text-gray-600">Train me on your data</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Start Chatting</h4>
                <p className="text-xs text-gray-600">Ask me anything</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">AI Learning</h4>
                <p className="text-xs text-gray-600">I improve over time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
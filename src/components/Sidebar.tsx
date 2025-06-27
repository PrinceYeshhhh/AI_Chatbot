import React, { useState } from 'react';
import { Conversation } from '../types';
import { Plus, MessageSquare, Trash2, Settings, Database, X, Sparkles } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onOpenTraining: () => void;
  onOpenSettings: () => void;
  onCloseSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenTraining,
  onOpenSettings,
  onCloseSidebar
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingId(conversationId);
    
    setTimeout(() => {
      onDeleteConversation(conversationId);
      setDeletingId(null);
    }, 200);
  };

  const handleNewConversation = () => {
    onNewConversation();
    onCloseSidebar?.();
  };

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation);
    onCloseSidebar?.();
  };

  const handleOpenTraining = () => {
    onOpenTraining();
    onCloseSidebar?.();
  };

  const handleOpenSettings = () => {
    onOpenSettings();
    onCloseSidebar?.();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Imperiality</span>
          </div>
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative rounded-lg transition-all duration-200 ${
                currentConversation?.id === conversation.id
                  ? 'bg-blue-100 border border-blue-200'
                  : 'hover:bg-gray-100'
              } ${deletingId === conversation.id ? 'opacity-50 scale-95' : ''}`}
              onMouseEnter={() => setHoveredId(conversation.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => handleSelectConversation(conversation)}
                className="w-full text-left p-3 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                disabled={deletingId === conversation.id}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {conversation.messages.length} messages
                    </p>
                  </div>
                </div>
              </button>
              
              {hoveredId === conversation.id && deletingId !== conversation.id && (
                <button
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 focus:ring-2 focus:ring-red-200"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={handleOpenTraining}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-gray-200"
        >
          <Database className="w-4 h-4" />
          Training Data
        </button>
        <button
          onClick={handleOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-gray-200"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
};
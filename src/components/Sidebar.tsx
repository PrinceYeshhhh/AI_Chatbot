import React, { useState } from 'react';
import { Conversation } from '../types';
import { Plus, MessageSquare, Trash2, Settings, Database, X, Sparkles } from 'lucide-react';
import { VirtualConversationList } from './VirtualList';

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
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Imperiality</span>
          </div>
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        <VirtualConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id ?? ''}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={onDeleteConversation}
          height={600}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2 bg-gradient-to-r from-white to-gray-50">
        <button
          onClick={handleOpenTraining}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-purple-200 transform hover:scale-105 active:scale-95 font-medium"
        >
          <Database className="w-4 h-4 text-purple-500" />
          Training Data
        </button>
        <button
          onClick={handleOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-gray-200 transform hover:scale-105 active:scale-95 font-medium"
        >
          <Settings className="w-4 h-4 text-gray-500" />
          Settings
        </button>
      </div>
    </div>
  );
};
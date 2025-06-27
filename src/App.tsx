import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { SettingsModal } from './components/SettingsModal';
import TrainingModal from './components/TrainingModal';
import { OnboardingMessage } from './components/OnboardingMessage';
import { ChatTemplates } from './components/ChatTemplates';
import { VoiceInputButton } from './components/VoiceInputButton';
import { SaveChatButton } from './components/SaveChatButton';
import { LoginModal } from './components/LoginModal';
import { AuthPage } from './components/AuthPage';
import { useChat } from './hooks/useChat';
import { Bot, Sparkles, Cpu, Brain, Menu, X, User, LogIn } from 'lucide-react';

function App() {
  const {
    conversations,
    currentConversation,
    isTyping,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation
  } = useChat();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('chatbot-onboarding-seen');
    if (hasSeenOnboarding) {
      setShowOnboarding(false);
    }
  }, []);

  const handleSendMessage = (message: string) => {
    if (showOnboarding) {
      setShowOnboarding(false);
      localStorage.setItem('chatbot-onboarding-seen', 'true');
    }
    sendMessage(message);
  };

  const handleTemplateSelect = (template: string) => {
    if (showOnboarding) {
      setShowOnboarding(false);
      localStorage.setItem('chatbot-onboarding-seen', 'true');
    }
    sendMessage(template);
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('chatbot-onboarding-seen', 'true');
  };

  const handleLoginClick = () => {
    setShowAuthPage(true);
  };

  // Show auth page if requested
  if (showAuthPage) {
    return (
      <div className="min-h-screen">
        <AuthPage />
        <button
          onClick={() => setShowAuthPage(false)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200"
        >
          ← Back to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onNewConversation={createNewConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onOpenTraining={() => setIsTrainingOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
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
                    <Cpu className="w-4 h-4" />
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

              {/* Login Button */}
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          {currentConversation ? (
            <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
              {/* Onboarding Message */}
              {showOnboarding && (
                <OnboardingMessage onDismiss={handleDismissOnboarding} />
              )}

              {/* Chat Templates */}
              {currentConversation.messages.length === 0 && !showOnboarding && (
                <ChatTemplates onTemplateSelect={handleTemplateSelect} />
              )}

              {/* Messages */}
              {currentConversation.messages.length > 0 && (
                <div className="space-y-6">
                  {currentConversation.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isTyping && <TypingIndicator />}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16 px-4">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Imperial AI Chatboard
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                  Experience the future of conversational AI powered by state-of-the-art machine learning. 
                  Start a new conversation to see advanced neural networks in action.
                </p>
                
                <button
                  onClick={createNewConversation}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg font-semibold"
                >
                  <Sparkles className="w-6 h-6" />
                  Start AI Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        {currentConversation && (
          <div className="border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto px-4 lg:px-6">
              <div className="flex items-center gap-2 py-2">
                <VoiceInputButton />
                <SaveChatButton conversation={currentConversation} />
              </div>
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
                placeholder="Ask me about AI, machine learning, or anything else..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      
      <TrainingModal
        isOpen={isTrainingOpen}
        onClose={() => setIsTrainingOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

export default App;
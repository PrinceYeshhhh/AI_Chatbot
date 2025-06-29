import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ErrorBoundary, MLErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardNavigation, CHAT_KEYBOARD_SHORTCUTS } from './hooks/useKeyboardNavigation';
import { useLiveRegion } from './hooks/useKeyboardNavigation';
import { PerformanceMonitor } from './utils/performanceMonitor';
import { FeatureTestPanel } from './components/FeatureTestPanel';
import IntroAnimation from './components/IntroAnimation';

function App() {
  const location = useLocation();
  const { announce } = useLiveRegion('polite');
  const [showIntro, setShowIntro] = React.useState(true);

  // Set up keyboard navigation for the entire app
  useKeyboardNavigation({
    shortcuts: [
      {
        ...CHAT_KEYBOARD_SHORTCUTS.SEND_MESSAGE,
        action: () => {
          // This will be handled by individual components
          announce('Send message shortcut activated');
        }
      },
      {
        ...CHAT_KEYBOARD_SHORTCUTS.NEW_CONVERSATION,
        action: () => {
          announce('New conversation shortcut activated');
        }
      },
      {
        ...CHAT_KEYBOARD_SHORTCUTS.CLOSE_MODAL,
        action: () => {
          announce('Close modal shortcut activated');
        }
      },
      {
        ...CHAT_KEYBOARD_SHORTCUTS.FOCUS_INPUT,
        action: () => {
          const input = document.querySelector('[data-testid="chat-input"]') as HTMLElement;
          if (input) {
            input.focus();
            announce('Chat input focused');
          }
        }
      }
    ],
    enabled: true
  });

  // Performance monitoring for route changes
  React.useEffect(() => {
    const timer = PerformanceMonitor.startTimer(`route-change-${location.pathname}`);
    
    // Announce route changes for screen readers
    const routeNames: Record<string, string> = {
      '/chat': 'Chat page',
      '/login': 'Login page',
      '/register': 'Register page'
    };
    
    const routeName = routeNames[location.pathname] || 'Unknown page';
    announce(`Navigated to ${routeName}`);
    
    return () => {
      timer();
    };
  }, [location.pathname, announce]);

  // Handle intro completion
  const handleIntroComplete = () => {
    setShowIntro(false);
    announce('AI Chatbot loaded successfully');
  };

  // Show intro animation on first load
  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <ErrorBoundary
      onError={(_error, _errorInfo) => {
        // Handle error silently or log to external service
        announce('An error occurred in the application');
      }}
    >
      <div className="app-container" role="application" aria-label="AI Chatbot Application">
        {/* Skip link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path="/login" 
              element={
                <MLErrorBoundary>
                  <LoginPage />
                </MLErrorBoundary>
              } 
            />
            <Route 
              path="/register" 
              element={
                <MLErrorBoundary>
                  <RegisterPage />
                </MLErrorBoundary>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <MLErrorBoundary>
                  <ChatPage />
                </MLErrorBoundary>
              } 
            />
            <Route path="/test" element={<FeatureTestPanel />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </AnimatePresence>

        {/* Live region for announcements */}
        <div 
          id="aria-live-region"
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        />

        {/* Performance monitoring panel (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
            <div className="font-semibold mb-2">Performance</div>
            <PerformancePanel />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// Performance monitoring panel component
const PerformancePanel: React.FC = () => {
  const [stats, setStats] = React.useState(PerformanceMonitor.getPerformanceSummary());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(PerformanceMonitor.getPerformanceSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1">
      <div>Operations: {stats.totalOperations}</div>
      <div>Slow: {stats.slowOperations}</div>
      <div>Avg: {stats.averageTime.toFixed(1)}ms</div>
      {stats.slowestOperation && (
        <div className="text-red-400">
          Slowest: {stats.slowestOperation.label} ({stats.slowestOperation.duration.toFixed(0)}ms)
        </div>
      )}
    </div>
  );
};

export default App;
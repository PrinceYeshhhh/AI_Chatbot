import React, { useState, useCallback, createContext, useContext, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
// Lazy load non-critical pages
const SignupPage = lazy(() => import('./pages/SignupPage'));
const UsageDashboard = lazy(() => import('./pages/UsageDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
import ProtectedRoute from './components/auth/ProtectedRoute'
import './App.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { WorkspaceProvider } from './context/WorkspaceContext';
import Toast, { ToastType } from './components/Toast';

// Toast context for global notifications
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}
export const ToastContext = createContext<ToastContextType>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

function App() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; duration?: number } | null>(null);
  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    setToast({ message, type, duration });
  }, []);
  const handleCloseToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ErrorBoundary>
        <AuthProvider>
          <WorkspaceProvider>
            <Router>
              <div className="App">
                {toast && (
                  <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={handleCloseToast}
                    duration={toast.duration}
                  />
                )}
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<Suspense fallback={<div>Loading...</div>}><SignupPage /></Suspense>} />
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/usage" 
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Loading...</div>}><UsageDashboard /></Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/analytics" 
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Loading...</div>}><AnalyticsDashboard /></Suspense>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/privacy" 
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<div>Loading...</div>}><PrivacyPage /></Suspense>
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </div>
            </Router>
          </WorkspaceProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ToastContext.Provider>
  )
}

export default App 
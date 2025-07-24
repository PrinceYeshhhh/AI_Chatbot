import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number; // ms
}

const typeStyles: Record<ToastType, { container: string; icon: React.ComponentType<any>; iconColor: string }> = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800 shadow-green-100',
    icon: CheckCircle,
    iconColor: 'text-green-500'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800 shadow-red-100',
    icon: XCircle,
    iconColor: 'text-red-500'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-yellow-100',
    icon: AlertCircle,
    iconColor: 'text-yellow-500'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100',
    icon: Info,
    iconColor: 'text-blue-500'
  },
};

const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const style = typeStyles[type];
  const Icon = style.icon;

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close timer
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose, duration]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 max-w-sm w-full px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${style.container}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${style.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast; 
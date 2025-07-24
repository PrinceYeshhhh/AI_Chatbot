import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-400'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconColor: 'text-red-400'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-400'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-400'
  }
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = ''
}) => {
  const style = alertStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={`border rounded-lg p-4 ${style.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${style.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Close alert"
          >
            <span className="sr-only">Close</span>
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}; 
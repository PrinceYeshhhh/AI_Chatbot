import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme?: 'light' | 'dark';
  onToggle?: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  theme = 'light', 
  onToggle, 
  className = '' 
}) => {
  const handleToggle = () => {
    onToggle?.();
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}; 
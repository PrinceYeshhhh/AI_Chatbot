import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export const VoiceInputButton: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleVoiceToggle = () => {
    // For now, just toggle the visual state
    setIsListening(!isListening);
    
    // Show coming soon message
    if (!isListening) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleVoiceToggle}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isListening
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Voice Input (Coming Soon)"
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
          Voice Input Coming Soon! 🎤
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};
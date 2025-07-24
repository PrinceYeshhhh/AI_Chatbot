import React from 'react';
import { speak, stopSpeaking } from './tts';

interface TTSButtonProps {
  text: string;
  lang?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, lang = 'en' }) => {
  const handleClick = () => {
    stopSpeaking();
    speak(text, lang);
  };
  return (
    <button onClick={handleClick} aria-label="Listen" title="Listen" style={{ marginLeft: 8 }}>
      🔊
    </button>
  );
}; 
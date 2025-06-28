import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, Sparkles } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const animationSequence = async () => {
      // Phase 1: Logo appears with glow effect
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowLogo(true);
      
      // Phase 2: Logo scales up with sparkle effect
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnimationPhase(1);
      
      // Phase 3: Brand name appears
      await new Promise(resolve => setTimeout(resolve, 600));
      setShowText(true);
      
      // Phase 4: Tagline appears
      await new Promise(resolve => setTimeout(resolve, 800));
      setShowTagline(true);
      
      // Phase 5: Hold for brand recognition
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 6: Fade out and transition
      setFadeOut(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onComplete();
    };

    animationSequence();
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000 gradient-animate ${
        fadeOut 
          ? 'opacity-0' 
          : ''
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main logo container */}
      <div className="relative flex flex-col items-center space-y-6">
        {/* Logo with glow effect */}
        <div 
          className={`relative transition-all duration-1000 ${
            showLogo 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-50'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse" />
          
          {/* Main logo */}
          <div className={`relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-8 shadow-2xl transition-all duration-1000 logo-glow ${
            animationPhase >= 1 ? 'scale-110' : 'scale-100'
          }`}>
            <Brain className="w-16 h-16 text-white" />
            
            {/* Sparkle effects */}
            {animationPhase >= 1 && (
              <>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 sparkle-float" />
                <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-300 sparkle-float" style={{ animationDelay: '0.5s' }} />
                <Sparkles className="absolute top-1/2 -right-4 w-4 h-4 text-blue-300 sparkle-float" style={{ animationDelay: '1s' }} />
              </>
            )}
          </div>
        </div>

        {/* Brand name */}
        <div 
          className={`text-center transition-all duration-1000 ${
            showText 
              ? 'opacity-100 translate-y-0 text-reveal' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
            AI Chatbot
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="w-6 h-6 text-blue-300" />
            <span className="text-blue-300 text-lg font-medium">Intelligent Conversations</span>
          </div>
        </div>

        {/* Tagline */}
        <div 
          className={`text-center transition-all duration-1000 ${
            showTagline 
              ? 'opacity-100 translate-y-0 text-reveal' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-gray-300 text-lg max-w-md">
            Experience the future of AI-powered conversations with advanced machine learning and natural language processing.
          </p>
        </div>

        {/* Loading indicator */}
        {showTagline && (
          <div className="flex items-center space-x-2 text-blue-300">
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="text-sm ml-2">Initializing AI...</span>
          </div>
        )}
      </div>

      {/* Subtle background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
    </div>
  );
} 
import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useWebSpeechAPI } from '../hooks/useWebSpeechAPI';

interface SpeechToTextButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onTranscription,
  className = '',
  size = 'md',
  disabled = false
}) => {
  const [error, setError] = useState<string | null>(null);
  
  const {
    isSupported,
    isListening,
    startListening,
    stopListening
  } = useWebSpeechAPI(
    (result) => {
      if (result.isFinal && result.text) {
        onTranscription(result.text);
        setError(null);
      }
    },
    (errorMsg) => {
      setError(errorMsg);
    }
  );

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = () => {
    setError(null);

    if (isListening) {
      stopListening();
    } else {
      if (!isSupported) {
        setError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      startListening();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || !isSupported}
        className={`
          ${sizeClasses[size]}
          ${className}
          flex items-center justify-center
          border-2 rounded-full
          transition-all duration-200
          ${isListening 
            ? 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600' 
            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
          }
          ${disabled || !isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isListening ? 'animate-pulse' : ''}
        `}
        title={
          !isSupported 
            ? 'Speech recognition not supported'
            : isListening 
              ? 'Click to stop listening' 
              : 'Click to start voice input'
        }
      >
        {isListening ? (
          <Square className={iconSizeClasses[size]} />
        ) : (
          <Mic className={iconSizeClasses[size]} />
        )}
      </button>
      
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-red-100 border border-red-300 rounded-md text-xs text-red-700 whitespace-pre-wrap max-w-xs z-50">
          {error}
        </div>
      )}
    </div>
  );
};
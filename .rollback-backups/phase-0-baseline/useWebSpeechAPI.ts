import { useState, useCallback, useRef } from 'react';

export interface WebSpeechResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface UseWebSpeechReturn {
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  error: string | null;
}

export const useWebSpeechAPI = (
  onResult?: (result: WebSpeechResult) => void,
  onError?: (error: string) => void
): UseWebSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Check if Web Speech API is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Web Speech API not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    
    setError(null);
    setTranscript('');
    
    try {
      // @ts-ignore - WebKit prefixed API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        const fullTranscript = finalTranscript + interimTranscript;
        setTranscript(fullTranscript);
        
        if (finalTranscript && onResult) {
          onResult({
            text: finalTranscript.trim(),
            confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.9,
            isFinal: true
          });
        }
      };
      
      recognition.onerror = (event) => {
        const errorMsg = `Speech recognition error: ${event.error}`;
        setError(errorMsg);
        setIsListening(false);
        onError?.(errorMsg);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (err) {
      const errorMsg = `Failed to start speech recognition: ${err}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isSupported, onResult, onError]);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);
  
  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
    transcript,
    error
  };
};
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  mergeTranscriptWithOverlap, 
  cleanRepeatedWords, 
  sanitizeInterimTranscript 
} from '../utils/speechDeduplication';

// Declare types for Web Speech API SpeechRecognition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSecureOrigin, setIsSecureOrigin] = useState(true);
  const [antiRepeatEnabled, setAntiRepeatEnabled] = useState(true);
  const [duplicatesCount, setDuplicatesCount] = useState(0);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const lastProcessedIndexRef = useRef<number>(-1);
  const transcriptRef = useRef<string>('');
  const antiRepeatEnabledRef = useRef(antiRepeatEnabled);

  useEffect(() => {
    antiRepeatEnabledRef.current = antiRepeatEnabled;
  }, [antiRepeatEnabled]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttpsOrLocal =
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      setIsSecureOrigin(isHttpsOrLocal);

      const win = window as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        setIsSupported(true);
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          const newFinalPieces: string[] = [];

          // Process finalized results strictly once per session
          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            if (item.isFinal) {
              if (i > lastProcessedIndexRef.current) {
                lastProcessedIndexRef.current = i;
                newFinalPieces.push(item[0].transcript);
              }
            } else {
              currentInterim += item[0].transcript + ' ';
            }
          }

          if (newFinalPieces.length > 0) {
            const incomingChunk = newFinalPieces.join(' ');
            const { merged, removedOverlapCount } = mergeTranscriptWithOverlap(
              transcriptRef.current,
              incomingChunk,
              antiRepeatEnabledRef.current
            );
            transcriptRef.current = merged;
            setTranscript(merged);
            if (removedOverlapCount > 0) {
              setDuplicatesCount((prev) => prev + removedOverlapCount);
            }
          }

          const sanitizedInterim = sanitizeInterimTranscript(
            transcriptRef.current,
            currentInterim,
            antiRepeatEnabledRef.current
          );
          setInterimTranscript(sanitizedInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Permissão do microfone negada. Clique no cadeado do navegador para autorizar.');
            shouldListenRef.current = false;
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // Ignore benign no-speech timeout in continuous mode
          } else if (event.error === 'network') {
            setErrorMessage('Erro de conexão no reconhecimento de voz.');
          } else {
            setErrorMessage(`Erro no microfone: ${event.error}`);
          }
        };

        recognition.onend = () => {
          // Reset session index tracking for next recognition session to prevent index desync
          lastProcessedIndexRef.current = -1;

          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }

      return () => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }
      };
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setErrorMessage('Navegador incompatível. Recomendamos Google Chrome ou Microsoft Edge.');
      return;
    }

    try {
      setErrorMessage(null);
      shouldListenRef.current = true;
      lastProcessedIndexRef.current = -1;
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // already started or transitioning
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    lastProcessedIndexRef.current = -1;
    setDuplicatesCount(0);
  }, []);

  const setManualTranscript = useCallback((newText: string) => {
    transcriptRef.current = newText;
    setTranscript(newText);
  }, []);

  const optimizeTranscript = useCallback(() => {
    const { cleaned, removedCount } = cleanRepeatedWords(transcriptRef.current);
    transcriptRef.current = cleaned;
    setTranscript(cleaned);
    if (removedCount > 0) {
      setDuplicatesCount((prev) => prev + removedCount);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    errorMessage,
    isSecureOrigin,
    antiRepeatEnabled,
    setAntiRepeatEnabled,
    duplicatesCount,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript: setManualTranscript,
    optimizeTranscript,
  };
}

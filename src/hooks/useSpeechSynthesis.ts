import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisProps {
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onVoiceAutoSelect?: (voiceURI: string) => void;
}

/**
 * Normalizes language tags (pt-BR, pt_BR, pt, por-BRA, etc.)
 */
function isPortugueseVoice(v: SpeechSynthesisVoice): boolean {
  if (!v) return false;
  const lang = (v.lang || '').toLowerCase().replace('_', '-');
  const name = (v.name || '').toLowerCase();
  return (
    lang.startsWith('pt') ||
    lang.includes('por') ||
    name.includes('portugu') ||
    name.includes('brazil') ||
    name.includes('brasil')
  );
}

/**
 * Scores voices to find the closest match to ChatGPT's expressive,
 * natural and warm conversational voice in Portuguese.
 */
export function findBestVoiceForChatGpt(
  voices: SpeechSynthesisVoice[],
  preferredPersona: 'chatgpt-natural' | 'chatgpt-masculino' | 'padrao' = 'chatgpt-natural'
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Filter Portuguese voices first
  const ptVoices = voices.filter(isPortugueseVoice);
  const candidatePool = ptVoices.length > 0 ? ptVoices : voices;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const uri = (v.voiceURI || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    let score = 0;

    // pt-BR highest priority
    if (lang === 'pt-br') score += 40;
    else if (lang.startsWith('pt')) score += 20;

    // High quality Neural / Natural indicators (same neural models as ChatGPT)
    if (name.includes('natural') || uri.includes('natural')) score += 70;
    if (name.includes('neural') || uri.includes('neural')) score += 70;
    if (name.includes('online') || uri.includes('online')) score += 35;
    if (name.includes('enhanced') || name.includes('premium')) score += 50;

    // Microsoft Natural Brazilian voices (closest timbre and intonation to ChatGPT in pt-BR)
    if (name.includes('francisca')) {
      score += preferredPersona === 'chatgpt-masculino' ? 30 : 90;
    }
    if (name.includes('antonio')) {
      score += preferredPersona === 'chatgpt-masculino' ? 95 : 40;
    }
    if (name.includes('thalita')) {
      score += preferredPersona === 'chatgpt-masculino' ? 25 : 80;
    }

    // Google Natural / Neural pt-BR voices
    if (name.includes('google') && (lang === 'pt-br' || name.includes('brasil') || name.includes('português'))) {
      score += preferredPersona === 'chatgpt-masculino' ? 50 : 75;
    }

    // Apple Natural Brazilian voices
    if (name.includes('luciana')) score += preferredPersona === 'chatgpt-masculino' ? 20 : 60;
    if (name.includes('felipe')) score += preferredPersona === 'chatgpt-masculino' ? 70 : 30;
    if (name.includes('joana')) score += preferredPersona === 'chatgpt-masculino' ? 20 : 55;

    // Android network neural voices (e.g. pt-br-x-afs-network)
    if (uri.includes('network') || name.includes('network')) score += 55;

    // Penalize legacy robotic synthesizers
    if (name.includes('espeak') || uri.includes('espeak')) score -= 100;
    if (name.includes('desktop') && !name.includes('natural')) score -= 30;

    return score;
  };

  const sorted = [...candidatePool].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return sorted[0] || candidatePool[0] || null;
}

export function useSpeechSynthesis({ 
  rate = 1.05, 
  pitch = 1.02, 
  voiceURI = '',
  onVoiceAutoSelect 
}: UseSpeechSynthesisProps = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentVoiceURIRef = useRef(voiceURI);

  useEffect(() => {
    currentVoiceURIRef.current = voiceURI;
  }, [voiceURI]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const updateVoices = () => {
        try {
          const availableVoices = window.speechSynthesis.getVoices() || [];
          if (availableVoices.length === 0) return;

          setVoices(availableVoices);

          let targetVoice: SpeechSynthesisVoice | null = null;

          // 1. If voiceURI is provided and matches an existing voice
          if (currentVoiceURIRef.current) {
            targetVoice = availableVoices.find((v) => v.voiceURI === currentVoiceURIRef.current) || null;
          }

          // 2. Otherwise auto-select the best ChatGPT-like voice
          if (!targetVoice) {
            targetVoice = findBestVoiceForChatGpt(availableVoices, 'chatgpt-natural');
            if (targetVoice && onVoiceAutoSelect) {
              onVoiceAutoSelect(targetVoice.voiceURI);
            }
          }

          setSelectedVoice(targetVoice || availableVoices[0] || null);
        } catch (e) {
          console.warn('Error reading speechSynthesis voices:', e);
        }
      };

      // 1. Initial immediate attempt
      updateVoices();

      // 2. Browser event listener
      window.speechSynthesis.onvoiceschanged = updateVoices;

      // 3. Fallback active polling (essential for Chrome, Android & Safari where voices load asynchronously)
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        pollCount++;
        const currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices && currentVoices.length > 0) {
          updateVoices();
          clearInterval(pollInterval);
        } else if (pollCount > 25) {
          clearInterval(pollInterval);
        }
      }, 150);

      return () => {
        clearInterval(pollInterval);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [onVoiceAutoSelect]);

  // Sync selectedVoice when voiceURI prop changes
  useEffect(() => {
    if (voiceURI && voices.length > 0) {
      const match = voices.find((v) => v.voiceURI === voiceURI);
      if (match) {
        setSelectedVoice(match);
      }
    }
  }, [voiceURI, voices]);

  // Direct programmatic voice selector
  const selectVoiceByURI = useCallback((targetURI: string) => {
    if (!targetURI) return;
    const match = voices.find((v) => v.voiceURI === targetURI);
    if (match) {
      setSelectedVoice(match);
      if (onVoiceAutoSelect) {
        onVoiceAutoSelect(match.voiceURI);
      }
    }
  }, [voices, onVoiceAutoSelect]);

  const speak = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (!isSupported || !text || !text.trim()) return;

      try {
        window.speechSynthesis.cancel();

        // Clean text of markdown/formatting before speaking
        const cleanText = text
          .replace(/[*_#`~[\]]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utteranceRef.current = utterance;

        // Use selected natural voice or best ChatGPT match
        let voiceToUse = selectedVoice;
        if (!voiceToUse && voices.length > 0) {
          voiceToUse = findBestVoiceForChatGpt(voices, 'chatgpt-natural');
        }

        if (voiceToUse) {
          utterance.voice = voiceToUse;
          utterance.lang = voiceToUse.lang || 'pt-BR';
        } else {
          utterance.lang = 'pt-BR';
        }

        // ChatGPT parameters: slightly brisk (1.05) and warm pitch (1.02)
        utterance.rate = Math.max(0.6, Math.min(1.8, rate || 1.05));
        utterance.pitch = Math.max(0.6, Math.min(1.4, pitch || 1.02));

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          if (onEndCallback) onEndCallback();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        setIsSpeaking(false);
      }
    },
    [isSupported, selectedVoice, voices, rate, pitch]
  );

  const cancel = useCallback(() => {
    if (isSupported && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Select ChatGPT optimized voice persona
  const setChatGptPersona = useCallback(
    (persona: 'chatgpt-natural' | 'chatgpt-masculino' = 'chatgpt-natural') => {
      const currentList = voices.length > 0 ? voices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
      if (!currentList || currentList.length === 0) return null;

      const best = findBestVoiceForChatGpt(currentList, persona);
      if (best) {
        setSelectedVoice(best);
        if (onVoiceAutoSelect) {
          onVoiceAutoSelect(best.voiceURI);
        }
      }
      return best;
    },
    [voices, onVoiceAutoSelect]
  );

  return {
    isSupported,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    selectVoiceByURI,
    setChatGptPersona,
    speak,
    cancel,
  };
}

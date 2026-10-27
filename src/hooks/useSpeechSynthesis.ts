import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisProps {
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  onVoiceAutoSelect?: (voiceURI: string) => void;
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

  // Filter Portuguese voices
  const ptVoices = voices.filter(
    (v) => v.lang === 'pt-BR' || v.lang.startsWith('pt') || v.name.toLowerCase().includes('portuguese') || v.name.toLowerCase().includes('brasil')
  );
  const candidatePool = ptVoices.length > 0 ? ptVoices : voices;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const uri = v.voiceURI.toLowerCase();
    let score = 0;

    // pt-BR bonus
    if (v.lang === 'pt-BR') score += 30;
    else if (v.lang.startsWith('pt')) score += 15;

    // High quality Neural / Natural indicators (same tech behind ChatGPT voice models)
    if (name.includes('natural') || uri.includes('natural')) score += 60;
    if (name.includes('neural') || uri.includes('neural')) score += 60;
    if (name.includes('online') || uri.includes('online')) score += 30;
    if (name.includes('enhanced') || name.includes('premium')) score += 45;

    // Microsoft Natural Brazilian voices (closest timbre and intonation to ChatGPT in pt-BR)
    if (name.includes('francisca')) {
      score += preferredPersona === 'chatgpt-masculino' ? 30 : 80;
    }
    if (name.includes('antonio')) {
      score += preferredPersona === 'chatgpt-masculino' ? 85 : 40;
    }
    if (name.includes('thalita')) {
      score += preferredPersona === 'chatgpt-masculino' ? 25 : 70;
    }

    // Google Natural / Neural pt-BR voices
    if (name.includes('google') && (v.lang === 'pt-BR' || name.includes('brasil') || name.includes('português'))) {
      score += preferredPersona === 'chatgpt-masculino' ? 50 : 65;
    }

    // Apple Natural Brazilian voices
    if (name.includes('luciana')) score += preferredPersona === 'chatgpt-masculino' ? 20 : 55;
    if (name.includes('felipe')) score += preferredPersona === 'chatgpt-masculino' ? 65 : 30;
    if (name.includes('joana')) score += preferredPersona === 'chatgpt-masculino' ? 20 : 50;

    // Android network neural voices (e.g. pt-br-x-afs-network)
    if (uri.includes('network') || name.includes('network')) score += 45;

    // Heavy penalty for legacy robotic synthesizers
    if (name.includes('espeak') || uri.includes('espeak')) score -= 80;
    if (name.includes('desktop') && !name.includes('natural')) score -= 25;

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
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length === 0) return;
        setVoices(availableVoices);

        let targetVoice: SpeechSynthesisVoice | null = null;

        // If a specific voiceURI is saved, try to find it
        if (currentVoiceURIRef.current) {
          targetVoice = availableVoices.find((v) => v.voiceURI === currentVoiceURIRef.current) || null;
        }

        // Otherwise pick the best natural voice matching ChatGPT's conversational tone
        if (!targetVoice) {
          targetVoice = findBestVoiceForChatGpt(availableVoices, 'chatgpt-natural');
          if (targetVoice && onVoiceAutoSelect) {
            onVoiceAutoSelect(targetVoice.voiceURI);
          }
        }

        setSelectedVoice(targetVoice || availableVoices[0] || null);
      };

      updateVoices();

      // Many browsers load voices asynchronously
      window.speechSynthesis.onvoiceschanged = updateVoices;
      const timer = setTimeout(updateVoices, 250);

      return () => {
        clearTimeout(timer);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [onVoiceAutoSelect]);

  // Update selectedVoice when voiceURI prop changes
  useEffect(() => {
    if (voiceURI && voices.length > 0) {
      const match = voices.find((v) => v.voiceURI === voiceURI);
      if (match) {
        setSelectedVoice(match);
      }
    }
  }, [voiceURI, voices]);

  const speak = useCallback(
    (text: string, onEndCallback?: () => void) => {
      if (!isSupported || !text.trim()) return;

      window.speechSynthesis.cancel();

      // Clean text of formatting artifacts before speaking
      const cleanText = text
        .replace(/[*_#`~[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

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

      // ChatGPT parameters: slightly brisk (1.05) and warm, pleasant pitch (1.02)
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
    },
    [isSupported, selectedVoice, voices, rate, pitch]
  );

  const cancel = useCallback(() => {
    if (isSupported && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Select ChatGPT optimized voice persona
  const setChatGptPersona = useCallback(
    (persona: 'chatgpt-natural' | 'chatgpt-masculino' = 'chatgpt-natural') => {
      if (voices.length === 0) return null;
      const best = findBestVoiceForChatGpt(voices, persona);
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
    setChatGptPersona,
    speak,
    cancel,
  };
}

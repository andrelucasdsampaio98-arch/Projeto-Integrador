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
export function isPortugueseVoice(v: SpeechSynthesisVoice): boolean {
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

export type MobileVoiceType = 'mobile-google' | 'mobile-apple' | 'mobile-padrao';

export interface MobileVoiceItem {
  id: MobileVoiceType;
  title: string;
  badge: string;
  platform: string;
  description: string;
  samplePhrase: string;
  matchedVoice: SpeechSynthesisVoice | null;
}

/**
 * Resolves the 3 standard mobile device voices:
 * 1. Google Voz (Android / Chrome Mobile Neural)
 * 2. Apple / Siri (iPhone / iPad / Safari iOS)
 * 3. Voz Nativa do Smartphone (Samsung / Local Offline)
 */
export function getMobileVoices(voices: SpeechSynthesisVoice[]): MobileVoiceItem[] {
  const ptVoices = voices.filter(isPortugueseVoice);
  const pool = ptVoices.length > 0 ? ptVoices : voices;

  // 1. Google Voz (Android)
  const googleVoice = pool.find((v) => {
    const name = v.name.toLowerCase();
    const uri = (v.voiceURI || '').toLowerCase();
    return (
      name.includes('google') ||
      uri.includes('google') ||
      uri.includes('network') ||
      uri.includes('afs') ||
      name.includes('android')
    );
  }) || pool.find(v => (v.lang || '').toLowerCase().includes('pt-br')) || pool[0] || null;

  // 2. Apple / Siri (iOS)
  const appleVoice = pool.find((v) => {
    const name = v.name.toLowerCase();
    const uri = (v.voiceURI || '').toLowerCase();
    return (
      name.includes('luciana') ||
      name.includes('felipe') ||
      name.includes('joana') ||
      name.includes('apple') ||
      uri.includes('apple') ||
      name.includes('siri')
    );
  }) || pool.find(v => v !== googleVoice) || pool[0] || null;

  // 3. Voz Nativa do Celular (Samsung / Local do Smartphone)
  const nativeMobileVoice = pool.find((v) => {
    const name = v.name.toLowerCase();
    const uri = (v.voiceURI || '').toLowerCase();
    return (
      name.includes('samsung') ||
      name.includes('local') ||
      uri.includes('local') ||
      v.default ||
      (v !== googleVoice && v !== appleVoice)
    );
  }) || pool.find(v => v.default) || pool[1] || pool[0] || null;

  return [
    {
      id: 'mobile-google',
      title: 'Google Voz (Android)',
      badge: 'Android • Neural',
      platform: 'Smartphones Android',
      description: googleVoice ? googleVoice.name : 'Voz Neural do Google para Android',
      samplePhrase: 'Olá! Voz Google para celulares Android selecionada com sucesso.',
      matchedVoice: googleVoice,
    },
    {
      id: 'mobile-apple',
      title: 'Apple / Siri (iOS)',
      badge: 'iPhone • iPad',
      platform: 'Dispositivos Apple iOS',
      description: appleVoice ? appleVoice.name : 'Voz Luciana / Siri para iPhone e iPad',
      samplePhrase: 'Olá! Voz Apple para iPhone e iPad selecionada com sucesso.',
      matchedVoice: appleVoice,
    },
    {
      id: 'mobile-padrao',
      title: 'Voz Nativa do Celular',
      badge: 'Offline • Sistema',
      platform: 'Samsung / Padrão do Aparelho',
      description: nativeMobileVoice ? nativeMobileVoice.name : 'Sintetizador nativo local do smartphone',
      samplePhrase: 'Olá! Voz nativa do aparelho selecionada com sucesso.',
      matchedVoice: nativeMobileVoice,
    },
  ];
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

    // High quality Neural / Natural indicators (same neural models as modern conversational AI)
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
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentVoiceURIRef = useRef(voiceURI);
  const onVoiceAutoSelectRef = useRef(onVoiceAutoSelect);
  const autoSelectedOnceRef = useRef(false);
  const resumeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    currentVoiceURIRef.current = voiceURI;
  }, [voiceURI]);

  useEffect(() => {
    onVoiceAutoSelectRef.current = onVoiceAutoSelect;
  }, [onVoiceAutoSelect]);

  // Load and sync voices
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
            if (targetVoice && !autoSelectedOnceRef.current) {
              autoSelectedOnceRef.current = true;
              currentVoiceURIRef.current = targetVoice.voiceURI;
              onVoiceAutoSelectRef.current?.(targetVoice.voiceURI);
            }
          }

          setSelectedVoice((prev) => {
            const nextVoice = targetVoice || availableVoices[0] || null;
            return prev?.voiceURI === nextVoice?.voiceURI ? prev : nextVoice;
          });
        } catch (e) {
          console.warn('Error reading speechSynthesis voices:', e);
        }
      };

      // 1. Initial attempt
      updateVoices();

      // 2. Browser event listener
      window.speechSynthesis.onvoiceschanged = updateVoices;
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      }

      // 3. Fallback active polling (essential for Chrome, Android & Safari where voices load asynchronously)
      let pollCount = 0;
      const pollInterval = window.setInterval(() => {
        pollCount++;
        const currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices && currentVoices.length > 0) {
          updateVoices();
          window.clearInterval(pollInterval);
        } else if (pollCount > 30) {
          window.clearInterval(pollInterval);
        }
      }, 100);

      return () => {
        window.clearInterval(pollInterval);
        if (typeof window.speechSynthesis.removeEventListener === 'function') {
          window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        }
        if (resumeIntervalRef.current) {
          window.clearInterval(resumeIntervalRef.current);
        }
      };
    }
  }, []);

  // Sync selectedVoice when voiceURI prop changes
  useEffect(() => {
    if (voiceURI && voices.length > 0) {
      const match = voices.find((v) => v.voiceURI === voiceURI);
      if (match) {
        setSelectedVoice((prev) => (prev?.voiceURI === match.voiceURI ? prev : match));
      }
    }
  }, [voiceURI, voices]);

  // Programmatic voice selector by URI
  const selectVoiceByURI = useCallback((targetURI: string) => {
    if (!targetURI) return;
    currentVoiceURIRef.current = targetURI;
    const currentList = voices.length > 0 
      ? voices 
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    const match = currentList.find((v) => v.voiceURI === targetURI);
    if (match) {
      setSelectedVoice(match);
      onVoiceAutoSelectRef.current?.(match.voiceURI);
    }
  }, [voices]);

  // Select one of the 3 Mobile Device Voices
  const selectMobileVoice = useCallback((mobileType: MobileVoiceType): SpeechSynthesisVoice | null => {
    const currentList = voices.length > 0 
      ? voices 
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    if (!currentList || currentList.length === 0) return null;

    const mobileList = getMobileVoices(currentList);
    const chosen = mobileList.find(m => m.id === mobileType);
    if (chosen && chosen.matchedVoice) {
      setSelectedVoice(chosen.matchedVoice);
      currentVoiceURIRef.current = chosen.matchedVoice.voiceURI;
      onVoiceAutoSelectRef.current?.(chosen.matchedVoice.voiceURI);
      return chosen.matchedVoice;
    }
    return null;
  }, [voices]);

  // Select ChatGPT optimized voice persona
  const setChatGptPersona = useCallback(
    (persona: 'chatgpt-natural' | 'chatgpt-masculino' = 'chatgpt-natural'): SpeechSynthesisVoice | null => {
      const currentList = voices.length > 0 
        ? voices 
        : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
      if (!currentList || currentList.length === 0) return null;

      const best = findBestVoiceForChatGpt(currentList, persona);
      if (best) {
        setSelectedVoice(best);
        currentVoiceURIRef.current = best.voiceURI;
        onVoiceAutoSelectRef.current?.(best.voiceURI);
      }
      return best;
    },
    [voices]
  );

  const cancel = useCallback(() => {
    if (isSupported && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        delete (window as any).__activeSpeechUtterance;
      } catch {}
      if (resumeIntervalRef.current) {
        window.clearInterval(resumeIntervalRef.current);
        resumeIntervalRef.current = null;
      }
      setIsSpeaking(false);
      setSpeakingText(null);
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, onEndCallback?: () => void, overrideVoiceURI?: string) => {
      if (!isSupported || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!text || !text.trim()) return;

      try {
        // Clear any previous interval
        if (resumeIntervalRef.current) {
          window.clearInterval(resumeIntervalRef.current);
          resumeIntervalRef.current = null;
        }

        // Clean text of markdown/formatting before speaking
        const cleanText = text
          .replace(/[*_#`~[\]]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!cleanText) return;

        // Ensure available voices are retrieved even if state was delayed
        const freshVoices = window.speechSynthesis.getVoices();
        const availableVoices = freshVoices && freshVoices.length > 0 ? freshVoices : voices;

        // Target voice resolution order:
        // 1. Explicit overrideVoiceURI passed directly to speak()
        // 2. Ref from most recent user selection
        // 3. React selectedVoice state
        // 4. Best ChatGPT match
        const targetURI = overrideVoiceURI || currentVoiceURIRef.current || selectedVoice?.voiceURI;
        let voiceToUse: SpeechSynthesisVoice | null = null;

        if (targetURI && availableVoices.length > 0) {
          voiceToUse = availableVoices.find((v) => v.voiceURI === targetURI) || null;
        }
        if (!voiceToUse && selectedVoice) {
          voiceToUse = selectedVoice;
        }
        if (!voiceToUse && availableVoices.length > 0) {
          voiceToUse = findBestVoiceForChatGpt(availableVoices, 'chatgpt-natural');
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utteranceRef.current = utterance;

        if (voiceToUse) {
          utterance.voice = voiceToUse;
          utterance.lang = (voiceToUse.lang || 'pt-BR').replace('_', '-');
        } else {
          utterance.lang = 'pt-BR';
        }

        // Explicit full volume
        utterance.volume = 1.0;

        // ChatGPT parameters: natural conversational speed (1.05) and warm pitch (1.02)
        utterance.rate = Math.max(0.6, Math.min(1.8, rate || 1.05));
        utterance.pitch = Math.max(0.6, Math.min(1.4, pitch || 1.02));

        // Keep strong reference on window to prevent Garbage Collection in Chromium
        (window as any).__activeSpeechUtterance = utterance;

        const cleanup = () => {
          setIsSpeaking(false);
          setSpeakingText(null);
          delete (window as any).__activeSpeechUtterance;
          if (resumeIntervalRef.current) {
            window.clearInterval(resumeIntervalRef.current);
            resumeIntervalRef.current = null;
          }
        };

        utterance.onstart = () => {
          setIsSpeaking(true);
          setSpeakingText(cleanText);
        };

        utterance.onend = () => {
          cleanup();
          if (onEndCallback) onEndCallback();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis utterance error:', e);
          cleanup();
        };

        // Reset and unpause speech synthesis engine
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
        } catch {}

        // Speak utterance
        window.speechSynthesis.speak(utterance);

        // Immediate unpause for Chromium iframe/background policy
        try {
          window.speechSynthesis.resume();
        } catch {}

        // Anti-freeze heartbeat: Chromium has a known 15s pause bug during continuous speech
        resumeIntervalRef.current = window.setInterval(() => {
          if (typeof window === 'undefined' || !window.speechSynthesis) {
            if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
            return;
          }
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            cleanup();
          }
        }, 200);

      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        setIsSpeaking(false);
        setSpeakingText(null);
      }
    },
    [isSupported, selectedVoice, voices, rate, pitch]
  );

  return {
    isSupported,
    isSpeaking,
    speakingText,
    voices,
    selectedVoice,
    setSelectedVoice,
    selectVoiceByURI,
    selectMobileVoice,
    setChatGptPersona,
    speak,
    cancel,
  };
}

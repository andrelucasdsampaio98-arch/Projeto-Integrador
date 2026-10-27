import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Send, 
  Trash2, 
  ArrowUpRight, 
  Smartphone,
  Sliders,
  Bot,
  RefreshCw,
  MessageSquare,
  GraduationCap,
  Zap,
  Mic
} from 'lucide-react';
import { AppSettings, VoiceSpeechStyle } from '../types';
import { getMobileVoices } from '../hooks/useSpeechSynthesis';

interface VoiceSpeechStyleOption {
  id: VoiceSpeechStyle;
  name: string;
  badge: string;
  description: string;
  samplePhrase: string;
  rate: number;
  pitch: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const VOICE_SPEECH_STYLES: VoiceSpeechStyleOption[] = [
  {
    id: 'conversacional',
    name: 'Natural & Diálogo',
    badge: '1.05x • Amigável',
    description: 'Fluida e natural para conversar no dia a dia com colegas.',
    samplePhrase: 'Olá! Este é o estilo de fala conversacional, natural e fluido para o dia a dia.',
    rate: 1.05,
    pitch: 1.02,
    icon: MessageSquare,
  },
  {
    id: 'didatica',
    name: 'Sala de Aula & Didática',
    badge: '0.90x • Articulada',
    description: 'Ritmo pausado e dicção nítida para o professor e a turma ouvirem com máxima clareza.',
    samplePhrase: 'Olá professor! Este é o estilo didático, mais pausado para facilitar a compreensão em sala de aula.',
    rate: 0.90,
    pitch: 1.00,
    icon: GraduationCap,
  },
  {
    id: 'rapida',
    name: 'Ágil & Prática',
    badge: '1.20x • Dinâmica',
    description: 'Cadência acelerada para respostas curtas, código e atividades em laboratório.',
    samplePhrase: 'Olá! Estilo ágil ativado para respostas rápidas e práticas.',
    rate: 1.20,
    pitch: 1.00,
    icon: Zap,
  },
  {
    id: 'enfase',
    name: 'Ênfase & Apresentação',
    badge: '0.95x • Tom Marcante',
    description: 'Projeção de voz destacada para responder chamada, dúvidas perante a turma ou seminários.',
    samplePhrase: 'Atenção turma! Este é o estilo com ênfase vocal para apresentações e perguntas em público.',
    rate: 0.95,
    pitch: 1.10,
    icon: Mic,
  },
];

interface FalarPorMimProps {
  speak: (text: string, onEndCallback?: () => void, overrideVoiceURI?: string) => void;
  isSpeaking: boolean;
  cancelSpeak: () => void;
  settings: AppSettings;
  voices?: SpeechSynthesisVoice[];
  selectedVoice?: SpeechSynthesisVoice | null;
  onSelectVoice?: (voiceURI: string) => void;
  onUpdateSpeechStyle?: (style: VoiceSpeechStyle, rate: number, pitch: number) => void;
}

export const FalarPorMim: React.FC<FalarPorMimProps> = ({
  speak,
  isSpeaking,
  cancelSpeak,
  settings,
  voices = [],
  selectedVoice,
  onSelectVoice,
  onUpdateSpeechStyle,
}) => {
  const [text, setText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [history, setHistory] = useState<string[]>([
    'Olá! Eu sou surdo(a). Podemos nos comunicar por texto aqui.',
    'Professor, tenho uma dúvida no exercício de programação.',
    'Obrigado pela explicação!',
  ]);

  const handleSpeak = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    speak(textToSpeak);

    // Save to history (avoid duplicates at top)
    setHistory((prev) => {
      const filtered = prev.filter((item) => item !== textToSpeak);
      return [textToSpeak, ...filtered].slice(0, 15);
    });
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickChips = [
    'Preciso de ajuda',
    'Pode repetir?',
    'Entendi, obrigado!',
    'Onde salvo o arquivo?',
    'Meu código deu erro',
    'Posso ir ao banheiro?',
  ];

  // Filter Portuguese voices
  const ptVoices = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();
    return (
      lang.startsWith('pt') ||
      lang.includes('por') ||
      name.includes('portugu') ||
      name.includes('brazil') ||
      name.includes('brasil')
    );
  });

  const displayVoices = showAllVoices || ptVoices.length === 0 ? voices : ptVoices;

  const currentVoiceURI = selectedVoice?.voiceURI || settings.selectedVoiceURI || (voices[0]?.voiceURI ?? '');
  const mobileVoices = getMobileVoices(voices);

  return (
    <div className="space-y-6">
      {/* FULLSCREEN DISPLAY OVERLAY */}
      {isFullscreen && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 transition-all ${
            settings.contrastTheme === 'amarelo-preto'
              ? 'bg-black text-yellow-300'
              : 'bg-white text-black'
          }`}
        >
          {/* Top Bar inside Fullscreen */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-slate-100 text-black border border-slate-300">
                Modo Apresentação em Tela Cheia
              </span>
              <span className="text-xs text-slate-600 hidden sm:inline font-medium">
                Mostre esta tela para o professor ou colega
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* 180° Flip Button for showing across desk */}
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isFlipped
                    ? 'bg-black text-white border-black'
                    : 'bg-slate-100 text-black border-slate-300 hover:bg-slate-200'
                }`}
                title="Girar texto em 180° para quem está na sua frente ler facilmente"
              >
                <Smartphone className="h-4 w-4" />
                {isFlipped ? 'Girar Normal' : 'Girar 180° (Mesa)'}
              </button>

              <button
                onClick={() => handleSpeak(text)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-xs transition shadow-xs"
              >
                <Volume2 className="h-4 w-4 fill-stone-900" />
                Falar em Voz Alta
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 transition"
                title="Fechar Tela Cheia"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Central Giant Text display */}
          <div
            className={`flex-1 flex items-center justify-center text-center p-4 transition-transform duration-300 ${
              isFlipped ? 'rotate-180' : ''
            }`}
          >
            <p
              className={`font-black tracking-tight leading-tight select-all max-w-5xl text-black ${
                settings.fontSize === 'gigante'
                  ? 'text-5xl sm:text-7xl lg:text-8xl'
                  : settings.fontSize === 'grande'
                  ? 'text-4xl sm:text-6xl lg:text-7xl'
                  : 'text-3xl sm:text-5xl lg:text-6xl'
              }`}
            >
              {text || 'Digite uma frase para exibir aqui em tamanho gigante.'}
            </p>
          </div>

          {/* Bottom Bar inside Fullscreen */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-600">
            <span>Toque na tela ou use a tecla ESC para sair</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-black hover:underline font-black"
            >
              Voltar à digitação
            </button>
          </div>
        </div>
      )}

      {/* REGULAR VIEW */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
              Falar por mim
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-950 font-extrabold border border-orange-200">
                Voz Natural pt-BR
              </span>
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Digite o que deseja comunicar. O aparelho falará com voz natural e expressiva e você pode exibir em tela cheia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-800 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition border border-stone-300"
            >
              <Maximize2 className="h-4 w-4" />
              Tela Cheia
            </button>

            {isSpeaking ? (
              <button
                onClick={cancelSpeak}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-xs"
              >
                <VolumeX className="h-4 w-4" />
                Parar Voz
              </button>
            ) : (
              <button
                onClick={() => handleSpeak(text)}
                disabled={!text.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-xs transition shadow-xs disabled:opacity-40 disabled:pointer-events-none"
              >
                <Volume2 className="h-4 w-4" />
                Falar Agora
              </button>
            )}
          </div>
        </div>

        {/* VOICE SELECTOR CARD & SPEECH STYLES */}
        <div className="p-4 sm:p-5 rounded-2xl bg-orange-50 border-2 border-orange-200/90 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-300 text-stone-900 font-black border border-orange-400 shrink-0 shadow-xs">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-stone-950 text-sm">Voz e Estilos de Fala:</span>
                  <span className="text-[11px] font-extrabold bg-orange-200 text-stone-900 px-2.5 py-0.5 rounded-full border border-orange-300">
                    {selectedVoice ? selectedVoice.name : 'Voz do Sistema'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5 rounded">
                    {settings.voiceRate ? settings.voiceRate.toFixed(2) : '1.05'}x
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                  Escolha a voz instalada e selecione o estilo de entonação para sala de aula ou laboratório.
                </p>
              </div>
            </div>

            {/* Quick Test / Stop Button */}
            {isSpeaking ? (
              <button
                type="button"
                onClick={cancelSpeak}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-2xs animate-pulse cursor-pointer"
                title="Parar reprodução de voz"
              >
                <VolumeX className="h-4 w-4" />
                <span>Parar Áudio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => speak('Olá! Esta é a voz configurada para falar por você com máxima clareza e naturalidade.', undefined, currentVoiceURI)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 font-black text-xs transition border border-orange-400 shadow-2xs cursor-pointer"
                title="Testar como soa a voz selecionada"
              >
                <Volume2 className="h-4 w-4" />
                <span>Ouvir Teste Geral</span>
              </button>
            )}
          </div>

          {/* Active Speaking Banner */}
          {isSpeaking && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-200/90 border border-orange-300 text-stone-950 text-xs font-bold shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600"></span>
                </span>
                <span>Reproduzindo fala agora no alto-falante: {selectedVoice?.name || 'Voz ativa'}</span>
              </div>
              <button
                type="button"
                onClick={cancelSpeak}
                className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[11px] font-black hover:bg-stone-800 transition cursor-pointer"
              >
                Silenciar
              </button>
            </div>
          )}

          {/* 3 VOZES PARA DISPOSITIVOS MOBILE */}
          <div className="space-y-2 pt-2 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-orange-600" />
                3 Vozes para Dispositivos Mobile (Celular & Tablet)
              </span>
              <span className="text-[10px] text-stone-600 font-bold">
                Toque para alternar e ouvir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {mobileVoices.map((mv) => {
                const isVoiceActive = currentVoiceURI === mv.matchedVoice?.voiceURI;
                return (
                  <button
                    key={mv.id}
                    type="button"
                    onClick={() => {
                      if (mv.matchedVoice && onSelectVoice) {
                        onSelectVoice(mv.matchedVoice.voiceURI);
                      }
                      speak(mv.samplePhrase, undefined, mv.matchedVoice?.voiceURI);
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between gap-1.5 cursor-pointer shadow-2xs ${
                      isVoiceActive
                        ? 'bg-orange-200/90 border-orange-500 ring-2 ring-orange-400'
                        : 'bg-white border-orange-200 hover:border-orange-300 hover:bg-orange-100/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1 rounded-lg ${isVoiceActive ? 'bg-orange-400 text-stone-950 font-black' : 'bg-orange-100 text-stone-800'}`}>
                          <Smartphone className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <strong className="block text-xs font-black text-stone-950">
                            {mv.title}
                          </strong>
                          <span className="text-[9px] font-bold text-stone-500">
                            {mv.badge}
                          </span>
                        </div>
                      </div>

                      {isVoiceActive ? (
                        <span className="text-[9px] font-black uppercase bg-orange-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <Check className="h-2.5 w-2.5" /> Ativo
                        </span>
                      ) : (
                        <span className="text-orange-700 hover:underline flex items-center gap-0.5 shrink-0 text-xs">
                          <Volume2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-stone-600 truncate font-medium" title={mv.description}>
                      {mv.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Dropdown */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label htmlFor="voice-select-dropdown" className="text-xs font-black text-stone-900 flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5 text-orange-600" />
                <span>Todas as Vozes do Dispositivo:</span>
              </label>

              {voices.length > ptVoices.length && ptVoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllVoices(!showAllVoices)}
                  className="text-[11px] text-stone-600 hover:text-black font-bold underline text-left sm:text-right cursor-pointer"
                >
                  {showAllVoices ? 'Mostrar apenas vozes em Português' : `Ver todas as vozes do sistema (${voices.length})`}
                </button>
              )}
            </div>

            {displayVoices.length > 0 ? (
              <div className="flex gap-2 items-center">
                <select
                  id="voice-select-dropdown"
                  value={currentVoiceURI}
                  onChange={(e) => {
                    const newURI = e.target.value;
                    if (onSelectVoice) {
                      onSelectVoice(newURI);
                    }
                  }}
                  className="flex-1 p-2.5 rounded-xl bg-white border-2 border-orange-300 text-stone-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-2xs cursor-pointer"
                >
                  {displayVoices.map((v, idx) => {
                    const isNeural = 
                      v.name.toLowerCase().includes('natural') || 
                      v.name.toLowerCase().includes('neural') ||
                      v.name.toLowerCase().includes('francisca') ||
                      v.name.toLowerCase().includes('antonio');
                    return (
                      <option key={`${v.voiceURI}-${idx}`} value={v.voiceURI}>
                        {isNeural ? '✨ ' : ''}{v.name} ({v.lang})
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    speak('Olá! Testando a voz selecionada agora.', undefined, currentVoiceURI);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 font-black text-xs transition border border-orange-400 shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                  title="Testar a voz atualmente selecionada no seletor"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Testar</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-orange-300 text-xs flex items-center justify-between gap-2">
                <span className="text-stone-700 font-medium">
                  Carregando vozes disponíveis no navegador...
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.getVoices();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-200 text-stone-900 font-bold flex items-center gap-1 hover:bg-orange-300 transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar Lista
                </button>
              </div>
            )}
          </div>

          {/* NOVO: ESTILOS DE FALA E ENTONAÇÃO (SUBSTITUI PREDEFINIÇÕES FEMININA/MASCULINA) */}
          <div className="space-y-2 pt-2 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-orange-600" />
                Estilos de Fala e Entonação
              </span>
              <span className="text-[10px] text-stone-600 font-bold">
                Clique para ativar e ouvir o estilo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICE_SPEECH_STYLES.map((style) => {
                const Icon = style.icon;
                const isActive = (settings.voiceStyle || 'conversacional') === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      if (onUpdateSpeechStyle) {
                        onUpdateSpeechStyle(style.id, style.rate, style.pitch);
                      }
                      speak(style.samplePhrase, undefined, currentVoiceURI);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-orange-200/80 border-orange-500 ring-2 ring-orange-400'
                        : 'bg-white border-orange-200 hover:border-orange-300 hover:bg-orange-100/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-orange-400 text-stone-950 font-black' : 'bg-orange-100 text-stone-800'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <strong className="block text-xs font-black text-stone-950">
                            {style.name}
                          </strong>
                          <span className="text-[10px] font-bold text-stone-600">
                            {style.badge}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isActive && (
                          <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white px-1.5 py-0.5 rounded">
                            <Check className="h-3 w-3" /> Ativo
                          </span>
                        )}
                        <span className="text-[11px] text-orange-800 font-extrabold flex items-center gap-0.5 hover:underline">
                          <Volume2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-700 leading-snug">
                      {style.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSpeak(text);
              }
            }}
            placeholder="Digite o que você quer falar..."
            rows={4}
            className={`w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl p-4 text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black placeholder:text-slate-400 transition resize-none leading-relaxed font-medium ${
              settings.fontSize === 'gigante' ? 'text-2xl' : settings.fontSize === 'grande' ? 'text-xl' : 'text-base'
            }`}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-slate-500">
            <span>{text.length} caracteres</span>
            {text && (
              <button
                onClick={() => setText('')}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-black"
                title="Limpar texto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
            Frases rápidas para conversa no laboratório:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setText(chip);
                  handleSpeak(chip);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-orange-100 text-stone-800 hover:text-stone-950 text-xs font-bold transition border border-stone-300 hover:border-orange-300 flex items-center gap-1 shadow-2xs"
              >
                <span>{chip}</span>
                <Volume2 className="h-3 w-3 text-stone-500" />
              </button>
            ))}
          </div>
        </div>

        {/* History of recent spoken phrases */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Histórico de falas recentes:
              </span>
              <button
                onClick={() => setHistory([])}
                className="text-[11px] text-slate-500 hover:text-rose-600 font-bold transition"
              >
                Limpar histórico
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((phrase, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200 text-xs"
                >
                  <span className="text-black font-semibold truncate flex-1">
                    {phrase}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSpeak(phrase)}
                      className="p-1.5 rounded-lg bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 transition"
                      title="Falar novamente"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(phrase)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition border border-slate-300"
                      title="Copiar texto"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

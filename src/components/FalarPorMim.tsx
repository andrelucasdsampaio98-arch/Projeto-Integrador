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
  Bot
} from 'lucide-react';
import { AppSettings } from '../types';

interface FalarPorMimProps {
  speak: (text: string) => void;
  isSpeaking: boolean;
  cancelSpeak: () => void;
  settings: AppSettings;
  voices?: SpeechSynthesisVoice[];
  selectedVoice?: SpeechSynthesisVoice | null;
  onSelectVoice?: (voiceURI: string) => void;
  onSelectChatGptPersona?: (persona: 'chatgpt-natural' | 'chatgpt-masculino') => void;
}

export const FalarPorMim: React.FC<FalarPorMimProps> = ({
  speak,
  isSpeaking,
  cancelSpeak,
  settings,
  voices = [],
  selectedVoice,
  onSelectVoice,
  onSelectChatGptPersona,
}) => {
  const [text, setText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
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

        {/* VOICE PERSONA BAR - ESTILO CHATGPT */}
        <div className="p-3 sm:p-4 rounded-2xl bg-orange-50/90 border border-orange-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-300 text-stone-900 font-black border border-orange-400/80 shrink-0 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-stone-950 text-sm">Voz Estilo ChatGPT:</span>
                <span className="text-[11px] font-extrabold bg-orange-200 text-stone-900 px-2.5 py-0.5 rounded-full border border-orange-300">
                  {selectedVoice ? selectedVoice.name : 'Voz Neural Natural pt-BR'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
                  {settings.voiceRate ? settings.voiceRate.toFixed(2) : '1.05'}x Fluida
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                Entonação humana e conversacional calibrada com timbres neurais modernos de alta fidelidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSelectChatGptPersona && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectChatGptPersona('chatgpt-natural')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-stone-900 border border-orange-300 text-xs font-bold transition shadow-2xs"
                  title="Voz natural feminina estilo ChatGPT (Francisca / Google Neural)"
                >
                  Feminina (Francisca)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectChatGptPersona('chatgpt-masculino')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-stone-900 border border-orange-300 text-xs font-bold transition shadow-2xs"
                  title="Voz natural masculina estilo ChatGPT (Antonio / Felipe)"
                >
                  Masculina (Antonio)
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => speak('Olá! Esta é a voz configurada no estilo ChatGPT para falar por mim com máxima clareza e naturalidade.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 font-black text-xs transition border border-orange-400 shadow-2xs"
              title="Testar a pronúncia da voz agora"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Testar Voz</span>
            </button>
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

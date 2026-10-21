import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  ShieldCheck, 
  Wand2, 
  Settings2,
  Volume2,
  FileText
} from 'lucide-react';
import { AppSettings } from '../types';
import { cleanRepeatedWords } from '../utils/speechDeduplication';

interface OuvirLegendarProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  errorMessage: string | null;
  isSupported: boolean;
  isSecureOrigin: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  settings: AppSettings;
  antiRepeatEnabled?: boolean;
  setAntiRepeatEnabled?: (enabled: boolean) => void;
  duplicatesCount?: number;
  optimizeTranscript?: () => void;
}

export const OuvirLegendar: React.FC<OuvirLegendarProps> = ({
  isListening,
  transcript,
  interimTranscript,
  errorMessage,
  isSupported,
  isSecureOrigin,
  startListening,
  stopListening,
  clearTranscript,
  settings,
  antiRepeatEnabled = true,
  setAntiRepeatEnabled,
  duplicatesCount = 0,
  optimizeTranscript,
}) => {
  const [copied, setCopied] = useState(false);
  const [justCleaned, setJustCleaned] = useState(false);
  const [showAntiRepeatInfo, setShowAntiRepeatInfo] = useState(false);

  // Avoid boundary repeats between finalized and interim text
  const fullText = transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '');

  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualOptimize = () => {
    if (optimizeTranscript) {
      optimizeTranscript();
      setJustCleaned(true);
      setTimeout(() => setJustCleaned(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Browser / Insecure Origin Compatibility Banner */}
      {!isSupported && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="text-xs leading-relaxed space-y-1">
            <strong className="block text-sm text-amber-200">Reconhecimento de Voz não suportado neste navegador</strong>
            <p>
              A função de <strong>Ouvir e Legendar</strong> utiliza a API Web Speech nativa, presente no <strong>Google Chrome</strong> e <strong>Microsoft Edge</strong> no computador, notebook e Android.
            </p>
            <p className="text-amber-400/80">
              Caso esteja em um navegador como Firefox ou Safari no iOS, utilize a aba <em>Falar por mim</em> ou instale o app pelo Chrome.
            </p>
          </div>
        </div>
      )}

      {!isSecureOrigin && isSupported && (
        <div className="rounded-2xl bg-sky-950/60 border border-sky-500/30 p-4 flex items-start gap-3 text-sky-200">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-sky-400" />
          <div className="text-xs leading-relaxed space-y-1">
            <strong className="block text-sm text-sky-100">Dica de Acesso por Endereço IP na Escola</strong>
            <p>
              Você está acessando por HTTP na rede local. Os navegadores modernos exigem conexão segura (HTTPS ou localhost) para liberar o microfone.
            </p>
            <p className="text-sky-300/80">
              Para liberar o microfone no Chrome via IP: acesse <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> e adicione o endereço IP do servidor. Ou use o link oficial publicado HTTPS.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Caption Board */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-black flex items-center gap-2">
                Ouvir e legendar
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-black font-extrabold border border-slate-300">
                  Legenda Gigante em Tempo Real
                </span>
              </h2>

              {/* Anti-Repetition Status Pill */}
              <button
                onClick={() => setAntiRepeatEnabled && setAntiRepeatEnabled(!antiRepeatEnabled)}
                title="Clique para alternar o Filtro Anti-Repetição"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                  antiRepeatEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className={`h-3.5 w-3.5 ${antiRepeatEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Anti-Repetição: {antiRepeatEnabled ? 'Ativo' : 'Desativado'}</span>
                <span className={`h-2 w-2 rounded-full ${antiRepeatEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              </button>

              {duplicatesCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold animate-fadeIn">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {duplicatesCount} {duplicatesCount === 1 ? 'repetição evitada' : 'repetições evitadas'}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Aproxime o microfone de quem está falando (professor ou colega). O filtro anti-repetição remove automaticamente gaguejos, ecos de microfone e repetições consecutivas de palavras.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {fullText && (
              <>
                <button
                  onClick={handleManualOptimize}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold transition border border-purple-200"
                  title="Fazer varredura e remover qualquer palavra duplicada"
                >
                  <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                  {justCleaned ? 'Limpo!' : 'Otimizar Legenda'}
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition border border-slate-300"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>

                <button
                  onClick={clearTranscript}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black transition border border-slate-300"
                  title="Limpar legenda"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}

            {isListening ? (
              <button
                onClick={stopListening}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-sm animate-pulse"
              >
                <MicOff className="h-4 w-4" />
                Pausar Escuta
              </button>
            ) : (
              <button
                onClick={startListening}
                disabled={!isSupported}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-xs transition shadow-xs disabled:opacity-40 disabled:pointer-events-none"
              >
                <Mic className="h-4 w-4 fill-stone-900" />
                Começar a Ouvir
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Bar */}
        {isListening && (
          <div className="flex items-center justify-between bg-stone-50 border border-stone-300 rounded-2xl p-3 px-4 text-xs text-stone-900">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <strong className="font-bold text-stone-900">Microfone ativo:</strong>
              <span className="hidden sm:inline">Captando fala em português com suavização anti-repetição...</span>
              <span className="sm:hidden">Ouvindo em tempo real...</span>
            </div>

            {/* Audio Waveform Animation Bars */}
            <div className="flex items-center gap-1 h-7">
              <div className="w-1 bg-orange-400 rounded-full wave-bar-1" />
              <div className="w-1 bg-orange-400 rounded-full wave-bar-2" />
              <div className="w-1 bg-orange-400 rounded-full wave-bar-3" />
              <div className="w-1 bg-orange-400 rounded-full wave-bar-4" />
              <div className="w-1 bg-orange-400 rounded-full wave-bar-5" />
            </div>
          </div>
        )}

        {/* Giant Caption Viewing Screen */}
        <div
          className={`min-h-[280px] rounded-3xl p-6 sm:p-8 flex flex-col justify-start transition-all border-2 ${
            settings.contrastTheme === 'amarelo-preto'
              ? 'bg-black text-yellow-300 border-yellow-500'
              : 'bg-white text-black border-slate-300 shadow-sm'
          }`}
        >
          {fullText ? (
            <div className="space-y-4">
              <p
                className={`font-black tracking-tight leading-relaxed select-all ${
                  settings.contrastTheme === 'amarelo-preto' ? 'text-yellow-300' : 'text-black'
                } ${
                  settings.fontSize === 'gigante'
                    ? 'text-3xl sm:text-5xl lg:text-6xl'
                    : settings.fontSize === 'grande'
                    ? 'text-2xl sm:text-4xl lg:text-5xl'
                    : 'text-xl sm:text-3xl lg:text-4xl'
                }`}
              >
                <span>{transcript}</span>
                {interimTranscript && (
                  <span className={`italic font-semibold ml-2 ${
                    settings.contrastTheme === 'amarelo-preto' ? 'text-yellow-100 opacity-80' : 'text-slate-600'
                  }`}>
                    {interimTranscript}
                  </span>
                )}
              </p>

              {/* Caption Status Footer */}
              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-3">
                  <span>{wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}</span>
                  <span>•</span>
                  <span>{fullText.length} caracteres</span>
                  {antiRepeatEnabled && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 inline" /> Filtro ativo (sem repetições)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="m-auto text-center max-w-md py-8 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 border border-slate-200 text-slate-500 mx-auto shadow-xs">
                <Mic className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-black">Nenhuma fala captada no momento</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Clique no botão <strong>"Começar a Ouvir"</strong> acima e peça para o professor ou colega falar normalmente. As palavras aparecerão aqui em letras gigantes e sem repetições indesejadas.
              </p>

              {/* Informational banner about the anti-repetition improvement */}
              <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong className="block font-bold text-emerald-950">Aprimoramento Anti-Repetição Ativo:</strong>
                  O sistema agora detecta e mescla sobreposições de áudio da Web Speech API, elimina gaguejos e remove repetições consecutivas de palavras (como <em>"o o"</em> ou <em>"vamos vamos"</em>).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

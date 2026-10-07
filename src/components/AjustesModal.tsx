import React from 'react';
import { Sliders, Volume2, Type, Eye, Smartphone, RotateCcw, Check, Sparkles, X } from 'lucide-react';
import { AppSettings, FontSize, ContrastTheme } from '../types';

interface AjustesModalProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  speak: (text: string) => void;
  onClose: () => void;
}

export const AjustesModal: React.FC<AjustesModalProps> = ({
  settings,
  setSettings,
  speak,
  onClose,
}) => {
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('ponte_app_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      fontSize: 'normal',
      contrastTheme: 'preto-branco',
      voiceRate: 1,
      voicePitch: 1,
      selectedVoiceURI: '',
      vibrationEnabled: true,
      accessibleFont: false,
      screenWakeLock: false,
    };
    setSettings(defaultSettings);
    try {
      localStorage.setItem('ponte_app_settings', JSON.stringify(defaultSettings));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white border-2 border-slate-300 p-6 sm:p-8 shadow-2xl space-y-6 my-auto text-black">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Sliders className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-black">Ajustes & Acessibilidade</h2>
              <p className="text-xs text-slate-600 font-medium">Personalize para sua necessidade visual e auditiva</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition border border-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Setting 1: Tamanho da Letra */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Type className="h-4 w-4" />
            Tamanho da Letra do Aplicativo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Normal', sample: 'Aa' },
              { id: 'grande', label: 'Grande', sample: 'Aa+' },
              { id: 'gigante', label: 'Gigante', sample: 'Aa++' },
            ].map((size) => (
              <button
                key={size.id}
                onClick={() => updateSetting('fontSize', size.id as FontSize)}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                  settings.fontSize === size.id
                    ? 'bg-black text-white border-black font-black shadow-md'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:border-black hover:bg-slate-100'
                }`}
              >
                <span className="text-lg font-black">{size.sample}</span>
                <span className="text-xs font-bold">{size.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Setting 2: Temas de Alto Contraste */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            Temas de Alto Contraste
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'preto-branco', label: 'Fundo Branco (Letras Pretas)', bg: 'bg-white', text: 'text-black', border: 'border-black' },
              { id: 'padrao', label: 'Branco Padrão', bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-400' },
              { id: 'amarelo-preto', label: 'Amarelo no Preto', bg: 'bg-black', text: 'text-yellow-300', border: 'border-yellow-400' },
              { id: 'azul-ciano', label: 'Azul & Ciano', bg: 'bg-slate-900', text: 'text-cyan-300', border: 'border-cyan-500' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSetting('contrastTheme', theme.id as ContrastTheme)}
                className={`p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                  settings.contrastTheme === theme.id
                    ? 'ring-2 ring-black border-black shadow-md'
                    : 'border-slate-300 hover:border-slate-500'
                } ${theme.bg}`}
              >
                <div className={`w-full h-4 rounded mb-2 ${theme.border} border`} />
                <span className={`text-[11px] font-black ${theme.text}`}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Setting 3: Tipografia Inclusiva (Atkinson Hyperlegible) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-300">
          <div>
            <strong className="text-xs font-black text-black block">Fonte Atkinson Hyperlegible</strong>
            <p className="text-[11px] text-slate-600">
              Desenvolvida pelo Braille Institute para diferenciar letras facilmente e reduzir confusão visual.
            </p>
          </div>
          <button
            onClick={() => updateSetting('accessibleFont', !settings.accessibleFont)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              settings.accessibleFont ? 'bg-black' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                settings.accessibleFont ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Setting 4: Velocidade e Tom da Síntese de Voz */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-300">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Volume2 className="h-4 w-4" />
              Velocidade da Voz em Português
            </label>
            <span className="text-xs font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-slate-300">
              {settings.voiceRate.toFixed(1)}x
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.voiceRate}
            onChange={(e) => updateSetting('voiceRate', parseFloat(e.target.value))}
            className="w-full accent-black cursor-pointer"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-600 font-bold">0.5x (Mais Lenta)</span>
            <button
              onClick={() => speak('Teste de voz do aplicativo Ponte para o laboratório.')}
              className="text-xs text-black hover:bg-slate-200 font-bold flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-slate-300 transition"
            >
              <Volume2 className="h-3.5 w-3.5" /> Testar Voz Agora
            </button>
            <span className="text-[10px] text-slate-600 font-bold">1.5x (Mais Rápida)</span>
          </div>
        </div>

        {/* Setting 5: Vibração Háptica */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-300">
          <div>
            <strong className="text-xs font-black text-black block">Vibração em Alertas e Toques</strong>
            <p className="text-[11px] text-slate-600">
              Vibra o celular ao disparar alertas visuais e confirmar toques em frases.
            </p>
          </div>
          <button
            onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              settings.vibrationEnabled ? 'bg-black' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={handleReset}
            className="text-xs text-slate-600 hover:text-rose-600 font-bold flex items-center gap-1 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar Padrões
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
          >
            Salvar e Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

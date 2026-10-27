import React from 'react';
import { Sliders, Volume2, Type, Eye, Smartphone, RotateCcw, Check, Sparkles, X, Bot } from 'lucide-react';
import { AppSettings, FontSize, ContrastTheme } from '../types';

interface AjustesModalProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  speak: (text: string) => void;
  onClose: () => void;
  voices?: SpeechSynthesisVoice[];
  selectedVoice?: SpeechSynthesisVoice | null;
  onSelectChatGptPersona?: (persona: 'chatgpt-natural' | 'chatgpt-masculino') => void;
}

export const AjustesModal: React.FC<AjustesModalProps> = ({
  settings,
  setSettings,
  speak,
  onClose,
  voices = [],
  selectedVoice,
  onSelectChatGptPersona,
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
      contrastTheme: 'azul-laranja',
      voiceRate: 1.05,
      voicePitch: 1.02,
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

  const ptVoices = voices.filter(
    (v) => v.lang === 'pt-BR' || v.lang.startsWith('pt') || v.name.toLowerCase().includes('portuguese')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-300 shadow-2xl p-6 sm:p-8 text-black space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-300 text-stone-900 border border-orange-400 font-black shadow-xs">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black">Ajustes & Acessibilidade</h2>
              <p className="text-xs text-slate-600">Personalize a voz estilo ChatGPT, contraste e visualização</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Setting 1: Tamanho da Fonte */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Type className="h-4 w-4" />
            Tamanho das Letras da Legenda
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Normal (100%)', sample: 'Aa' },
              { id: 'grande', label: 'Grande (140%)', sample: 'Aa' },
              { id: 'gigante', label: 'Gigante (180%)', sample: 'Aa' },
            ].map((size) => (
              <button
                key={size.id}
                onClick={() => updateSetting('fontSize', size.id as FontSize)}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1 ${
                  settings.fontSize === size.id
                    ? 'bg-orange-100 text-stone-900 border-orange-400 ring-2 ring-orange-400 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-300 hover:border-orange-300 hover:bg-orange-50'
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
            Temas de Cor e Contraste
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'azul-laranja', label: 'Azul com Laranja (Padrão)', bg: 'bg-[#081026]', text: 'text-orange-400', border: 'border-orange-500' },
              { id: 'laranja-pastel', label: 'Laranja Pastel & Cinza', bg: 'bg-[#fff7ed]', text: 'text-stone-900', border: 'border-orange-400' },
              { id: 'preto-branco', label: 'Fundo Branco (Contraste)', bg: 'bg-white', text: 'text-black', border: 'border-slate-400' },
              { id: 'padrao', label: 'Cinza Suave Neutro', bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-300' },
              { id: 'amarelo-preto', label: 'Amarelo no Preto', bg: 'bg-black', text: 'text-yellow-300', border: 'border-yellow-400' },
              { id: 'azul-ciano', label: 'Azul & Ciano', bg: 'bg-slate-900', text: 'text-cyan-300', border: 'border-cyan-500' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSetting('contrastTheme', theme.id as ContrastTheme)}
                className={`p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                  settings.contrastTheme === theme.id
                    ? 'ring-2 ring-orange-400 border-orange-400 shadow-sm'
                    : 'border-slate-300 hover:border-orange-300'
                } ${theme.bg}`}
              >
                <div className={`w-full h-4 rounded mb-2 ${theme.border} border`} />
                <span className={`text-[11px] font-black ${theme.text}`}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Setting 3: VOZ ESTILO CHATGPT */}
        <div className="space-y-3 p-4 rounded-2xl bg-orange-50 border border-orange-300">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-orange-600" />
              Configuração de Voz Estilo ChatGPT
            </label>
            <span className="text-[11px] font-black text-orange-950 bg-orange-200 px-2.5 py-0.5 rounded-full border border-orange-300">
              Voz Neural Humana
            </span>
          </div>

          <p className="text-xs text-stone-700 leading-relaxed">
            Utiliza vozes neurais de alta fidelidade com cadência fluida (1.05x) e tom caloroso, idêntica à síntese conversacional do ChatGPT.
          </p>

          {/* Quick Persona Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onSelectChatGptPersona) onSelectChatGptPersona('chatgpt-natural');
                updateSetting('voiceRate', 1.05);
                updateSetting('voicePitch', 1.02);
              }}
              className="p-2.5 rounded-xl bg-white hover:bg-orange-100 border border-orange-300 text-left transition shadow-2xs"
            >
              <strong className="block text-xs font-black text-stone-950">Voz Feminina (Francisca)</strong>
              <span className="text-[11px] text-stone-600">Fluida, suave e expressiva</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSelectChatGptPersona) onSelectChatGptPersona('chatgpt-masculino');
                updateSetting('voiceRate', 1.05);
                updateSetting('voicePitch', 1.0);
              }}
              className="p-2.5 rounded-xl bg-white hover:bg-orange-100 border border-orange-300 text-left transition shadow-2xs"
            >
              <strong className="block text-xs font-black text-stone-950">Voz Masculina (Antonio)</strong>
              <span className="text-[11px] text-stone-600">Clara, articulada e amigável</span>
            </button>
          </div>

          {/* Voice Dropdown if multiple voices available */}
          {ptVoices.length > 0 && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-stone-800 block">
                Selecionar Voz Instalada no Dispositivo:
              </label>
              <select
                value={settings.selectedVoiceURI || (selectedVoice?.voiceURI ?? '')}
                onChange={(e) => updateSetting('selectedVoiceURI', e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white border border-orange-300 text-black focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {ptVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Voice Speed Slider */}
          <div className="space-y-1.5 pt-2 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                Velocidade da Voz: {settings.voiceRate.toFixed(2)}x
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">
                (ChatGPT Padrão: 1.05x)
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={settings.voiceRate}
              onChange={(e) => updateSetting('voiceRate', parseFloat(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                updateSetting('voiceRate', 1.05);
                updateSetting('voicePitch', 1.02);
              }}
              className="text-[11px] text-orange-950 underline font-bold"
            >
              Redefinir para 1.05x (ChatGPT)
            </button>

            <button
              onClick={() => speak('Olá! Esta é a voz configurada no estilo ChatGPT para falar por mim com máxima clareza e naturalidade.')}
              className="text-xs text-stone-900 bg-orange-300 hover:bg-orange-400 font-black flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-400 shadow-2xs transition"
            >
              <Volume2 className="h-3.5 w-3.5" /> Testar Voz Agora
            </button>
          </div>
        </div>

        {/* Setting 4: Tipografia Inclusiva (Atkinson Hyperlegible) */}
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

        {/* Setting 5: Vibração Háptica */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-300">
          <div>
            <strong className="text-xs font-black text-black block">Vibração Háptica ao Tocar</strong>
            <p className="text-[11px] text-slate-600">
              Vibra o celular ao confirmar toques em frases e botões de ação.
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
            className="px-6 py-2.5 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-xs transition shadow-xs"
          >
            Salvar e Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

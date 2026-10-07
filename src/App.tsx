/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Mic, 
  MessageSquare, 
  Hand, 
  Bell, 
  Layers, 
  Wifi, 
  Sliders, 
  Sparkles, 
  Info,
  CheckCircle2,
  ExternalLink,
  Laptop,
  GraduationCap,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Check
} from 'lucide-react';

import { ActiveTab, AppSettings, UserRole } from './types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

import { SistemaEstudo } from './components/SistemaEstudo';
import { FalarPorMim } from './components/FalarPorMim';
import { OuvirLegendar } from './components/OuvirLegendar';
import { FrasesRapidas } from './components/FrasesRapidas';
import { VLibrasWidget } from './components/LibrasAvatar/VLibrasWidget';
import { AlertaVisual } from './components/AlertaVisual';
import { SolucoesSistema } from './components/SolucoesSistema';
import { AcessoPorIP } from './components/AcessoPorIP';
import { AjustesModal } from './components/AjustesModal';
import { PWAInstallButton } from './components/PWAInstallButton';

const INITIAL_SETTINGS: AppSettings = {
  fontSize: 'normal',
  contrastTheme: 'preto-branco',
  voiceRate: 1.0,
  voicePitch: 1.0,
  selectedVoiceURI: '',
  vibrationEnabled: true,
  accessibleFont: false,
  screenWakeLock: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('falar');
  const [showSettings, setShowSettings] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);

  // Separate Role Access: 'aluno' | 'professor'
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('ponte_sistema_estudo_role');
      if (saved === 'aluno' || saved === 'professor') return saved;
    } catch {
      // fallback
    }
    return 'aluno';
  });

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    try {
      localStorage.setItem('ponte_sistema_estudo_role', newRole);
    } catch {
      // fallback
    }
    setActiveTab('estudos');
    setShowPortalModal(false);
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ponte_app_settings');
      if (saved) return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  });

  // Apply theme & font to body classes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (settings.accessibleFont) {
        body.classList.add('font-accessible');
      } else {
        body.classList.remove('font-accessible');
      }
    }
  }, [settings.accessibleFont]);

  // Speech Synthesis Hook
  const {
    isSupported: isTtsSupported,
    isSpeaking,
    speak,
    cancel: cancelSpeak,
  } = useSpeechSynthesis({
    rate: settings.voiceRate,
    pitch: settings.voicePitch,
    voiceURI: settings.selectedVoiceURI,
  });

  // Speech Recognition Hook
  const {
    isSupported: isSttSupported,
    isListening,
    transcript,
    interimTranscript,
    errorMessage: sttError,
    isSecureOrigin,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  // Tab definitions customized by active role
  const tabs = [
    { 
      id: 'estudos', 
      label: userRole === 'professor' ? 'Painel Professor (Aulas & MP3)' : 'Aulas & PDFs (Aluno)', 
      icon: userRole === 'professor' ? BookOpen : GraduationCap, 
      color: 'text-black', 
      badge: userRole === 'professor' ? 'Docente' : 'Estudo' 
    },
    { id: 'falar', label: 'Falar por mim', icon: Volume2, color: 'text-cyan-400' },
    { id: 'ouvir', label: 'Ouvir e legendar', icon: Mic, color: 'text-emerald-400', badge: isListening ? 'Ouvindo' : undefined },
    { id: 'frases', label: 'Frases rápidas', icon: MessageSquare, color: 'text-purple-400' },
    { id: 'libras', label: 'Libras 3D Gov', icon: Sparkles, color: 'text-blue-400' },
    { id: 'alerta', label: 'Alerta visual', icon: Bell, color: 'text-rose-400' },
    { id: 'solucoes', label: 'Soluções de sistema', icon: Layers, color: 'text-blue-400' },
    { id: 'rede', label: 'Acesso por IP', icon: Wifi, color: 'text-sky-400' },
  ];

  // Dynamic contrast theme styling wrapper
  const getThemeWrapperClass = () => {
    switch (settings.contrastTheme) {
      case 'amarelo-preto':
        return 'bg-black text-yellow-300 min-h-screen';
      case 'azul-ciano':
        return 'bg-slate-900 text-cyan-100 min-h-screen';
      case 'padrao':
      case 'preto-branco':
      default:
        return 'bg-white text-black min-h-screen';
    }
  };

  return (
    <div className={getThemeWrapperClass()}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white font-black shadow-md">
              <Hand className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-black">
                  Ponte
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-black border border-slate-300">
                  Comunica Acessível
                </span>
              </div>
              <p className="text-[11px] text-slate-600 hidden sm:block font-medium">
                Projeto Integrador &bull; Acessibilidade para Alunos Surdos e Mudos
              </p>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Separate Portal Access Switcher */}
            <button
              onClick={() => setShowPortalModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-xs ${
                userRole === 'professor'
                  ? 'bg-black text-white border-black'
                  : 'bg-white hover:bg-slate-100 text-black border-slate-300'
              }`}
              title="Acessar separadamente Portal do Aluno ou Portal do Professor"
            >
              {userRole === 'professor' ? (
                <>
                  <BookOpen className="h-4 w-4 text-white" />
                  <span className="hidden sm:inline">Acesso: Professor</span>
                  <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-black sm:ml-1">Docente</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 text-black" />
                  <span className="hidden sm:inline">Acesso: Aluno</span>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-black sm:ml-1">Estudante</span>
                </>
              )}
            </button>

            {/* Quick Button to open Sistema de Aulas & PDFs */}
            <button
              onClick={() => setActiveTab('estudos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                activeTab === 'estudos'
                  ? 'bg-black text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-black border border-slate-300'
              }`}
              title="Acessar o Painel de Aulas"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Aulas & PDFs</span>
            </button>

            {/* Quick Button to open the Government 3D Avatar (VLibras) */}
            <button
              onClick={() => {
                const accessBtn = document.querySelector('[vw-access-button]') as HTMLElement;
                if (accessBtn) {
                  accessBtn.click();
                } else {
                  setActiveTab('libras');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition shadow-xs"
              title="Abrir Boneco 3D do Governo Federal (VLibras)"
            >
              <span className="text-sm">🇧🇷</span>
              <span className="hidden sm:inline">Boneco 3D Gov</span>
            </button>

            <PWAInstallButton />

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
              title="Ajustes de Acessibilidade"
            >
              <Sliders className="h-4 w-4 text-black" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden md:flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:text-black hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
        {/* Tab 0: Aulas & Estudo (Aluno e Professor com PDFs & MP3) */}
        {activeTab === 'estudos' && (
          <SistemaEstudo
            settings={settings}
            speak={speak}
            isSpeaking={isSpeaking}
            cancelSpeak={cancelSpeak}
            userRole={userRole}
            onRoleChange={handleSwitchRole}
          />
        )}

        {/* Tab 1: Falar por mim */}
        {activeTab === 'falar' && (
          <FalarPorMim
            speak={speak}
            isSpeaking={isSpeaking}
            cancelSpeak={cancelSpeak}
            settings={settings}
          />
        )}

        {/* Tab 2: Ouvir e legendar */}
        {activeTab === 'ouvir' && (
          <OuvirLegendar
            isListening={isListening}
            transcript={transcript}
            interimTranscript={interimTranscript}
            errorMessage={sttError}
            isSupported={isSttSupported}
            isSecureOrigin={isSecureOrigin}
            startListening={startListening}
            stopListening={stopListening}
            clearTranscript={clearTranscript}
            settings={settings}
          />
        )}

        {/* Tab 3: Frases rápidas */}
        {activeTab === 'frases' && (
          <FrasesRapidas
            speak={speak}
            settings={settings}
          />
        )}

        {/* Tab 4: Libras com Boneco 3D do Governo Federal (VLibras) */}
        {activeTab === 'libras' && (
          <VLibrasWidget onSpeakText={speak} />
        )}

        {/* Tab 5: Alerta visual */}
        {activeTab === 'alerta' && (
          <AlertaVisual settings={settings} />
        )}

        {/* Tab 6: Soluções de sistema */}
        {activeTab === 'solucoes' && (
          <SolucoesSistema />
        )}

        {/* Tab 7: Acesso por IP */}
        {activeTab === 'rede' && (
          <AcessoPorIP />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden flex items-center overflow-x-auto px-2 py-1.5 safe-area-bottom shadow-lg scrollbar-none gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[58px] shrink-0 relative ${
                isActive
                  ? 'text-black font-extrabold bg-slate-100 border border-slate-300'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-black' : 'text-slate-600'}`} />
              <span className="text-[10px] mt-0.5 truncate max-w-[62px]">
                {tab.label.split(' ')[0]}
              </span>
              {tab.badge && (
                <span className="absolute top-0.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <AjustesModal
          settings={settings}
          setSettings={setSettings}
          speak={speak}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Portal Selection Modal (Separated Access for Aluno and Professor) */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl my-auto rounded-3xl bg-white border border-slate-300 shadow-2xl p-6 sm:p-8 text-black space-y-6 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-black border border-slate-300">
                  Acessos Separados
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-black mt-1">
                  Selecione o seu Acesso ao Sistema
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  Escolha o perfil apropriado. Cada ambiente possui ferramentas e permissões específicas.
                </p>
              </div>

              <button
                onClick={() => setShowPortalModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>

            {/* Portal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Acesso Aluno */}
              <div 
                onClick={() => handleSwitchRole('aluno')}
                className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-4 hover:border-black ${
                  userRole === 'aluno'
                    ? 'border-black bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-black shadow-md">
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    {userRole === 'aluno' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white flex items-center gap-1">
                        <Check className="h-3 w-3" /> Ativo
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-black">
                      🎓 Acesso do Aluno
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Área de estudo com videoaulas em MP3, tradução em Libras com o Boneco do VLibras e apostilas em PDF.
                    </p>
                  </div>

                  <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Ouvir videoaulas em áudio MP3</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Tradução 3D com Boneco do VLibras</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Download e visualização de PDFs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Comunicação acessível integrada</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitchRole('aluno');
                  }}
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black transition shadow-xs text-center"
                >
                  Entrar como Aluno
                </button>
              </div>

              {/* Card 2: Acesso Professor */}
              <div 
                onClick={() => handleSwitchRole('professor')}
                className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-4 hover:border-black ${
                  userRole === 'professor'
                    ? 'border-black bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-black shadow-md">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                    {userRole === 'professor' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white flex items-center gap-1">
                        <Check className="h-3 w-3" /> Ativo
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-black">
                      👨‍🏫 Acesso do Professor
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Painel docente para cadastro de aulas, upload de MP3, gravação no microfone e anexos de PDFs.
                    </p>
                  </div>

                  <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Cadastrar aulas e disciplinas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Upload de MP3 e gravação ao vivo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Testar tradução no Boneco VLibras</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-black shrink-0" />
                      <span>Anexar e gerar apostilas em PDF</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitchRole('professor');
                  }}
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black transition shadow-xs text-center"
                >
                  Entrar como Professor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

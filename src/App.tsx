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
  Check,
  LogIn,
  LogOut,
  User,
  Key,
  UserPlus
} from 'lucide-react';

import { ActiveTab, AppSettings, UserRole, UserAccount } from './types';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { getCurrentUser, setCurrentUser as setStoredCurrentUser } from './data/authUsersData';
import { AuthPortalModal } from './components/AuthPortalModal';

import { SistemaEstudo } from './components/SistemaEstudo';
import { FalarPorMim } from './components/FalarPorMim';
import { OuvirLegendar } from './components/OuvirLegendar';
import { FrasesRapidas } from './components/FrasesRapidas';
import { VLibrasWidget } from './components/LibrasAvatar/VLibrasWidget';
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('estudos');
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Authenticated user session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return getCurrentUser();
  });

  // Separate Role Access: 'aluno' | 'professor'
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const user = getCurrentUser();
    if (user) return user.role;
    try {
      const saved = localStorage.getItem('ponte_sistema_estudo_role');
      if (saved === 'aluno' || saved === 'professor') return saved;
    } catch {
      // fallback
    }
    return 'aluno';
  });

  // If no user is logged in, show auth modal on initial access
  useEffect(() => {
    if (!currentUser) {
      setShowAuthModal(true);
    }
  }, []);

  const handleSuccessLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setUserRole(user.role);
    setShowAuthModal(false);
    setActiveTab('estudos');
  };

  const handleLogout = () => {
    setStoredCurrentUser(null);
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    try {
      localStorage.setItem('ponte_sistema_estudo_role', newRole);
    } catch {}
    if (!currentUser || currentUser.role !== newRole) {
      setShowAuthModal(true);
    } else {
      setActiveTab('estudos');
    }
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
    antiRepeatEnabled,
    setAntiRepeatEnabled,
    duplicatesCount,
    startListening,
    stopListening,
    clearTranscript,
    optimizeTranscript,
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
            {/* Authenticated User & Portal Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-xs ${
                    userRole === 'professor'
                      ? 'bg-black text-white border-black'
                      : 'bg-white hover:bg-slate-100 text-black border-slate-300'
                  }`}
                  title={`Usuário logado: ${currentUser.name} (Matrícula: ${currentUser.matricula}). Clique para gerenciar conta.`}
                >
                  {userRole === 'professor' ? (
                    <>
                      <BookOpen className="h-4 w-4 text-white" />
                      <span className="hidden sm:inline font-black truncate max-w-[130px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-black sm:ml-1">
                        Matr. {currentUser.matricula}
                      </span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="h-4 w-4 text-black" />
                      <span className="hidden sm:inline font-black truncate max-w-[130px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-black sm:ml-1">
                        Matr. {currentUser.matricula}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black border border-slate-300 text-xs font-bold transition flex items-center gap-1"
                  title="Sair / Encerrar Sessão"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline text-[11px]">Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-black text-white hover:bg-slate-800 shadow-xs"
                title="Acessar com matrícula de Aluno ou Professor"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar (Login / Cadastro)</span>
              </button>
            )}

            {/* Quick Button to open Sistema de Aulas & PDFs */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowAuthModal(true);
                } else {
                  setActiveTab('estudos');
                }
              }}
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
            currentUser={currentUser}
            onRoleChange={handleSwitchRole}
            onOpenLogin={() => setShowAuthModal(true)}
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
            antiRepeatEnabled={antiRepeatEnabled}
            setAntiRepeatEnabled={setAntiRepeatEnabled}
            duplicatesCount={duplicatesCount}
            optimizeTranscript={optimizeTranscript}
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

        {/* Tab 5: Soluções de sistema */}
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

      {/* Auth Portal Modal (Login e Cadastro com Matrícula para Aluno e Professor) */}
      <AuthPortalModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccessLogin={handleSuccessLogin}
        initialRole={userRole}
        allowClose={currentUser !== null}
      />
    </div>
  );
}

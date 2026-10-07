import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Smartphone, Vibrate, Zap, Timer, Play, Pause, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { AppSettings } from '../types';

interface AlertaVisualProps {
  settings: AppSettings;
}

export const AlertaVisual: React.FC<AlertaVisualProps> = ({ settings }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashColor, setFlashColor] = useState<'red' | 'yellow' | 'blue'>('red');
  const [hasVibration, setHasVibration] = useState(false);
  const [vibratePattern, setVibratePattern] = useState<'curto' | 'longo' | 'sos'>('curto');

  // Lab Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInitial, setTimerInitial] = useState(300); // 5 min
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const flashTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      setHasVibration(true);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      triggerAlarm('yellow', 5000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const triggerVibration = (pattern: 'curto' | 'longo' | 'sos') => {
    if (!settings.vibrationEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;

    if (pattern === 'curto') {
      navigator.vibrate([200, 100, 200]);
    } else if (pattern === 'longo') {
      navigator.vibrate([500, 200, 500, 200, 500]);
    } else if (pattern === 'sos') {
      navigator.vibrate([100, 50, 100, 50, 100, 150, 300, 100, 300, 100, 300, 150, 100, 50, 100, 50, 100]);
    }
  };

  const triggerAlarm = (color: 'red' | 'yellow' | 'blue', durationMs: number = 3000) => {
    setFlashColor(color);
    setIsFlashing(true);
    triggerVibration(vibratePattern);

    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => {
      setIsFlashing(false);
    }, durationMs);
  };

  const stopAlarm = () => {
    setIsFlashing(false);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* FULLSCREEN FLASHING STROBE OVERLAY */}
      {isFlashing && (
        <div
          onClick={stopAlarm}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-8 cursor-pointer select-none ${
            flashColor === 'red'
              ? 'animate-strobe-red'
              : flashColor === 'yellow'
              ? 'animate-strobe-yellow'
              : 'animate-strobe-blue'
          }`}
        >
          <div className="text-center space-y-6 max-w-3xl">
            <div className="flex justify-center">
              <BellRing className="h-28 w-28 animate-bounce" />
            </div>
            <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight">
              Atenção!
            </h1>
            <p className="text-2xl sm:text-4xl font-extrabold">
              Alerta Visual Ativo no Laboratório
            </p>
            <p className="text-lg font-semibold opacity-90">
              Toque na tela em qualquer lugar para desativar o alerta
            </p>
          </div>
        </div>
      )}

      {/* Main Alert Card */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-black flex items-center gap-2">
              Alerta visual e tátil
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-black font-extrabold border border-slate-300">
                Luz Estroboscópica & Vibração
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Chama a atenção do aluno surdo através do piscar da tela e da vibração do celular, sem depender de som.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 border ${
                hasVibration
                  ? 'bg-slate-100 text-black border-slate-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              {hasVibration ? 'Vibração Suportada' : 'Vibração indisponível neste PC'}
            </span>
          </div>
        </div>

        {/* Big Action Buttons to Test Alert */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => triggerAlarm('red', 4000)}
            className="p-5 rounded-2xl bg-rose-50 hover:bg-rose-100/70 border border-rose-300 text-left transition transform active:scale-95 shadow-xs group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-rose-600 text-white shadow-xs group-hover:scale-110 transition">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-rose-700">Emergência</span>
            </div>
            <h3 className="text-base font-black text-rose-950 mb-1">Alerta Vermelho Máximo</h3>
            <p className="text-xs text-rose-900/80 leading-relaxed font-medium">
              Pisca a tela em vermelho e branco rapidamente com vibração SOS.
            </p>
          </button>

          <button
            onClick={() => triggerAlarm('yellow', 3000)}
            className="p-5 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-300 text-left transition transform active:scale-95 shadow-xs group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-110 transition">
                <BellRing className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800">Atenção</span>
            </div>
            <h3 className="text-base font-black text-amber-950 mb-1">Chamar Atenção do Aluno</h3>
            <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
              Aviso amarelo para o professor chamar o aluno ou avisar início de explicação.
            </p>
          </button>

          <button
            onClick={() => triggerAlarm('blue', 3000)}
            className="p-5 rounded-2xl bg-blue-50 hover:bg-blue-100/70 border border-blue-300 text-left transition transform active:scale-95 shadow-xs group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-black text-white shadow-xs group-hover:scale-110 transition">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-700">Notificação</span>
            </div>
            <h3 className="text-base font-black text-blue-950 mb-1">Aviso Azul Suave</h3>
            <p className="text-xs text-blue-900/80 leading-relaxed font-medium">
              Pulso visual azul para trocas de turno ou avisos breves no laboratório.
            </p>
          </button>
        </div>

        {/* LAB ACTIVITY TIMER WITH VISUAL ALARM */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-black" />
              <h3 className="text-sm font-black text-black">Cronômetro Visual para Atividades de Aula</h3>
            </div>
            <span className="text-xs text-slate-600 font-medium">
              Quando zerar, a tela piscará alertando o aluno silenciosamente
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            {/* Giant Timer Display */}
            <div className="text-center sm:text-left">
              <span className="font-mono text-4xl sm:text-5xl font-black text-black tracking-wider">
                {formatTimer(timerSeconds || timerInitial)}
              </span>
              <span className="text-xs text-slate-600 font-medium block mt-0.5">Tempo Restante para o Exercício</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2">
              {[1, 5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerInitial(mins * 60);
                    setTimerSeconds(mins * 60);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    timerInitial === mins * 60
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isTimerRunning && timerSeconds === 0) {
                    setTimerSeconds(timerInitial);
                  }
                  setIsTimerRunning(!isTimerRunning);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs transition shadow-xs ${
                  isTimerRunning
                    ? 'bg-amber-600 text-white'
                    : 'bg-black hover:bg-slate-800 text-white'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-4 w-4" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" /> Iniciar
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerInitial);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300"
                title="Reiniciar tempo"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Lock, 
  Key, 
  User, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  X, 
  HelpCircle,
  Building,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { 
  authenticateUser, 
  registerNewUser, 
  getStoredUsers, 
  INITIAL_USERS 
} from '../data/authUsersData';

interface AuthPortalModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccessLogin: (user: UserAccount) => void;
  initialRole?: UserRole;
  allowClose?: boolean;
}

export const AuthPortalModal: React.FC<AuthPortalModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  initialRole = 'aluno',
  allowClose = true,
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro'>('login');

  // Login form state
  const [loginMatricula, setLoginMatricula] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regMatricula, setRegMatricula] = useState('');
  const [regTurmaOuArea, setRegTurmaOuArea] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regConfirmMatricula, setRegConfirmMatricula] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = authenticateUser(loginMatricula, loginSenha, activeRole);
    if (result.success && result.user) {
      onSuccessLogin(result.user);
    } else {
      setLoginError(result.error || 'Erro na autenticação. Verifique os dados informados.');
    }
  };

  // Quick fill with matricula as password
  const handleCopyMatriculaToSenha = () => {
    if (loginMatricula.trim()) {
      setLoginSenha(loginMatricula.trim());
      setLoginError(null);
    }
  };

  // Quick Demo logins
  const handleQuickDemo = (demoMatricula: string, role: UserRole) => {
    setActiveRole(role);
    setActiveTab('login');
    setLoginMatricula(demoMatricula);
    setLoginSenha(demoMatricula);
    setLoginError(null);

    const result = authenticateUser(demoMatricula, demoMatricula, role);
    if (result.success && result.user) {
      onSuccessLogin(result.user);
    }
  };

  // Generate automated matricula for new user registration
  const handleGenerateMatricula = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newMat = activeRole === 'professor' ? `PROF-${randomSuffix}` : `2024${randomSuffix}`;
    setRegMatricula(newMat);
    setRegConfirmMatricula(newMat);
  };

  // Handle Registration submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regName.trim()) {
      setRegError('Por favor, informe o seu nome completo.');
      return;
    }

    if (!regMatricula.trim()) {
      setRegError('Por favor, informe a matrícula.');
      return;
    }

    if (regMatricula.trim().toLowerCase() !== regConfirmMatricula.trim().toLowerCase()) {
      setRegError('A confirmação da matrícula não confere com o número digitado. Lembre-se: sua senha será sua matrícula.');
      return;
    }

    const result = registerNewUser({
      name: regName,
      matricula: regMatricula,
      role: activeRole,
      turmaOuArea: regTurmaOuArea || (activeRole === 'professor' ? 'Docência Inclusiva' : 'Ensino Médio / Fundamental'),
      email: regEmail
    });

    if (result.success && result.user) {
      setRegSuccess('Cadastro realizado com sucesso! Conectando ao sistema...');
      setTimeout(() => {
        onSuccessLogin(result.user!);
      }, 700);
    } else {
      setRegError(result.error || 'Erro ao realizar cadastro.');
    }
  };

  const storedUsers = getStoredUsers().filter(u => u.role === activeRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-3xl bg-white border border-slate-300 shadow-2xl p-6 sm:p-8 text-black space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-black border border-slate-300">
                Acesso Escolar Autenticado
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {activeRole === 'professor' ? 'Portal do Professor' : 'Portal do Aluno'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black mt-1 flex items-center gap-2">
              {activeRole === 'professor' ? (
                <>
                  <BookOpen className="h-6 w-6 text-black" />
                  <span>Acesso do Professor</span>
                </>
              ) : (
                <>
                  <GraduationCap className="h-6 w-6 text-black" />
                  <span>Acesso do Aluno</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {activeRole === 'professor'
                ? 'A senha do professor é o seu número de matrícula de docente.'
                : 'A senha do aluno é o seu número de matrícula escolar.'}
            </p>
          </div>

          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition"
              title="Fechar janela"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Modo de Acesso: Já Tenho Cadastro e Primeiro Acesso (Posicionado ACIMA) */}
        <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-300">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition ${
              activeTab === 'login'
                ? 'bg-orange-300 text-stone-900 border border-orange-400/80 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Já Tenho Cadastro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('cadastro');
              setRegError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition ${
              activeTab === 'cadastro'
                ? 'bg-orange-300 text-stone-900 border border-orange-400/80 shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Primeiro Acesso</span>
          </button>
        </div>

        {/* Seleção de Perfil: Acesso Aluno & Acesso do Professor (Abaixo de Já Tenho Cadastro / Primeiro Acesso) */}
        <div className="flex items-center justify-center gap-2 border-b border-orange-200/80 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveRole('aluno');
              setLoginError(null);
              setRegError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition border ${
              activeRole === 'aluno'
                ? 'bg-orange-300 text-stone-900 border-orange-400 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-orange-50 border-transparent'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Acesso Aluno</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('professor');
              setLoginError(null);
              setRegError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition border ${
              activeRole === 'professor'
                ? 'bg-orange-300 text-stone-900 border-orange-400 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-orange-50 border-transparent'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Acesso do Professor</span>
          </button>
        </div>

        {/* VIEW 1: LOGIN TAB */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Rule Callout Banner */}
            <div className="p-3.5 rounded-2xl bg-[#fff7ed] border border-orange-200 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-300 text-stone-900 border border-orange-400/50 shrink-0 mt-0.5">
                <Key className="h-4 w-4 text-stone-900" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-black text-black block">
                  Regra de Senha do Sistema
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {activeRole === 'aluno' ? (
                    <>A senha do aluno é <strong>o seu próprio número de matrícula</strong> escolar.</>
                  ) : (
                    <>A senha do professor é <strong>a sua própria matrícula de professor</strong>.</>
                  )}
                </p>
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{loginError}</span>
                </div>
              </div>
            )}

            {/* Field: Matrícula */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-black">
                {activeRole === 'professor' ? 'Matrícula do Professor' : 'Matrícula do Aluno'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginMatricula}
                  onChange={(e) => setLoginMatricula(e.target.value)}
                  placeholder={activeRole === 'professor' ? 'Ex: PROF-1020' : 'Ex: 20240101'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            {/* Field: Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-black">
                  Senha de Acesso
                </label>
                {loginMatricula.trim() && (
                  <button
                    type="button"
                    onClick={handleCopyMatriculaToSenha}
                    className="text-[11px] font-bold text-black underline hover:text-slate-700"
                  >
                    Usar Matrícula como Senha
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  placeholder="Digite sua matrícula como senha"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black"
                  title={showLoginPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Digite exatamente o mesmo número da sua matrícula.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-sm flex items-center justify-center gap-2 transition shadow-xs"
            >
              <LogIn className="h-4 w-4" />
              <span>Entrar no Sistema</span>
            </button>

            {/* Quick Demo Access Buttons */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 block">
                Acessos Rápidos de Demonstração (1 Clique):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('20240101', 'aluno')}
                  className="p-2.5 rounded-xl border border-slate-300 hover:border-black bg-white hover:bg-slate-50 text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-black block">🎓 Aluno (Ana Beatriz)</span>
                    <span className="text-[10px] text-slate-500 font-medium">Matrícula & Senha: 20240101</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('PROF-1020', 'professor')}
                  className="p-2.5 rounded-xl border border-slate-300 hover:border-black bg-white hover:bg-slate-50 text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-black block">👨‍🏫 Prof. Carlos Eduardo</span>
                    <span className="text-[10px] text-slate-500 font-medium">Matrícula & Senha: PROF-1020</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* First Access Prompt */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('cadastro');
                  setRegError(null);
                }}
                className="text-xs font-bold text-black underline hover:text-slate-700"
              >
                Primeiro acesso ao sistema? Faça seu cadastro aqui &rarr;
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: CADASTRO / PRIMEIRO ACESSO TAB */}
        {activeTab === 'cadastro' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white shrink-0 mt-0.5">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-black text-black block">
                  Primeiro Acesso - Cadastramento de {activeRole === 'professor' ? 'Professor' : 'Aluno'}
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  Cadastre seus dados educacionais. <strong>Sua senha de acesso será o seu número de matrícula</strong> registrado aqui.
                </p>
              </div>
            </div>

            {regError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{regError}</span>
                </div>
              </div>
            )}

            {regSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* Nome Completo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-black">
                Nome Completo *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={activeRole === 'professor' ? 'Ex: Profa. Helena Martins' : 'Ex: Gabriel Souza Santos'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                required
              />
            </div>

            {/* Matrícula */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-black">
                  {activeRole === 'professor' ? 'Número da Matrícula Docente *' : 'Número da Matrícula Escolar *'}
                </label>
                <button
                  type="button"
                  onClick={handleGenerateMatricula}
                  className="text-[11px] font-bold text-black underline hover:text-slate-700 flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Gerar Matrícula Automática</span>
                </button>
              </div>
              <input
                type="text"
                value={regMatricula}
                onChange={(e) => {
                  setRegMatricula(e.target.value);
                  setRegConfirmMatricula(e.target.value);
                }}
                placeholder={activeRole === 'professor' ? 'Ex: PROF-3040' : 'Ex: 20240301'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                required
              />
              <p className="text-[11px] text-slate-500 font-medium">
                Esta matrícula será também a sua <strong>senha de acesso</strong>.
              </p>
            </div>

            {/* Turma / Área */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black">
                  {activeRole === 'professor' ? 'Área / Disciplina' : 'Turma / Série'}
                </label>
                <input
                  type="text"
                  value={regTurmaOuArea}
                  onChange={(e) => setRegTurmaOuArea(e.target.value)}
                  placeholder={activeRole === 'professor' ? 'Ex: Letras / Libras' : 'Ex: 1º Ano Médio'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black">
                  E-mail Institucional (Opcional)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="usuario@escola.edu.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Confirmação de Senha (digitar matrícula novamente) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase text-black">
                Confirmar Senha (Digite a Matrícula Novamente) *
              </label>
              <input
                type="text"
                value={regConfirmMatricula}
                onChange={(e) => setRegConfirmMatricula(e.target.value)}
                placeholder="Repita sua matrícula para confirmar sua senha"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-black"
                required
              />
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-sm flex items-center justify-center gap-2 transition shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              <span>Concluir Cadastro e Acessar Sistema</span>
            </button>

            {/* Back to Login link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className="text-xs font-bold text-black underline hover:text-slate-700"
              >
                Já possui cadastro anterior? Clique aqui para entrar &rarr;
              </button>
            </div>
          </form>
        )}

        {/* Existing Accounts in system preview */}
        {storedUsers.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
              Matrículas Registradas neste dispositivo ({activeRole === 'professor' ? 'Docentes' : 'Alunos'}):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {storedUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginMatricula(u.matricula);
                    setLoginSenha(u.matricula);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[11px] font-bold text-black flex items-center gap-1.5 transition"
                  title="Clique para preencher a matrícula e senha"
                >
                  <span>{u.name.split(' ')[0]}</span>
                  <span className="text-[9px] bg-black text-white px-1 py-0.5 rounded font-black">
                    {u.matricula}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

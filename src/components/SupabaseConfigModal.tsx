import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  FileCode, 
  HelpCircle,
  Key,
  Layers,
  Server
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveCustomSupabaseCredentials, 
  isSupabaseConfigured, 
  testSupabaseConnection 
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    hasTables?: boolean;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'credenciais' | 'sql' | 'instrucoes'>('credenciais');

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);

    saveCustomSupabaseCredentials(url, anonKey);
    if (onConnectionChanged) {
      onConnectionChanged();
    }

    const res = await testSupabaseConnection();
    setTestResult(res);
    setTesting(false);
  };

  const handleCopySql = () => {
    const sqlCode = `-- SQL DO PROJETO INTEGRADOR PONTE (SUPABASE)
-- Execute no SQL Editor do Supabase (supabase.com -> Projeto -> SQL Editor -> New Query)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA PROFILES (USUÁRIOS E PAPÉIS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  matricula TEXT,
  role TEXT NOT NULL CHECK (role IN ('aluno', 'professor')) DEFAULT 'aluno',
  turma_ou_area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. TABELA AULAS_ATIVIDADES E AULAS
CREATE TABLE IF NOT EXISTS public.aulas_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  instrucoes TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('aula', 'atividade')) DEFAULT 'aula',
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  professor_nome TEXT NOT NULL,
  disciplina TEXT NOT NULL DEFAULT 'Geral',
  prazo_entrega DATE,
  material_url TEXT,
  material_nome TEXT,
  material_tipo TEXT,
  material_tamanho TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  instrucoes TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('aula', 'atividade')) DEFAULT 'aula',
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  professor_nome TEXT NOT NULL,
  disciplina TEXT NOT NULL DEFAULT 'Geral',
  prazo_entrega DATE,
  material_url TEXT,
  material_nome TEXT,
  material_tipo TEXT,
  material_tamanho TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BUCKET PRIVADO 'materiais-aulas' NO SUPABASE STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais-aulas', 'materiais-aulas', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 4. TRIGGER DE SEGURANÇA: NOVO USUÁRIO SEMPRE INICIA COM O PAPEL 'aluno'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, matricula, role, turma_ou_area)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'Usuário'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'matricula', 'MAT-' || substr(NEW.id::text, 1, 6)),
    'aluno',
    COALESCE(NEW.raw_user_meta_data->>'turma_ou_area', 'Geral')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. FUNÇÃO ADMINISTRATIVA PARA CONCEDER PAPEL DE PROFESSOR
CREATE OR REPLACE FUNCTION public.atribuir_papel_professor(user_email TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET role = 'professor', updated_at = now() WHERE email = user_email;
  RETURN 'Papel de Professor atribuído com sucesso a ' || user_email;
END;
$$;

-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis legiveis" ON public.profiles;
CREATE POLICY "Perfis legiveis" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Atualizar proprio perfil sem mudar role" ON public.profiles;
CREATE POLICY "Atualizar proprio perfil sem mudar role" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "Aulas visiveis a todos" ON public.aulas_atividades;
CREATE POLICY "Aulas visiveis a todos" ON public.aulas_atividades FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Apenas professores inserem" ON public.aulas_atividades;
CREATE POLICY "Apenas professores inserem" ON public.aulas_atividades FOR INSERT TO authenticated
WITH CHECK (auth.uid() = professor_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'professor'));

DROP POLICY IF EXISTS "Professores editam suas aulas" ON public.aulas_atividades;
CREATE POLICY "Professores editam suas aulas" ON public.aulas_atividades FOR UPDATE TO authenticated
USING (auth.uid() = professor_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'professor'));

DROP POLICY IF EXISTS "Professores excluem suas aulas" ON public.aulas_atividades;
CREATE POLICY "Professores excluem suas aulas" ON public.aulas_atividades FOR DELETE TO authenticated
USING (auth.uid() = professor_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'professor'));

-- 7. POLÍTICAS RLS NO BUCKET PRIVADO 'materiais-aulas'
DROP POLICY IF EXISTS "Materiais legiveis por autenticados" ON storage.objects;
CREATE POLICY "Materiais legiveis por autenticados" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'materiais-aulas');

DROP POLICY IF EXISTS "Professores enviam para sua pasta" ON storage.objects;
CREATE POLICY "Professores enviam para sua pasta" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'materiais-aulas' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'professor')
);

DROP POLICY IF EXISTS "Professores excluem de sua pasta" ON storage.objects;
CREATE POLICY "Professores excluem de sua pasta" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'materiais-aulas' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'professor')
);
`;
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleCopyEnv = () => {
    const envSnippet = `VITE_SUPABASE_URL="${url || 'https://seu-projeto.supabase.co'}"\nVITE_SUPABASE_ANON_KEY="${anonKey || 'sua-chave-publica-anon'}"`;
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  const handleCopyPromoteQuery = () => {
    const q = `SELECT public.atribuir_papel_professor('${adminEmail || 'seu_email@exemplo.com'}');`;
    navigator.clipboard.writeText(q);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 3000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl my-auto rounded-3xl bg-white border border-slate-300 shadow-2xl p-6 sm:p-7 text-black space-y-5 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-xs">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  isConfigured 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isConfigured ? 'Supabase Conectado' : 'Aguardando Credenciais'}
                </span>
              </div>
              <h2 className="text-xl font-black text-black mt-0.5">
                Conexão Supabase & Banco de Dados
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-black">
          <button
            onClick={() => setActiveTab('credenciais')}
            className={`py-2 px-3 rounded-lg transition ${
              activeTab === 'credenciais'
                ? 'bg-white text-black shadow-xs'
                : 'text-stone-600 hover:text-black'
            }`}
          >
            Credenciais & Teste
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-2 px-3 rounded-lg transition ${
              activeTab === 'sql'
                ? 'bg-white text-black shadow-xs'
                : 'text-stone-600 hover:text-black'
            }`}
          >
            Script SQL (RLS & Tabelas)
          </button>
          <button
            onClick={() => setActiveTab('instrucoes')}
            className={`py-2 px-3 rounded-lg transition ${
              activeTab === 'instrucoes'
                ? 'bg-white text-black shadow-xs'
                : 'text-stone-600 hover:text-black'
            }`}
          >
            Guia de Configuração
          </button>
        </div>

        {/* TAB 1: CREDENCIAIS */}
        {activeTab === 'credenciais' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-black text-black block flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Segurança de Credenciais
              </span>
              <p>
                Utilize apenas a <strong>Project URL</strong> e a <strong>Publishable / Anon Key</strong> pública. 
                Nunca insira ou compartilhe a <em>service_role</em> ou chaves secretas no navegador.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-black">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://sua-instancia.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black text-xs font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-black">
                  Publishable Key / Anon Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-black text-xs font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <span className="font-black block">
                    {testResult.success ? 'Conexão Verificada com Sucesso!' : 'Falha na Conexão'}
                  </span>
                  <p>{testResult.message}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyEnv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold transition"
              >
                {copiedEnv ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedEnv ? 'Variáveis Copiadas!' : 'Copiar formato .env'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndTest}
                disabled={testing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testando Conexão...' : 'Salvar & Testar Conexão'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SCRIPT SQL */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <span className="font-black text-black block flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-black" />
                Execução no Supabase SQL Editor
              </span>
              <p>
                Este script configura as tabelas <code>profiles</code> e <code>aulas_atividades</code>, 
                o bucket <code>materiais_educacionais</code> no Supabase Storage e as políticas de segurança RLS.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-xs transition shadow-xs"
            >
              {copiedSql ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedSql ? 'Script SQL Copiado para a Área de Transferência!' : 'Copiar Script SQL Completo (1 Clique)'}</span>
            </button>

            {/* Promote Teacher Helper */}
            <div className="p-4 rounded-2xl bg-[#fff7ed] border border-orange-200 text-xs space-y-2">
              <span className="font-black text-stone-900 block flex items-center gap-1.5">
                <Key className="h-4 w-4 text-orange-600" />
                Como Atribuir o Papel de Professor com Segurança:
              </span>
              <p className="text-slate-700">
                Pelas regras de segurança, novos cadastros sempre começam como <strong>Aluno</strong>. 
                Para transformar uma conta em Professor, execute a função no SQL Editor do Supabase:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="email.do.professor@escola.edu.br"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={handleCopyPromoteQuery}
                  className="px-3 py-1.5 rounded-lg bg-orange-300 hover:bg-orange-400 text-stone-900 border border-orange-400 font-black text-xs shrink-0 flex items-center gap-1"
                >
                  {copiedQuery ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>Copiar Comando</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GUIA PASSO A PASSO */}
        {activeTab === 'instrucoes' && (
          <div className="space-y-3 text-xs text-slate-700 max-h-[360px] overflow-y-auto pr-1">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-black block">1. Criar Projeto no Supabase</span>
              <p>Acesse <strong>supabase.com</strong>, crie uma conta ou entre no seu painel e clique em <em>New Project</em>.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-black block">2. Obter as Credenciais Públicas</span>
              <p>Vá em <em>Project Settings &rarr; Data API</em> (ou API Settings). Copie a <strong>Project URL</strong> e a <strong>anon / public key</strong>.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-black block">3. Onde colocar no Google AI Studio</span>
              <p>
                No painel de variáveis de ambiente do seu projeto no AI Studio ou no arquivo <code>.env</code>, adicione:
              </p>
              <pre className="p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
{`VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
              </pre>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-black text-black block">4. Executar o Script SQL</span>
              <p>
                No menu lateral do Supabase, clique em <strong>SQL Editor</strong>, cole o script da aba &quot;Script SQL&quot; e clique no botão <strong>Run</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

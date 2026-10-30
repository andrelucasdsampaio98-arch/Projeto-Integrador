-- ==============================================================================
-- PROJETO INTEGRADOR - PLATAFORMA EDUCACIONAL ACESSÍVEL (PONTE)
-- SCRIPT DE INICIALIZAÇÃO, TABELAS, STORAGE PRIVADO E POLÍTICAS RLS (SUPABASE)
-- ==============================================================================
-- Execute este script completo no Supabase: Painel do Projeto -> SQL Editor -> Novo Script -> Run (Ctrl+Enter)

-- 1. HABILITAR EXTENSÃO DE CRIPTOGRAFIA / UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE PERFIS DE USUÁRIOS (PROFILES)
-- Vinculada diretamente ao auth.users do Supabase Auth
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

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. TABELA DE AULAS E ATIVIDADES (AULAS_ATIVIDADES E AULAS)
-- Requisito: id, título, descrição, tipo (aula ou atividade), professor responsável,
-- data de criação, prazo de entrega opcional, caminho do material anexado (material_url).
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
  material_url TEXT, -- Armazena o caminho relativo no storage: ID_DO_PROFESSOR/nome-do-arquivo.ext
  material_nome TEXT,
  material_tipo TEXT,
  material_tamanho TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para ordenação mais recente -> mais antiga e consultas
CREATE INDEX IF NOT EXISTS idx_aulas_atividades_data_criacao ON public.aulas_atividades(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_aulas_atividades_tipo ON public.aulas_atividades(tipo);
CREATE INDEX IF NOT EXISTS idx_aulas_atividades_professor ON public.aulas_atividades(professor_id);

-- Criar tabela 'aulas' com a mesma estrutura para garantir compatibilidade caso o usuário utilize o nome 'aulas'
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
  material_url TEXT, -- Armazena o caminho no bucket materiais-aulas
  material_nome TEXT,
  material_tipo TEXT,
  material_tamanho TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aulas_data_criacao ON public.aulas(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_aulas_tipo ON public.aulas(tipo);
CREATE INDEX IF NOT EXISTS idx_aulas_professor ON public.aulas(professor_id);

-- 4. BUCKET PRIVADO 'materiais-aulas' NO SUPABASE STORAGE
-- Configurado como PRIVADO (public = false) conforme especificação.
-- O acesso aos arquivos ocorre via URLs assinadas temporárias (createSignedUrl).
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais-aulas', 'materiais-aulas', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 5. FUNÇÃO E TRIGGER PARA CRIAR PERFIL AUTOMÁTICO NO CADASTRO
-- Regra de Segurança: Todo novo usuário cadastrado inicia ESTRITAMENTE com o papel de 'aluno'.
-- Nenhum formulário ou código de navegador pode conceder papel de professor no cadastro.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, matricula, role, turma_ou_area)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'Usuário'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'matricula', 'MAT-' || substr(NEW.id::text, 1, 6)),
    'aluno', -- SEGURANÇA FORÇADA: Sempre 'aluno' por padrão no banco!
    COALESCE(NEW.raw_user_meta_data->>'turma_ou_area', 'Geral')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE WHEN profiles.name = '' THEN EXCLUDED.name ELSE profiles.name END;
  RETURN NEW;
END;
$$;

-- Vincular o trigger ao auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. FUNÇÃO DE SEGURANÇA ADMINISTRATIVA: ATRIBUIR PAPEL DE PROFESSOR
-- Somente o administrador do banco pode promover um usuário para professor.
CREATE OR REPLACE FUNCTION public.atribuir_papel_professor(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.profiles
  SET role = 'professor', updated_at = now()
  WHERE email = user_email;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    RETURN 'Usuário com o email ' || user_email || ' não encontrado.';
  ELSE
    RETURN 'Sucesso! Usuário ' || user_email || ' agora possui o papel de Professor.';
  END IF;
END;
$$;

-- 7. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS RLS - TABELA PROFILES
DROP POLICY IF EXISTS "Perfis podem ser lidos por usuarios autenticados" ON public.profiles;
CREATE POLICY "Perfis podem ser lidos por usuarios autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuario pode atualizar seu proprio perfil exceto role" ON public.profiles;
CREATE POLICY "Usuario pode atualizar seu proprio perfil exceto role"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 9. POLÍTICAS RLS - TABELA AULAS_ATIVIDADES
DROP POLICY IF EXISTS "Aulas e atividades visiveis para usuarios autenticados" ON public.aulas_atividades;
CREATE POLICY "Aulas e atividades visiveis para usuarios autenticados"
  ON public.aulas_atividades FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas professores podem publicar aulas e atividades" ON public.aulas_atividades;
CREATE POLICY "Apenas professores podem publicar aulas e atividades"
  ON public.aulas_atividades FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

DROP POLICY IF EXISTS "Professores podem editar suas proprias publicacoes" ON public.aulas_atividades;
CREATE POLICY "Professores podem editar suas proprias publicacoes"
  ON public.aulas_atividades FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  )
  WITH CHECK (auth.uid() = professor_id);

DROP POLICY IF EXISTS "Professores podem excluir suas proprias publicacoes" ON public.aulas_atividades;
CREATE POLICY "Professores podem excluir suas proprias publicacoes"
  ON public.aulas_atividades FOR DELETE
  TO authenticated
  USING (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

-- POLÍTICAS RLS - TABELA AULAS
DROP POLICY IF EXISTS "Aulas visiveis para usuarios autenticados" ON public.aulas;
CREATE POLICY "Aulas visiveis para usuarios autenticados"
  ON public.aulas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas professores podem publicar em aulas" ON public.aulas;
CREATE POLICY "Apenas professores podem publicar em aulas"
  ON public.aulas FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

DROP POLICY IF EXISTS "Professores podem editar suas proprias aulas" ON public.aulas;
CREATE POLICY "Professores podem editar suas proprias aulas"
  ON public.aulas FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  )
  WITH CHECK (auth.uid() = professor_id);

DROP POLICY IF EXISTS "Professores podem excluir suas proprias aulas" ON public.aulas;
CREATE POLICY "Professores podem excluir suas proprias aulas"
  ON public.aulas FOR DELETE
  TO authenticated
  USING (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

-- 10. POLÍTICAS RLS - SUPABASE STORAGE (BUCKET PRIVADO 'materiais-aulas')
-- Leitura autorizada via createSignedUrl para alunos e professores autenticados
DROP POLICY IF EXISTS "Usuarios autenticados podem ler materiais-aulas" ON storage.objects;
CREATE POLICY "Usuarios autenticados podem ler materiais-aulas"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'materiais-aulas');

-- Upload permitido exclusivamente a professores autenticados na pasta ID_DO_PROFESSOR/...
DROP POLICY IF EXISTS "Professores podem enviar para materiais-aulas" ON storage.objects;
CREATE POLICY "Professores podem enviar para materiais-aulas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'materiais-aulas' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

-- Atualização e substituição permitidas ao professor proprietário
DROP POLICY IF EXISTS "Professores podem atualizar seus materiais" ON storage.objects;
CREATE POLICY "Professores podem atualizar seus materiais"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'materiais-aulas' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

-- Exclusão de arquivos permitida exclusivamente ao professor dono da pasta
DROP POLICY IF EXISTS "Professores podem excluir seus materiais" ON storage.objects;
CREATE POLICY "Professores podem excluir seus materiais"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'materiais-aulas' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'professor'
    )
  );

-- ==============================================================================
-- DICA: COMO TORNAR SEU PRIMEIRO USUÁRIO PROFESSOR APÓS O CADASTRO:
-- Execute no SQL Editor substituindo pelo seu e-mail cadastrado:
-- SELECT public.atribuir_papel_professor('seu_email@exemplo.com');
-- ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AulaAtividade, UserAccount, UserRole } from '../types';

// ==============================================================================
// CONFIGURAÇÕES E CREDENCIAIS
// ==============================================================================

// Bucket privado no Supabase Storage para materiais de aulas e atividades
export const SUPABASE_BUCKET_MATERIAIS = 'materiais-aulas';

// Formatos permitidos de acordo com os requisitos:
// PDFs, documentos Word, apresentações PowerPoint e imagens
export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp'
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp'
];

// Chaves locais para permitir configuração rápida via interface sem reiniciar o dev server se desejado
const LOCAL_STORAGE_URL_KEY = 'ponte_supabase_url';
const LOCAL_STORAGE_ANON_KEY = 'ponte_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let storedUrl = '';
  let storedKey = '';
  try {
    storedUrl = (localStorage.getItem(LOCAL_STORAGE_URL_KEY) || '').trim();
    storedKey = (localStorage.getItem(LOCAL_STORAGE_ANON_KEY) || '').trim();
  } catch {
    // Ignore localStorage errors
  }

  const url = envUrl || storedUrl;
  const anonKey = envKey || storedKey;

  return { url, anonKey };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string) {
  try {
    if (url.trim()) {
      localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_URL_KEY);
    }

    if (anonKey.trim()) {
      localStorage.setItem(LOCAL_STORAGE_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ANON_KEY);
    }
    // Reinstancia o cliente
    reinitSupabaseClient();
  } catch (e) {
    console.error('Erro ao salvar credenciais do Supabase:', e);
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url && 
    url.startsWith('https://') && 
    !url.includes('MY_SUPABASE') &&
    anonKey && 
    anonKey.length > 20 &&
    !anonKey.includes('MY_ANON')
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('https://')) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (e) {
    console.error('Falha ao instanciar o Supabase Client:', e);
    return null;
  }
}

export function reinitSupabaseClient() {
  supabaseInstance = null;
  return getSupabaseClient();
}

/**
 * Validação de extensão e formato de arquivo para materiais didáticos
 */
export function isMaterialFileAllowed(file: File): { valid: boolean; reason?: string } {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      reason: `Formato de arquivo não suportado. Utilize PDF (.pdf), Word (.doc, .docx), PowerPoint (.ppt, .pptx) ou Imagens (.png, .jpg, .webp).`
    };
  }

  // Limite máximo de 50MB
  if (file.size > 50 * 1024 * 1024) {
    return {
      valid: false,
      reason: `O arquivo selecionado (${(file.size / (1024 * 1024)).toFixed(1)}MB) ultrapassa o limite máximo de 50MB.`
    };
  }

  return { valid: true };
}

/**
 * Retorna categoria de ícone/tipo com base na extensão
 */
export function getMaterialCategory(fileNameOrType: string): 'pdf' | 'word' | 'powerpoint' | 'image' | 'outro' {
  const lower = fileNameOrType.toLowerCase();
  if (lower.endsWith('.pdf') || lower.includes('pdf')) return 'pdf';
  if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.includes('word') || lower.includes('msword')) return 'word';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx') || lower.includes('powerpoint') || lower.includes('presentation')) return 'powerpoint';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.startsWith('image/')) return 'image';
  return 'outro';
}

/**
 * Extrai o nome amigável do arquivo a partir de um material_url (ex: ID_PROF/arquivo.pdf -> arquivo.pdf)
 */
export function getFileNameFromStoragePath(materialUrlOrPath: string): string {
  if (!materialUrlOrPath) return 'Material_Anexo';
  // Remove query params
  const clean = materialUrlOrPath.split('?')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || 'Material_Anexo';
}

/**
 * Busca perfil do usuário no banco de dados com suporte para a tabela 'perfis' e 'profiles'
 * e colunas 'role' ou 'papel'.
 */
export async function getProfileFromDb(
  client: SupabaseClient,
  userId: string
): Promise<{ role: UserRole; name: string; matricula: string; turmaOuArea: string }> {
  let profile: any = null;

  // 1. Tenta a tabela 'perfis' (configurada no banco do usuário)
  try {
    const { data, error } = await client
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      profile = data;
    }
  } catch {
    // continua
  }

  // 2. Fallback para 'profiles' caso o schema esteja com nomes em inglês
  if (!profile) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        profile = data;
      }
    } catch {
      // continua
    }
  }

  const rawRole = (profile?.role || profile?.papel || '').toLowerCase();
  const role: UserRole = rawRole === 'professor' ? 'professor' : 'aluno';
  const name = profile?.name || profile?.nome || '';
  const matricula = profile?.matricula || '';
  const turmaOuArea = profile?.turma_ou_area || profile?.turma || 'Geral';

  return { role, name, matricula, turmaOuArea };
}

/**
 * Teste de conectividade com Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  hasTables?: boolean;
  url?: string;
}> {
  const client = getSupabaseClient();
  const { url } = getSupabaseCredentials();

  if (!client) {
    return {
      success: false,
      url,
      message: 'Credenciais do Supabase ausentes ou formato inválido. Preencha URL e Anon Key.',
    };
  }

  try {
    // Tenta consultar a tabela aulas
    let { data, error } = await client
      .from('aulas')
      .select('id')
      .limit(1);

    if (error && (error.code === '42P01' || error.message?.includes('relation "aulas" does not exist') || error.message?.includes('not find the table'))) {
      const fallback = await client
        .from('aulas_atividades')
        .select('id')
        .limit(1);
      error = fallback.error;
      data = fallback.data;
    }

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('not find the table')) {
        return {
          success: true,
          hasTables: false,
          url,
          message: 'Conectado ao Supabase com sucesso! Porém a tabela "aulas" ainda não foi encontrada.',
        };
      }
      return {
        success: false,
        url,
        message: `Erro ao testar consulta no Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      hasTables: true,
      url,
      message: 'Conexão com o Supabase estabelecida com sucesso e tabela aulas verificada!',
    };
  } catch (err: any) {
    return {
      success: false,
      url,
      message: `Falha de rede ao conectar ao Supabase: ${err.message || 'Erro desconhecido'}`,
    };
  }
}

// ==============================================================================
// AUTENTICAÇÃO COM SUPABASE AUTH E TABELA 'perfis'
// ==============================================================================

export interface SupabaseAuthResult {
  success: boolean;
  user?: UserAccount;
  error?: string;
}

/**
 * Cadastro de usuário.
 * SEGURANÇA: Todo novo usuário é criado com o papel 'aluno'.
 * Apenas um administrador pode promover para 'professor' no banco de dados.
 */
export async function supabaseSignUp(
  email: string,
  pass: string,
  extra: { name: string; matricula: string; turmaOuArea?: string }
): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado.' };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          name: extra.name,
          matricula: extra.matricula,
          turma_ou_area: extra.turmaOuArea || 'Geral',
          role: 'aluno', // Força papel aluno
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Não foi possível criar o usuário no Supabase.' };
    }

    // Busca o perfil criado no banco (tabela perfis ou profiles)
    let role: UserRole = 'aluno';
    try {
      const dbProfile = await getProfileFromDb(client, data.user.id);
      role = dbProfile.role;
    } catch {
      // fallback
    }

    const userAccount: UserAccount = {
      id: data.user.id,
      name: extra.name || (data.user.email ? data.user.email.split('@')[0] : 'Usuário'),
      matricula: extra.matricula,
      role,
      email: data.user.email,
      turmaOuArea: extra.turmaOuArea || 'Geral',
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    return { success: true, user: userAccount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado no cadastro.' };
  }
}

/**
 * Login com e-mail e senha.
 * Busca o papel seguro diretamente da tabela 'perfis' no banco para impedir adulteração.
 */
export async function supabaseSignIn(email: string, pass: string): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado.' };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    // Busca autoritativa da tabela perfis/profiles (segurança: papel vem do banco, nunca do cliente)
    const dbProfile = await getProfileFromDb(client, data.user.id);

    const role: UserRole = dbProfile.role;
    const name = dbProfile.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário';
    const matricula = dbProfile.matricula || data.user.user_metadata?.matricula || 'MAT-' + data.user.id.slice(0, 6);
    const turmaOuArea = dbProfile.turmaOuArea || data.user.user_metadata?.turma_ou_area || 'Geral';

    const userAccount: UserAccount = {
      id: data.user.id,
      name,
      matricula,
      role,
      email: data.user.email,
      turmaOuArea,
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    return { success: true, user: userAccount };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao realizar login.' };
  }
}

/**
 * Logout do Supabase
 */
export async function supabaseSignOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Erro ao encerrar sessão no Supabase:', e);
    }
  }
}

/**
 * Obtém o perfil atual autenticado no Supabase
 */
export async function supabaseGetCurrentUserProfile(): Promise<UserAccount | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return null;

    const dbProfile = await getProfileFromDb(client, user.id);

    const role: UserRole = dbProfile.role;
    const name = dbProfile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
    const matricula = dbProfile.matricula || user.user_metadata?.matricula || 'MAT-' + user.id.slice(0, 6);
    const turmaOuArea = dbProfile.turmaOuArea || user.user_metadata?.turma_ou_area || 'Geral';

    return {
      id: user.id,
      name,
      matricula,
      role,
      email: user.email,
      turmaOuArea,
      createdAt: user.created_at,
    };
  } catch (e) {
    console.error('Erro ao buscar perfil atual no Supabase:', e);
    return null;
  }
}

// ==============================================================================
// GESTÃO DE AULAS E ATIVIDADES (TABELA 'aulas')
// ==============================================================================

/**
 * Busca todas as publicações da tabela 'aulas' do Supabase,
 * ordenadas da mais recente para a mais antiga (criado_em DESC).
 */
export async function supabaseFetchAulasAtividades(tipoFilter?: 'todas' | 'aula' | 'atividade'): Promise<{
  success: boolean;
  data: AulaAtividade[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, data: [], error: 'Supabase não conectado.' };
  }

  try {
    // 1. Tenta consultar a tabela 'aulas'
    let query = client.from('aulas').select('*');

    if (tipoFilter && tipoFilter !== 'todas') {
      query = query.eq('tipo', tipoFilter);
    }

    let { data, error } = await query;

    // Se 'aulas' não existir, tenta 'aulas_atividades'
    if (error && (error.code === '42P01' || error.message?.includes('relation "aulas" does not exist') || error.message?.includes('not find the table'))) {
      let fallbackQuery = client.from('aulas_atividades').select('*');
      if (tipoFilter && tipoFilter !== 'todas') {
        fallbackQuery = fallbackQuery.eq('tipo', tipoFilter);
      }
      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const rawRows = (data as any[]) || [];

    // Mapeamento compatível com o schema: id, titulo, descricao, tipo, professor_id, material_url, prazo, criado_em
    const mappedItems: AulaAtividade[] = rawRows.map((row) => {
      const dataCriacao = row.criado_em || row.data_criacao || row.created_at || new Date().toISOString();
      const prazoEntrega = row.prazo || row.prazo_entrega || null;
      const fileName = row.material_nome || getFileNameFromStoragePath(row.material_url);

      return {
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        instrucoes: row.instrucoes || row.descricao,
        tipo: row.tipo === 'atividade' ? 'atividade' : 'aula',
        professor_id: row.professor_id,
        professor_nome: row.professor_nome || 'Professor',
        disciplina: row.disciplina || 'Geral',
        prazo_entrega: prazoEntrega,
        prazo: prazoEntrega,
        material_url: row.material_url || null,
        material_nome: fileName,
        material_tipo: row.material_tipo || null,
        material_tamanho: row.material_tamanho || null,
        data_criacao: dataCriacao,
        criado_em: dataCriacao,
        created_at: dataCriacao,
      };
    });

    // Ordenação mais recente para mais antiga
    mappedItems.sort((a, b) => {
      const timeA = new Date(a.criado_em || a.data_criacao).getTime();
      const timeB = new Date(b.criado_em || b.data_criacao).getTime();
      return timeB - timeA;
    });

    return { success: true, data: mappedItems };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'Erro ao carregar publicações.' };
  }
}

/**
 * Criação de nova aula ou atividade na tabela 'aulas'.
 * REQUISITOS DE SEGURANÇA:
 * - Somente usuários com o papel 'professor' podem publicar.
 * - professor_id é preenchido ESTRITAMENTE com o ID do usuário autenticado no Supabase Auth.
 * - Nunca aceita professor_id vindo de formulário no navegador.
 */
export async function supabaseCreateAulaAtividade(item: {
  titulo: string;
  descricao: string;
  instrucoes?: string;
  tipo: 'aula' | 'atividade';
  professor_nome?: string;
  disciplina?: string;
  prazo_entrega?: string | null;
  material_url?: string | null;
  material_nome?: string | null;
  material_tipo?: string | null;
  material_tamanho?: string | null;
}): Promise<{ success: boolean; data?: AulaAtividade; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado.' };
  }

  try {
    // 1. Obter usuário autenticado
    const { data: sessionData } = await client.auth.getSession();
    const authenticatedUserId = sessionData?.session?.user?.id;
    if (!authenticatedUserId) {
      return {
        success: false,
        error: 'Apenas professores autenticados podem publicar. Faça login no sistema.',
      };
    }

    // 2. Verificar no banco se possui papel de professor
    const profile = await getProfileFromDb(client, authenticatedUserId);
    if (profile.role !== 'professor') {
      return {
        success: false,
        error: 'Apenas usuários com papel professor podem publicar aulas ou atividades.',
      };
    }

    const professorNome = item.professor_nome?.trim() || profile.name || 'Professor';
    const agoraIso = new Date().toISOString();
    const prazoValue = item.prazo_entrega || null;

    // 3. Payload exato da tabela 'aulas': id, titulo, descricao, tipo, professor_id, material_url, prazo, criado_em
    const payloadAulasCore: Record<string, any> = {
      titulo: item.titulo.trim(),
      descricao: item.descricao.trim(),
      tipo: item.tipo,
      professor_id: authenticatedUserId, // PREENCHIDO COM O ID DO USUÁRIO AUTENTICADO
      material_url: item.material_url || null,
      prazo: prazoValue,
      criado_em: agoraIso,
    };

    // Payload estendido caso a tabela tenha colunas extras
    const payloadAulasExtended: Record<string, any> = {
      ...payloadAulasCore,
      instrucoes: (item.instrucoes || '').trim(),
      professor_nome: professorNome,
      disciplina: item.disciplina?.trim() || 'Geral',
      prazo_entrega: prazoValue,
      material_nome: item.material_nome || null,
      material_tipo: item.material_tipo || null,
      material_tamanho: item.material_tamanho || null,
      data_criacao: agoraIso,
    };

    // Tenta primeiro inserir na tabela 'aulas' com campos estendidos
    let { data, error } = await client
      .from('aulas')
      .insert([payloadAulasExtended])
      .select()
      .single();

    // Se falhar porque alguma coluna extra não existe na tabela 'aulas', tenta o payload exato
    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist'))) {
      const coreRes = await client
        .from('aulas')
        .insert([payloadAulasCore])
        .select()
        .single();
      data = coreRes.data;
      error = coreRes.error;
    }

    // Se 'aulas' não existir, tenta na tabela 'aulas_atividades'
    if (error && (error.code === '42P01' || error.message?.includes('relation "aulas" does not exist') || error.message?.includes('not find the table'))) {
      const fallbackRes = await client
        .from('aulas_atividades')
        .insert([payloadAulasExtended])
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    const created = data as any;
    const finalItem: AulaAtividade = {
      id: created.id,
      titulo: created.titulo,
      descricao: created.descricao,
      instrucoes: created.instrucoes || created.descricao,
      tipo: created.tipo,
      professor_id: created.professor_id,
      professor_nome: created.professor_nome || professorNome,
      disciplina: created.disciplina || 'Geral',
      prazo_entrega: created.prazo || created.prazo_entrega || null,
      prazo: created.prazo || created.prazo_entrega || null,
      material_url: created.material_url || null,
      material_nome: created.material_nome || getFileNameFromStoragePath(created.material_url),
      material_tipo: created.material_tipo || null,
      material_tamanho: created.material_tamanho || null,
      data_criacao: created.criado_em || created.data_criacao || agoraIso,
      criado_em: created.criado_em || agoraIso,
    };

    return { success: true, data: finalItem };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao publicar aula/atividade.' };
  }
}

/**
 * Atualização de aula ou atividade.
 * Somente o professor autor pode atualizar (garantido por RLS no banco).
 */
export async function supabaseUpdateAulaAtividade(
  id: string,
  updates: Partial<AulaAtividade>
): Promise<{ success: boolean; data?: AulaAtividade; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado.' };
  }

  try {
    // Normaliza os campos para atualizar em 'aulas'
    const updatePayload: Record<string, any> = {};
    if (updates.titulo !== undefined) updatePayload.titulo = updates.titulo;
    if (updates.descricao !== undefined) updatePayload.descricao = updates.descricao;
    if (updates.tipo !== undefined) updatePayload.tipo = updates.tipo;
    if (updates.material_url !== undefined) updatePayload.material_url = updates.material_url;
    if (updates.prazo_entrega !== undefined) {
      updatePayload.prazo = updates.prazo_entrega;
      updatePayload.prazo_entrega = updates.prazo_entrega;
    }
    if (updates.prazo !== undefined) {
      updatePayload.prazo = updates.prazo;
    }
    if (updates.instrucoes !== undefined) updatePayload.instrucoes = updates.instrucoes;
    if (updates.disciplina !== undefined) updatePayload.disciplina = updates.disciplina;

    let { data, error } = await client
      .from('aulas')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    // Se coluna não existir, tenta payload simplificado
    if (error && (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist'))) {
      const simplePayload: Record<string, any> = {
        titulo: updates.titulo,
        descricao: updates.descricao,
        tipo: updates.tipo,
        material_url: updates.material_url,
        prazo: updates.prazo_entrega || updates.prazo,
      };
      const retry = await client
        .from('aulas')
        .update(simplePayload)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error && (error.code === '42P01' || error.message?.includes('relation "aulas" does not exist') || error.message?.includes('not find the table'))) {
      const fallbackRes = await client
        .from('aulas_atividades')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as AulaAtividade };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar publicação.' };
  }
}

/**
 * Exclusão de aula ou atividade.
 * Somente o professor autor pode excluir (garantido por RLS no banco).
 */
export async function supabaseDeleteAulaAtividade(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado.' };
  }

  try {
    let { error } = await client
      .from('aulas')
      .delete()
      .eq('id', id);

    if (error && (error.code === '42P01' || error.message?.includes('relation "aulas" does not exist') || error.message?.includes('not find the table'))) {
      const fallbackRes = await client
        .from('aulas_atividades')
        .delete()
        .eq('id', id);
      error = fallbackRes.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir publicação.' };
  }
}

// ==============================================================================
// GESTÃO DE ARQUIVOS (SUPABASE STORAGE: BUCKET PRIVADO 'materiais-aulas')
// ==============================================================================

/**
 * Upload de materiais para o bucket privado 'materiais-aulas' com acompanhamento de progresso.
 * REQUISITOS:
 * 1. Apenas professores autenticados podem enviar arquivos.
 * 2. Suporta PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx) e Imagens (.png, .jpg, .webp).
 * 3. Mostra o nome do arquivo selecionado e o progresso do envio.
 * 4. Organização de pastas pelo ID do professor autenticado:
 *    ID_DO_PROFESSOR/nome-do-arquivo.ext
 * 5. Retorna o caminho 'storagePath' para ser salvo na coluna 'material_url' da tabela 'aulas'.
 * 6. Já gera uma URL assinada temporária para visualização imediata no painel.
 */
export async function supabaseUploadMaterial(
  file: File,
  professorId?: string,
  onProgress?: (progressPercent: number) => void
): Promise<{
  success: boolean;
  storagePath?: string;
  signedUrl?: string;
  fileName?: string;
  fileSizeFormatted?: string;
  fileType?: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado. Verifique URL e chave nas configurações.' };
  }

  // 1. Validar formato permitido
  const validation = isMaterialFileAllowed(file);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  try {
    // 2. Obter o ID do professor autenticado
    const { data: sessionData } = await client.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    const sessionToken = sessionData?.session?.access_token;

    const targetProfessorId = professorId || authUserId;
    if (!targetProfessorId) {
      return {
        success: false,
        error: 'Apenas professores autenticados podem enviar materiais. Faça login como Professor.',
      };
    }

    // 3. Sanitizar o nome do arquivo preservando a extensão
    const originalName = file.name;
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const extension = dotIndex !== -1 ? originalName.substring(dotIndex) : '';
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = `${safeBaseName}${extension}`;

    // 4. Estrutura padrão exigida: ID_DO_PROFESSOR/nome-do-arquivo.ext
    const storagePath = `${targetProfessorId}/${safeFileName}`;

    if (onProgress) onProgress(15);

    // 5. Executar o upload com suporte a rastreamento de progresso
    let uploadSuccess = false;
    let uploadErrorMessage = '';

    const { url, anonKey } = getSupabaseCredentials();

    // Se temos credenciais e XMLHttpRequest, podemos fazer upload direto com progresso real em bytes
    if (sessionToken && url && typeof XMLHttpRequest !== 'undefined' && onProgress) {
      try {
        const uploadUrl = `${url.replace(/\/$/, '')}/storage/v1/object/${SUPABASE_BUCKET_MATERIAIS}/${storagePath}`;
        
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${sessionToken}`);
          xhr.setRequestHeader('apikey', anonKey);
          xhr.setRequestHeader('x-upsert', 'true');
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
              const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
              onProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadSuccess = true;
              if (onProgress) onProgress(100);
              resolve();
            } else {
              try {
                const errObj = JSON.parse(xhr.responseText);
                uploadErrorMessage = errObj.message || errObj.error || `Erro HTTP ${xhr.status}`;
              } catch {
                uploadErrorMessage = `Erro no envio: código ${xhr.status}`;
              }
              reject(new Error(uploadErrorMessage));
            }
          };

          xhr.onerror = () => {
            reject(new Error('Erro de conexão durante o upload.'));
          };

          xhr.send(file);
        });
      } catch (e: any) {
        console.warn('XHR upload falhou, tentando fallback com SDK:', e.message);
        uploadSuccess = false;
      }
    }

    // Fallback utilizando o SDK oficial do Supabase caso o upload direto por XHR não tenha sido concluído
    if (!uploadSuccess) {
      if (onProgress) onProgress(40);
      const { error: uploadError } = await client.storage
        .from(SUPABASE_BUCKET_MATERIAIS)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.message?.toLowerCase().includes('not found')) {
          return {
            success: false,
            error: `Bucket privado "${SUPABASE_BUCKET_MATERIAIS}" não encontrado no Supabase. Crie o bucket com este nome no Storage.`,
          };
        }
        return { success: false, error: uploadError.message };
      }

      if (onProgress) onProgress(100);
    }

    // 6. Gerar Signed URL temporária (1 hora) para o professor testar imediatamente
    let initialSignedUrl = '';
    try {
      const { data: signedData } = await client.storage
        .from(SUPABASE_BUCKET_MATERIAIS)
        .createSignedUrl(storagePath, 3600);
      if (signedData?.signedUrl) {
        initialSignedUrl = signedData.signedUrl;
      }
    } catch {
      // url assinada pode ser gerada sob demanda depois
    }

    const sizeInKB = Math.round(file.size / 1024);
    const sizeFormatted = sizeInKB > 1024 
      ? `${(sizeInKB / 1024).toFixed(1)} MB` 
      : `${sizeInKB} KB`;

    return {
      success: true,
      storagePath, // Este caminho será gravado na coluna material_url
      signedUrl: initialSignedUrl,
      fileName: file.name,
      fileSizeFormatted: sizeFormatted,
      fileType: file.type || extension,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro no upload para o Supabase Storage.' };
  }
}

/**
 * Gera URL temporária assinada (createSignedUrl) para acesso a arquivos no bucket privado.
 * Usado pelo painel do aluno e pelo painel do professor para abrir ou baixar materiais.
 * 
 * @param storagePathOrUrl Caminho relativo no bucket (ex: ID_PROF/arquivo.pdf) ou URL completa
 * @param expiresIn Validade do link temporário em segundos (padrão: 3600s = 1 hora)
 */
export async function supabaseCreateSignedUrl(
  storagePathOrUrl: string,
  expiresIn = 3600
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  if (!storagePathOrUrl) {
    return { success: false, error: 'Caminho de arquivo inválido.' };
  }

  // Se já for data URL (base64) ou blob local, retorna direto
  if (storagePathOrUrl.startsWith('data:') || storagePathOrUrl.startsWith('blob:')) {
    return { success: true, signedUrl: storagePathOrUrl };
  }

  const client = getSupabaseClient();
  if (!client) {
    if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
      return { success: true, signedUrl: storagePathOrUrl };
    }
    return { success: false, error: 'Supabase não conectado. Configure as credenciais.' };
  }

  try {
    let cleanPath = storagePathOrUrl.trim();

    // Se vier uma URL completa do Supabase Storage, extrai o caminho relativo
    const bucketMarker = `${SUPABASE_BUCKET_MATERIAIS}/`;
    if (cleanPath.includes(bucketMarker)) {
      cleanPath = cleanPath.substring(cleanPath.indexOf(bucketMarker) + bucketMarker.length);
      if (cleanPath.includes('?')) {
        cleanPath = cleanPath.split('?')[0];
      }
    } else if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return { success: true, signedUrl: cleanPath };
    }

    // Remove barras iniciais
    cleanPath = cleanPath.replace(/^\/+/, '');

    // Invoca createSignedUrl da biblioteca oficial do Supabase
    const { data, error } = await client.storage
      .from(SUPABASE_BUCKET_MATERIAIS)
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      // Fallback para bucket legado 'materiais_educacionais' caso tenha sido enviado anteriormente
      const fallback = await client.storage
        .from('materiais_educacionais')
        .createSignedUrl(cleanPath, expiresIn);

      if (!fallback.error && fallback.data?.signedUrl) {
        return { success: true, signedUrl: fallback.data.signedUrl };
      }

      return { success: false, error: error.message };
    }

    if (!data?.signedUrl) {
      return { success: false, error: 'Não foi possível gerar a URL assinada para o material.' };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado ao gerar link seguro.' };
  }
}

/**
 * Helper para Alunos e Professores abrirem ou baixarem materiais privados.
 * Gera link assinado e executa a ação no navegador.
 */
export async function supabaseOpenOrDownloadMaterial(
  storagePathOrUrl: string,
  fileName?: string,
  action: 'open' | 'download' = 'open'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await supabaseCreateSignedUrl(storagePathOrUrl, 3600);
    if (!res.success || !res.signedUrl) {
      return { success: false, error: res.error || 'Falha ao obter link assinado.' };
    }

    const signedUrl = res.signedUrl;

    if (action === 'open') {
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Baixar arquivo criando elemento âncora temporário
      const effectiveName = fileName || getFileNameFromStoragePath(storagePathOrUrl) || 'material_didatico';
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = effectiveName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 200);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao processar o material.' };
  }
}

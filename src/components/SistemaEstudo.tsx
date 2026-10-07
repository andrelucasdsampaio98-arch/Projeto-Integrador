import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Upload, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Volume2, 
  RotateCcw, 
  Check, 
  Layers, 
  UserCheck, 
  Clock, 
  Calendar,
  AlertCircle,
  FileAudio,
  Bot,
  Play,
  ShieldCheck,
  Mic,
  ArrowRight,
  Headphones
} from 'lucide-react';
import { Lesson, LessonPdfFile, LessonMp3Video, UserRole, AppSettings } from '../types';
import { INITIAL_LESSONS } from '../data/lessonsData';
import { TeacherLessonModal } from './TeacherLessonModal';
import { StudentLessonDetailModal } from './StudentLessonDetailModal';
import { PdfViewerModal } from './PdfViewerModal';
import { Mp3VideoLessonPlayer } from './Mp3VideoLessonPlayer';

interface SistemaEstudoProps {
  settings: AppSettings;
  speak: (text: string) => void;
  isSpeaking: boolean;
  cancelSpeak: () => void;
  userRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

const STORAGE_KEY = 'ponte_sistema_estudo_aulas';
const ROLE_STORAGE_KEY = 'ponte_sistema_estudo_role';

export const SistemaEstudo: React.FC<SistemaEstudoProps> = ({
  settings,
  speak,
  isSpeaking,
  cancelSpeak,
  userRole: propUserRole,
  onRoleChange: propOnRoleChange
}) => {
  // Current active role: 'aluno' or 'professor'
  const [internalRole, setInternalRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === 'aluno' || saved === 'professor') return saved;
    } catch {
      // fallback
    }
    return 'aluno';
  });

  const userRole = propUserRole || internalRole;

  const handleRoleChange = (role: UserRole) => {
    setInternalRole(role);
    if (propOnRoleChange) {
      propOnRoleChange(role);
    }
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // fallback
    }
  };

  // Lessons list
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LESSONS;
  });

  // Save lessons to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    } catch (e) {
      console.error('Error saving lessons to localStorage:', e);
    }
  }, [lessons]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Todas');
  const [selectedMediaType, setSelectedMediaType] = useState<'todos' | 'com-mp3' | 'com-pdf'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'pendentes' | 'concluidas'>('todos');

  // Modals state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [activeDetailLesson, setActiveDetailLesson] = useState<Lesson | null>(null);
  const [activePdfViewer, setActivePdfViewer] = useState<{
    file: LessonPdfFile;
    lessonTitle: string;
  } | null>(null);
  const [activeMp3Modal, setActiveMp3Modal] = useState<{
    mp3: LessonMp3Video;
    lessonTitle: string;
  } | null>(null);

  // Extract unique subjects
  const availableSubjects = ['Todas', ...Array.from(new Set(lessons.map((l) => l.subject)))];

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubject = selectedSubject === 'Todas' || lesson.subject === selectedSubject;

    const matchesMediaType =
      selectedMediaType === 'todos' ||
      (selectedMediaType === 'com-mp3' && lesson.mp3Lessons && lesson.mp3Lessons.length > 0) ||
      (selectedMediaType === 'com-pdf' && lesson.pdfFiles && lesson.pdfFiles.length > 0);

    const matchesStatus = 
      selectedStatus === 'todos' ||
      (selectedStatus === 'concluidas' && lesson.isCompleted) ||
      (selectedStatus === 'pendentes' && !lesson.isCompleted);

    return matchesSearch && matchesSubject && matchesMediaType && matchesStatus;
  });

  // Toggle completed state
  const handleToggleComplete = (lessonId: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, isCompleted: !l.isCompleted } : l))
    );
    if (activeDetailLesson && activeDetailLesson.id === lessonId) {
      setActiveDetailLesson((prev) =>
        prev ? { ...prev, isCompleted: !prev.isCompleted } : null
      );
    }
  };

  // Update notes
  const handleUpdateNotes = (lessonId: string, notes: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, studentNotes: notes } : l))
    );
    if (activeDetailLesson && activeDetailLesson.id === lessonId) {
      setActiveDetailLesson((prev) =>
        prev ? { ...prev, studentNotes: notes } : null
      );
    }
  };

  // Save new or edited lesson
  const handleSaveLesson = (savedLesson: Lesson) => {
    setLessons((prev) => {
      const exists = prev.some((l) => l.id === savedLesson.id);
      if (exists) {
        return prev.map((l) => (l.id === savedLesson.id ? savedLesson : l));
      } else {
        return [savedLesson, ...prev];
      }
    });
    setIsTeacherModalOpen(false);
    setEditingLesson(null);
  };

  // Delete lesson
  const handleDeleteLesson = (lessonId: string) => {
    if (confirm('Tem certeza que deseja excluir esta aula, videoaulas em MP3 e arquivos PDF anexados?')) {
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
      if (activeDetailLesson?.id === lessonId) {
        setActiveDetailLesson(null);
      }
    }
  };

  // Reset to initial demo lessons
  const handleResetLessons = () => {
    if (confirm('Deseja restaurar as aulas modelo de exemplo com PDFs e videoaulas em MP3?')) {
      setLessons(INITIAL_LESSONS);
    }
  };

  // Trigger VLibras official 3D avatar
  const handleQuickTriggerVLibras = (sampleText?: string) => {
    const text = sampleText || 'Bem-vindo ao estudo em Libras com o Boneco do VLibras.';
    navigator.clipboard.writeText(text);

    const accessBtn = document.querySelector('[vw-access-button]') as HTMLElement;
    if (accessBtn) {
      accessBtn.click();
    } else {
      const vw = document.querySelector('[vw]') as HTMLElement;
      if (vw) {
        vw.classList.toggle('active');
      }
    }
  };

  // Count stats
  const totalLessons = lessons.length;
  const completedCount = lessons.filter((l) => l.isCompleted).length;
  const totalPdfsCount = lessons.reduce((acc, l) => acc + (l.pdfFiles ? l.pdfFiles.length : 0), 0);
  const totalMp3Count = lessons.reduce((acc, l) => acc + (l.mp3Lessons ? l.mp3Lessons.length : 0), 0);

  return (
    <div className="space-y-6 text-black">
      {/* Top Banner: Distinct Access Indicator & Role Selector */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-black border border-slate-300">
                Acessos Separados
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {userRole === 'professor' ? 'Ambiente do Professor' : 'Ambiente do Aluno'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 mt-1">
              {userRole === 'professor' ? (
                <>
                  <BookOpen className="h-6 w-6 text-black" />
                  <span>Acesso do Professor &bull; Gestão de Aulas, MP3 & PDFs</span>
                </>
              ) : (
                <>
                  <GraduationCap className="h-6 w-6 text-black" />
                  <span>Acesso do Aluno &bull; Estudo, Videoaulas em MP3 & Libras</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mt-1">
              {userRole === 'professor'
                ? 'Painel exclusivo de docentes. Publique videoaulas em áudio MP3, anexe apostilas em PDF e use o Boneco do VLibras para validar a tradução em sinais.'
                : 'Área do estudante. Acesse suas aulas, ouça as videoaulas em MP3 com tradução direta pelo Boneco 3D do VLibras, leia PDFs e marque matérias estudadas.'}
            </p>
          </div>

          {/* Explicit Portals Selector */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 hidden sm:inline">
              Perfil Ativo:
            </span>
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-300 shadow-xs">
              <button
                onClick={() => handleRoleChange('aluno')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                  userRole === 'aluno'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-slate-700 hover:text-black hover:bg-slate-200'
                }`}
                title="Acessar o Portal do Aluno"
              >
                <UserCheck className="h-4 w-4" />
                <span>🎓 Acesso Aluno</span>
              </button>

              <button
                onClick={() => handleRoleChange('professor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
                  userRole === 'professor'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-slate-700 hover:text-black hover:bg-slate-200'
                }`}
                title="Acessar o Portal do Professor"
              >
                <BookOpen className="h-4 w-4" />
                <span>👨‍🏫 Acesso Professor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Portal Environment Description */}
        {userRole === 'professor' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white font-black shrink-0 shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-black">
                      Painel Pedagógico do Professor
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Modo Gestão Ativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Cadastre conteúdos com videoaulas em áudio MP3, apostilas em PDF e teste a tradução em Libras com o Boneco do VLibras.
                  </p>
                </div>
              </div>

              {/* Action Buttons for Teacher */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setIsTeacherModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black transition shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Cadastrar Nova Aula (PDFs & MP3)</span>
                </button>

                <button
                  onClick={() => handleQuickTriggerVLibras('Testando tradução de aula no Boneco do VLibras')}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-300 text-xs font-bold transition shadow-xs"
                  title="Abrir o Boneco do VLibras para testar tradução"
                >
                  <Bot className="h-4 w-4 text-black" />
                  <span>Testar Boneco VLibras</span>
                </button>

                <button
                  onClick={handleResetLessons}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-300 text-xs font-bold transition"
                  title="Restaurar aulas modelo padrão com PDFs e MP3s"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white font-black shrink-0 shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-black">
                      Portal Exclusivo do Estudante
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Modo Aluno
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Acesse suas aulas, ouça as videoaulas em MP3 acompanhadas pelo Boneco 3D do VLibras e faça download dos materiais em PDF.
                  </p>
                </div>
              </div>

              {/* Quick Progress Indicator */}
              <div className="flex items-center gap-3 text-xs bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-600 font-semibold">Progresso de Estudo:</span>
                <span className="font-black text-black">
                  {completedCount} de {totalLessons} concluídas
                </span>
                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all"
                    style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total de Aulas
            </span>
            <span className="text-xl font-black text-black mt-0.5 block">
              {totalLessons}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Videoaulas em MP3
            </span>
            <span className="text-xl font-black text-black mt-0.5 block flex items-center gap-1.5">
              <FileAudio className="h-4 w-4 text-black" />
              {totalMp3Count}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Arquivos PDF Anexados
            </span>
            <span className="text-xl font-black text-black mt-0.5 block flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-black" />
              {totalPdfsCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {userRole === 'professor' ? 'Disciplinas Ativas' : 'Aulas Estudadas'}
            </span>
            <span className="text-xl font-black text-black mt-0.5 block">
              {userRole === 'professor' ? availableSubjects.length - 1 : completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, matéria, professor ou palavras-chave..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-black text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-black"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Media Type Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setSelectedMediaType('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedMediaType === 'todos'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              Todos os Materiais
            </button>
            <button
              onClick={() => setSelectedMediaType('com-mp3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedMediaType === 'com-mp3'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
              title="Filtrar aulas com Videoaulas em MP3"
            >
              <FileAudio className="h-3 w-3" />
              <span>Com MP3</span>
            </button>
            <button
              onClick={() => setSelectedMediaType('com-pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                selectedMediaType === 'com-pdf'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
              title="Filtrar aulas com Apostilas em PDF"
            >
              <FileText className="h-3 w-3" />
              <span>Com PDF</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setSelectedStatus('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedStatus === 'todos'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              Status: Todos
            </button>
            <button
              onClick={() => setSelectedStatus('pendentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedStatus === 'pendentes'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              A Estudar
            </button>
            <button
              onClick={() => setSelectedStatus('concluidas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedStatus === 'concluidas'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              Concluídas
            </button>
          </div>
        </div>

        {/* Subject Category Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-500 font-bold shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Matéria:
          </span>
          {availableSubjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap border ${
                selectedSubject === sub
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-black'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons List Grid */}
      {filteredLessons.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-black">Nenhuma aula encontrada</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Não encontramos aulas com os filtros selecionados. Altere os termos da busca ou adicione novos materiais.
          </p>
          {userRole === 'professor' && (
            <button
              onClick={() => {
                setEditingLesson(null);
                setIsTeacherModalOpen(true);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold shadow-xs"
            >
              + Cadastrar Nova Aula
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs hover:border-black transition flex flex-col justify-between space-y-4 group"
            >
              {/* Card Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-black border border-slate-300">
                    {lesson.subject}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {lesson.isCompleted ? (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" /> Concluída
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleComplete(lesson.id)}
                        className="text-[10px] font-bold text-slate-500 hover:text-black flex items-center gap-1"
                        title="Marcar como concluída"
                      >
                        <Circle className="h-3 w-3" /> Pendente
                      </button>
                    )}
                  </div>
                </div>

                <h3 
                  onClick={() => setActiveDetailLesson(lesson)}
                  className="text-base font-black text-black leading-snug line-clamp-2 cursor-pointer group-hover:underline"
                >
                  {lesson.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {lesson.summary || lesson.fullContent}
                </p>
              </div>

              {/* Videoaulas em MP3 Preview & VLibras Shortcut */}
              {lesson.mp3Lessons && lesson.mp3Lessons.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <FileAudio className="h-3.5 w-3.5 text-black" />
                      Videoaula em MP3 ({lesson.mp3Lessons.length})
                    </span>

                    <button
                      onClick={() => handleQuickTriggerVLibras(lesson.mp3Lessons![0].transcript)}
                      className="text-[11px] font-extrabold text-black hover:underline flex items-center gap-1"
                      title="Traduzir o áudio com o Boneco do VLibras"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Boneco VLibras</span>
                    </button>
                  </div>

                  {lesson.mp3Lessons.slice(0, 1).map((mp3) => (
                    <div
                      key={mp3.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs gap-2"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-black truncate max-w-[150px]">
                          {mp3.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({mp3.durationFormatted})
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveMp3Modal({ mp3, lessonTitle: lesson.title })}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black text-white hover:bg-slate-800 text-[11px] font-black shadow-2xs"
                        title="Ouvir videoaula e traduzir com o Boneco do VLibras"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Ouvir</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* PDF Attachments Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {lesson.date}
                  </span>
                  <span className="text-slate-800 font-bold truncate max-w-[140px]">
                    {lesson.teacherName}
                  </span>
                </div>

                {lesson.pdfFiles && lesson.pdfFiles.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {lesson.pdfFiles.slice(0, 2).map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-black shrink-0" />
                          <span className="font-bold text-black truncate max-w-[150px]">
                            {pdf.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setActivePdfViewer({ file: pdf, lessonTitle: lesson.title })}
                            className="p-1 rounded-md bg-white hover:bg-slate-200 text-black border border-slate-300"
                            title="Visualizar PDF"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <a
                            href={pdf.dataUrl}
                            download={pdf.name}
                            className="p-1 rounded-md bg-white hover:bg-slate-200 text-black border border-slate-300"
                            title="Baixar PDF"
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {lesson.pdfFiles.length > 2 && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        + {lesson.pdfFiles.length - 2} outros arquivos PDF
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Sem arquivo PDF anexado
                    </span>
                  </div>
                )}
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveDetailLesson(lesson)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Abrir Aula & Estudo</span>
                </button>

                {/* Teacher Administration Controls (visible only in Teacher Access) */}
                {userRole === 'professor' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
                        setIsTeacherModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 transition"
                      title="Editar Aula, PDFs e Videoaulas MP3"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                      title="Excluir aula"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Teacher Create/Edit Lesson */}
      {isTeacherModalOpen && (
        <TeacherLessonModal
          lessonToEdit={editingLesson}
          onSave={handleSaveLesson}
          onClose={() => {
            setIsTeacherModalOpen(false);
            setEditingLesson(null);
          }}
        />
      )}

      {/* MODAL 2: Student Lesson Detail */}
      {activeDetailLesson && (
        <StudentLessonDetailModal
          lesson={activeDetailLesson}
          onClose={() => setActiveDetailLesson(null)}
          onToggleComplete={handleToggleComplete}
          onUpdateNotes={handleUpdateNotes}
          onOpenPdf={(file, title) => setActivePdfViewer({ file, lessonTitle: title })}
          speak={speak}
          isSpeaking={isSpeaking}
          cancelSpeak={cancelSpeak}
        />
      )}

      {/* MODAL 3: PDF Viewer Modal */}
      {activePdfViewer && (
        <PdfViewerModal
          file={activePdfViewer.file}
          lessonTitle={activePdfViewer.lessonTitle}
          onClose={() => setActivePdfViewer(null)}
          onSpeakText={speak}
        />
      )}

      {/* MODAL 4: Dedicated MP3 Videoaula Player with VLibras */}
      {activeMp3Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl my-auto rounded-3xl bg-white border border-slate-300 shadow-2xl p-6 text-black space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileAudio className="h-6 w-6 text-black" />
                <h3 className="text-base font-black text-black">
                  Reprodução de Videoaula & Tradução em Libras
                </h3>
              </div>
              <button
                onClick={() => setActiveMp3Modal(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition"
              >
                Fechar
              </button>
            </div>

            <Mp3VideoLessonPlayer
              mp3Lesson={activeMp3Modal.mp3}
              lessonTitle={activeMp3Modal.lessonTitle}
              onClose={() => setActiveMp3Modal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

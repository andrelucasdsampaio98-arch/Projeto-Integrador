import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Eye, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Bookmark, 
  ExternalLink,
  Share2,
  BookOpen,
  Calendar,
  User,
  Check,
  Type,
  FileAudio,
  Bot
} from 'lucide-react';
import { Lesson, LessonPdfFile } from '../types';
import { Mp3VideoLessonPlayer } from './Mp3VideoLessonPlayer';

interface StudentLessonDetailModalProps {
  lesson: Lesson;
  onClose: () => void;
  onToggleComplete: (lessonId: string) => void;
  onUpdateNotes: (lessonId: string, notes: string) => void;
  onOpenPdf: (file: LessonPdfFile, lessonTitle: string) => void;
  speak: (text: string) => void;
  isSpeaking: boolean;
  cancelSpeak: () => void;
}

export const StudentLessonDetailModal: React.FC<StudentLessonDetailModalProps> = ({
  lesson,
  onClose,
  onToggleComplete,
  onUpdateNotes,
  onOpenPdf,
  speak,
  isSpeaking,
  cancelSpeak
}) => {
  const [notes, setNotes] = useState(lesson.studentNotes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [readingTextSize, setReadingTextSize] = useState<'normal' | 'grande' | 'gigante'>('normal');

  const handleSaveNotes = () => {
    onUpdateNotes(lesson.id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleReadLessonAloud = () => {
    if (isSpeaking) {
      cancelSpeak();
    } else {
      const textToRead = `Aula: ${lesson.title}. Disciplina: ${lesson.subject}. Professor: ${lesson.teacherName}. Resumo: ${lesson.summary}. Conteúdo da aula: ${lesson.fullContent}`;
      speak(textToRead);
    }
  };

  const handleTriggerVLibras = () => {
    // Attempt to invoke the government VLibras widget button
    const accessBtn = document.querySelector('[vw-access-button]') as HTMLElement;
    if (accessBtn) {
      accessBtn.click();
    }
    // Also copy lesson text to clipboard so student can paste into VLibras if desired
    navigator.clipboard.writeText(lesson.accessibleTranscript || lesson.title);
  };

  const getFontClass = () => {
    switch (readingTextSize) {
      case 'gigante':
        return 'text-lg sm:text-xl leading-relaxed';
      case 'grande':
        return 'text-base sm:text-lg leading-relaxed';
      default:
        return 'text-sm sm:text-base leading-relaxed';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl my-auto rounded-3xl bg-white border border-slate-300 shadow-2xl text-black overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white font-black shadow-xs">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-300">
                  {lesson.subject}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {lesson.date}
                </span>
              </div>
              <h2 className="text-lg font-black text-black">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleComplete(lesson.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                lesson.isCompleted
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white hover:bg-slate-100 text-black border-slate-300'
              }`}
              title="Marcar aula como concluída"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{lesson.isCompleted ? 'Estudada ✓' : 'Marcar Concluída'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Accessibility Action Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-500" />
              Docente:
            </span>
            <span className="font-extrabold text-black">{lesson.teacherName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TTS Read Aloud */}
            <button
              onClick={handleReadLessonAloud}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition border ${
                isSpeaking 
                  ? 'bg-rose-600 text-white border-rose-700' 
                  : 'bg-white hover:bg-slate-100 text-black border-slate-300'
              }`}
              title="Ouvir o texto da aula narrado por voz sintética"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>Parar Áudio</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Ouvir Aula em Voz Alta</span>
                </>
              )}
            </button>

            {/* VLibras Avatar Trigger */}
            <button
              onClick={handleTriggerVLibras}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-black border border-slate-300 font-bold transition"
              title="Abrir o Boneco 3D do Governo Federal (VLibras) para tradução de Libras"
            >
              <span>🇧🇷</span>
              <span>Boneco 3D Gov (VLibras)</span>
            </button>

            {/* Font size toggle */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-0.5">
              <button
                onClick={() => setReadingTextSize('normal')}
                className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                  readingTextSize === 'normal' ? 'bg-black text-white' : 'text-slate-700'
                }`}
                title="Tamanho Normal"
              >
                A
              </button>
              <button
                onClick={() => setReadingTextSize('grande')}
                className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                  readingTextSize === 'grande' ? 'bg-black text-white' : 'text-slate-700'
                }`}
                title="Tamanho Grande"
              >
                A+
              </button>
              <button
                onClick={() => setReadingTextSize('gigante')}
                className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                  readingTextSize === 'gigante' ? 'bg-black text-white' : 'text-slate-700'
                }`}
                title="Tamanho Gigante"
              >
                A++
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Summary Card */}
          {lesson.summary && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-black mb-1">
                Resumo da Aula
              </h3>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                {lesson.summary}
              </p>
            </div>
          )}

          {/* Accessible Transcript if available */}
          {lesson.accessibleTranscript && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-950">
                  Guia Acessível em Linguagem Direta (Fácil Leitura e Libras)
                </h3>
              </div>
              <p className="text-sm font-bold text-blue-900 leading-relaxed">
                {lesson.accessibleTranscript}
              </p>
            </div>
          )}

          {/* SECTION: VIDEOAULAS EM MP3 & TRADUÇÃO COM BONECO DO VLIBRAS */}
          {lesson.mp3Lessons && lesson.mp3Lessons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white font-bold">
                    <FileAudio className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-black">
                      Videoaulas em Áudio MP3 & Tradução em Libras ({lesson.mp3Lessons.length})
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Ouça a explicação da aula e traduza para Libras com o Boneco do VLibras
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {lesson.mp3Lessons.map((mp3) => (
                  <Mp3VideoLessonPlayer
                    key={mp3.id}
                    mp3Lesson={mp3}
                    lessonTitle={lesson.title}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION: ATTACHED PDF FILES */}
          <div className="p-5 rounded-2xl bg-white border border-slate-300 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white font-bold">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black">
                    Arquivos em PDF para Estudo ({lesson.pdfFiles.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Apostilas, resumos e exercícios anexados pelo professor
                  </p>
                </div>
              </div>
            </div>

            {lesson.pdfFiles.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Nenhum arquivo PDF anexado para esta aula.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lesson.pdfFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-xs">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-black truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tamanho: <span className="font-bold text-black">{file.sizeFormatted}</span> &bull; {file.uploadedAt}
                        </p>
                      </div>
                    </div>

                    {file.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {file.description}
                      </p>
                    )}

                    {/* PDF Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      <button
                        onClick={() => onOpenPdf(file, lesson.title)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Visualizar PDF</span>
                      </button>

                      <a
                        href={file.dataUrl}
                        download={file.name}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition"
                        title="Baixar arquivo PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Baixar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Lesson Text Content */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-black border-b border-slate-200 pb-1">
              Conteúdo Completo da Aula
            </h3>
            <div className={`p-5 rounded-2xl bg-white border border-slate-200 font-sans font-medium text-black whitespace-pre-wrap ${getFontClass()}`}>
              {lesson.fullContent}
            </div>
          </div>

          {/* Tags */}
          {lesson.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Tópicos:</span>
              {lesson.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-black text-xs font-bold border border-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Student Personal Study Notes */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-black" />
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  Minhas Anotações & Dúvidas sobre a Aula
                </h3>
              </div>
              {notesSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Anotações salvas!
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escreva aqui suas observações, dúvidas para perguntar ao professor ou resumos..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-black text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black resize-y"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
              >
                Salvar Anotações de Estudo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

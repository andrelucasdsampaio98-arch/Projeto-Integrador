export type ActiveTab = 
  | 'estudos'
  | 'falar' 
  | 'ouvir' 
  | 'frases' 
  | 'libras' 
  | 'solucoes' 
  | 'rede' 
  | 'ajustes';

export type UserRole = 'aluno' | 'professor';

export interface UserAccount {
  id: string;
  name: string;
  matricula: string;
  role: UserRole;
  email?: string;
  turmaOuArea?: string;
  createdAt: string;
}

export interface LessonPdfFile {
  id: string;
  name: string;
  sizeFormatted: string;
  dataUrl: string;
  uploadedAt: string;
  pageCount?: number;
  description?: string;
}

export interface LessonMp3Video {
  id: string;
  title: string;
  fileName: string;
  dataUrl: string; // Base64 audio/mp3 data URL or blob
  durationFormatted: string;
  fileSizeFormatted: string;
  uploadedAt: string;
  transcript: string;
  librasInstructions?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  teacherName: string;
  date: string;
  summary: string;
  fullContent: string;
  accessibleTranscript?: string;
  videoUrl?: string;
  pdfFiles: LessonPdfFile[];
  mp3Lessons?: LessonMp3Video[];
  isCompleted?: boolean;
  studentNotes?: string;
  tags: string[];
}

export type ContrastTheme = 'padrao' | 'amarelo-preto' | 'preto-branco' | 'azul-ciano';

export type FontSize = 'normal' | 'grande' | 'gigante';

export interface AppSettings {
  fontSize: FontSize;
  contrastTheme: ContrastTheme;
  voiceRate: number; // 0.5 to 2.0
  voicePitch: number; // 0.5 to 1.5
  selectedVoiceURI: string;
  vibrationEnabled: boolean;
  accessibleFont: boolean;
  screenWakeLock: boolean;
}

export interface QuickPhrase {
  id: string;
  category: 'basico' | 'aula' | 'suporte' | 'urgencia';
  text: string;
  iconName: string;
  isCustom?: boolean;
}

export interface LibrasSign {
  id: string;
  word: string;
  category: 'alfabeto' | 'numero' | 'social' | 'aula' | 'tecnologia' | 'emergencia';
  letter?: string;
  description: string;
  handShape: string;
  movement: string;
  exampleSentence?: string;
  svgHandId?: string;
}

export interface SystemSolutionGuide {
  id: string;
  title: string;
  category: 'windows' | 'android' | 'libras' | 'videochamada' | 'apresentacao';
  shortDesc: string;
  shortcut?: string;
  badge: string;
  requirements: string;
  steps: string[];
  labTip: string;
  iconName: string;
}

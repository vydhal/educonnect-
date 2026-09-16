export type UserRole = 'PROFESSOR' | 'ALUNO' | 'ESCOLA' | 'COMUNIDADE' | 'ADMIN' | 'GESTOR' | 'COORDENADOR' | 'SUPERVISOR' | 'EQUIPE_ESCOLAR';

export interface Post {
  id: string;
  author: string;
  authorId: string;
  authorTitle?: string;
  authorAvatar?: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  likes: number;
  comments: number;
  commentsCount?: number;
  shares?: number;
  image?: string;
  images?: string[];
  isVerified?: boolean;
  status?: 'PUBLICADO' | 'PENDENTE' | 'REPROVADO';
  classId?: string;
  className?: string;
  moderation?: {
    id: string;
    status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
    reason?: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface ModerationItem {
  id: string;
  postId?: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  authorRole?: string;
  school: string;
  className?: string;
  registration?: string;
  date: string;
  contentPreview: string;
  images?: string[];
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
  reason?: string;
  moderatorName?: string;
  post?: any;
  moderator?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  school?: string;
  schools?: { id: string, name: string }[];
  schoolId?: string;
  registration?: string;
  classId?: string;
  className?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'ACESSO' | 'POSTAGEM' | 'MODERACAO' | 'SISTEMA' | 'USUARIO';
  status: 'SUCESSO' | 'FALHA' | 'PENDENTE' | 'APROVADO' | 'REPROVADO';
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  userEmail?: string | null;
  registration?: string | null;
  classId?: string | null;
  className?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}


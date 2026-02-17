
export type UserRole = 'PROFESSOR' | 'ALUNO' | 'ESCOLA' | 'COMUNIDADE' | 'ADMIN';

export interface Post {
  id: string;
  author: string;
  authorTitle: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  image?: string;
  isVerified?: boolean;
}

export interface ModerationItem {
  id: string;
  author: string;
  school: string;
  date: string;
  contentPreview: string;
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
}

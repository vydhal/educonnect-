
export type UserRole = 'PROFESSOR' | 'ALUNO' | 'ESCOLA' | 'COMUNIDADE' | 'ADMIN';

export interface Post {
  id: string;
  author: string;
  authorId: string;
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
  author: string;
  school: string;
  date: string;
  contentPreview: string;
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  school?: string;
  createdAt?: string;
}


# Roadmap do Projeto EduConnect

## Visão Geral
Transformar o EduConnect em uma plataforma de rede social educacional completa, similar ao LinkedIn, focada na conexão entre escolas, professores, alunos e comunidade.

## Fases do Projeto

### Fase 1: Fundação e Autenticação (Concluído) ✅
- [x] Configuração do Ambiente (Backend Node.js/Prisma, Frontend React/Vite/Tailwind).
- [x] Banco de Dados PostgreSQL configurado.
- [x] Sistema de Autenticação (Login, Registro, JWT).
- [x] Perfis de Usuário básicos (Aluno, Professor, Escola, Comunidade).

### Fase 2: Gestão Administrativa (Concluído) ✅
- [x] Painel Administrativo com Sidebar Persistente.
- [x] Gestão de Usuários (CRUD Completo).
- [x] Importação/Exportação de Usuários via CSV.
- [x] Moderação de Conteúdo (Estrutura básica).

### Fase 3: Rede Social e Engajamento (Concluído - Core 🚀)
**Objetivo:** Implementar o "Core" da rede social com dados reais.

#### 3.1 Feed de Notícias
- [x] API de Posts (Criar, Listar, Excluir).
- [x] Frontend: Conectar `FeedPage` à API Real.
- [x] Funcionalidade de "Criar Postagem" (Texto + Imagem).

#### 3.2 Interações
- [x] Sistema de Curtidas (Likes).
- [x] Sistema de Comentários (API + UI).
- [ ] Compartilhamento (Visual/Link).

#### 3.3 Conexões (Networking)
- [x] Seguir/Deixar de Seguir usuários.
- [x] Listar Seguidores e Seguindo.
- [x] Sugestões de Conexão na `NetworkPage`.

### Fase 4: Gestão Escolar e Projetos (Futuro)
- [ ] Páginas de Perfil das Escolas.
- [ ] Vitrine de Projetos dos Alunos.
- [ ] Sistema de Mensagens Diretas.

## Status Atual
Estamos no início da **Fase 3**. A infraestrutura está pronta e o Admin Panel está funcional. Agora precisamos dar vida ao Feed e às interações sociais.

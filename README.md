# 🎓 EduConnect - Sistema de Rede Social para Educação

Uma plataforma inovadora conectando professores, alunos, escolas e comunidades em um único espaço de colaboração educacional.

## 🚀 Características

- **Autenticação JWT** - Login e registro seguro com múltiplos papéis
- **Feed Social** - Compartilhe conteúdo, comentários e reações
- **Networking** - Conecte-se com professores, alunos e instituições
- **Gerenciamento de Projetos** - Crie e colabore em projetos educacionais
- **Painel de Moderação** - Gerenciamento de conteúdo
- **Admin Dashboard** - Controle total da plataforma
- **Dados Reais** - Integração completa com PostgreSQL e Prisma

## 🛠 Tecnologias

### Frontend
- React 19
- TypeScript
- Vite
- React Router

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcryptjs

### DevOps
- Docker & Docker Compose
- PostgreSQL Container
- Pronto para Portainer

## 📦 Estrutura do Projeto

```
educonnect/
├── frontend/              # Aplicação React
│   ├── pages/            # Páginas da aplicação
│   ├── api.ts            # Cliente API
│   ├── App.tsx           # Componente raiz
│   └── package.json
├── backend/              # API Express
│   ├── src/
│   │   ├── routes/       # Rotas da API
│   │   ├── middleware/   # Autenticação e tratamento de erros
│   │   ├── utils/        # Utilitários
│   │   └── server.ts     # Servidor principal
│   ├── prisma/           # Schema e migrations
│   └── package.json
└── docker-compose.yml    # Orquestração completa
```

## 🚀 Iniciando o Projeto

### Opção 1: Com Docker Compose (Recomendado)

```bash
# Navegar para a pasta do projeto
cd educonnect

# Iniciar todos os containers
docker-compose up --build

# Acesse:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# PostgreSQL: localhost:5432
```

### Opção 2: Desenvolvimento Local

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

**Frontend (outro terminal):**
```bash
cd frontend
npm install
npm run dev
```

## 📊 Dados de Teste

### Contas Padrão

| Email | Senha | Função |
|-------|-------|--------|
| admin@educonnect.com | admin123 | Admin |
| prof.carlos@educonnect.com | prof123 | Professor |
| prof.maria@educonnect.com | prof123 | Professor |
| joao@educonnect.com | aluno123 | Aluno |
| julia@educonnect.com | aluno123 | Aluna |
| raul.cordula@educonnect.com | escola123 | Escola |

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil autenticado

### Posts
- `GET /api/posts` - Listar feed
- `POST /api/posts` - Criar novo post
- `GET /api/posts/:id` - Obter post
- `POST /api/posts/:id/like` - Curtir post
- `POST /api/posts/:id/comments` - Adicionar comentário
- `DELETE /api/posts/:id` - Deletar post

### Usuários
- `GET /api/users/:id` - Perfil do usuário
- `POST /api/users/:id/follow` - Seguir usuário
- `GET /api/users/:id/followers` - Listar seguidores
- `GET /api/users/:id/following` - Listar seguindo
- `GET /api/users/search/:query` - Buscar usuários

### Moderação (Admin)
- `GET /api/moderation` - Listar para moderação
- `POST /api/moderation/flag/:postId` - Reportar post
- `PUT /api/moderation/:id/approve` - Aprovar conteúdo
- `PUT /api/moderation/:id/reject` - Rejeitar conteúdo

### Projetos
- `GET /api/projects` - Listar todos
- `POST /api/projects` - Criar projeto
- `GET /api/projects/:id` - Obter projeto
- `GET /api/projects/category/:category` - Por categoria
- `DELETE /api/projects/:id` - Deletar projeto

## 🔐 Autenticação

A aplicação usa JWT (JSON Web Tokens) com:
- Tokens com expiração de 7 dias
- Senhas criptografadas com bcryptjs
- CORS configurado para segurança
- Middleware de autenticação em rotas protegidas

## 🚀 Deploy no Portainer

### Preparação

1. Certifique-se de que todos os Dockerfiles estão presentes
2. Configure as variáveis de ambiente em produção

### Steps para Portainer

1. Acesse seu Portainer
2. **Stacks** > **Add Stack**
3. **Docker Compose**
4. Cole o conteúdo do `docker-compose.yml`
5. Configure variáveis de ambiente
6. **Deploy**

## 📊 Banco de Dados

### Schema Prisma

- **User** - Usuários com papéis (PROFESSOR, ALUNO, ESCOLA, COMUNIDADE, ADMIN)
- **Post** - Posts do feed com autor
- **Comment** - Comentários em posts
- **Like** - Curtidas em posts
- **UserFollow** - Relacionamento de seguidores
- **ModerationItem** - Itens para moderação
- **Project** - Projetos educacionais

## 🐛 Troubleshooting

### Conexão com PostgreSQL
```bash
# Verificar containers rodando
docker ps

# Ver logs do PostgreSQL
docker logs educonnect-postgres

# Ver logs do Backend
docker logs educonnect-backend
```

### Resetar banco de dados
```bash
docker exec educonnect-backend npx prisma migrate reset
docker exec educonnect-backend npm run prisma:seed
```

### Frontend não conecta ao Backend
- Verifique se `VITE_API_URL` está correto em `.env`
- Confirme se porta 5000 do backend está aberta
- Verifique CORS no backend

## 📝 Próximas Melhorias

- [ ] Notificações em tempo real com WebSocket
- [ ] Upload de arquivos
- [ ] Busca avançada
- [ ] Cache com Redis
- [ ] Aplicativo mobile
- [ ] Testes automatizados

## 🔧 Variáveis de Ambiente

### Backend (`.env`)
```
DATABASE_URL=postgresql://educonnect:educonnect123@postgres:5432/educonnect_db
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:5000/api
```

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para educação em Campina Grande**

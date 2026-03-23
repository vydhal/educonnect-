# 🏗️ Arquitetura Técnica

O EduConnect utiliza uma arquitetura moderna baseada em containers, facilitando o desenvolvimento local e o deploy em escala.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Papel |
| :--- | :--- | :--- |
| **Frontend** | React 18+ (Vite) | Interface do usuário e lógica de estado local. |
| **Backend** | Node.js (Express) | API RESTful e lógica de negócios. |
| **Banco de Dados** | PostgreSQL 16 | Armazenamento persistente e relacional. |
| **ORM** | Prisma | Mapeamento objeto-relacional e migrações. |
| **Estilização** | Vanilla CSS + Tailwind | Design system premium e responsivo. |
| **Infra/DevOps** | Docker + Swarm | Orquestração e isolamento de ambientes. |

## 📁 Estrutura de Arquivos

*   `/backend`: Contém a API.
    *   `/src/routes`: Definição de endpoints (auth, projects, posts, etc).
    *   `/src/middleware`: Filtros de segurança e tratamento de erros.
    *   `/prisma`: Esquema do banco de dados e arquivos de migração.
*   `/frontend`: Contém a aplicação Web.
    *   `/pages`: Componentes de página (Login, Feed, Projects, etc).
    *   `/components`: Elementos reutilizáveis (Header, Card, Modal).
    *   `api.ts`: Cliente de comunicação com o backend.
*   `/deploy`: Arquivos de orquestração para produção (`stack.yml`).

## 📊 Modelo de Dados (Simplified ERD)

O banco de dados é gerido pelo Prisma e foca em relacionamentos sociais:
*   **User**: Entidade central com perfis diferenciados (Professor, Aluno, Escola).
*   **Project**: Postagem rica com anexos e categorias pedagógicas.
*   **Post**: Atualização social rápida com galeria de fotos.
*   **Interactions**: Tabelas de Like, Comment e Follow geram notificações dinâmicas.

## 🔒 Segurança
*   **Autenticação**: Baseada em tokens JWT (expiração de 7 dias).
*   **Criptografia**: Senhas armazenadas com hash `bcrypt`.
*   **Proxy**: Configurado para `trust proxy` (necessário para deploy seguro atrás de Traefik/Nginx).

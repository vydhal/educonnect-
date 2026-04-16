# 📜 Histórico de Versões (Changelog)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo, seguindo os padrões de versionamento semântico.

## [1.1.0] - 2026-04-16
### Adicionado
- **Busca Global**: Implementada barra de busca reativa no Header (Desktop e Mobile) para pesquisar conteúdos e pessoas.
- **Hashtags Dinâmicas**: Sistema de tags clicáveis que filtram o feed instantaneamente (#educacao, #tecnologia, etc).
- **Tópicos Recentes**: Widget interativo na barra lateral para navegação rápida por temas populares.
- **Indicador de Filtro Ativo**: UI para gerenciar e limpar filtros de busca ou hashtags.
### Corrigido
- **Persistência de Seguidores**: Resolvido falha onde o status "Seguindo" não persistia após recarregamento (uso de `optionalAuthMiddleware`).
- **Hot Reload Docker**: Configuração otimizada para desenvolvimento em tempo real sem perda de dados entre reinícios.

## [1.0.7] - 2026-03-12
### Adicionado
- Central de documentação profissional em `/docs`.
- Manuais de produto, técnico, deploy e funcionalidades.

## [1.0.6] - 2026-03-12
### Corrigido
- Ajuste definitivo no layout do modal de detalhes (organização 100% vertical).
- Comentários movidos para o final da postagem para melhor usabilidade.

## [1.0.5] - 2026-03-12
### Adicionado
- Funcionalidade de **Editar** e **Excluir** para os autores de inspirações.
- Botão "LER INSPIRAÇÃO COMPLETA" intuitivo nos cards do feed.
- Proteção de rotas no backend para garantir que apenas donos ou admins alterem conteúdo.

## [1.0.4] - 2026-03-12
### Alterado
- Expansão do modal de escrita de 850px para 1000px.
- Melhoria de espaçamento interno (padding) e ergonomia do formulário.
### Corrigido
- Validação de existência de usuário no backend para evitar erros 500 com tokens órfãos.

## [1.0.3] - 2026-03-12
### Adicionado
- Habilitação de `trust proxy` no Express para funcionamento correto atrás de balanceadores.
### Alterado
- Substituição do editor rico `react-quill` pelo `react-simple-wysiwyg` para compatibilidade com React 18.
- Mudança de URLs de upload absolutas para caminhos relativos.
### Corrigido
- Fim dos erros de "Mixed Content" (HTTPS servindo HTTP).

## [1.0.2] - 2026-03-12
### Corrigido
- Ajuste no Prisma Schema: Campos da tabela Project tornados opcionais para evitar falhas de migração em bancos com dados existentes.

## [1.0.1] - 2026-03-12
### Adicionado
- Primeira versão estável pós-migração Docker.
- Implementação inicial da seção "Ideais que Inspiram".

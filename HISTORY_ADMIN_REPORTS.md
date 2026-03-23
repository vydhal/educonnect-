# Histórico de Atualizações: Dashboard Administrativo & Relatórios (EduConnect)

Este documento registra a trajetória de desenvolvimento e as escolhas técnicas feitas durante a reformulação da área analítica do portal administrativo.

## 📅 Resumo das Fases

### 1. Transição para Dados Reais (Total Dynamics)
- **Frontend (`AdminReportsPage.tsx`)**: Removido todo o uso de "mock data". A página agora consome diretamente os endpoints `/stats` (KPIs) e `/reports` (Gráficos).
- **Backend (`admin.routes.ts`)**: Implementadas consultas complexas com **Prisma ORM** para extrair:
  - Crescimento mensal de usuários e postagens.
  - Ranking de engajamento por unidade (escola/setor).
  - Nuvem de palavras baseada em hashtags reais de posts.
  - Métricas gerais de interação (curtidas + comentários).

### 2. Filtros Dinâmicos e Granularidade
- **Seletor de Período**: Adicionada funcionalidade para alternar entre janelas de tempo (30, 90 e 180 dias).
- **Filtro por Unidade**: Implementado um dropdown que permite ao administrador focar em uma escola específica.
  - Quando uma escola é selecionada, os gráficos de crescimento e KPIs refletem apenas os dados daquela instituição.
  - O ranking global de unidades é automaticamente ocultado para privilegiar a visão interna da escola.
- **Parametrização**: Sincronização de query strings entre frontend e backend (`?days=X&schoolId=Y`).

### 3. Sistema de Exportação de Dados (CSV)
- **Backend**: Nova rota `/reports/export` que gera buffers CSV com codificação **UTF-8 (BOM)** para compatibilidade perfeita com Excel (evitando bugs de acentuação).
- **Frontend**: Migração de redirecionamento simples para um fluxo de **Download via Blob**.
  - Garante que os `Authorization Headers` sejam enviados, protegendo os dados.
  - O CSV exportado respeita os filtros ativos na tela, garantindo consistência entre o que se vê e o que se baixa.

### 4. Estabilidade e Infraestrutura
- **Restauração de Rotas**: Recuperação de rotas administrativas essenciais (Gestão de Usuários e Configurações) que haviam sido impactadas durante refatorações pesadas.
- **Resolução de Conflitos (Porta 5000)**: Identificado e corrigido o erro de **404 Not Found** causado por "zumbis" do Node.js que travavam a porta e impediam o carregamento das novas rotas de relatórios.
- **Tipagem TypeScript**: Correção de erros de tipagem implícita `any[]` e melhoria das interfaces do Prisma para garantir segurança em tempo de compilação.

## 🛠️ Tecnologias Utilizadas
- **Recharts**: Para visualizações espaciais e trajetórias.
- **Prisma**: Para agregações e queries de banco de dados.
- **Express.js**: Para estruturação de rotas e middleware de administração.
- **React (TSX)**: Para interface reativa e estilizada.

---
*Documento gerado para facilitar a integração de novos modelos ou revisão técnica da trajetória do projeto.*

# 🚀 Guia de Deploy e Infraestrutura

O EduConnect foi projetado para ser "cloud-ready" e rodar preferencialmente em ambientes orquestrados com Docker Swarm ou Portainer.

## 🐳 Docker Stack

O arquivo principal de deploy é o `deploy/stack.yml`. Ele configura três serviços interdependentes:
1.  **Backend**: API Node.js rodando na porta 5000 interna.
2.  **Frontend**: Aplicação React rodando na porta 3000 interna.
3.  **Database**: Instância de PostgreSQL 16.

## 🔌 Variáveis de Ambiente Necessárias

Para o funcionamento correto, as seguintes variáveis devem ser configuradas no seu ambiente de deploy (Portainer):

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão com o banco | `postgresql://user:pass@db:5432/educonnect` |
| `JWT_SECRET` | Chave para assinar os tokens | `sua-chave-ultra-secreta` |
| `PORT` | Porta do servidor backend | `5000` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `VITE_API_URL` | URL pública da API | `https://portaledu.simplisoft.com.br/api` |

## 🌐 Configuração de Proxy (Traefik)

O sistema já está pré-configurado com labels para o **Traefik**, incluindo:
*   Redirecionamento automático HTTP -> HTTPS.
*   CORS e Trust Proxy habilitados no backend.
*   Limites de upload de arquivos ajustados para 50MB.

## 💾 Volumes e Persistência
Utilizamos volumes Docker nomeados para garantir que os dados não sejam perdidos ao reiniciar os containers:
*   `educonnect_postgres_data_v2`: Dados do banco.
*   `educonnect_uploads`: Armazenamento de imagens e anexos.

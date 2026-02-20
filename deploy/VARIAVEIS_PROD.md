# 📋 Variáveis de Ambiente para Produção (Portainer)

Configure estas variáveis na seção **Environment variables** da sua Stack no Portainer.

### 🗄️ Banco de Dados (PostgreSQL)
| Variável | Valor Recomendado | Descrição |
|----------|-------------------|-----------|
| `POSTGRES_USER` | `educonnect` | Usuário do banco de dados |
| `POSTGRES_PASSWORD` | `[SUA_SENHA_FORTE]` | Senha para o PostgreSQL |
| `POSTGRES_DB` | `educonnect_db` | Nome do banco de dados |

### 🧠 Backend API
| Variável | Valor Recomendado | Descrição |
|----------|-------------------|-----------|
| `DATABASE_URL` | `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@educonnect_db:5432/${POSTGRES_DB}?schema=public` | URL de conexão (Prisma) |
| `JWT_SECRET` | `[UM_SECRET_LONGO_E_ALEATORIO]` | Chave para assinar tokens JWT |
| `PORT` | `5000` | Porta interna do backend |
| `NODE_ENV` | `production` | Ambiente de execução |
| `FRONTEND_URL` | `https://portaledu.simplisoft.com.br` | URL principal do frontend |
| `TZ` | `America/Sao_Paulo` | Timezone do container |

### 🖼️ Frontend
| Variável | Valor Recomendado | Descrição |
|----------|-------------------|-----------|
| `VITE_API_URL` | `https://portaledu.simplisoft.com.br/api` | URL da API para o cliente |
| `TZ` | `America/Sao_Paulo` | Timezone do container |

---

> [!IMPORTANT]
> - Não esqueça de substituir `[SUA_SENHA_FORTE]` e `[UM_SECRET_LONGO_E_ALEATORIO]` por valores reais e seguros.
> - Certifique-se de que a rede `SimpliSoft` já existe no seu Docker Swarm/Host antes de subir a stack.

# 🚀 Guia de Deploy no Portainer

Este documento descreve como fazer o deploy completo do EduConnect no Portainer.

## 📋 Pré-requisitos

- Portainer instalado e rodando
- Acesso administrativo ao Portainer
- Código do EduConnect disponível (GitHub, GitLab, ou arquivo local)
- Espaço em disco suficiente para 3 containers

## 🔧 Preparação do Ambiente

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` com as variáveis necessárias:

```env
# Banco de Dados
DB_USER=educonnect
DB_PASSWORD=senha-super-segura-123
DB_NAME=educonnect_db

# JWT
JWT_SECRET=secret-jwt-super-seguro-mudarmudarprodução

# URLs
FRONTEND_URL=https://seu-dominio.com
VITE_API_URL=https://seu-dominio.com/api

# Node
NODE_ENV=production
```

### 2. Preparar o Repositório

Se usar Git, certifique-se que:
- Todos os Dockerfiles estão presentes
- `docker-compose.yml` está na raiz
- `.gitignore` está configurado

## 📝 Steps para Deploy no Portainer

### Método 1: Via Docker Compose (Recomendado)

1. **Acesse o Portainer**
   - URL: `http://seu-server:9000`
   - Faça login

2. **Navegue para Stacks**
   - Clique em **Stacks** no menu esquerdo
   - Clique em **Add Stack**

3. **Configure a Stack**
   - **Name**: `educonnect`
   - **Method**: Selecione uma das opções:
     - **Web editor**: Cole o conteúdo do `docker-compose.yml`
     - **Upload**: Envie o arquivo `docker-compose.prod.yml`
     - **Git Repository**: Aponte para seu repositório

4. **Adicione Variáveis de Ambiente**
   - Clique em **Environment variables**
   - Adicione as variáveis necessárias (veja seção anterior)

5. **Deploy**
   - Clique em **Deploy the stack**
   - Aguarde a conclusão

### Método 2: Via Containers Individuais

1. **Crie a Network**
   ```
   Networks > Create network > educonnect-network
   ```

2. **Crie o PostgreSQL**
   - Clique em **Containers** > **Create container**
   - **Image**: `postgres:16-alpine`
   - **Name**: `educonnect-postgres`
   - **Network**: `educonnect-network`
   - **Environment**:
     - `POSTGRES_USER=educonnect`
     - `POSTGRES_PASSWORD=seu-password`
     - `POSTGRES_DB=educonnect_db`
   - **Volumes**: `/var/lib/postgresql/data`

3. **Crie o Backend**
   - **Build image** a partir do `backend/Dockerfile`
   - **Name**: `educonnect-backend`
   - **Network**: `educonnect-network`
   - **Port mapping**: `5000:5000`
   - **Environment**: (veja variáveis acima)
   - **Depends on**: `educonnect-postgres`

4. **Crie o Frontend**
   - **Build image** a partir do `frontend/Dockerfile`
   - **Name**: `educonnect-frontend`
   - **Network**: `educonnect-network`
   - **Port mapping**: `3000:3000`
   - **Environment**: (veja variáveis acima)

## 🔌 Configuração de Proxy Reverso (Nginx/Apache)

Se quiser acessar via domínio único:

```nginx
# /etc/nginx/sites-available/educonnect

upstream backend {
    server localhost:5000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 SSL/TLS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --nginx -d seu-dominio.com

# Atualizar configuração Nginx com SSL
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Monitoramento no Portainer

### Visualizar Logs
1. Vá para **Containers**
2. Clique no container desejado
3. Vá para **Logs**
4. Configure filtros se necessário

### Monitorar Recursos
1. Dashboard > **Container statistics**
2. Visualize CPU, Memória, I/O

### Health Checks
- Cada container tem status
- Verde = Rodando normalmente
- Amarelo = Problema detectado
- Vermelho = Erro crítico

## 🔄 Atualizações e Manutenção

### Atualizar a Aplicação

1. **Via Git (recomendado)**
   - Vá para a Stack
   - Clique em **Pull and redeploy**
   - Selecione a branch

2. **Manualmente**
   - Remove containers antigos
   - Crie novos com código atualizado

### Backup do Banco de Dados

```bash
# Executar dentro do container
docker exec educonnect-postgres pg_dump -U educonnect -d educonnect_db > backup.sql

# Copiar para host
docker cp educonnect-postgres:/backup.sql ./backup.sql
```

### Restaurar Banco de Dados

```bash
# Copiar arquivo para container
docker cp backup.sql educonnect-postgres:/backup.sql

# Restaurar
docker exec -i educonnect-postgres psql -U educonnect -d educonnect_db < backup.sql
```

## 🐛 Troubleshooting

### Containers não iniciam
```bash
# Ver logs detalhados
docker logs educonnect-backend
docker logs educonnect-frontend
docker logs educonnect-postgres
```

### Erro de conexão ao banco
- Verifique se PostgreSQL está rodando
- Confirme se credenciais estão corretas
- Teste conectividade: `psql -h localhost -U educonnect`

### Frontend não carrega
- Verifique CORS no backend
- Confirme se `VITE_API_URL` está correto
- Cheque porta 3000

### Performance baixa
- Aumentar recursos (CPU/Memória) no container
- Adicionar cache (Redis)
- Ativar compressão gzip

## 🔐 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET mudado e forte
- [ ] Senhas do banco de dados complexas
- [ ] HTTPS/SSL habilitado
- [ ] Firewall configurado
- [ ] Backups regulares
- [ ] Logs monitorados
- [ ] Atualizações de imagens Docker
- [ ] Limite de recursos configurado

### Endpoints Protegidos

Proteja endpoints sensíveis com rate limiting:

```bash
# Exemplo com Nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/auth {
    limit_req zone=api_limit burst=20;
    proxy_pass http://backend;
}
```

## 📈 Escalabilidade Futura

Para escalar a aplicação:

1. **Load Balancer**: Adicionar múltiplas instâncias do backend
2. **Cache**: Redis para sessões e cache
3. **CDN**: Para servir assets estáticos
4. **Database**: Replicação PostgreSQL para HA
5. **Containers**: Orquestração com Kubernetes

## 📞 Suporte e Recursos

- Documentação Portainer: https://docs.portainer.io
- Docker Compose: https://docs.docker.com/compose
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs

---

**Desenvolvido com ❤️ para educação**

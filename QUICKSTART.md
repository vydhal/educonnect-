# 🚀 QUICKSTART - EduConnect

## ⏱️ 2 Minutos para Iniciar

### Pré-requisito
- ✅ Docker instalado (ou continue sem ele para rodar local)

### Opção 1: Docker (Recomendado) - 30 segundos

```bash
cd educonnect
docker-compose up --build
```

Pronto! Aguarde mensagens de sucesso:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Opção 2: Local sem Docker - 2 minutos

#### Terminal 1 - Backend
```bash
cd backend
npm install        # Já feito, pule se não for primeira vez
npm run dev        # Inicia em http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm install        # Já feito, pule se não for primeira vez
npm run dev        # Inicia em http://localhost:3000
```

---

## 🔑 Login com Contas de Teste

| Email | Senha | Acesso |
|-------|-------|--------|
| admin@educonnect.com | admin123 | Admin Dashboard |
| prof.carlos@educonnect.com | prof123 | Feed Social |
| joao@educonnect.com | aluno123 | Feed Social |

---

## 🎯 O que Testar

1. **Login** - Use admin@educonnect.com / admin123
2. **Feed** - Crie posts, curta, comente
3. **Networking** - Siga usuários
4. **Projetos** - Crie projetos educacionais
5. **Admin** - Vá para /admin para moderar conteúdo

---

## 🛑 Para Parar

### Docker
```bash
docker-compose down
```

### Local
- Terminal: `Ctrl+C` em cada um

---

## 📊 Verificar Status

```bash
# Ver containers rodando
docker ps

# Ver logs
docker logs educonnect-backend
docker logs educonnect-frontend

# Parar container específico
docker stop educonnect-backend
```

---

## 🔗 URLs Importantes

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

---

## ⚠️ Problemas Comuns

**"Porta 5000 já em uso"**
```bash
docker ps
docker stop <container>
```

**"Conexão recusada ao backend"**
- Verifique se está rodando: `docker ps`
- Veja logs: `docker logs educonnect-backend`

**"Erro de banco de dados"**
```bash
docker-compose down -v
docker-compose up --build
```

---

## 📚 Próximas Leituras

- `README.md` - Documentação completa
- `SUMMARY.md` - Resumo do projeto
- `PORTAINER_DEPLOY.md` - Deploy em produção

---

**Pronto! O EduConnect está rodando! 🎉**

# 🛳️ Comandos para Build e Push de Imagens

Siga estes passos para gerar as imagens e enviá-las para o seu registro.

### 1. Login no Docker Hub (ou seu registro)
Antes de começar, certifique-se de estar logado:
```bash
docker login
```

### 2. Build e Push do Backend
Execute estes comandos na raiz do projeto:
```bash
# Build da imagem do backend
docker build -t vydhal/educonnect-backend:latest ./backend

# Enviar para o registro
docker push vydhal/educonnect-backend:latest
```

### 3. Build e Push do Frontend
Execute estes comandos na raiz do projeto:
```bash
# Build da imagem do frontend
docker build -t vydhal/educonnect-frontend:latest ./frontend

# Enviar para o registro
docker push vydhal/educonnect-frontend:latest
```

---

### 💡 Dica: Script de Automação (Windows/PowerShell)
Você pode criar um arquivo `.ps1` com o seguinte conteúdo para automatizar:

```powershell
Write-Host "🚀 Iniciando Build das Imagens..." -ForegroundColor Cyan

# Backend
Write-Host "📦 Building Backend..."
docker build -t vydhal/educonnect-backend:latest ./backend
docker push vydhal/educonnect-backend:latest

# Frontend
Write-Host "📦 Building Frontend..."
docker build -t vydhal/educonnect-frontend:latest ./frontend
docker push vydhal/educonnect-frontend:latest

Write-Host "✅ Processo concluído!" -ForegroundColor Green
```

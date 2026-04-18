# 🚀 Script de Deploy EduConnect para o Docker Hub
# Usuário: cayquesilva

$DOCKER_USER = "cayquesilva"
$VERSION_FILE = "VERSION"
$DEFAULT_API_URL = "https://api.educonnect.portaleducampina.com.br/api"

Write-Host "--- EduConnect Deployment Tool ---" -ForegroundColor Yellow

# 1. Gerenciar Versão
if (Test-Path $VERSION_FILE) {
    $CURRENT_VERSION = (Get-Content $VERSION_FILE).Trim()
}
else {
    $CURRENT_VERSION = "0.0.0"
}

Write-Host "Versão atual detectada: $CURRENT_VERSION"

# Função para atualizar a versão (ex: 1.1.0 -> 1.1.1)
function Update-AppVersion($old) {
    $parts = $old.Split('.')
    if ($parts.Count -lt 3) { return "1.0.0" }
    $parts[2] = [int]$parts[2] + 1
    return $parts -join '.'
}

$NEXT_VERSION = Update-AppVersion $CURRENT_VERSION

# Escolha da Versão
$VERSION = Read-Host "Digite a nova versão [Padrão: $NEXT_VERSION]"
if ([string]::IsNullOrWhiteSpace($VERSION)) {
    $VERSION = $NEXT_VERSION
}

# 2. Configurações de Build
$API_URL = Read-Host "Digite a URL da API para o Frontend [Padrão: $DEFAULT_API_URL]"
if ([string]::IsNullOrWhiteSpace($API_URL)) {
    $API_URL = $DEFAULT_API_URL
}

# Escolha do Componente
Write-Host "`nO que você deseja subir?"
Write-Host "1 - Apenas o Frontend"
Write-Host "2 - Apenas o Backend"
Write-Host "3 - Ambos (Frontend e Backend)"
$CHOICE = Read-Host "Digite sua escolha (1, 2 ou 3)"

# -----------------------------------------------------------------------------
# EXECUÇÃO BACKEND
# -----------------------------------------------------------------------------
if ($CHOICE -eq "2" -or $CHOICE -eq "3") {
    $B_IMG = "$DOCKER_USER/educonnect-backend"
    
    Write-Host "`n>>> Iniciando build do Backend [$VERSION]..." -ForegroundColor Cyan
    docker build -t "$B_IMG`:$VERSION" -t "$B_IMG`:latest" ./backend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ">>> Enviando Backend para o Docker Hub..." -ForegroundColor Yellow
        docker push "$B_IMG`:$VERSION"
        docker push "$B_IMG`:latest"
    }
    else {
        Write-Host "!!! Erro fatal no build do Backend" -ForegroundColor Red
        exit 1
    }
}

# -----------------------------------------------------------------------------
# EXECUÇÃO FRONTEND
# -----------------------------------------------------------------------------
if ($CHOICE -eq "1" -or $CHOICE -eq "3") {
    $F_IMG = "$DOCKER_USER/educonnect-frontend"
    
    Write-Host "`n>>> Iniciando build do Frontend [$VERSION]..." -ForegroundColor Cyan
    Write-Host "Usando API: $API_URL" -ForegroundColor Gray
    
    docker build --build-arg VITE_API_URL="$API_URL" -t "$F_IMG`:$VERSION" -t "$F_IMG`:latest" ./frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ">>> Enviando Frontend para o Docker Hub..." -ForegroundColor Yellow
        docker push "$F_IMG`:$VERSION"
        docker push "$F_IMG`:latest"
    }
    else {
        Write-Host "!!! Erro fatal no build do Frontend" -ForegroundColor Red
        exit 1
    }
}

# -----------------------------------------------------------------------------
# CONCLUSÃO
# -----------------------------------------------------------------------------

# Salvar nova versão
$VERSION | Out-File -FilePath $VERSION_FILE -Encoding utf8

Write-Host "`n✅ PROCESSO FINALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "Sua nova versão é: $VERSION" -ForegroundColor Cyan
Write-Host "DICA: O Docker Hub agora possui as tags [$VERSION] e [latest] atualizadas."
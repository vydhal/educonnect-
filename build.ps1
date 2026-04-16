# Script para buildar e enviar as imagens para o Docker Hub
$DEFAULT_VERSION = "1.1.0"

Write-Host "--- EduConnect Deployment Tool ---"

# Escolha da Versao
$VERSION = Read-Host "Digite a versao que deseja subir [Padrao: $DEFAULT_VERSION]"
if ([string]::IsNullOrWhiteSpace($VERSION)) {
    $VERSION = $DEFAULT_VERSION
}

# Escolha do Componente
Write-Host ""
Write-Host "O que voce deseja subir?"
Write-Host "1 - Apenas o Frontend"
Write-Host "2 - Apenas o Backend"
Write-Host "3 - Ambos (Frontend e Backend)"
$CHOICE = Read-Host "Digite sua escolha (1, 2 ou 3)"

# Execucao Backend
if ($CHOICE -eq "2" -or $CHOICE -eq "3") {
    Write-Host ""
    Write-Host ">>> Iniciando build do Backend: $VERSION" -ForegroundColor Cyan
    docker build -t vydhal/educonnect-backend:$VERSION ./backend
    if ($LASTEXITCODE -eq 0) {
        Write-Host ">>> Enviando Backend para o Docker Hub..." -ForegroundColor Yellow
        docker push vydhal/educonnect-backend:$VERSION
    } else {
        Write-Host "!!! Erro fatal no build do Backend" -ForegroundColor Red
        exit 1
    }
}

# Execucao Frontend
if ($CHOICE -eq "1" -or $CHOICE -eq "3") {
    Write-Host ""
    Write-Host ">>> Iniciando build do Frontend: $VERSION" -ForegroundColor Cyan
    docker build -t vydhal/educonnect-frontend:$VERSION ./frontend
    if ($LASTEXITCODE -eq 0) {
        Write-Host ">>> Enviando Frontend para o Docker Hub..." -ForegroundColor Yellow
        docker push vydhal/educonnect-frontend:$VERSION
    } else {
        Write-Host "!!! Erro fatal no build do Frontend" -ForegroundColor Red
        exit 1
    }
}

# Conclusao
Write-Host ""
Write-Host "DONE: Processo finalizado com sucesso." -ForegroundColor Green
Write-Host "DICA: No Portainer, use 'Update Service' com a imagem vydhal/educonnect-XXX:$VERSION"

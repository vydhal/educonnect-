# Script para buildar e enviar as imagens para o Docker Hub

$VERSION = "1.0.7"

Write-Host "Iniciando build do Backend versão $VERSION..." -ForegroundColor Cyan
docker build -t vydhal/educonnect-backend:$VERSION ./backend
Write-Host "Enviando Backend para o Docker Hub..." -ForegroundColor Yellow
docker push vydhal/educonnect-backend:$VERSION

Write-Host "Iniciando build do Frontend versão $VERSION..." -ForegroundColor Cyan
docker build -t vydhal/educonnect-frontend:$VERSION ./frontend
Write-Host "Enviando Frontend para o Docker Hub..." -ForegroundColor Yellow
docker push vydhal/educonnect-frontend:$VERSION

Write-Host "Processo finalizado com sucesso! As novas imagens (v$VERSION) estão no Docker Hub." -ForegroundColor Green

@echo off
REM EduConnect Setup Script for Windows

echo.
echo 🎓 Iniciando EduConnect...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está instalado. Por favor instale Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker encontrado

REM Create .env files if they don't exist
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo 📝 Arquivo .env criado em backend\
)

if not exist "frontend\.env" (
    (
        echo VITE_API_URL=http://localhost:5000/api
    ) > "frontend\.env"
    echo 📝 Arquivo .env criado em frontend\
)

echo.
echo 🚀 Iniciando containers...
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    Database: localhost:5432
echo.

docker-compose up --build

echo.
echo ✨ EduConnect iniciado com sucesso!
pause

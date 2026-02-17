#!/bin/bash
# EduConnect Setup Script

echo "🎓 Iniciando EduConnect..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor instale Docker Desktop."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado."
    exit 1
fi

echo "✅ Docker encontrado"

# Create .env files if they don't exist
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "📝 Arquivo .env criado em backend/"
fi

if [ ! -f frontend/.env ]; then
    echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
    echo "📝 Arquivo .env criado em frontend/"
fi

echo ""
echo "🚀 Iniciando containers..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Database: localhost:5432"
echo ""

docker-compose up --build

echo ""
echo "✨ EduConnect iniciado com sucesso!"

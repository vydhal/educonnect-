#!/bin/bash

echo "⏳ Aguardando PostgreSQL inicializar..."
until pg_isready -h postgres -U educonnect -d educonnect_db; do
  echo "PostgreSQL não está pronto. Aguardando..."
  sleep 2
done

echo "✅ PostgreSQL conectado!"

echo "🔄 Executando migrações Prisma..."
npx prisma migrate deploy || (echo "⚠️ Migração falhou, tentando db push..." && npx prisma db push --force-reset)

echo "🌱 Executando seed..."
npm run prisma:seed

echo "✨ Banco de dados inicializado!"
echo "🚀 Iniciando servidor..."

exec "$@"

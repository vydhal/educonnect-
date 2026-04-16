FROM node:20-alpine

WORKDIR /app

# Install postgresql client, bash and OpenSSL
RUN apk add --no-cache postgresql-client bash openssl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "echo '🚀 Starting EduConnect Backend...' && (pg_isready -h postgres -U educonnect -d educonnect_db -t 10 || echo '⚠️ Database not ready...') && (npx prisma db push || npx prisma db push --force-reset) && npm run prisma:seed && npx tsx src/server.ts"]

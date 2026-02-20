FROM node:20-alpine

WORKDIR /app

# Install postgresql client, bash and OpenSSL
RUN apk add --no-cache postgresql-client bash openssl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "echo '🚀 Starting EduConnect Backend...' && until pg_isready -h educonnect_db -U educonnect -d educonnect_db; do sleep 2; done && npx prisma db push && npm run prisma:seed && npx tsx src/server.ts"]

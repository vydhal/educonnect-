FROM node:20-alpine

WORKDIR /app

# Install postgresql client, bash and OpenSSL
RUN apk add --no-cache postgresql-client bash openssl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "echo 'Waiting for postgres...' && until pg_isready -h postgres -U educonnect -d educonnect_db; do sleep 2; done && echo 'Syncing database schema...' && npx prisma db push --skip-generate && echo 'Seeding database...' && npm run prisma:seed && echo 'Starting server...' && npm run dev"]

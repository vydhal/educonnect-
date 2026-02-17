.PHONY: help up down build logs seed migrate-reset clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make up              - Iniciar containers"
	@echo "  make down            - Parar containers"
	@echo "  make build           - Rebuildar imagens"
	@echo "  make logs            - Ver logs dos containers"
	@echo "  make seed            - Carregar dados de teste"
	@echo "  make migrate-reset   - Resetar banco de dados"
	@echo "  make clean           - Remover volumes e containers"

up:
	docker-compose up --build

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

seed:
	docker exec educonnect-backend npm run prisma:seed

migrate-reset:
	docker exec educonnect-backend npx prisma migrate reset --force

clean:
	docker-compose down -v
	rm -rf backend/node_modules frontend/node_modules

logs-backend:
	docker logs -f educonnect-backend

logs-frontend:
	docker logs -f educonnect-frontend

logs-db:
	docker logs -f educonnect-postgres

ps:
	docker-compose ps

bash-backend:
	docker exec -it educonnect-backend bash

bash-db:
	docker exec -it educonnect-postgres psql -U educonnect -d educonnect_db

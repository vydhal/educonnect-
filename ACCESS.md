
# Credenciais de Acesso e Setup

## Credenciais de Teste

### Administrador (Super Admin)
- **Email:** vydhal@gmail.com
- **Senha:** Vydhal@112358
- **Role:** ADMIN

### Usuários de Teste (Criados via Seed - Se disponível)
- **Professor:** (A ser criado/verificado)
- **Aluno:** (A ser criado/verificado)
- **Escola:** (A ser criado/verificado)

## Como Rodar o Projeto

### Backend
1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente em `.env` (baseado em `.env.example`).
4. Execute as migrações do banco de dados:
   ```bash
   npx prisma migrate dev
   ```
5. Popule o banco com dados de teste (Seed):
   ```bash
   npm run prisma:seed
   ```
6. Inicie o servidor:
   ```bash
   npm run dev
   ```

### Frontend
1. Navegue até a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Notas Importantes
- O sistema utiliza autenticação via JWT.
- O painel admin está acessível em `/login#/admin` ou via menu de usuário após login como Admin.

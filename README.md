# 📘 Sistema de Precificação

<!--
Breve descrição do projeto, incluindo o objetivo, nome do cliente e o setor envolvido.
-->

Aplicação web para gestão de precificação de produtos baseado em matérias-primas, impostos, fretes e custos fixos, com controle de acesso granular por áreas (roles).

Acesse a solução por meio deste [🔗 Link](https://www.nasa.gov/)

---

## 📄 Documentação

A documentação completa do projeto pode ser acessada através deste **[link](https://intelijr.github.io/data_analysis/)**

> A documentação é mantida utilizando o [Docusaurus](https://docusaurus.io/). Para informações sobre como configurar e manter a documentação, consulte o [guia de configuração](./docs/README.md).

---

## 🚀 Tecnologias Utilizadas

### Frontend
- React 19
- Vite
- TypeScript
- TailwindCSS 4
- React Query (TanStack Query)
- React Hook Form + Zod
- Zustand (State Management)

### Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

- NestJS 11
- Prisma ORM 6
- PostgreSQL 16
- JWT Authentication
- Argon2 (Password Hashing)
- Docker & Docker Compose

### Infraestrutura
- Docker (desenvolvimento)
- DBaaS - PostgreSQL (produção)

---

## 🛠️ Como Rodar o Projeto

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

### 🐳 Opção 1: Rodar com Docker (Recomendado para Desenvolvimento)

```bash
# Clone o repositório
git clone https://github.com/inteli-junior/data_analysis.git
cd data_analysis

# Configure as variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env

# Inicie todos os serviços (backend + banco de dados)
docker-compose up -d

# Aguarde os containers iniciarem (cerca de 10-15 segundos)
# Você pode acompanhar os logs com:
docker-compose logs -f api

# Execute as migrations do Prisma
docker-compose exec api npx prisma migrate deploy

# 🔐 IMPORTANTE: Crie o primeiro usuário ADMIN
docker-compose exec api npx prisma db seed

# ✅ Credenciais padrão do Admin:
# Email: admin@example.com
# Senha: Admin@123456
# ⚠️  ALTERE A SENHA IMEDIATAMENTE APÓS O PRIMEIRO LOGIN!

# Acesse:
# - Backend API: http://localhost:3000
# - API Docs: http://localhost:3000/docs
# - Health Check: http://localhost:3000/health
```

#### Frontend (Desenvolvimento Separado)

```bash
# Em outro terminal, acesse o diretório do frontend
cd frontend

# Instale as dependências
npm install

# Configure o arquivo .env (se necessário)
cp .env.example .env
# Certifique-se de que VITE_API_URL=http://localhost:3000

# Inicie o servidor de desenvolvimento
npm run dev

# Frontend rodando em: http://localhost:5173
```

### 💻 Opção 2: Rodar Localmente (Sem Docker)

#### Backend

```bash
# Acesse o diretório do backend
cd backend

# Instale as dependências
npm install

# Configure o arquivo .env com a DATABASE_URL
# Exemplo: DATABASE_URL="postgresql://user:pass@localhost:5432/projeto_dev"

# Gere o Prisma Client
npx prisma generate

# Execute as migrations
npx prisma migrate dev

# 🔐 Crie o primeiro usuário ADMIN
npm run seed

# Inicie o servidor
npm run start:dev

# Backend rodando em: http://localhost:3000
```

#### Frontend

```bash
# Em outro terminal, acesse o diretório do frontend
cd frontend

# Instale as dependências
npm install

# Configure o arquivo .env (se necessário)
cp .env.example .env
# Exemplo: VITE_API_URL=http://localhost:3000

# Inicie o servidor de desenvolvimento
npm run dev

# Frontend rodando em: http://localhost:5173
```

---

## 🔐 Autenticação e Segurança

### Primeiro Acesso

1. **Criar Admin Inicial** (apenas uma vez):
   ```bash
   # Com Docker
   docker-compose exec api npx prisma db seed
   
   # Sem Docker
   cd backend && npm run seed
   ```

2. **Fazer Login**:
   - Acesse o frontend em `http://localhost:5173/login`
   - Use as credenciais:
     - Email: `admin@example.com`
     - Senha: `Admin@123456`

3. **Alterar Senha** (IMPORTANTE):
   - Após o primeiro login, vá em Perfil
   - Altere a senha padrão imediatamente

### Customizar Admin Inicial

Você pode personalizar as credenciais do admin editando o `.env` antes de rodar o seed:

```env
ADMIN_EMAIL=seu-email@empresa.com
ADMIN_PASSWORD=SuaSenhaSegura@2025
ADMIN_NAME=Seu Nome Completo
```

### Sistema de Roles

O sistema possui 4 níveis de acesso:

| Role | Permissões |
|------|-----------|
| **ADMIN** | Acesso total ao sistema, gestão de usuários |
| **COMERCIAL** | Gerencia produtos e matérias-primas |
| **LOGISTICA** | Gerencia fretes |
| **IMPOSTO** | Gerencia impostos (premissas) |

**Fluxo de Criação de Usuários:**
1. ADMIN cria novos usuários (eles ficam INATIVOS)
2. ADMIN ativa os usuários quando apropriado
3. Usuários podem fazer login após ativação
4. ADMIN pode resetar senhas de outros usuários

**Regras de Segurança:**
- ✅ Admin não pode desativar a si mesmo
- ✅ Admin não pode mudar a própria role
- ✅ Não é possível desativar o último admin ativo
- ✅ Usuários inativos não conseguem fazer login
- ✅ Registro público não permite criar ADMIN

---

## 🗂️ Estrutura de Diretórios

```bash
.
├── .github/                       # Configurações de CI/CD e templates de PR
│   └── workflows/
│       ├── deploy_docusaurus.yml
│       └── restrict_prs.yml
│
├── backend/                       # Código backend (NestJS + Prisma)
│   ├── src/
│   │   ├── auth/                  # Autenticação (JWT, Guards, Strategies)
│   │   ├── users/                 # Gestão de usuários
│   │   ├── taxes/                 # Impostos (Premissas)
│   │   ├── freights/              # Fretes
│   │   ├── raw-materials/         # Matérias-primas
│   │   ├── products/              # Produtos
│   │   ├── fixed-costs/           # Custos fixos
│   │   ├── prisma/                # Prisma Service
│   │   ├── common/                # Guards, Decorators, Interfaces
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma          # Schema do banco de dados
│   │   ├── seed.ts                # Script de criação do admin inicial
│   │   └── migrations/            # Histórico de migrations
│   ├── test/                      # Testes E2E
│   ├── Dockerfile                 # Build da imagem Docker
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
│
├── frontend/                      # Código frontend (React + Vite)
│   ├── src/
│   │   ├── api/                   # Chamadas à API
│   │   ├── components/
│   │   │   ├── common/            # Componentes reutilizáveis
│   │   │   ├── features/          # Componentes específicos de features
│   │   │   └── layout/            # Layout (Sidebar, Header, etc)
│   │   ├── hooks/                 # Custom hooks
│   │   ├── lib/                   # Utilitários, validações, constantes
│   │   ├── pages/                 # Páginas da aplicação
│   │   ├── store/                 # Zustand stores
│   │   ├── types/                 # TypeScript types
│   │   ├── routes.tsx             # Configuração de rotas
│   │   └── main.tsx
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── docs/                          # Documentação Docusaurus
│   ├── docs/
│   │   ├── visao-produto.md
│   │   ├── design.md
│   │   └── desenvolvimento.md
│
├── docker-compose.yml             # Orquestração dos containers (dev)
├── .env.example                   # Variáveis para Docker Compose
├── auth_tests.py                  # Script de testes de autenticação
├── .gitignore
└── README.md
```

---

## 🔧 Comandos Úteis

### Prisma

```bash
# Criar nova migration
npx prisma migrate dev --name nome_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Criar seed (primeiro admin)
npx prisma db seed

# Abrir Prisma Studio (visualizar dados)
npx prisma studio

# Resetar banco (CUIDADO! Apaga todos os dados)
npx prisma migrate reset
```

### Docker

```bash
# Iniciar containers
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar containers
docker-compose down

# Parar e remover volumes (CUIDADO! Apaga o banco)
docker-compose down -v

# Rebuild dos containers
docker-compose build --no-cache

# Executar comandos no container
docker-compose exec api <comando>

# Exemplos úteis:
docker-compose exec api npx prisma studio
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run test
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Backend

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:e2e
npm run test:cov
```

---

## 🚀 Deploy em Produção

### Banco de Dados

O projeto está configurado para usar **DBaaS (Database as a Service)** em produção, garantindo:

- ✅ Backups automáticos
- ✅ Alta disponibilidade
- ✅ Escalabilidade
- ✅ Segurança

**Opções recomendadas de DBaaS:**
- AWS RDS (PostgreSQL)
- AWS Aurora Serverless
- Supabase
- Render PostgreSQL
- Railway
- Neon

**Para trocar o banco de dados**, basta alterar a variável de ambiente `DATABASE_URL`:

```bash
# Desenvolvimento (Docker local)
DATABASE_URL="postgresql://postgres:postgres@db:5432/gw_dev"

# Produção (DBaaS)
DATABASE_URL="postgresql://user:senha@seu-rds.amazonaws.com:5432/projeto_prod?sslmode=require"
```

### Backend

1. Configure as variáveis de ambiente no serviço de deploy:
   ```env
   DATABASE_URL=postgresql://...
   NODE_ENV=production
   JWT_SECRET=seu-secret-super-seguro-aqui
   JWT_REFRESH_SECRET=outro-secret-diferente-aqui
   PASSWORD_PEPPER=um-pepper-para-seguranca-extra
   ADMIN_EMAIL=admin@suaempresa.com
   ADMIN_PASSWORD=SenhaSeguraParaPrimeiroAcesso
   ```

2. Faça build da imagem Docker:
   ```bash
   docker build -t projeto-api:latest --target production ./backend
   ```

3. Execute as migrations e seed antes do primeiro deploy:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Frontend

1. Configure a variável de ambiente da API:
   ```env
   VITE_API_URL=https://sua-api.com
   ```

2. Faça build do projeto:
   ```bash
   cd frontend
   npm run build
   ```

3. Faça deploy da pasta `dist/` para:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Ou seu serviço preferido

---

## 🔒 Variáveis de Ambiente

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gw_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Security
PASSWORD_PEPPER="your-password-pepper-for-extra-security"

# Admin Seed
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin@123456"
ADMIN_NAME="Administrador"

# App
NODE_ENV="development"
PORT=3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

### Docker Compose (.env na raiz)

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gw_dev
DB_PORT=5432
```

---

## 📊 API Endpoints

Acesse a documentação completa da API em: **http://localhost:3000/docs**

### Principais Endpoints

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/auth/register` | Registrar usuário | Público* |
| POST | `/auth/login` | Fazer login | Público |
| POST | `/auth/logout` | Fazer logout | JWT |
| GET | `/auth/me` | Obter perfil | JWT |
| POST | `/auth/refresh` | Refresh token | JWT |
| GET | `/users` | Listar usuários | Admin |
| POST | `/users` | Criar usuário | Admin |
| PATCH | `/users/:id` | Atualizar usuário | Admin |
| GET | `/products` | Listar produtos | Comercial/Admin |
| POST | `/products` | Criar produto | Comercial/Admin |
| GET | `/raw-materials` | Listar matérias-primas | Comercial/Admin |
| POST | `/raw-materials` | Criar matéria-prima | Comercial/Admin |
| GET | `/taxes` | Listar impostos | Imposto/Admin |
| POST | `/taxes` | Criar imposto | Imposto/Admin |
| GET | `/freights` | Listar fretes | Logistica/Admin |
| POST | `/freights` | Criar frete | Logistica/Admin |
| GET | `/fixed-costs` | Listar custos fixos | Admin |
| POST | `/fixed-costs` | Criar custo fixo | Admin |

_*Registro público cria usuários INATIVOS. Não permite criar ADMIN._

---

## 🆘 Solução de Problemas

### Erro ao conectar no banco de dados

```bash
# Verificar se o container do banco está rodando
docker-compose ps

# Ver logs do banco
docker-compose logs db

# Recriar containers
docker-compose down
docker-compose up -d
```

### Erro "Admin já existe" ao rodar seed

```bash
# O seed só cria admin se não existir nenhum
# Se já existe, ignore o erro ou delete o admin existente via Prisma Studio
npx prisma studio
```

### Erro de permissão no login

```bash
# Verificar se o usuário está ativo
# Conectar ao Prisma Studio e verificar campo isActive
npx prisma studio
```

### Rate limit atingido nos testes

```bash
# Aguarde 1 minuto entre execuções
# Ou limpe os registros de rate limit reiniciando a API
docker-compose restart api
```

---

## 👥 Time do Projeto

Conheça quem participou do desenvolvimento deste projeto:

- **Isabelly Maia** _Scrum Master_  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/isabellymaiia)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/isabellymaia/)

- **Karine Paixão**  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/karinevicr)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/karine-victoria/)

- **Raphael Silva**  
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RaphaelSilva09)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/raphaelfelipesilva/)

---

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.
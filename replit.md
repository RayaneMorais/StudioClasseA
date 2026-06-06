# Sistema Classe A

Sistema interno para escola de ballet com controle de alunos, turmas e mensalidades mensais.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/classe-a run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, wouter (routing), React Query
- API: Express 5 + express-session + bcryptjs + connect-pg-simple
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — database schema (users, turmas, alunos, mensalidades)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, turmas, alunos, mensalidades, dashboard)
- `artifacts/classe-a/src/pages/` — React pages (login, dashboard, turmas, alunos, mensalidades)
- `artifacts/classe-a/src/components/layout.tsx` — sidebar navigation layout

## Architecture decisions

- Session-based authentication using express-session + connect-pg-simple (sessions stored in DB)
- Sessions table created manually via SQL (connect-pg-simple's `createTableIfMissing` fails when bundled with esbuild)
- No public registration — admin users created manually via SQL
- No deletion of students or classes — only status deactivation
- Vencimento sempre fixo no dia 10 de cada mês

## Product

- **Login** — autenticação interna com email e senha
- **Dashboard** — alunos ativos, turmas ativas, mensalidades pendentes, pagas e receita do mês
- **Turmas** — criar e editar turmas de ballet
- **Alunos** — cadastrar e editar alunos, filtrar por turma e status, inativar
- **Mensalidades** — controle mensal, gerar em massa, marcar como pago/pendente

## User preferences

- Interface em português (Brasil)
- Cores: rosa (primária), branco (fundo), preto (texto)
- Sem exclusão de registros — apenas inativação

## Gotchas

- **Sessions table**: connect-pg-simple's `createTableIfMissing: true` fails when bundled. Sessions table must exist before starting. Created via: `CREATE TABLE IF NOT EXISTS "sessions" (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL)`
- **Login padrão**: `admin@classea.com` / `admin123`
- After any OpenAPI spec change, run codegen: `pnpm --filter @workspace/api-spec run codegen`
- `pnpm --filter @workspace/db run push` to apply schema changes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

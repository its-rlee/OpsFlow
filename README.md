# OpsFlow · Operations Workspace

A clean, interview-focused support ticket dashboard built with **React, TypeScript, Node.js, Express, Prisma and PostgreSQL**.

OpsFlow showcases frontend state management, typed REST APIs, input validation, SQL data modeling, atomic updates, optimistic concurrency, and request idempotency.

## Features

- Dashboard showing total, open, in-progress and resolved tickets
- Ticket creation and searchable/filterable list
- Ticket details, claiming and resolving
- Atomic first-claim-wins API, using a conditional PostgreSQL update
- Optimistic concurrency with a ticket version number
- `Idempotency-Key` support for repeatable creation requests
- API unit tests with Vitest and Supertest, plus GitHub Actions CI

## Quick start

Prerequisites: Node.js 22+, npm, Docker Desktop (or another running PostgreSQL 16 instance).

```bash
git clone https://github.com/its-rlee/OpsFlow.git
cd OpsFlow
npm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
npm run db:generate --workspace=@opsflow/api
npm run db:migrate --workspace=@opsflow/api
npm run dev
```

The frontend runs at **http://localhost:5173** and the API runs at **http://localhost:4000**.

On first migration, Prisma may request a migration name; use `init`.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Basic health check |
| GET | `/api/tickets` | Recent 100 tickets; optional `?status=OPEN` |
| POST | `/api/tickets` | Create ticket; supports `Idempotency-Key` |
| POST | `/api/tickets/:id/claim` | Claim only if unassigned and open |
| PATCH | `/api/tickets/:id/status` | Set status using current version |

Try creating a ticket:

```bash
curl -X POST http://localhost:4000/api/tickets \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: example-1' \
  -d '{"title":"Resolve slow search","description":"Searching tickets is slow for large teams","priority":"HIGH"}'
```

## Testing and builds

```bash
npm run build
npm test
```

CI generates the Prisma client, builds both apps and runs isolated API tests (no database needed for the current mocked tests).

## Architecture

Read [docs/architecture.md](docs/architecture.md) for concurrency, data flow, and interview talking points.

## Security and current limitations

This is a **portfolio MVP**, not a production-ready support platform. It intentionally has no authentication or authorization yet. Run it locally only and do not store personal or confidential customer information. Later phases will add session authentication, role checks, integration tests and pagination.

## Interview roadmap

1. Explain `async/await`, Promises, TypeScript types and React state.
2. Trace a ticket from frontend form through API validation into PostgreSQL.
3. Explain why a conditional SQL update prevents competing claims.
4. Explain the version field and HTTP 409 conflict response.
5. Describe error handling, tests, future auth, indexing and scaling.

Built as a learning portfolio project.

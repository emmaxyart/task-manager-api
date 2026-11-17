# Task Manager API

A small REST API for managing tasks, built with Express 5, TypeScript, Prisma 7, PostgreSQL, and Zod.

## Features

- Full CRUD for tasks (`title`, `completed`)
- Pagination and filtering by completion status
- Zod request validation with field-level error details
- OpenAPI/Swagger documentation at `/api-docs`
- Helmet security headers, CORS, and rate limiting
- Centralized error handling and graceful shutdown
- Unit/integration tests with Vitest + Supertest (database mocked)

## Prerequisites

- Node.js 20+ (Node 22 or later recommended)
- PostgreSQL 14+ (a local instance is fine for development)
- npm (a `pnpm-lock.yaml` is also present if you prefer pnpm)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create your environment file** (copy the template, then edit it):

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to your PostgreSQL connection string. Do **not** skip this step — `prisma generate` reads the config file, which requires `DATABASE_URL` to be present.

3. **Generate the Prisma Client and apply migrations**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   Use `npx prisma migrate dev` instead during development if you plan to change the schema.

4. **Start the API**

   ```bash
   npm run dev
   ```

   The server listens on `http://localhost:3000` by default. Confirm it is up with `curl http://localhost:3000/api/health`, then open `http://localhost:3000/api-docs` for interactive documentation.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string used by Prisma. |
| `PORT` | No | `3000` | Port the API listens on. |
| `CLIENT_URL` | No | Dev: `http://localhost:5173,http://localhost:3000` | Comma-separated allowed CORS origins. Use `*` to allow any origin (dev only). |
| `NODE_ENV` | No | — | Set to `production` to disable CORS unless `CLIENT_URL` is explicitly set. |

> In development, when `CLIENT_URL` is unset, localhost ports 5173 and 3000 are allowed. In production, no origin is allowed until you set `CLIENT_URL` to your frontend's URL(s).

## npm scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with tsx watch (hot reload). |
| `npm run build` | Compile TypeScript into `dist/`. |
| `npm start` | Run the compiled build (`npm run build` first). |
| `npm test` | Run the test suite once. |

## API reference

Base URL: `http://localhost:3000`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Welcome message |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tasks` | List tasks (`page`, `limit` 1–100, `completed=true|false`) |
| `GET` | `/api/tasks/:id` | Get one task |
| `POST` | `/api/tasks` | Create a task (`title`, 1–200 chars) |
| `PATCH` | `/api/tasks/:id` | Update `title` and/or `completed` |
| `DELETE` | `/api/tasks/:id` | Delete a task |

### Response shapes

Endpoints intentionally use a consistent `data` field but differ at the top level:

- List → `{ "count": 10, "data": [...], "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }`
- Get one → `{ "data": { ... } }`
- Create / update / delete → `{ "message": "...", "data": { ... } }`

Errors → `{ "error": "..." }`, with validation errors adding `details: [{ field, message }]`.

## Frontend integration notes

- Set the API base URL to `http://localhost:3000` and call `/api/tasks` with `fetch`/axios.
- If your dev server runs on a port other than 5173, add it to `CLIENT_URL` (comma-separated) and restart the API. CORS preflight (`OPTIONS`) is handled automatically.
- Credentials/cookies are not used, so requests do not need `withCredentials`. There is no authentication layer — **all tasks are global and shared** between clients. Add auth before exposing this publicly.
- Handle the three response envelopes above, and treat any non-2xx JSON response as `{ error, details? }`.
- The API is stateless apart from PostgreSQL; the frontend should not rely on server-side sessions.

## Testing

```bash
npm test
```

Tests import the Express app directly and mock Prisma, so no running database is needed.

## Project structure

```
src/
  app.ts                    Express app, middleware, docs, root/health routes
  server.ts                 DB connection, listener, graceful shutdown
  lib/prisma.ts             PrismaClient + pg adapter
  controllers/              Request handlers
  routes/                   Route definitions
  schemas/                  Zod validation schemas
  middleware/               Validation and error handlers
  docs/swagger.ts           OpenAPI document
  generated/prisma/         Generated Prisma Client (do not edit)
prisma/
  schema.prisma             Task model
  migrations/               SQL migrations
tests/                      Vitest + Supertest tests
```

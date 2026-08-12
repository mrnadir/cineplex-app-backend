# Cineplex Web Backend

Node.js / Express API for a cinema booking platform — movies, theaters, shows, seats, auth, news, banners, and real-time updates via Socket.io.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (`pg`) |
| Cache / queues | Redis + BullMQ |
| Real-time | Socket.io (Redis adapter) |
| Validation | Zod |
| Auth | JWT (access + refresh) + Argon2 |
| Docs | Swagger UI (OpenAPI) |
| Email | Nodemailer + Handlebars (queued) |
| Uploads | Multer + Sharp |
| Logging | Pino |
| Tests | Jest + ts-jest |

---

## Features

- Modular domain architecture (`routes → controller → service → repository`)
- JWT auth with refresh tokens, OTP, and email verification
- File uploads with image processing and cleanup on error
- Background workers (email queue) via BullMQ
- Bull Board UI for queue monitoring
- Socket.io with Redis adapter
- Rate limiting, Helmet, CORS, CSRF protection
- OpenAPI docs at `/api-docs`
- SQL migrations with tracking table
- Unit tests per module + Husky / lint-staged / Commitlint

---

## Project Structure

```text
cineplex-web-backend/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # HTTP + Socket.io bootstrap & graceful shutdown
│   │
│   ├── config/                # Env, CORS, Helmet, Redis, Swagger, rate limit
│   ├── db/                    # Pool, migrations runner, create/drop DB
│   ├── migrations/            # SQL migration files
│   ├── routes/                # API v1 route aggregator
│   │
│   ├── modules/               # Domain modules
│   │   ├── auth/
│   │   ├── user/
│   │   ├── banner/
│   │   ├── news/
│   │   ├── comment/
│   │   ├── movie/
│   │   ├── theater/
│   │   ├── slot/
│   │   ├── show/
│   │   ├── seat_type/
│   │   ├── seat_pricing/
│   │   ├── booking/           # (in progress)
│   │   ├── otp/
│   │   ├── refresh_token/
│   │   └── verification_token/
│   │
│   ├── middlewares/           # Auth, validation, uploads, errors, CSRF, etc.
│   ├── shared/                # Logger, email, queue, OpenAPI helpers, Redis
│   ├── socket/                # Socket.io server & auth
│   ├── workers/               # BullMQ worker process entry
│   ├── eTicket/               # E-ticket / PDF generation
│   ├── errors/                # Custom & mapped error handlers
│   ├── enums/
│   ├── types/
│   ├── utils/
│   └── validators/
│
├── uploads/                   # Static uploaded files
├── .env.example
├── jest.config.ts
├── jest.setup.ts
├── package.json
└── tsconfig.json
```

### Module layout (typical)

```text
modules/<name>/
├── <name>.routes.ts
├── <name>.controller.ts
├── <name>.service.ts
├── <name>.repository.ts
├── <name>.interface.ts
├── <name>.validator.ts | <name>.validation.ts
└── <name>.test.ts
```

---

## Prerequisites

- Node.js 18+ (recommended 20+)
- Yarn
- PostgreSQL
- Redis

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd cineplex-web-backend
yarn install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in values (see [Environment Variables](#environment-variables)).

### 3. Database

```bash
yarn db:create    # create database
yarn migrate      # run SQL migrations
```

### 4. Run

```bash
# API server (HTTP + Socket.io)
yarn dev

# Background workers (separate process)
yarn worker
```

Production:

```bash
yarn build
yarn start
```

---

## Environment Variables

Copy from `.env.example`:

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `APP_NAME` | Application name |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |
| `PORT` | HTTP port (default `3000`) |
| `MACHINE_IP` | Bind address |
| `FRONTEND_URL` | Frontend base URL |
| `ALLOWED_ORIGINS` | CORS origins (dev) |
| `PROD_ORIGINS` | CORS origins (prod) |
| `DATABASE_*` | PostgreSQL host, port, name, user, password, pool |
| `REDIS_*` | Redis host, port, password |
| `JWT_ACCESS_SECRET` | Access token secret (≥ 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (≥ 32 chars, different from access) |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_DAYS` | e.g. `30d` |
| `EMAIL_*` | SMTP from, user, host, port, pass |
| `COOKIE_SAMESITE` | `strict` \| `lax` \| `none` |
| `COOKIE_SECURE` | `true` \| `false` |

Env is validated at startup via Zod (`src/config/env.schema.ts`).

---

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start API in watch mode |
| `yarn worker` | Start BullMQ workers in watch mode |
| `yarn build` | Compile TypeScript → `dist/` |
| `yarn start` | Run compiled server |
| `yarn test` | Run Jest tests |
| `yarn test:watch` | Jest watch mode |
| `yarn test:coverage` | Coverage report |
| `yarn lint` | ESLint |
| `yarn lint:fix` | ESLint with autofix |
| `yarn format` | Prettier on `src/**/*.ts` |
| `yarn db:create` | Create PostgreSQL database |
| `yarn db:drop` | Drop PostgreSQL database |
| `yarn migrate` | Apply pending SQL migrations |

---

## API Overview

Base path: **`/api/v1`**

| Path | Module |
| --- | --- |
| `/api/v1/auth` | Authentication |
| `/api/v1/user` | Users |
| `/api/v1/banner` | Banners |
| `/api/v1/news` | News |
| `/api/v1/comment` | Comments |
| `/api/v1/movie` | Movies |
| `/api/v1/theater` | Theaters |
| `/api/v1/slot` | Time slots |
| `/api/v1/show` | Shows |
| `/api/v1/seat_type` | Seat types |
| `/api/v1/seat_pricing` | Seat pricing |

### Useful URLs

| URL | Purpose |
| --- | --- |
| `/` | Welcome / health-style landing |
| `/api-docs` | Swagger UI |
| `/admin/queues` | Bull Board (queue dashboard) |
| `/uploads/*` | Static uploaded files |

---

## Architecture Notes

- **API process** (`yarn dev` / `yarn start`) — Express + Socket.io
- **Worker process** (`yarn worker`) — consumes BullMQ jobs (e.g. email)
- **Migrations** — SQL files in `src/migrations/`, tracked in `schema_migrations`
- **Transactions** — `src/db/transaction-context.ts` for multi-query unit of work
- **Graceful shutdown** — closes Socket.io, HTTP server, and DB pool on `SIGINT` / `SIGTERM`

---

## Testing & Quality

```bash
yarn test
yarn lint
yarn format
```

- Pre-commit: Husky + lint-staged (ESLint + Prettier)
- Commits: Commitlint with conventional commits

---

## License

MIT

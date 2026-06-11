# Clear402

Clear402 is a pnpm monorepo foundation for the Clear402 system.

## What Is In This Branch

- `apps/dashboard`: minimal Next.js dashboard shell
- `services/runtime`: Node runtime with `GET /health`
- `services/provider-x402`: provider stub with `GET /health`
- `packages/shared`: shared Zod contracts and domain types
- SQLite schema initialization for the runtime service

## What Is Not In This Branch

- CawAdapter implementation
- Guard Pipeline implementation
- Attack Lab implementation
- complex dashboard workflows

## Quick Start

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

### Run Services

```bash
pnpm --filter @clear402/runtime db:init
pnpm --filter @clear402/runtime dev
pnpm --filter @clear402/provider-x402 dev
pnpm --filter @clear402/dashboard exec next dev --hostname 127.0.0.1 --port 3000
```

Default endpoints:

- runtime health: `http://127.0.0.1:4000/health`
- provider health: `http://127.0.0.1:4010/health`
- dashboard: `http://127.0.0.1:3000`

## Shared Contracts

The source of truth for cross-module API shapes lives in `packages/shared/src/contracts.ts`.
Database layout for the runtime lives in `services/runtime/src/db/schema.ts`.

## Environment

See [`.env.example`](./.env.example) for the supported variables.


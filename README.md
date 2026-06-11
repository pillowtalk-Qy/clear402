# Clear402

Clear402 is a CAW-backed hardened x402 runtime with an evidence-first dashboard.

## What Is In This Branch

- `apps/dashboard`: Evidence Dashboard with mission, challenge, trust, firewall, receipt, attack, and export panels
- `services/runtime`: Node runtime with `GET /health`
- `services/provider-x402`: provider stub with `GET /health`
- `packages/shared`: shared Zod contracts and domain types
- SQLite schema initialization for the runtime service

## What Is Not In This Branch

- live CAW execution
- guard pipeline orchestration
- runtime API endpoints beyond health
- real attack execution

## Run

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

## Start Services

```bash
pnpm db:init
pnpm --filter @clear402/runtime dev
pnpm --filter @clear402/provider-x402 dev
pnpm --filter dashboard dev
```

Default endpoints:

- runtime health: `http://127.0.0.1:4000/health`
- provider health: `http://127.0.0.1:4010/health`
- dashboard: `http://127.0.0.1:3000`

## Evidence Dashboard

The dashboard is a control surface, not a landing page.

It shows:

- Mission Console
- Official CAW Panel
- x402 Challenge Inspector
- Provider Registry + ERC-8004 Trust Panel
- Metadata Firewall Diff
- PaymentContext Panel
- Clear Signing Panel
- CAW Execution Timeline
- Service Receipt Panel
- Attack Lab Panel
- Evidence Export Panel

## live / fallback / mock

- `live`: runtime and provider health are fetched from real services
- `fallback`: demo-only guard, receipt, and export states are visible because their runtime APIs are not implemented yet
- `mock`: attack fixtures and some panel details are deterministic demo data

Nothing in the dashboard pretends a fallback path is live payment evidence.

## Shared Contracts

Cross-module API shapes live in `packages/shared/src/contracts.ts`.
Database layout lives in `services/runtime/src/db/schema.ts`.

## Environment

See [`.env.example`](./.env.example) for supported variables.

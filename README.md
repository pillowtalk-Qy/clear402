# Clear402

Clear402 is a hardened x402 runtime and evidence dashboard with a strict CAW boundary.

The current `clear402/live-caw-testnet` branch can demonstrate the guard pipeline and attack lab truthfully, and it records one successful CAW Sepolia testnet tiny transfer. That live CAW claim is limited to the recorded smoke in `docs/live_caw_testnet_smoke_report.md`; it is not mainnet, not production-ready, and not unrestricted CAW execution.

## Current Branch State

- `apps/dashboard`: Evidence Dashboard with mission, challenge, trust, firewall, receipt, attack, and export panels. It fetches live runtime/provider health and labels fallback/mock demo state.
- `services/runtime`: Node runtime health service plus real guard pipeline modules for provider registry, ERC-8004 trust checks, metadata firewall, PaymentContext binding, quote/nonce/budget protection, clearsig, CAW adapter boundary, receipt verifier, and attack lab execution.
- `services/provider-x402`: local x402 provider health service plus deterministic challenge, payment proof, receipt, and attack-fixture helpers.
- `packages/shared`: shared Zod contracts and domain types.
- `scripts/run_attack_lab.ts`: runs 16 attack fixtures through the real guard pipeline and requires every scenario to return `blocked` with a `guardEventId`.
- `docs/caw_capability_report.md`: records CAW `Live ready: true` only for the recorded Sepolia testnet pact and tiny-transfer smoke; `policy_denial_evidence` remains `needs_manual_step` / `fallback` / `not-run`.
- `docs/live_caw_testnet_smoke_report.md`: records the request ID, pact ID, transaction hash, pact completion, and testnet balance evidence for the one live CAW smoke.
- SQLite schema initialization for the runtime service.

## Current Limits

- Default demo and attack lab flows do not trigger real CAW payments; they remain local/demo guard-pipeline exercises.
- Only the explicit live CAW Sepolia testnet smoke moved testnet SETH, and the completed pact should not be reused for another smoke.
- The recorded smoke is not mainnet execution, not production readiness, and not unrestricted wallet access.
- CAW policy-denial evidence was not live-smoked; it remains `needs_manual_step` / `fallback` / `not-run`.
- Runtime/provider health are long-lived service endpoints; attack lab HTTP routes are exercised by the attack runner's local runtime handler.
- Dashboard mission, payment, receipt, and evidence export actions are demo/fallback state unless backed by a runtime API response.
- Attack inputs are mock fixtures, not external exploit traffic.
- Provider/trust/capability seed data is demo data, not live registry or ERC-8004 network data.

## Gate Commands

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm run attack:all
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

## Demo Docs

- [Demo Operator Runbook](./docs/demo_operator_runbook.md)
- [Demo Narrative / Talk Track](./docs/demo_narrative_talk_track.md)
- [Live / Fallback / Mock Policy](./docs/live_fallback_mock_policy.md)
- [CAW Capability Report](./docs/caw_capability_report.md)
- [Live CAW Testnet Smoke Report](./docs/live_caw_testnet_smoke_report.md)

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

- `live`: runtime/provider health endpoints; guard pipeline code execution in tests and attack lab; provider registry, metadata firewall, PaymentContext resource binding, quote/nonce/budget checks, clearsig, and receipt verifier logic when those modules execute; the single recorded Sepolia testnet CAW tiny transfer documented in `docs/live_caw_testnet_smoke_report.md`.
- `fallback`: CAW policy-denial evidence because it was not live-smoked; dashboard mission/payment/receipt/export actions that represent demo state; capability records marked `fallback_required` or `needs_manual_step`.
- `mock`: attack fixtures, demo provider/trust/capability seed records, dashboard sample IDs and hashes.

Nothing in the dashboard or docs should present fallback/mock state as proof that CAW moved funds. The only current CAW funds-movement claim is the recorded Sepolia testnet smoke.

## P0 Security Fix To Call Out

The PaymentContext metadata override issue is closed. The guard pipeline now blocks when `metadata.resourceUrl` does not match the bound request/challenge resource before creating a PaymentContext.

## Shared Contracts

Cross-module API shapes live in `packages/shared/src/contracts.ts`.
Database layout lives in `services/runtime/src/db/schema.ts`.

## Environment

See [`.env.example`](./.env.example) for supported variables.

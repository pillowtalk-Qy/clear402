# Clear402

Clear402 is a hardened x402 runtime and evidence dashboard with a strict CAW boundary.

The current branch can demonstrate the guard pipeline and attack lab truthfully, and it records one successful CAW Sepolia testnet tiny transfer plus one CAW Sepolia testnet policy-denial result. Those live CAW claims are limited to the recorded reports in `docs/live_caw_testnet_smoke_report.md` and `docs/live_caw_policy_denial_report.md`; they are not mainnet, not production-ready, not unrestricted CAW execution, and not coverage for every CAW denial type.

## Current Branch State

- `apps/dashboard`: Evidence Dashboard with mission, challenge, trust, firewall, receipt, attack, and export panels. It fetches live runtime/provider health and labels fallback/mock demo state.
- `services/runtime`: Node runtime health service plus real guard pipeline modules for provider registry, ERC-8004 trust checks, metadata firewall, PaymentContext binding, quote/nonce/budget protection, clearsig, CAW adapter boundary, receipt verifier, and attack lab execution.
- `services/provider-x402`: local x402 provider health service plus deterministic challenge, payment proof, receipt, and attack-fixture helpers.
- `packages/shared`: shared Zod contracts and domain types.
- `tests/e2e`: Playwright browser E2E for the dashboard mission flow, denied/fallback visibility, attack-state visibility, and evidence export artifacts.
- `scripts/run_attack_lab.ts`: runs 16 attack fixtures through the real guard pipeline and requires every scenario to return `blocked` with a `guardEventId`.
- `docs/caw_capability_report.md`: records CAW `Live ready: true` only for the recorded Sepolia testnet allow-path tiny transfer and destination-allowlist policy denial.
- `docs/live_caw_testnet_smoke_report.md`: records the request ID, pact ID, transaction hash, pact completion, and testnet balance evidence for the one live CAW smoke.
- `docs/live_caw_policy_denial_report.md`: records the request ID, pact ID, rejected transaction record, denial reason, and no-success evidence for the one live CAW policy-denial check.
- `docs/demo_script.md`, `docs/paper_mapping.md`, `docs/limitations.md`, and `docs/security_boundaries.md`: Phase 21 final demo packaging docs.
- `evidence/sample_evidence_pack.json` and `evidence/sample_evidence_pack.md`: sample/fallback/mock evidence pack artifacts; they are not live CAW audit artifacts and do not add a live tx hash to the ordinary dashboard flow.
- SQLite schema initialization for the runtime service.

## Current Limits

- Default demo and attack lab flows do not trigger real CAW payments; they remain local/demo guard-pipeline exercises.
- Only the explicit live CAW Sepolia testnet smoke moved testnet SETH, and the completed pact should not be reused for another smoke.
- The recorded CAW allow-path smoke and policy-denial evidence are not mainnet execution, not production readiness, and not unrestricted wallet access.
- CAW policy-denial evidence covers one Sepolia testnet destination-allowlist rejection only; it does not cover every possible CAW denial type.
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

`pnpm test:e2e` now runs the browser E2E first, then the runtime guard tests, then the authoritative 16/16 attack lab gate. The Playwright run starts or reuses:

- runtime: `http://127.0.0.1:4000`
- provider: `http://127.0.0.1:4010`
- dashboard: `http://127.0.0.1:3000`

Browser artifacts are written under `e2e-results/`, including desktop and mobile dashboard screenshots, Playwright traces/videos, and the dashboard evidence export JSON/Markdown. These artifacts are local run evidence and are intentionally gitignored.

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
- [Five-Minute Demo Script](./docs/demo_script.md)
- [Demo Narrative / Talk Track](./docs/demo_narrative_talk_track.md)
- [Live / Fallback / Mock Policy](./docs/live_fallback_mock_policy.md)
- [Paper Mapping](./docs/paper_mapping.md)
- [Limitations](./docs/limitations.md)
- [Security Boundaries](./docs/security_boundaries.md)
- [CAW Capability Report](./docs/caw_capability_report.md)
- [Live CAW Testnet Smoke Report](./docs/live_caw_testnet_smoke_report.md)
- [Live CAW Policy Denial Report](./docs/live_caw_policy_denial_report.md)

## Evidence Samples

- [Sample Evidence Pack JSON](./evidence/sample_evidence_pack.json)
- [Sample Evidence Pack Markdown](./evidence/sample_evidence_pack.md)

The sample evidence pack is for demo packaging and review. It is explicitly sample/fallback/mock, does not execute CAW, and must not be used as proof of a live CAW payment.

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

- `live`: runtime/provider health endpoints; guard pipeline code execution in tests and attack lab; provider registry, metadata firewall, PaymentContext resource binding, quote/nonce/budget checks, clearsig, and receipt verifier logic when those modules execute; the single recorded Sepolia testnet CAW tiny transfer documented in `docs/live_caw_testnet_smoke_report.md`; the single recorded Sepolia testnet CAW destination-allowlist denial documented in `docs/live_caw_policy_denial_report.md`.
- `fallback`: dashboard mission/payment/receipt/export actions that represent demo state; capability records marked `fallback_required` or `needs_manual_step`.
- `mock`: attack fixtures, demo provider/trust/capability seed records, dashboard sample IDs and hashes.

Nothing in the dashboard or docs should present fallback/mock state as proof that CAW moved funds. The only current CAW funds-movement claim is the recorded Sepolia testnet allow-path smoke; the recorded policy-denial evidence confirms no successful transfer.

## P0 Security Fix To Call Out

The PaymentContext metadata override issue is closed. The guard pipeline now blocks when `metadata.resourceUrl` does not match the bound request/challenge resource before creating a PaymentContext.

## Shared Contracts

Cross-module API shapes live in `packages/shared/src/contracts.ts`.
Database layout lives in `services/runtime/src/db/schema.ts`.

## Environment

See [`.env.example`](./.env.example) for supported variables.

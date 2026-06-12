# Clear402 Interface Contracts

This document freezes the integration interface surface for the Clear402 monorepo.

## 1. Contract Principles

1. Amounts stay as strings.
2. IDs stay opaque and stable.
3. Environment-dependent responses carry `evidenceMode`.
4. Errors use Problem JSON.
5. Dashboard renders runtime truth when a runtime API exists and labels fallback/mock demo state when it does not.
6. Guard Pipeline and Attack Lab contracts are in scope for the current integration branch; CAW payment evidence is limited to one recorded Sepolia testnet tiny transfer in `docs/live_caw_testnet_smoke_report.md` and one recorded Sepolia testnet destination-allowlist denial in `docs/live_caw_policy_denial_report.md`. Default dashboard demos and attack lab runs must not trigger real CAW payments. Do not describe this branch as mainnet, production-ready, unrestricted CAW execution, or coverage for every possible CAW policy-denial type.

## 2. Shared Types

The canonical shared types live in `packages/shared/src/contracts.ts` and `packages/shared/src/domain.ts`.

Implemented contract families:

- `EvidenceMode`
- `CapabilityStatus`
- `EnforcementLevel`
- `ReceiptStatus`
- `MissionStatus`
- `QuoteStatus`
- `ReservationStatus`
- `GuardDecision`
- `ServiceMode`
- `ProblemJSON`
- `HealthResponse`
- `MissionCreateRequest`
- `Mission`
- `ProviderRegistryEntry`
- `X402Quote`
- `PaymentContext`
- `QuoteReservation`
- `GuardEvent`
- `CawCapabilityRecord`
- `CawPolicyDenialEvidence`
- `ServiceReceipt`
- `ERC8004TrustResult`
- `EvidenceBundle`

These types are the source of truth for the runtime, provider, and dashboard integration slice.

## 3. API Surface

### 3.1 Long-Lived Service Endpoints

- `GET /health`

Implemented by:

- `services/runtime`
- `services/provider-x402`

### 3.2 Attack Lab Handler

The attack lab runner starts a local runtime handler that exposes:

- `POST /api/attacks/:attackName/run`

This route is used by `scripts/run_attack_lab.ts` and runtime tests. It is an operator/test surface for the attack lab, not evidence of a production payment API.

### 3.3 Evidence Export

The runtime exposes server-side evidence export endpoints:

- `GET /api/evidence/:missionId/export.json`
- `GET /api/evidence/:missionId/export.md`

Both endpoints are read-only. JSON is built from one structured evidence bundle; Markdown is rendered from the same bundle. Exports must label `live`, `fallback`, and `mock` evidence explicitly and must not include API keys, wallet secrets, pairing tokens, local environment values, or raw secret-bearing CAW evidence.

### 3.4 Response Rules

- Health payloads must validate against `HealthResponse`.
- Failure responses must use `ProblemJSON`.
- `evidenceMode` values are limited to `live`, `fallback`, and `mock`.

## 4. SQLite Foundation Schema

The runtime schema is initialized by `services/runtime/src/db/schema.ts`.

Implemented tables and views:

- `missions`
- `provider_registry`
- `x402_quotes`
- `quotes` view
- `payment_contexts`
- `quote_reservations`
- `budget_ledger`
- `receipts`
- `guard_events`

## 5. Exclusions For This Branch

The following are reserved for later phases and are not implemented here:

- unrestricted CAW payment execution beyond the recorded Sepolia testnet tiny transfer
- CAW denial coverage beyond the recorded destination-allowlist rejection
- live ERC-8004 network data
- long-lived runtime mission/payment endpoints beyond health

## 6. Stability Note

This document is the contract freeze for the integration branch. Any future change to these interfaces should update this file first, then update the shared Zod schemas and downstream consumers.

# Clear402 Interface Contracts

This document freezes the foundation interface surface for the Clear402 monorepo.

## 1. Contract Principles

1. Amounts stay as strings.
2. IDs stay opaque and stable.
3. Environment-dependent responses carry `evidenceMode`.
4. Errors use Problem JSON.
5. Dashboard renders runtime truth; it does not invent state.
6. CAW, Guard, and Attack Lab are explicitly out of scope for this branch.

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

These types are the source of truth for the runtime, provider, and dashboard foundation slice.

## 3. API Surface

### 3.1 Live Endpoints

- `GET /health`

Implemented by:

- `services/runtime`
- `services/provider-x402`

### 3.2 Foundation Response Rules

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

- CawAdapter business logic
- Guard Pipeline orchestration
- Attack Lab flows
- complex dashboard interactions
- live CAW execution paths

## 6. Stability Note

This document is the contract freeze for the foundation branch. Any future change to these interfaces should update this file first, then update the shared Zod schemas and downstream consumers.

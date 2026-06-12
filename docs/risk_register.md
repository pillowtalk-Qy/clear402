# Clear402 Risk Register

Phase 0 risk register for the Clear402 repo.

Legend:

- Likelihood: Low / Medium / High
- Impact: Low / Medium / High
- Status: Open / Monitoring / Mitigated

## 1. CAW CLI / SDK Unavailable Or Changed

| Field | Value |
|---|---|
| Likelihood | High |
| Impact | High |
| Status | Open |
| Owner | CAW window, Lead |
| Trigger | `caw --help` / SDK methods do not match the planned flow |
| Mitigation | Produce `docs/caw_capability_report.md`, classify every capability as `verified`, `needs_manual_step`, `unavailable`, or `fallback_required` |
| No-Go | Any unsupported CAW capability is claimed as live |

Why it matters:

CAW is the execution source of truth. If the adapter surface is wrong, the whole payment story becomes fiction.

## 2. CAW Audit API Unavailable

| Field | Value |
|---|---|
| Likelihood | Medium |
| Impact | High |
| Status | Open |
| Owner | CAW window |
| Trigger | Transaction/audit lookup cannot be retrieved programmatically |
| Mitigation | Store raw stdout/stderr, redacted traces, and manual-step notes; surface missing audit support in the capability report |
| No-Go | A denial or approval is presented without traceable evidence |

Why it matters:

Audit evidence is part of the security proof, not a cosmetic extra.

## 3. x402 Provider Instability

| Field | Value |
|---|---|
| Likelihood | High |
| Impact | High |
| Status | Open |
| Owner | Provider window |
| Trigger | 402 challenge shape changes, provider is down, or challenge cannot be normalized |
| Mitigation | Keep a local provider-x402 with deterministic challenge fixtures and a debug challenge endpoint |
| No-Go | Runtime silently falls back to plain payment |

Why it matters:

The guard pipeline needs a stable 402 source to validate against.

## 4. clearsig Integration Mismatch

| Field | Value |
|---|---|
| Likelihood | Medium |
| Impact | High |
| Status | Open |
| Owner | Guard window |
| Trigger | Decoder cannot inspect selectors or typed data reliably |
| Mitigation | Use a hard block on unsupported high-risk intent, keep a strict adapter boundary, and preserve evidence of the decision |
| No-Go | Unknown or risky calldata is treated as safe |

Why it matters:

If clearsig cannot explain the intent, the runtime must not pretend it can.

## 5. ERC-8004 Only Exists As Demo Data

| Field | Value |
|---|---|
| Likelihood | High |
| Impact | Medium |
| Status | Open |
| Owner | Guard window |
| Trigger | No live or semi-live ERC-8004 data is available |
| Mitigation | Treat ERC-8004 as a P1 trust layer only; fall back to local registry and explicit `require_approval` or `block` decisions for higher-risk cases |
| No-Go | ERC-8004 is used as a substitute for CAW policy |

Why it matters:

ERC-8004 can inform trust. It cannot spend funds.

## 6. Frontend Over-Mock

| Field | Value |
|---|---|
| Likelihood | High |
| Impact | High |
| Status | Open |
| Owner | Dashboard window, Lead |
| Trigger | UI shows synthetic hashes, fake denials, or invisible fallback states |
| Mitigation | All states come from runtime APIs; badges for `live`, `fallback`, and `mock` must be visible; no hardcoded success story |
| No-Go | Mock is indistinguishable from live in the main demo path |

Why it matters:

The dashboard is a witness, not the author of truth.

## 7. Network Or Demo Environment Failure

| Field | Value |
|---|---|
| Likelihood | Medium |
| Impact | High |
| Status | Open |
| Owner | Lead, Provider, QA |
| Trigger | No connectivity, unstable local services, or provider/runtime port conflicts |
| Mitigation | Local provider, health checks, cached evidence, and a deterministic fallback plan |
| No-Go | Demo path depends on fragile live network assumptions without a fallback explanation |

Why it matters:

Hackathon demos fail in the seams between services, not only in code.

## 8. Testnet Assets Are Insufficient

| Field | Value |
|---|---|
| Likelihood | Medium |
| Impact | High |
| Status | Open |
| Owner | CAW window, Lead |
| Trigger | Faucet balance is too low for the planned mission budget |
| Mitigation | Budget caps, dry-run preflight, request-id reuse prevention, and a wallet funding checklist before live paths are promised |
| No-Go | A live payment path is advertised without verified funds |

Why it matters:

A payment runtime without spendable test assets is only a story.

## 9. Secret Leakage Into Logs Or Evidence

| Field | Value |
|---|---|
| Likelihood | Medium |
| Impact | High |
| Status | Open |
| Owner | All windows, QA |
| Trigger | API keys, seeds, tokens, or private keys appear in logs, fixtures, or exports |
| Mitigation | Redact raw evidence, keep secret scans in QA, never place secrets in frontend bundles |
| No-Go | Any real secret is committed or exported |

Why it matters:

The repo must be safe to inspect, export, and share.

## 10. Shared Contract Drift Between Windows

| Field | Value |
|---|---|
| Likelihood | Medium |
| Impact | High |
| Status | Open |
| Owner | Lead |
| Trigger | Multiple branches redefine the same API or schema in incompatible ways |
| Mitigation | Lead owns shared contracts, branch merge order is fixed, breaking changes require explicit contract updates first |
| No-Go | Module branches silently change core contracts |

Why it matters:

The integration branch is only stable when shared contracts are owned centrally.

## Operating Notes

1. Every risk must remain visible until the relevant phase proves it false.
2. `fallback` is allowed only when it is labeled and explained.
3. `mock` is allowed only for fixtures, lab data, or component labs.
4. `live` requires real execution evidence; CAW/funds claims require external raw evidence.
5. ERC-8004 is a P1 trust layer only and never a substitute for CAW policy.

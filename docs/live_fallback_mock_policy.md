# Clear402 Live / Fallback / Mock Policy

This policy freezes how the repo labels evidence and behavior.

## 1. Definitions

### Live

`live` means the action was executed against the real intended system or code path and the repo has evidence of that execution.

Examples:

- a local runtime/provider health response,
- a real guard pipeline decision,
- a real CAW-approved transaction,
- the recorded CAW Sepolia testnet tiny transfer in `docs/live_caw_testnet_smoke_report.md`,
- a real provider 402 challenge,
- a real audit lookup,
- or a real receipt verification.

Live always needs evidence, not just a success message. CAW/funds claims need raw external evidence such as an audit record or verified transaction reference.

### Fallback

`fallback` means the intended live capability was unavailable or too risky for the current environment, so the system used a deterministic, documented substitute.

Fallback is allowed only when:

- the substitute is named,
- the substitution is visible in the UI and evidence,
- and the substitute does not pretend to be live.

Fallback never becomes a silent normal-payment path.

### Mock

`mock` means inert synthetic data used for layout, component lab work, or fixtures.

Mock is allowed only when:

- it is clearly labeled,
- it does not claim external execution,
- and it does not sit in the main proof path.

Mock may help development, but it must never impersonate a live wallet, live denial, or live provider execution.

## 2. Selection Rules

### 2.1 CAW

- `live` only after capability verification and raw evidence.
- `fallback` when the official path is unavailable but a documented local substitute exists.
- `mock` only for isolated fixtures or UI labs.
- The current live CAW claim is limited to the recorded Sepolia testnet tiny transfer. It is not mainnet, production readiness, unrestricted CAW execution, or live policy-denial evidence.

### 2.2 Provider

- `live` only for a real challenge or receipt from the local provider service or external provider under test.
- `fallback` only for a deterministic debug challenge or local replay with explicit labeling.
- `mock` only for fixture data that does not exercise the real verification path.

### 2.3 Dashboard

- `live` only when rendering runtime facts.
- `fallback` when the UI is showing a documented substitute state.
- `mock` only in dev/component lab surfaces, never in the main demo path.

### 2.4 Attack Lab

- The attack input fixture may be `mock`, but the blocked outcome must reflect the real guard pipeline result.
- A blocked attack cannot be presented as a live exploit.

## 3. Required Labels

Every user-visible or exported artifact must show one of these labels:

- `live`
- `fallback`
- `mock`

If a capability is not verified, it must be labeled `fallback_required` or `needs_manual_step` at the capability-report level, not silently upgraded to live.

## 4. Evidence Rules

1. Live claims require raw evidence references.
2. Fallback claims require an explicit explanation of what was substituted.
3. Mock claims require fixture provenance.
4. Evidence exports must preserve the mode per record.
5. Redaction is required before any raw evidence leaves the runtime boundary.

## 5. Prohibited Patterns

1. Mock must not masquerade as live.
2. Fallback must not silently route to ordinary payment.
3. Dashboard state must not override runtime state.
4. Unknown CAW capability must not be claimed as verified.
5. ERC-8004 must not be treated as a replacement for CAW policy.
6. No money-moving path may bypass the guard pipeline.
7. No receipt or audit story may be told without provenance.

## 6. Operational Consequences

- If a live claim lacks evidence, downgrade it.
- If the environment cannot support live execution, say so.
- If a feature is P1-only, make that explicit.
- If the system is uncertain, block or require approval rather than pretend confidence.

## 7. Example Classifications

| Case | Mode |
|---|---|
| Real CAW tx hash with audit record | live |
| Local deterministic debug challenge | fallback |
| Component-lab JSON fixture | mock |
| ERC-8004 missing, local registry used instead | fallback or mock, never live |
| Demo screenshot with fake tx hash | mock |

## 8. Current Demo Gate Classification

This section records the current `clear402/live-caw-testnet` branch status for demo operators.

### Live In The Current Demo

- Runtime and provider `GET /health` responses from local services.
- Guard pipeline execution in tests and in `pnpm run attack:all`.
- Provider registry validation, metadata firewall, PaymentContext resource binding, quote/nonce/budget checks, clearsig, and service receipt verification when run by the guard pipeline.
- The P0 `metadata.resourceUrl` override defense: mismatched metadata is blocked before PaymentContext creation.
- One CAW Sepolia testnet tiny transfer recorded in `docs/live_caw_testnet_smoke_report.md`, including request ID, pact ID, tx hash, pact completion, and balance evidence.

These live claims describe code paths that actually execute. Some of those paths run over demo seed records; the seed data itself is not live external data.

### Fallback In The Current Demo

- Dashboard mission, payment, receipt, and export actions unless they are explicitly backed by a runtime response.
- Ordinary demo and attack lab flows do not trigger real CAW payments.
- CAW policy-denial evidence remains `needs_manual_step` / `fallback` / `not-run`; a live audited policy-denial smoke was not run.

### Mock In The Current Demo

- Attack fixtures.
- Demo provider registry entries, ERC-8004 trust records, CAW capability seed records, sample wallet IDs, sample hashes, and sample transaction references.
- Dashboard attack cards and sample evidence preview records.

### Demo Rule

Say "16/16 attacks blocked" only as: 16 mock attack fixtures were executed through the real guard pipeline, and each returned a blocked decision with evidence. Do not say or imply that the attack lab moved CAW funds, that external attackers were tested, or that demo seed data is live registry data.

Say "live CAW execution" only as: one Sepolia testnet tiny transfer was recorded in `docs/live_caw_testnet_smoke_report.md`. Do not generalize it to mainnet, production readiness, unrestricted CAW execution, or live policy-denial evidence.

## 9. Safety Summary

The rule is simple:

1. live is only for real execution,
2. fallback is only for explicit substitution,
3. mock is only for inert fixtures,
4. and none of them may lie about the others.

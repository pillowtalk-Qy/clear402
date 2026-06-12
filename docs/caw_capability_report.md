# CAW Capability Report

This report records what Clear402 can truthfully claim about the local CAW boundary.

- Version: `clear402.caw.capability-report.v1`
- Created at: `2026-06-11T14:31:14.000Z`
- Evidence mode: `fallback`
- Live ready: `false`

| Capability | Status | Evidence Mode | Evidence Ref | Notes |
|---|---|---|---|---|
| `caw_cli` | `unavailable` | `fallback` | `caw-probe:99f6f2a48484f8fc8227c6ff` | caw was not found on PATH. |
| `wallet_identity` | `fallback_required` | `fallback` | `caw-probe:99f6f2a48484f8fc8227c6ff` | Blocked because the CAW CLI probe is not verified: caw was not found on PATH. |
| `policy_enforcement` | `fallback_required` | `fallback` | `caw-probe:99f6f2a48484f8fc8227c6ff` | Blocked because the CAW CLI probe is not verified: caw was not found on PATH. |
| `payment_execution` | `fallback_required` | `fallback` | `caw-probe:99f6f2a48484f8fc8227c6ff` | Blocked because the CAW CLI probe is not verified: caw was not found on PATH. |
| `audit_lookup` | `fallback_required` | `fallback` | `caw-probe:99f6f2a48484f8fc8227c6ff` | Blocked because the CAW CLI probe is not verified: caw was not found on PATH. |
| `policy_denial_evidence` | `fallback_required` | `fallback` | `caw-probe:99f6f2a48484f8fc8227c6ff` | Blocked because the CAW CLI probe is not verified: caw was not found on PATH. |

## Consequence

Clear402 must not claim that the CAW side moved funds or approved a payment in this environment. Payment attempts must stop with explicit denial or `fallback_required` evidence until the missing capabilities are verified.

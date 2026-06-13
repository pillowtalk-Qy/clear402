# Clear402 Sample Evidence Pack

This is a sample/fallback/mock evidence pack for Phase 21 final demo packaging. It is not a live CAW audit artifact and it does not prove a live payment.

Source JSON: `evidence/sample_evidence_pack.json`

## Mode Summary

| Component | Evidence Mode | Notes |
|---|---|---|
| Mission | `fallback` | Sample mission modeled after the dashboard/runtime demo flow. |
| Provider challenge | `fallback` | Deterministic local/demo challenge shape. |
| ERC-8004 trust | `mock` | Demo ERC-8004 trust seed data, not `live_erc8004` registry truth. |
| PaymentContext | `fallback` | Sample PaymentContext facts; no live CAW payment was attempted. |
| Guard | `fallback` | Fallback/demo guard decision at the CAW boundary. |
| Ordinary dashboard payment | `fallback` | No live transaction hash. |
| Attack lab | `mock` input, real guard execution when reproduced | Fixture inputs only; run `pnpm run attack:all` for real local guard execution. |
| Redaction | `fallback` | Raw CAW evidence refs and secrets are omitted. |

## Live CAW Scope References

The sample links to the two recorded live-scope reports but does not embed or create live CAW transaction evidence:

- `docs/live_caw_testnet_smoke_report.md`: one recorded Sepolia tiny transfer only.
- `docs/live_caw_policy_denial_report.md`: one recorded Sepolia destination-allowlist denial only.

The ordinary dashboard payment remains fallback/demo and must not be described as the recorded live Sepolia transfer.

## Mission

- Mission ID: `sample-mission-demo-402`
- Status: `blocked`
- Budget: `0.10`
- Resource: `https://127.0.0.1:4010/paid/report?topic=market-intel`
- Evidence mode: `fallback`

## Provider / Challenge

- Provider ID: `provider-runtime-demo`
- Origin: `https://127.0.0.1:4010`
- Merchant: `0xA882b939c4Ca15c904760b8c240124Cb68cc2A88`
- Challenge amount: `0.10` `USDC` on `base-sepolia`
- Provider/trust data: demo/mock seed data, not live registry truth.

## ERC-8004 Trust

- Agent ID: `erc8004:agent:runtime-demo`
- Trust source: `demo_erc8004`
- Registration status: `needs_registration`
- Decision: `require_approval`
- Live source reference: `8004scan` search for `clear402`
- Notice: local demo trust only; Clear402 provider identity must be registered before live ERC-8004 trust can be claimed.

## PaymentContext And Guard

- PaymentContext hash: `0xsample_payment_context_hash`
- Service mode: `caw-fetch`
- Guard decision: `fallback_required`
- Guard layer: `caw`
- Guard reason: Mission Flow Runtime API is in fallback/demo mode and does not execute real CAW payments.

## Ordinary Dashboard Payment

- Evidence mode: `fallback`
- CAW payment attempted: `false`
- Live tx hash present: `false`
- TX hash: `n/a`

## Attack Lab

The attack lab records mock fixture inputs. When reproduced with `pnpm run attack:all`, those fixtures execute through the real local guard pipeline and should return blocked decisions with guard evidence.

Sample scenarios:

| Scenario | Paper | Blocked By |
|---|---|---|
| `replay_same_proof` | Five Attacks on x402 Agentic Payment Protocol | Quote Reservation / Nonce Lock |
| `pii_leakage` | Hardening x402: PII-Safe Agentic Payments | Metadata Firewall |
| `paid_but_denied` | A402: Binding Cryptocurrency Payments to Service Execution | ServiceReceipt verifier |

## Redaction

The sample omits raw CAW evidence refs, API keys, pairing tokens, wallet secrets, `.env.caw.local` values, and secret-bearing logs. It uses placeholder sample hashes rather than live secrets or live transaction evidence.

## Allowed Claims

- This sample demonstrates the final evidence pack shape and labels.
- The ordinary dashboard payment in this sample is fallback/demo with no live tx hash.
- The attack lab entries are mock fixture summaries; real guard execution happens only when the runner is executed.

## Forbidden Claims

- Do not use this sample as proof of live CAW payment.
- Do not claim mainnet execution.
- Do not claim production readiness.
- Do not claim unrestricted CAW execution.
- Do not claim provider/trust seed data is live registry truth.
- Do not claim `demo_erc8004` as `live_erc8004`.

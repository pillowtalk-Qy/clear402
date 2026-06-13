# Clear402 Limitations

This document records the Phase 21 demo boundaries. It is a claims-control document: when in doubt, use the narrower wording here.

## Current Live Scope

Clear402 has two recorded live CAW Sepolia facts:

- one tiny `0.0001` SETH Sepolia testnet allow-path transfer in `docs/live_caw_testnet_smoke_report.md`;
- one Sepolia testnet destination-allowlist policy denial in `docs/live_caw_policy_denial_report.md`.

That live scope does not extend to ordinary dashboard payments, attack lab runs, provider/trust seed data, mainnet, production readiness, unrestricted CAW execution, or every CAW denial type.

## Explicit Non-Claims

| Limitation | Current Status |
|---|---|
| No mainnet | No mainnet CAW execution is claimed or documented. |
| No production readiness | The branch is demo-gate ready, not production-ready. |
| No unrestricted CAW execution | CAW use is limited to the recorded Sepolia allow-path transfer and recorded destination-allowlist denial. |
| Only one recorded CAW denial type | The only live denial type recorded is destination outside the transfer allowlist. |
| Ordinary dashboard/demo flow is fallback | The dashboard mission/payment/receipt/export path is fallback/demo unless explicitly backed by runtime evidence; ordinary payment has no live tx hash. |
| Attack fixtures are mock inputs | The attack lab inputs are fixtures; the guard execution is real local code. |
| Provider/trust/capability seed data is demo/mock | Demo provider registry, ERC-8004-style trust, capability records, wallet IDs, hashes, and sample references are not live registry truth. |
| Browser E2E requires local Chrome/Chromium | `pnpm test:e2e` uses Playwright and needs a local Chromium-compatible browser installed and runnable in the operator environment. |

## Dashboard And Evidence Limits

- Dashboard runtime/provider health can be live local service evidence.
- Dashboard mission/payment/receipt/export actions remain fallback/demo state unless a runtime response explicitly backs them.
- The ordinary dashboard payment path does not invoke the live CAW Sepolia smoke and must not display a live tx hash.
- Evidence exports are read-only summaries. Exporting evidence does not execute CAW payments.
- Sample evidence packs in `evidence/` are samples. They are not live CAW audit artifacts.
- Raw CAW evidence refs, API keys, pairing tokens, wallet secrets, and environment values must stay out of committed docs and exported samples.

## Attack Lab Limits

- The authoritative gate is `pnpm run attack:all`.
- The expected claim is "16 mock attack fixtures executed through the real guard pipeline and returned blocked decisions with guard evidence."
- Do not claim external attackers, production traffic, live CAW payment attempts, or live exploit attempts.
- The attack lab may exercise CAW-bound decision branches through fallback/mock evidence, but it does not trigger the recorded live CAW transfer or the recorded live CAW denial.

## P1 / Championship Status

Phase 21 packaging does not finish the full P1 championship list. Current status:

| P1 Item | Status |
|---|---|
| ERC-8004 trust adapter demo or explicit limitation | Partially complete as an adapter over demo trust records; not live ERC-8004 network truth. |
| ServiceEscrow fund/refund flow | Not complete. |
| `message_sign` PaymentContext support | Not complete. |
| `params_match` / `message_match` / `function_abis` support | Not complete. |
| SSE timeline | Not complete. |
| 20-request race regression | Partially complete in the attack fixture `concurrent_free_riding_20_requests`; not a broader production load/race suite. |
| Signed ProviderQuote | Not complete. |
| Dual Receipt model | Partially represented by payment and delivery receipt fields; not a full production dual-receipt protocol. |
| Chaos / regression pack | Partially represented by unit, E2E, and 16 attack fixtures; not a complete chaos suite. |
| Payment gateway mode | Not complete. |
| EvidenceBundle provenance fix | Closed in the current clean baseline by classifying evidence bundles by evidence mode; keep regression coverage when expanding evidence surfaces. |
| Dashboard payment-state clarity | Closed for the ordinary demo payment label; keep the fallback/demo guard visible if new payment controls are added. |

## Safe Closeout Claim

"This branch is final-demo packaged for the current Clear402 guard and evidence story. It shows live local services, real local guard execution, fallback-labeled ordinary dashboard payment, 16/16 mock attack fixtures blocked, one recorded CAW Sepolia tiny transfer, and one recorded CAW Sepolia destination-allowlist denial. It does not claim mainnet, production readiness, unrestricted CAW execution, full CAW denial coverage, live provider registry truth, or external attack traffic."


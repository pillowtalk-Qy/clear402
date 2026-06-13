# CAW Capability Report

This report records what Clear402 can truthfully claim about the local CAW boundary.

- Version: `clear402.caw.capability-report.v1`
- Created at: `2026-06-12T13:43:00Z`
- Updated at: `2026-06-13T22:17:05Z`
- Evidence mode: `live`
- Live ready: `true` for the recorded Sepolia testnet allow-path tiny transfer and the recorded Sepolia testnet policy-denial evidence only

| Capability | Status | Evidence Mode | Evidence Ref | Notes |
|---|---|---|---|---|
| `caw_cli` | `verified` | `live` | `caw:v0.2.86` | Official `caw` CLI installed and responded locally. |
| `wallet_identity` | `verified` | `live` | `wallet:5751d798-605b-4723-acf4-e3a03f524511` | CAW wallet was paired and active. |
| `policy_enforcement` | `verified` | `live` | `pact:71e60376-8959-4f25-ab7e-83fc3e8e196c` | Approved pact limited execution to SETH, one merchant destination, a tiny amount cap, and one successful transaction. |
| `payment_execution` | `verified` | `live` | `tx:0xf0f257dad181ec835c09e131177402c0d2073bf345ca13d394b6aaa170a69011` | CAW executed a `0.0001` SETH Sepolia testnet transfer. |
| `audit_lookup` | `verified` | `live` | `pact-events:7c306b48-dd43-401a-9e65-16cd347066a7` | CAW pact events show submitted, activated, and completed with reason `tx_count>=1`. |
| `policy_denial_evidence` | `verified` | `live` | `request:clear402-live-caw-denial-1781280971` | CAW rejected one Sepolia testnet transfer to a non-allowlisted destination with `ADDRESS_NOT_WHITELISTED` / `policy_denied`; no transaction hash was produced. |

## Official CLI Verification

| Capability | Status | Evidence Mode | Evidence Ref | Notes |
|---|---|---|---|---|
| `official_x402_http_402_challenge` | `verified` | `live` | `evidence/caw/live_verify_20260613T2214Z_official_x402_curl_402.stdout.txt` | The official x402 Express example from `x402-foundation/x402` commit `b32a702` returned a real HTTP 402 challenge. |
| `official_x402_dry_run` | `verified` | `live` | `evidence/caw/live_verify_20260613T2214Z_official_x402_caw_fetch_dry_run.stderr.txt` | `caw fetch --dry-run` parsed the real x402 challenge and listed the accepted `eip155:84532` USDC option without calling the payment API. |
| `official_x402_execute` | `needs_manual_step` | `live` | `evidence/caw/live_verify_20260613T2214Z_official_x402_caw_fetch_execute.stderr.txt` | The execute path reached CAW but failed with `INSUFFICIENT_PERMISSION` / `can_transfer`; no paid retry or tx hash was produced. A fresh approved pact for that x402 asset/operation is required. |
| `message_sign_pact_submit` | `verified` | `live` | `evidence/caw/pact_submit_message_sign_clear402.stdout.txt` | `caw pact submit` previously created a `pending_approval` pact for the message-sign path. |
| `message_sign_live_evidence` | `needs_manual_step` | `live` | `evidence/caw/live_verify_20260613T2214Z_pact_status_message_sign.stdout.txt`, `evidence/caw/live_verify_20260613T2214Z_message_sign_allow_probe.stderr.txt`, `evidence/caw/live_verify_20260613T2214Z_message_sign_deny_probe.stderr.txt` | The message-sign pact is still `pending_approval`; both allow-shaped and deny-shaped PaymentContext probes were blocked with `INSUFFICIENT_PERMISSION` / `can_message_sign`, so no live allow/deny signing evidence exists yet. |
| `payment_gateway_mode` | `verified` | `live` | `evidence/caw/live_verify_20260613T2214Z_payment_gateway_forward_port_check.stdout.txt` and `evidence/caw/live_verify_20260613T2214Z_payment_gateway_forward_request.stdout.txt` | `caw payment gateway` forward mode started, listened on `127.0.0.1:8404`, and forwarded the official x402 request. The forwarded payment still failed on CAW `can_transfer`, so this proves the official local run path only, not settlement. |

## Consequence

Clear402 may claim one live CAW Sepolia testnet allow-path tiny transfer, one live CAW Sepolia testnet destination-allowlist policy denial, the official x402 HTTP 402 / dry-run round-trip, and the official payment-gateway startup/forwarding path. It must not claim production readiness, mainnet execution, unrestricted wallet access, successful official x402 execute, successful payment execution beyond the recorded allow-path smoke, live message-sign allow/deny evidence, payment gateway settlement, or coverage for every possible CAW policy-denial type.

See `docs/live_caw_testnet_smoke_report.md` for the allow-path transaction, pact, and balance evidence. See `docs/live_caw_policy_denial_report.md` for the recorded policy-denial evidence.
Fresh CAW CLI raw stdout/stderr/meta/result files for the verification run are indexed in `evidence/caw/live_verify_20260613T2214Z_summary.json`.

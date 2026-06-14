# CAW Capability Report

This report records what Clear402 can truthfully claim about the local CAW boundary.

- Version: `clear402.caw.capability-report.v1`
- Created at: `2026-06-12T13:43:00Z`
- Updated at: `2026-06-14T01:25:00Z`
- Evidence mode: `live`
- Live ready: `true` for the recorded Sepolia testnet allow-path tiny transfer, the recorded Sepolia testnet policy-denial evidence, the narrowly scoped `message_sign` typed-data allow/deny verification, and the Base Sepolia USDC EIP-3009 typed-data authorization signature verification

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
| `message_sign_typed_data_pact_submit` | `verified` | `live` | `evidence/caw/message_sign_typed_data_20260614T0022Z_pact_submit.stdout.txt`, `evidence/caw/message_sign_typed_data_20260614T0022Z_pact_show.stdout.txt` | `caw pact submit` created pact `6c27d578-df51-488c-862f-55475bc01190` with `type: message_sign`, `chain_in: ["SETH"]`, `primary_type_in: ["PaymentContext"]`, current CAW source address, exact Clear402 domain match, and exact `paymentContextHash` / `intent` message match. |
| `message_sign_typed_data_live_evidence` | `verified` | `live` | `evidence/caw/message_sign_typed_data_20260614T0038Z_summary.json`, `evidence/caw/message_sign_typed_data_20260614T0038Z_allow_probe.result.json`, `evidence/caw/message_sign_typed_data_20260614T0038Z_allow_tx_get_1.result.json`, `evidence/caw/message_sign_typed_data_20260614T0038Z_deny_probe.result.json`, `evidence/caw/message_sign_typed_data_20260614T0038Z_pact_status_final_summary.json` | The typed-data pact is active and live-verified: the allow-shaped `caw tx sign-message` request returned `Success` with a real EIP-712 signature, and the deny-shaped request returned `MESSAGE_SIGN_DENIED` / `no_pact_message_sign_allow_policy_matched`. |
| `eip3009_usdc_authorization` | `verified` | `live` | `evidence/caw/eip3009_usdc_20260614T011248Z/summary.json`, `evidence/caw/eip3009_usdc_20260614T011248Z/allow_tx_get_3.result.json`, `evidence/caw/eip3009_usdc_20260614T011248Z/deny_probe.result.json`, `evidence/caw/eip3009_usdc_20260614T011248Z/pact_status_after_probes.result.json` | Approved pact `4ae3f7a8-ee69-4174-83b5-1063548f9fe2` allowed exactly one Base Sepolia USDC `TransferWithAuthorization` EIP-712 typed-data shape (`chainId: 84532`, `verifyingContract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e`, CAW wallet sender, Clear402 recipient, value `1`, exact expiry and nonce). The allow-shaped request returned `Success` with a real signature, and the deny-shaped request with a mismatched `to` returned `MESSAGE_SIGN_DENIED`. No chain submission, tx hash, or funds movement is claimed; the CAW wallet had no `TBASE_USDC` balance. |
| `payment_gateway_mode` | `verified` | `live` | `evidence/caw/live_verify_20260613T2214Z_payment_gateway_forward_port_check.stdout.txt` and `evidence/caw/live_verify_20260613T2214Z_payment_gateway_forward_request.stdout.txt` | `caw payment gateway` forward mode started, listened on `127.0.0.1:8404`, and forwarded the official x402 request. The forwarded payment still failed on CAW `can_transfer`, so this proves the official local run path only, not settlement. |

## Consequence

Clear402 may claim one live CAW Sepolia testnet allow-path tiny transfer, one live CAW Sepolia testnet destination-allowlist policy denial, the official x402 HTTP 402 / dry-run round-trip, the official payment-gateway startup/forwarding path, one narrowly scoped live CAW `message_sign` typed-data allow/deny verification for pact `6c27d578-df51-488c-862f-55475bc01190`, and one live CAW EIP-712 USDC authorization verification for Base Sepolia pact `4ae3f7a8-ee69-4174-83b5-1063548f9fe2`. It must not claim production readiness, mainnet execution, unrestricted wallet access, successful official x402 execute, successful payment execution beyond the recorded allow-path smoke, Base Sepolia USDC funds movement, EIP-3009 `transferWithAuthorization` chain execution, payment gateway settlement, or coverage for every possible CAW policy-denial type.

See `docs/live_caw_testnet_smoke_report.md` for the allow-path transaction, pact, and balance evidence. See `docs/live_caw_policy_denial_report.md` for the recorded policy-denial evidence.
Fresh CAW CLI raw stdout/stderr/meta/result files for the verification run are indexed in `evidence/caw/live_verify_20260613T2214Z_summary.json`.
Fresh CAW `message_sign` typed-data pact evidence is indexed in `evidence/caw/message_sign_typed_data_20260614T0038Z_summary.json`; the live allow/deny probes are verified, but only for that exact pact and typed-data shape.
Fresh Base Sepolia USDC EIP-3009 typed-data authorization evidence is indexed in `evidence/caw/eip3009_usdc_20260614T011248Z/summary.json`; the live allow/deny probes verify CAW signing and policy enforcement only, not on-chain transfer execution.

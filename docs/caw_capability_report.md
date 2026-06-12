# CAW Capability Report

This report records what Clear402 can truthfully claim about the local CAW boundary.

- Version: `clear402.caw.capability-report.v1`
- Created at: `2026-06-12T13:43:00Z`
- Updated at: `2026-06-12T16:16:11Z`
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

## Consequence

Clear402 may claim one live CAW Sepolia testnet allow-path tiny transfer and one live CAW Sepolia testnet destination-allowlist policy denial. It must not claim production readiness, mainnet execution, unrestricted wallet access, successful payment execution beyond the recorded allow-path smoke, or coverage for every possible CAW policy-denial type.

See `docs/live_caw_testnet_smoke_report.md` for the allow-path transaction, pact, and balance evidence. See `docs/live_caw_policy_denial_report.md` for the recorded policy-denial evidence.

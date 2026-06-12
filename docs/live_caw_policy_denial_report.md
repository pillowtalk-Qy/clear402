# Live CAW Policy Denial Report

This report records one Clear402 CAW Sepolia testnet policy-denial evidence run. It intentionally excludes API keys, pairing tokens, wallet secrets, and local environment values.

## Summary

- Date: `2026-06-12T16:16:11Z` (`2026-06-13 00:16:11 HKT`)
- Branch: `clear402/live-caw-denial-evidence`
- Result: `pass`
- Evidence mode: `live` for CAW policy-denial evidence only
- Chain: `SETH` (Ethereum Sepolia Testnet)
- Token: `SETH`
- Amount: `0.0001`
- Denial type covered: destination address outside the pact transfer allowlist

## Denial Evidence

| Field | Value |
|---|---|
| CAW request ID | `clear402-live-caw-denial-1781280971` |
| CAW transaction ID | `02d0fa5d-07e1-470d-8ec5-b586a96ff0ba` |
| Pact ID | `c3f6217f-dc9a-4cdd-9332-8e1661e4ab8e` |
| Source address | `0xab42bb255c4660b0879f007ab3ed9ae049d85859` |
| Destination address | `0x000000000000000000000000000000000000dEaD` |
| Status | `Rejected` |
| Sub-status | `policy_denied` |
| Denial code | `ADDRESS_NOT_WHITELISTED` |
| Denial reason | `no_pact_transfer_allow_policy_matched` |
| Transaction hash present | `false` |

The request was intentionally sent to a destination outside the pact's transfer allowlist. CAW rejected it before any successful transaction hash was produced.

## Pact Evidence

Preflight before the denial request confirmed:

- pact status: `active`
- `progress_tx_count`: `0`
- `progress_usd_spent`: `0`
- allow policy: transfer on `SETH`/`SETH` only to `0xA882b939c4Ca15c904760b8c240124Cb68cc2A88`
- deny-test destination: `0x000000000000000000000000000000000000dEaD`

Post-denial read-only checks confirmed:

- pact status: `active`
- `progress_tx_count`: `0`
- `progress_usd_spent`: `0`
- recent transaction hash present: `false`
- `caw pact events` returned no lifecycle event rows for this pact at query time
- `caw tx get --request-id clear402-live-caw-denial-1781280971` returned the rejected CAW transaction record above

## No Successful Transfer

No successful transaction was recorded for this denial request:

- the transfer command did not return a success exit code
- the CAW transaction record status is `Rejected`
- the CAW transaction record sub-status is `policy_denied`
- the transaction hash field is empty
- the pact progress remained `0` successful transactions

## Scope

This report verifies one live CAW Sepolia testnet policy-denial path: destination address allowlist enforcement for a transfer pact.

It does not prove:

- mainnet readiness,
- production readiness,
- unrestricted CAW execution,
- successful payment execution,
- or coverage for every possible CAW policy-denial type.

See `docs/live_caw_testnet_smoke_report.md` for the separate recorded Sepolia testnet allow-path tiny transfer.

## Safety Notes

- Do not reuse the old completed allow-path pact.
- Do not run additional live CAW smoke transfers during the ordinary demo.
- Do not commit `.env.caw.local`, `.env.caw.local.bak`, API keys, pairing tokens, wallet secrets, or raw secret-bearing logs.
- The ordinary dashboard demo and attack lab must not trigger real CAW payments.

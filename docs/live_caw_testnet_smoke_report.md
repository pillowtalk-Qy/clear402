# Live CAW Testnet Smoke Report

This report records the first successful Clear402 CAW testnet transfer. It intentionally excludes API keys, pairing tokens, and local environment values.

## Summary

- Date: `2026-06-12`
- Branch: `clear402/live-caw-testnet`
- Result: `pass`
- Evidence mode: `live` for CAW testnet transfer and pact lifecycle evidence
- Chain: `SETH` (Ethereum Sepolia Testnet)
- Token: `SETH`
- Amount: `0.0001`

## Transaction Evidence

| Field | Value |
|---|---|
| CAW request ID | `clear402-live-caw-smoke-1781270885558` |
| CAW transaction ID | `a234e499-edb8-4e16-87ed-ee071a85df2a` |
| Pact ID | `71e60376-8959-4f25-ab7e-83fc3e8e196c` |
| Source address | `0xab42bb255c4660b0879f007ab3ed9ae049d85859` |
| Destination address | `0xA882b939c4Ca15c904760b8c240124Cb68cc2A88` |
| Status | `Success` |
| Sub-status | `completed` |
| Transaction hash | `0xf0f257dad181ec835c09e131177402c0d2073bf345ca13d394b6aaa170a69011` |
| Explorer | `https://sepolia.etherscan.io/tx/0xf0f257dad181ec835c09e131177402c0d2073bf345ca13d394b6aaa170a69011` |

## Pact Evidence

The pact lifecycle was confirmed through `caw pact events`:

| Event | Timestamp |
|---|---|
| `submitted` | `2026-06-12T12:40:05.881472Z` |
| `activated` | `2026-06-12T12:40:24.163147Z` |
| `completed` | `2026-06-12T13:28:07.093277Z` |

Completion metadata:

```json
{
  "reason": "tx_count>=1"
}
```

`caw pact status` confirmed:

- `progress_tx_count`: `1`
- `progress_usd_spent`: `0`
- pact status: `completed`
- recent transaction status: `Success`

## Balance Evidence

The funded SETH balance moved from the initial faucet balance of `0.01` to:

```json
{
  "amount": "0.009518770566051",
  "locked": "0",
  "pending": "0",
  "total": "0.009518770566051"
}
```

The difference reflects the `0.0001` SETH transfer plus Sepolia gas.

## Runtime Finding

The first successful live transfer returned before CAW transaction and audit evidence were immediately queryable, so Clear402 initially downgraded the result to `CAW_LIVE_EVIDENCE_MISSING`. The runtime live executor now waits briefly for transaction/audit evidence to settle before deciding whether live evidence is present.

This is an evidence synchronization fix; it does not weaken guard checks, pact validation, idempotency, resource binding, quote/nonce locking, clearsig, receipt validation, or attack-lab blocking behavior.

## Verification

After the live executor fix:

- `pnpm lint`: pass
- `pnpm test`: pass
- `pnpm build`: pass
- `pnpm test:e2e`: pass
- `pnpm run attack:all`: pass, `16/16` blocked

## Safety Notes

- Do not run another live smoke against the completed pact.
- Do not commit `.env.caw.local`, `.env.caw.local.bak`, API keys, pairing tokens, or raw secret-bearing logs.
- The completed pact should be treated as exhausted because it completed after one successful transaction.
- The demo may now claim one live CAW Sepolia testnet transfer, but must not generalize that to mainnet, production readiness, or unrestricted CAW execution.

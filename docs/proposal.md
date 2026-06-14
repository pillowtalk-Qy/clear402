# Clear402 Hackathon Proposal

## Project Name

Clear402

## One-Liner

Clear402 is a CAW-backed x402 guard and evidence workflow for safer agent-native HTTP 402 payments.

## Problem

Agent-native HTTP 402 and x402 flows let autonomous agents pay for data or services inline. The hard part is not only moving testnet funds. The agent also needs proof that the paid resource, provider, quote, wallet policy, signing intent, and delivered service all match what the agent expected.

Without that guard layer, an x402 flow can be vulnerable to replay, cross-resource substitution, malicious discovery, hidden calldata, metadata leakage, and paid-but-denied delivery.

## Solution

Clear402 wraps an x402-style payment flow with a guard pipeline and evidence dashboard. It validates provider identity, binds the resource into a PaymentContext, checks quote/nonce/budget state, redacts metadata, inspects signing intent, verifies service receipts, records CAW boundaries, and exports evidence for review.

The dashboard is an operator console for reviewing live, fallback, and mock evidence labels. The attack lab runs 16 mock fixture inputs through the real guard pipeline and requires every scenario to be blocked.

## Target Users

- AI agent developers adding paid HTTP/API calls.
- Wallet and payment infrastructure teams evaluating agent-native payment controls.
- Security reviewers looking for evidence that an x402 flow is bound to the right resource, provider, and delivery result.
- Hackathon judges reviewing a CAW-backed x402 demo with explicit testnet boundaries.

## Technical Implementation

- `apps/dashboard`: Next.js operator dashboard for mission status, x402 challenge inspection, CAW boundary status, attack lab state, and evidence export.
- `services/runtime`: Node/TypeScript guard runtime with PaymentContext binding, provider registry checks, ERC-8004-style trust validation over demo records, quote/nonce/budget locks, metadata firewall, clearsig checks, CAW adapter boundary, receipt verifier, SQLite schema, and evidence export.
- `services/provider-x402`: deterministic local x402 provider with challenge, payment proof, receipt, and attack-fixture helpers.
- `packages/shared`: Zod contracts and shared domain types.
- `tests/e2e`: Playwright dashboard flow for happy, denied, attack, and export paths.
- `scripts/run_attack_lab.ts`: authoritative 16-scenario attack-lab runner.
- CAW integration boundary: `@cobo/agentic-wallet` plus recorded CAW CLI evidence for Sepolia/testnet allow, denial, EIP-712 authorization, and exact Base Sepolia EIP-3009 execution paths.

## Current Completion

- Dashboard, runtime, provider, shared contracts, E2E tests, and attack lab are implemented.
- Final gate commands pass: `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, and `pnpm run attack:all`.
- Attack lab passes with 16/16 blocked scenarios.
- Recorded live CAW evidence exists for one Sepolia tiny transfer, one Sepolia destination-allowlist denial, one narrow EIP-712 authorization verification, and one exact Base Sepolia EIP-3009 USDC tx.
- Ordinary dashboard payment remains fallback/demo state.
- Presentation deck is available as Google Slides: https://docs.google.com/presentation/d/1oCXVoHJQFKGSCqc57O6KIy-4vmzy6qyrXBj_BPEyrcY/edit
- Final demo video, recording script, and short preview media exist under `submission/demo-video/`.
- Team wallet/contact details are intentionally kept out of the public repo and supplied through the hackathon portal if required.

## Roadmap

- Keep the portal demo video link/upload aligned with `submission/demo-video/clear402-demo-final.mp4`.
- Keep public repo media and portal assets aligned as the submission package evolves.
- Replace demo provider/trust seed data with live registry and attestation sources.
- Expand CAW denial coverage beyond destination allowlist.
- Add production deployment hardening, observability, and operator approval workflows.
- Add stronger persisted evidence provenance and signed export bundles.

## Track Recommendation

Cobo Agent-Native Payments / 402

## Demo Boundary

Live CAW evidence is limited to recorded Sepolia tiny transfer, recorded destination-allowlist denial, narrow EIP-712 authorization verification, and the exact Base Sepolia EIP-3009 USDC tx.

Clear402 is a hackathon demo, not a mainnet production product. It does not commit private keys, API keys, seed phrases, pairing tokens, or wallet secrets.

## Sepolia / Testnet Evidence

| Evidence | Value |
|---|---|
| Agent wallet / source address | `0xab42bb255c4660b0879f007ab3ed9ae049d85859` |
| Allow-path CAW request ID | `clear402-live-caw-smoke-1781270885558` |
| Allow-path pact ID | `71e60376-8959-4f25-ab7e-83fc3e8e196c` |
| Allow-path tx hash | `0xf0f257dad181ec835c09e131177402c0d2073bf345ca13d394b6aaa170a69011` |
| Policy-denial CAW request ID | `clear402-live-caw-denial-1781280971` |
| Policy-denial pact ID | `c3f6217f-dc9a-4cdd-9332-8e1661e4ab8e` |
| Policy-denial operation record | Rejected transfer to `0x000000000000000000000000000000000000dEaD` with `ADDRESS_NOT_WHITELISTED` / `policy_denied`; no tx hash produced. |

See `docs/live_caw_testnet_smoke_report.md` and `docs/live_caw_policy_denial_report.md` for details.

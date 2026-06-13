# Clear402

<img src="./docs/assets/project/clear402-logo.png" alt="Clear402 logo" width="560">

## One-Liner

Clear402 is a CAW-backed x402 guard and evidence workflow for safer agent-native HTTP 402 payments.

## Project Background

Clear402 is a hackathon demo, not a mainnet production product. It demonstrates how an agent-native HTTP 402 payment flow can be wrapped with provider validation, resource binding, metadata redaction, clear signing, receipt verification, attack-lab checks, and evidence export. Live CAW evidence is limited to the recorded Sepolia tiny transfer and recorded destination-allowlist denial.

## Why HTTP 402 / x402 Matters

HTTP 402 and x402 let services request payment inline, which is useful when autonomous agents buy data, model output, or services without a human checkout page. That flow also creates new risk: replayed proofs, cross-resource substitution, malicious provider discovery, hidden calldata, metadata leakage, and paid-but-denied delivery.

Clear402 treats an x402 payment as an evidence workflow. The payment header is only one input; the guard also binds the paid resource, provider identity, quote terms, wallet policy, signing intent, service receipt, and exported evidence.

## What We Reuse From Cobo Agentic Wallet

- Official CAW CLI / SDK boundary through `@cobo/agentic-wallet`.
- CAW wallet identity and pact concepts for agent-controlled testnet payments.
- Recorded Sepolia allow-path evidence for one tiny `0.0001` SETH transfer.
- Recorded Sepolia destination-allowlist denial evidence for one rejected transfer.

## What Clear402 Adds

- x402 challenge normalization and PaymentContext binding.
- Provider registry checks and ERC-8004-style trust validation over demo records.
- Quote, nonce, budget, and replay locks.
- Metadata firewall and redacted evidence export.
- Clear-signing checks for malicious approval and hidden multicall behavior.
- Service receipt verification for paid-but-denied and malformed delivery paths.
- A 16-scenario attack lab that runs mock fixture inputs through the real guard pipeline.
- An operator dashboard that labels live, fallback, and mock evidence boundaries.

## Architecture

| Area | Path | Purpose |
|---|---|---|
| Dashboard | `apps/dashboard` | Next.js operator console for missions, challenges, guard status, attack lab, and evidence export. |
| Runtime | `services/runtime` | Guard pipeline, CAW adapter boundary, SQLite schema, evidence export, and attack-lab execution. |
| Provider | `services/provider-x402` | Local deterministic x402 provider, challenge, payment proof, receipt, and fixture helpers. |
| Shared contracts | `packages/shared` | Zod schemas and shared domain types. |
| E2E tests | `tests/e2e` | Playwright desktop/mobile dashboard flow and evidence export checks. |
| Evidence docs | `docs/live_caw_*.md` | Recorded Sepolia/testnet CAW evidence. |

## Setup

Requirements:

- Node.js `>=22.5.0`
- pnpm `>=10.33.2`

```bash
pnpm install
pnpm db:init
```

## Run Demo

Start the three local services:

```bash
pnpm --filter @clear402/runtime dev
pnpm --filter @clear402/provider-x402 dev
pnpm --filter dashboard dev
```

Default endpoints:

- Dashboard: `http://127.0.0.1:3000`
- Runtime health: `http://127.0.0.1:4000/health`
- Provider health: `http://127.0.0.1:4010/health`

The ordinary dashboard payment path is fallback/demo state unless it is explicitly backed by recorded live CAW evidence. The attack lab uses mock fixture inputs and real guard execution.

## Run Tests

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm run attack:all
```

`pnpm test:e2e` runs Playwright dashboard E2E, runtime guard tests, and the attack lab gate. Browser artifacts are written under `e2e-results/` and are intentionally gitignored.

If the machine running E2E does not have Chrome/Chromium available, install the browser runtime first:

```bash
pnpm exec playwright install chromium
```

## Demo Video Script Link

- [Five-Minute Demo Script](./docs/demo_script.md)
- [Demo Operator Runbook](./docs/demo_operator_runbook.md)
- [Submission Package](./submission/README.md)
- [Demo Video Recording Script](./submission/demo-video/recording-script.md)
- [Demo Video - simulation/rehearsal MP4](./submission/demo-video/clear402-demo-simulation-rehearsal.mp4)
- [Presentation Deck - simulation/rehearsal version](./submission/ppt/clear402-hackathon-deck.pptx)
- [Final Submit Checklist](./submission/final-submit-checklist.md)

The current PPT and video materials are simulation/rehearsal materials. The formal PPT/video versions are being urgently polished. The final submitted video should be 3-5 minutes and show the dashboard flow, live/fallback/mock labels, evidence export, and 16/16 attack-lab result.

## Proposal Link

- [Hackathon Proposal](./docs/proposal.md)

## Evidence Links

All chain evidence below is Sepolia/testnet evidence.

| Evidence | Value |
|---|---|
| Agent wallet / source address | `0xab42bb255c4660b0879f007ab3ed9ae049d85859` |
| Allow-path CAW request ID | `clear402-live-caw-smoke-1781270885558` |
| Allow-path pact ID | `71e60376-8959-4f25-ab7e-83fc3e8e196c` |
| Allow-path tx hash | `0xf0f257dad181ec835c09e131177402c0d2073bf345ca13d394b6aaa170a69011` |
| Allow-path explorer | `https://sepolia.etherscan.io/tx/0xf0f257dad181ec835c09e131177402c0d2073bf345ca13d394b6aaa170a69011` |
| Policy-denial CAW request ID | `clear402-live-caw-denial-1781280971` |
| Policy-denial pact ID | `c3f6217f-dc9a-4cdd-9332-8e1661e4ab8e` |
| Policy-denial operation | Rejected Sepolia transfer to `0x000000000000000000000000000000000000dEaD` |
| Policy-denial result | `ADDRESS_NOT_WHITELISTED` / `policy_denied`, no tx hash produced |

Detailed reports:

- [CAW Capability Report](./docs/caw_capability_report.md)
- [Live CAW Testnet Smoke Report](./docs/live_caw_testnet_smoke_report.md)
- [Live CAW Policy Denial Report](./docs/live_caw_policy_denial_report.md)
- [Sample Evidence Pack JSON](./evidence/sample_evidence_pack.json)
- [Sample Evidence Pack Markdown](./evidence/sample_evidence_pack.md)

The sample evidence pack is for demo packaging and review. It is sample/fallback/mock evidence and must not be used as proof of a live CAW payment.

## Security Boundaries

- Hackathon demo only; not a mainnet production product.
- Do not commit private keys, API keys, pairing tokens, seed phrases, wallet secrets, or `.env.caw.local` files.
- Use Sepolia/testnet evidence only.
- Ordinary dashboard payment is fallback/demo state.
- Live CAW evidence is limited to the recorded Sepolia tiny transfer and recorded destination-allowlist denial.
- Attack lab inputs are mock fixtures, not external exploit traffic, but they run through the real guard pipeline.

See [Security Boundaries](./docs/security_boundaries.md) and [Limitations](./docs/limitations.md).

## Limitations

- The project does not claim mainnet readiness or unrestricted CAW execution.
- The recorded CAW allow path covers one tiny Sepolia transfer only.
- The recorded CAW denial covers one destination-allowlist rejection only.
- Provider registry, ERC-8004-style trust, and capability seed data are demo records; live ERC-8004 network truth is still not claimed here.
- Browser/E2E artifacts are local run evidence and are not committed.

## Third-Party APIs / SDKs / AI Tools

- Cobo Agentic Wallet SDK: `@cobo/agentic-wallet`
- Cobo CAW CLI: used for recorded Sepolia/testnet evidence capture
- x402-style local provider flow: implemented in `services/provider-x402`
- Next.js, React, Framer Motion, and Lucide React for the dashboard
- Zod for shared contracts
- Local signed provider quote, ServiceEscrow, dual-receipt, and clear-sign policy helpers in runtime/provider code
- TypeScript, tsup, Vitest, and Playwright for build/test gates
- SQLite-backed runtime schema
- AI-assisted development/review tools were used during project packaging; no AI provider API key is committed.

## Team Link

- [OriginShift Team](./docs/team.md) - fill wallet addresses and contact details before final portal submission if required.

## Project Assets

- [Clear402 Logo](./docs/assets/project/clear402-logo.png)
- [Demo Video - simulation/rehearsal MP4](./submission/demo-video/clear402-demo-simulation-rehearsal.mp4)
- [Presentation Deck - simulation/rehearsal version](./submission/ppt/clear402-hackathon-deck.pptx)
- [Submission Package](./submission/README.md)

## Additional Docs

- [Live / Fallback / Mock Policy](./docs/live_fallback_mock_policy.md)
- [Paper Mapping](./docs/paper_mapping.md)
- [Security Audit](./docs/security_audit.md)
- [Code Review](./docs/code_review.md)
- [Design Review](./docs/design_review.md)
- [Final Gate Report](./docs/final_gate_report.md)

# Clear402 3-5 Minute Demo Recording Script

Status: final recording script for the 3-5 minute hackathon demo video.

Target length: 3-5 minutes.

## Preflight

Run these before recording:

```bash
pnpm install
pnpm db:init
pnpm --filter @clear402/runtime dev
pnpm --filter @clear402/provider-x402 dev
pnpm --filter dashboard dev
```

In a separate terminal, keep this command ready:

```bash
pnpm run attack:all
```

Open:

- Dashboard: `http://127.0.0.1:3000`
- GitHub README or local README preview
- `docs/live_caw_testnet_smoke_report.md`
- `docs/live_caw_policy_denial_report.md`
- Google Slides deck: `https://docs.google.com/presentation/d/1oCXVoHJQFKGSCqc57O6KIy-4vmzy6qyrXBj_BPEyrcY/edit?slide=id.g3ebe18728ee_1_6#slide=id.g3ebe18728ee_1_6`

## Voiceover

### 0:00-0:25 - Project Hook

Show the title slide or README.

Say:

```text
This is Clear402 by OriginShift. x402 lets agents pay for HTTP resources. Clear402 makes those payments safer by wrapping the flow with Cobo Agentic Wallet boundaries, guard checks, service receipt verification, attack-lab coverage, and evidence export.
```

### 0:25-0:55 - Problem

Show the problem slide or dashboard overview.

Say:

```text
The risk is that an autonomous payment proof can drift away from the exact resource, provider, quote, wallet policy, signing intent, or delivered service. That creates replay, substitution, metadata leakage, blind signing, and paid-but-denied failures.
```

### 0:55-1:40 - Dashboard Flow

Show the dashboard. Create or select a mission, then walk through dry run, guard, CAW boundary recording, receipt, and export states.

Say:

```text
The dashboard is an operator console, not a landing page. It is backed by local runtime APIs for mission creation, dry-run challenge inspection, guard preparation, receipt verification, timeline events, and evidence export. The CAW boundary action is labeled as fallback state and does not claim a live CAW transaction hash.
```

### 1:40-2:25 - Guard Pipeline

Show the guard and evidence sections.

Say:

```text
The runtime binds the request into a PaymentContext, checks provider trust, quote terms, nonce and budget state, metadata redaction, clear-signing intent, and service receipt consistency. Every block decision is written as guard evidence rather than being a frontend-only state.
```

### 2:25-3:05 - Attack Lab

Run:

```bash
pnpm run attack:all
```

Say:

```text
The attack lab runs sixteen mock attack fixtures through the real local guard pipeline. The current gate is sixteen out of sixteen blocked, covering replay, resource substitution, malicious approval, paid-but-denied delivery, metadata leakage, settlement path substitution, cache confusion, free-riding race behavior, and malformed delivery.
```

### 3:05-3:40 - CAW Evidence

Show the CAW evidence docs.

Say:

```text
Clear402 does not claim mainnet or unrestricted CAW execution. The live CAW execution evidence is deliberately narrow: one recorded Sepolia tiny transfer, one recorded Sepolia destination-allowlist policy denial, one live `message_sign` EIP-712 authorization verification for Base Sepolia USDC, and one exact Base Sepolia USDC EIP-3009 transfer executed through CAW-approved `message_sign` + `contract_call`. The official CLI evidence also shows x402 dry-run parsing and local gateway startup, but not a successful official `caw fetch` x402 execute path. That gives reviewers real wallet evidence while keeping the demo boundary honest.
```

### 3:40-4:20 - Submission Readiness

Show `docs/final_gate_report.md` or the completion slide.

Say:

```text
The final gate passes lint, tests, build, Playwright browser E2E, runtime guard tests, and the attack lab. The local championship layer now includes ServiceEscrow state, message-sign PaymentContext checks, richer policy matching, signed ProviderQuote, dual receipt, local gateway mode, and the mission timeline SSE endpoint. The remaining claims are live or production claims, not hidden local gaps: approved live message signing, onchain escrow, live ERC-8004 truth, production gateway settlement, and production dual receipt.
```

### 4:20-4:50 - Close

Show README or the OriginShift slide.

Say:

```text
Clear402 is submission-ready as a CAW-backed x402 guard and evidence workflow. It is built to show a practical path from agent-native payments to safer, reviewable payment execution.
```

## Final Video Checklist

- Shows project name and team name.
- Shows dashboard, not only slides.
- Shows `pnpm run attack:all` result.
- Shows evidence export or evidence files.
- States Sepolia/testnet only.
- States ordinary dashboard payment is fallback/demo.
- Does not show private keys, API keys, seed phrases, pairing tokens, wallet secrets, or `.env.caw.local`.
- Does not claim mainnet, production readiness, unrestricted CAW, or live external attack traffic.

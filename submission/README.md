# Clear402 Submission Package

This folder collects the files and final links needed for the hackathon portal.

## Project

| Field | Value |
|---|---|
| Project name | Clear402 |
| One-liner | CAW-backed x402 guard and evidence workflow for safer agent-native HTTP 402 payments. |
| Team | OriginShift |
| Recommended track | Cobo Agent-Native Payments / HTTP 402 / x402 |
| GitHub repo | https://github.com/pillowtalk-Qy/clear402 |
| Demo status | Code/docs/evidence are submission-ready; PPT and video below are simulation/rehearsal materials while the formal versions are being urgently polished. |

## Upload Checklist

| Required item | Current file / link | Status |
|---|---|---|
| GitHub repo | https://github.com/pillowtalk-Qy/clear402 | Ready |
| README | `README.md` | Ready |
| Proposal | `docs/proposal.md` | Ready |
| Demo script | `docs/demo_script.md` and `submission/demo-video/recording-script.md` | Ready |
| Presentation deck | `submission/ppt/clear402-hackathon-deck.pptx` | Simulation/rehearsal version; formal version in urgent polish |
| Demo video | Add the final uploaded link below after recording | Simulation script ready; formal video in urgent polish |
| Team info | `docs/team.md` | Needs wallet/contact fields if required by the portal |
| Chain/testnet evidence | `docs/live_caw_testnet_smoke_report.md`, `docs/live_caw_policy_denial_report.md` | Ready |
| Security boundary | `docs/security_boundaries.md` and `docs/limitations.md` | Ready |

## Demo Video Link

Final uploaded demo video link:

```text
TBD - formal version is being urgently polished. Current materials are simulation/rehearsal only.
```

Recommended filename if uploading a file directly:

```text
clear402-demo-3to5min.mp4
```

## PPT / Video Status Note

The PPT and video materials in this folder are current simulation/rehearsal materials for alignment and recording practice. The formal PPT/video versions are still being urgently polished for final submission.

## Final Claims

- Clear402 is a hackathon demo, not a mainnet production product.
- Live CAW evidence is limited to one recorded Sepolia tiny transfer and one recorded Sepolia destination-allowlist denial.
- Ordinary dashboard payment is fallback/demo state and does not claim a live CAW tx hash.
- Attack lab inputs are mock fixtures, but they run through the real local guard pipeline.
- The current authoritative gate is `pnpm test:e2e` plus `pnpm run attack:all`.

## Portal Copy

Short description:

```text
Clear402 is a CAW-backed x402 guard and evidence workflow that helps autonomous agents make safer HTTP 402 payments by binding the paid resource, provider, quote, wallet policy, signing intent, delivery receipt, and exported evidence.
```

Long description:

```text
Clear402 demonstrates a hardened agent-native HTTP 402 payment runtime built around Cobo Agentic Wallet boundaries. It wraps an x402-style payment flow with PaymentContext binding, provider/trust checks, quote and nonce locks, budget protection, PII-safe metadata filtering, clear-signing checks, service receipt verification, a 16-scenario attack lab, and an operator dashboard that exports evidence as JSON and Markdown.

The demo includes recorded Sepolia CAW evidence for one tiny allow-path transfer and one destination-allowlist policy denial. The ordinary dashboard payment flow is explicitly fallback/demo state, and the attack lab uses mock attack fixtures executed through the real guard pipeline.
```

## Remaining Manual Fields

Fill these before the final portal submit if the form asks for them:

- Final demo video URL or uploaded MP4.
- Team member wallet addresses.
- Team contact details.
- Any event-specific track, prize, or sponsor fields.

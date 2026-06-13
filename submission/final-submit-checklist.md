# Final Submit Checklist

Use this as the last checklist before pressing submit in the hackathon portal.

## Already Ready In GitHub

- README includes background, install, run, tests, architecture, APIs/SDKs/tools, evidence, limitations, and team link.
- Proposal exists at `docs/proposal.md`.
- Security boundaries exist at `docs/security_boundaries.md`.
- Limitations exist at `docs/limitations.md`.
- Final gate report exists at `docs/final_gate_report.md`.
- Sample evidence pack exists in `evidence/`.
- Team page exists at `docs/team.md`.
- Simulation/rehearsal presentation deck exists at `submission/ppt/clear402-hackathon-deck.pptx`; formal version is being urgently polished.
- Simulation/rehearsal demo recording script exists at `submission/demo-video/recording-script.md`; formal video is being urgently polished.

## Must Fill Manually Before Portal Submit

- Final demo video link or uploaded MP4.
- Formal presentation deck, if the portal requires the final polished version rather than the simulation/rehearsal deck.
- Wallet addresses if the hackathon portal requires them.
- Team contact information if the hackathon portal requires it.

## Recommended Final Commands

Run from the repo root:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm run attack:all
git status --short --branch
```

Expected claim if all pass:

```text
Clear402 is demo-ready for a CAW-backed x402 guard and evidence workflow, with live CAW evidence limited to the recorded Sepolia tiny transfer and recorded destination-allowlist denial.
```

## Claims To Avoid

- Do not claim mainnet readiness.
- Do not claim production readiness.
- Do not claim unrestricted CAW execution.
- Do not claim ordinary dashboard payment is a live CAW tx.
- Do not claim attack lab inputs are live external attacks.
- Do not include private keys, API keys, seed phrases, pairing tokens, wallet secrets, or private CAW values.

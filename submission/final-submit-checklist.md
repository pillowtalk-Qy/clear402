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
- Presentation deck link is documented in `submission/ppt/README.md`.
- Short demo preview MP4 exists at `submission/demo-video/clear402-demo-preview.mp4`.
- Final demo recording script exists at `submission/demo-video/recording-script.md`.

## Must Fill Manually Before Portal Submit

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

If Playwright cannot find Chrome/Chromium on a fresh machine, run:

```bash
pnpm exec playwright install chromium
```

Expected claim if all pass:

```text
Clear402 is demo-ready for a CAW-backed x402 guard and evidence workflow, with live CAW evidence limited to the recorded Sepolia tiny transfer, recorded destination-allowlist denial, narrow EIP-712 authorization verification, and exact Base Sepolia EIP-3009 USDC tx.
```

## Claims To Avoid

- Do not claim mainnet readiness.
- Do not claim production readiness.
- Do not claim unrestricted CAW execution.
- Do not claim ordinary dashboard payment is a live CAW tx.
- Do not claim attack lab inputs are live external attacks.
- Do not include private keys, API keys, seed phrases, pairing tokens, wallet secrets, or private CAW values.

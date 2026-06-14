# Clear402 Demo Operator Runbook

This runbook is the operator path for the current Clear402 demo branch. It is intentionally strict about live, fallback, and mock labels.

## 1. Truth Boundary

| Layer | Current status | How to say it |
|---|---|---|
| Runtime/provider health | live | Local services are running and returning health payloads. |
| Guard pipeline | live execution over local/demo inputs | Provider registry, metadata firewall, PaymentContext binding, quote/nonce/budget checks, clearsig, and receipt verifier execute in tests and attack lab. |
| CAW testnet smoke | live for one recorded Sepolia tiny transfer | Request ID, pact ID, tx hash, and pact completion are in `docs/live_caw_testnet_smoke_report.md`. |
| CAW default demo execution | no live payment | Ordinary dashboard demos and attack lab runs must not trigger a real CAW payment. |
| CAW policy denial evidence | live for one recorded Sepolia destination-allowlist denial | Request ID, pact ID, rejected transaction record, denial reason, and no-success evidence are in `docs/live_caw_policy_denial_report.md`. |
| Attack lab | mock inputs, live guard execution | The 16 scenarios are fixtures run through the real guard pipeline. |
| Provider/trust/capability seed data | mock | Demo records prove the pipeline shape, not external registry truth. |
| Dashboard payment/export actions | fallback/demo state | The dashboard labels non-live state; it does not prove funds moved. |

## 2. Install

From the repo root:

```bash
cd /Users/qy/Documents/clear402
pnpm install
```

Expected result: install completes. Optional dependency build-script warnings for packages such as `esbuild` or `sharp` are not demo blockers unless a later command fails.

## 3. Run The Gate

Run the same gate before recording:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm run attack:all
```

Expected result:

- `pnpm lint` passes TypeScript checks across packages.
- `pnpm test` passes unit and runtime tests.
- `pnpm build` builds runtime, provider, shared package, and dashboard.
- `pnpm test:e2e` starts or reuses runtime `http://127.0.0.1:4000`, provider `http://127.0.0.1:4010`, and dashboard `http://127.0.0.1:3000`, runs Playwright browser E2E, then runs guard pipeline tests and the attack lab.
- `pnpm run attack:all` prints all 16 attack names and ends with JSON results where every scenario has `decision: "blocked"` and a `guardEventId`.

## 4. Start Runtime, Provider, And Dashboard

Use three terminals.

Terminal 1:

```bash
cd /Users/qy/Documents/clear402
pnpm db:init
pnpm --filter @clear402/runtime dev
```

Terminal 2:

```bash
cd /Users/qy/Documents/clear402
pnpm --filter @clear402/provider-x402 dev
```

Terminal 3:

```bash
cd /Users/qy/Documents/clear402
pnpm --filter dashboard dev --hostname 127.0.0.1 --port 3000
```

Open:

- Runtime health: `http://127.0.0.1:4000/health`
- Provider health: `http://127.0.0.1:4010/health`
- Dashboard: `http://127.0.0.1:3000`

The runtime and provider development servers expose health endpoints. The attack lab route is exercised by the attack runner's local runtime handler.

## 5. Run The Attack Lab

```bash
pnpm run attack:all
```

What the command does:

- starts a local runtime attack-lab handler,
- runs the 16 named scenarios,
- sends each fixture to `POST /api/attacks/:attackName/run`,
- requires each response to be `blocked`,
- requires each response to include a `guardEventId`,
- prints a JSON evidence payload.

How to explain the result:

Say: "16 out of 16 fixture attacks are blocked by the real guard pipeline."

Also say: "The attack inputs are mock fixtures. The defense logic is the same guard pipeline code used by runtime tests."

Do not say that these were external attacks, production traffic, or CAW-funded payments. The attack lab does not trigger the recorded live CAW smoke.

## 6. P0 Fix Explanation

Issue closed: PaymentContext metadata `resourceUrl` can no longer override the bound request/challenge resource.

What changed in behavior:

- The guard pipeline canonicalizes the request resource and challenge resource.
- It separately canonicalizes `metadata.resourceUrl`.
- If metadata points somewhere else, the pipeline blocks at `resource_binding`.
- The block happens before PaymentContext creation, so no downstream payment context is built from attacker-controlled metadata.

Short demo wording:

"The P0 was a resource substitution risk. A malicious metadata field could try to steer the payment context toward another URL. Now the guard binds request, challenge, and metadata together. A mismatch is blocked before PaymentContext exists."

## 7. CAW Testnet Smoke Explanation

Current CAW fact:

- `docs/caw_capability_report.md` marks live-ready CAW evidence for exactly four recorded facts: the Sepolia testnet allow-path tiny transfer, the Sepolia testnet destination-allowlist denial, the narrow `message_sign` EIP-712 authorization verification, and the exact Base Sepolia EIP-3009 USDC tx.
- `docs/live_caw_testnet_smoke_report.md` records the request ID, pact ID, transaction hash, pact completion, and balance evidence.
- `docs/live_caw_policy_denial_report.md` records the request ID, pact ID, rejected transaction record, denial reason, and no-success evidence.
- `docs/caw_capability_report.md` and `docs/limitations.md` keep the live CAW claim narrow; they do not imply mainnet, unrestricted CAW execution, or a successful official `caw fetch` x402 execute path.
- The transfer was `0.0001` SETH on Ethereum Sepolia testnet.
- This is not mainnet, not production-ready, and not unrestricted CAW execution.
- The recorded policy-denial evidence covers one destination allowlist rejection only; do not claim every CAW policy-denial type is covered.

Short demo wording:

"CAW is the spending authority. This branch records one tiny Sepolia testnet CAW transfer, one Sepolia testnet CAW policy denial, one live `message_sign` EIP-712 authorization verification for Base Sepolia USDC, and one exact Base Sepolia EIP-3009 USDC transfer through CAW-approved `message_sign` + `contract_call`. The normal dashboard demo and attack lab do not move funds."

If the dashboard shows sample hashes or a transaction reference, call them sample/fallback evidence unless they are explicitly the Sepolia tx hash from `docs/live_caw_testnet_smoke_report.md`.

## 8. Dashboard Walkthrough

Recommended order:

1. Show the Live / Fallback / Mock sidebar.
2. Point out runtime and provider health badges as the live service facts.
3. Click `Create mission`.
4. Click `Dry run 402` and describe the challenge/registry/fallback settlement labels.
5. Click `Prepare guard` and describe PaymentContext, nonce, quote lock, clear-signing, and metadata redaction.
6. Treat `Execute payment` as a fallback demo step only. Preface it before clicking; the ordinary dashboard demo does not run the live CAW testnet smoke.
7. Click `Verify receipt` as a receipt-verifier demo state, not proof of live delivery.
8. Run selected attack cards in the dashboard for UI storytelling.
9. Use the CLI attack lab for the authoritative 16/16 gate.
10. Click `Export evidence` or `Open JSON` to show the dashboard's current evidence bundle.

## 9. Export Evidence

Automated browser E2E artifacts are written to `e2e-results/`:

- `desktop-chromium-dashboard.png`
- `mobile-chromium-dashboard.png`
- `dashboard-evidence-export.json`
- `dashboard-evidence-export.md`
- `playwright-output/` and `playwright-report/` for traces, videos, and the HTML report

The browser E2E covers the operator path: create mission, dry run 402, prepare guard, execute fallback/demo payment, verify fallback receipt, run denied/attack dashboard states, and export evidence. It still treats the CLI attack lab as the authoritative 16/16 security gate.

For gate evidence:

```bash
mkdir -p evidence/demo
set -o pipefail
pnpm run attack:all | tee evidence/demo/attack-lab-$(date +%Y%m%d-%H%M%S).log
```

For dashboard evidence:

- click `Export evidence`,
- click `Open JSON`,
- review the JSON and Markdown panels,
- verify the `liveFallbackMockLabels` block before using the bundle in a demo.

Current behavior: the dashboard export prefers the server-side runtime JSON/Markdown endpoints and falls back to the in-app bundle if they are unavailable.

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| Dashboard shows runtime/provider `fallback` | Confirm runtime/provider terminals are running and health URLs are reachable. |
| Port conflict | Set `RUNTIME_PORT`, `PROVIDER_X402_PORT`, or pass a different dashboard `--port`. |
| Attack lab fails before results | Re-run `pnpm install`, then `pnpm test:e2e` to isolate the failing runtime test. |
| CAW execution is requested | Do not run another live smoke during the demo. Point to `docs/live_caw_testnet_smoke_report.md` and `docs/live_caw_policy_denial_report.md` for the already-recorded Sepolia testnet evidence. |
| Evidence labels look mixed | Use `docs/live_fallback_mock_policy.md` as the tie-breaker. |

## 11. Rehearsal Checklist

- [ ] `pnpm install` passed.
- [ ] `pnpm lint` passed.
- [ ] `pnpm test` passed.
- [ ] `pnpm build` passed.
- [ ] `pnpm test:e2e` passed.
- [ ] `pnpm run attack:all` passed with 16 blocked results.
- [ ] Dashboard loads at `http://127.0.0.1:3000`.
- [ ] Runtime and provider health badges are live.
- [ ] CAW testnet-smoke-only wording is rehearsed.
- [ ] P0 metadata override explanation is rehearsed.
- [ ] Evidence export labels are checked before presentation.

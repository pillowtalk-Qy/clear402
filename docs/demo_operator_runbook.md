# Clear402 Demo Operator Runbook

This runbook is the operator path for the current integration branch. It is intentionally strict about live, fallback, and mock labels.

## 1. Truth Boundary

| Layer | Current status | How to say it |
|---|---|---|
| Runtime/provider health | live | Local services are running and returning health payloads. |
| Guard pipeline | live execution over local/demo inputs | Provider registry, metadata firewall, PaymentContext binding, quote/nonce/budget checks, clearsig, and receipt verifier execute in tests and attack lab. |
| CAW execution | fallback | `caw` is not on `PATH`; `payment_execution` is `fallback_required`. |
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

Run the same gate before rehearsal or recording:

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
- `pnpm test:e2e` includes guard pipeline tests and the attack lab.
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
pnpm --filter dashboard dev -- --hostname 127.0.0.1 --port 3000
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

Do not say that these were external attacks, production traffic, or CAW-funded payments.

## 6. P0 Fix Explanation

Issue closed: PaymentContext metadata `resourceUrl` can no longer override the bound request/challenge resource.

What changed in behavior:

- The guard pipeline canonicalizes the request resource and challenge resource.
- It separately canonicalizes `metadata.resourceUrl`.
- If metadata points somewhere else, the pipeline blocks at `resource_binding`.
- The block happens before PaymentContext creation, so no downstream payment context is built from attacker-controlled metadata.

Short demo wording:

"The P0 was a resource substitution risk. A malicious metadata field could try to steer the payment context toward another URL. Now the guard binds request, challenge, and metadata together. A mismatch is blocked before PaymentContext exists."

## 7. CAW Fallback-Only Explanation

Current CAW fact:

- `docs/caw_capability_report.md` says `Live ready: false`.
- `caw_cli` is `unavailable`.
- `payment_execution` is `fallback_required`.
- The local CawAdapter boundary must deny or return fallback-required evidence when official CAW capabilities are not verified.

Short demo wording:

"CAW is the spending authority, but this machine does not have the CAW CLI available. So Clear402 shows the CAW boundary and denial path, but it does not claim a real CAW-funded payment."

If the dashboard shows sample hashes or a transaction reference, call them sample/fallback evidence, not settlement proof.

## 8. Dashboard Walkthrough

Recommended order:

1. Show the Live / Fallback / Mock sidebar.
2. Point out runtime and provider health badges as the live service facts.
3. Click `Create mission`.
4. Click `Dry run 402` and describe the challenge/registry/fallback settlement labels.
5. Click `Prepare guard` and describe PaymentContext, nonce, quote lock, clear-signing, and metadata redaction.
6. Treat `Execute payment` as a fallback demo step only. Preface it before clicking.
7. Click `Verify receipt` as a receipt-verifier demo state, not proof of live delivery.
8. Run selected attack cards in the dashboard for UI storytelling.
9. Use the CLI attack lab for the authoritative 16/16 gate.
10. Click `Export evidence` or `Open JSON` to show the dashboard's current evidence bundle.

## 9. Export Evidence

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

Current limitation: the dashboard export is an in-app JSON/Markdown bundle. It is not a server-side runtime export endpoint.

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| Dashboard shows runtime/provider `fallback` | Confirm runtime/provider terminals are running and health URLs are reachable. |
| Port conflict | Set `RUNTIME_PORT`, `PROVIDER_X402_PORT`, or pass a different dashboard `--port`. |
| Attack lab fails before results | Re-run `pnpm install`, then `pnpm test:e2e` to isolate the failing runtime test. |
| CAW execution is requested | Stop and point to `docs/caw_capability_report.md`; this branch is fallback-only at the CAW boundary. |
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
- [ ] CAW fallback-only wording is rehearsed.
- [ ] P0 metadata override explanation is rehearsed.
- [ ] Evidence export labels are checked before presentation.

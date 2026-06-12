# Phase 17 Security Audit

Date: 2026-06-13 HKT
Branch: `clear402/e2e-security`
Base reviewed: `clear402/integration` at `41f5a05`

## Scope

This was a read-only security audit for Clear402. I reviewed secret exposure, SSRF, command injection, guard bypass, mock/live/fallback confusion, PII leakage, and receipt tampering. I did not change CAW, Guard, Provider, or Dashboard implementation code.

The current working tree already contained provider entrypoint changes in:

- `services/provider-x402/src/server.ts`
- `services/provider-x402/src/server.test.ts`
- `services/provider-x402/src/http.d.mts`

Those files were reviewed but not modified.

## Architecture Summary

Clear402 is a Node/TypeScript monorepo with:

- `services/runtime`: mission API, guard pipeline, CAW adapter boundary, evidence export, attack lab.
- `services/provider-x402`: local x402 provider, challenge/proof/receipt helpers.
- `apps/dashboard`: evidence dashboard and runtime proxy routes.
- `packages/shared`: contracts and shared domain types.

Primary trust boundaries:

- User/API mission input into runtime mission flow.
- x402 challenge/resource binding into PaymentContext.
- CAW live executor boundary and evidence requirements.
- Provider debug/fallback proof path versus live evidence claims.
- Dashboard runtime proxy and evidence export.
- Evidence export redaction and live/fallback/mock labels.

## Attack Surface

Code surface:

- Public local endpoints: runtime `/health`, `/api/missions`, `/api/evidence/:missionId/export.{json,md}`; provider `/health`, `/paid/report`, `/verify-payment`, `/debug/challenge`, `/debug/verify`, `/attack-fixtures/:name`.
- Authenticated/admin endpoints: none in this demo branch.
- External integrations: CAW SDK through `@cobo/agentic-wallet`; dashboard runtime/provider health fetches.
- Background jobs/websockets/uploads: none found.
- Attack lab: local fixture runner and route handler.

Infrastructure surface:

- Secret management: environment variables plus `.env*` ignored by git.
- CI/IaC/container configs: none found in this repo snapshot.
- Lockfile: `pnpm-lock.yaml` present and tracked.

## P0 Findings

None found.

## P1 Findings

### P1-S1: EvidenceBundle can misclassify fallback/mock evidence as live and can omit the just-recorded allow event

Status: verified by source review and test output.

Evidence:

- `services/runtime/src/guard/pipeline.ts:205-212` builds `live`, `fallback`, and `mock` buckets from `GuardEvent.decision`, not from nested `evidenceMode`.
- `services/runtime/src/guard/pipeline.ts:1133-1134` computes `const evidenceBundle = evidenceBundleForMission(...)` before recording the successful `allow` event at `recordGuardEvent(...)`.
- `pnpm test:e2e` attack lab output showed an `evidenceBundle.live` entry whose nested `cawEvidence.evidenceMode` was `fallback`.

Why this matters:

This does not bypass the guard, does not move funds, and does not override CAW evidence checks. It does create a provenance risk: raw `EvidenceBundle.live` can overstate live evidence or miss the current success event. That is exactly the kind of live/fallback/mock confusion Clear402 is trying to avoid.

Exploit scenario:

1. Operator runs an attack lab or fallback/demo flow.
2. A guard event with decision `allow` is recorded as a setup step or prior attempt while nested evidence remains fallback/mock.
3. A downstream export, log reader, or demo script counts `evidenceBundle.live.length`.
4. The operator accidentally claims "live facts" from a bucket that contains fallback/mock evidence.

Impact:

Misleading evidence provenance and demo claims. This is high priority for audit integrity, but not a P0 because the CAW adapter still blocks live payment claims unless wallet, tx/cobo transaction, audit id, request id, and raw evidence are present.

Recommendation:

- Record the success guard event before building the returned evidence bundle.
- Classify bundle buckets by actual evidence mode, not only guard decision.
- Add a regression where an `allow` event containing fallback CAW evidence cannot appear under `EvidenceBundle.live`.
- Consider storing a top-level `evidence_mode` column on guard events to remove inference ambiguity.

## Other Security Notes

- Secrets: `.env` and `.env.*` are ignored. Only `.env.example` is tracked. Git history scan found placeholder/test strings only, no active high-confidence credential.
- SSRF: Mission `resourceUrl` is constrained to the demo provider origin in `mission_flow.ts`; guard also binds request and challenge canonical URLs before PaymentContext creation.
- Command injection: uses of `spawnSync` pass argument arrays, not shell strings. `CLEAR402_CAW_BIN` is environment-controlled and treated as trusted operator configuration.
- Guard bypass: existing tests cover metadata resource override blocking before PaymentContext creation, replay blocking, pending approval blocking, missing live CAW evidence blocking, overspend blocking, and provider selection.
- PII leakage: runtime and dashboard evidence export paths redact secret-like keys/values; receipt verifier blocks raw PII patterns inside receipts.
- Receipt tampering: receipt verification checks PaymentContext hash, pact, provider address, amount, chain/token, response hash, provider signature, response schema, delivery denial, CAW completion anchor, and raw PII.

## Supply Chain

`pnpm audit --audit-level moderate` reported one moderate advisory:

- `postcss <8.5.10`, via `apps__dashboard > next > postcss`, GHSA-qx2v-qp2m-jg93.

This is not P0/P1 in the current Clear402 app because I did not find a code path that accepts attacker-controlled CSS and stringifies it into served CSS. Track and upgrade when Next releases or permits the patched transitive version.

## Commands Run

- `git branch --show-current`
- `git status --short`
- `git diff --stat`
- `git ls-files '*.env' '.env.*'`
- `sed -n '1,200p' .gitignore`
- `git log -p --all -G 'AKIA|ASIA|ghp_|gho_|github_pat_|sk_live_|xox[baprs]-|BEGIN .*PRIVATE KEY|PRIVATE_KEY|SECRET|TOKEN|PASSWORD|API_KEY|MNEMONIC|SEED'`
- `rg` scans for secrets, SSRF, command execution, env usage, evidence modes, receipt signatures, PII redaction, guard decisions.
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm audit --audit-level moderate`
- `git diff --check`

## Disclaimer

This is an AI-assisted first-pass security audit. It is not a substitute for a professional security audit or penetration test.

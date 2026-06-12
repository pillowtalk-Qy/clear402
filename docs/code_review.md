# Phase 18 Code Review

Date: 2026-06-13 HKT
Branch: `clear402/e2e-security`

## Scope Check

Intent: run post-integration security/code/design review without adding new features.

Diff present before this review:

- `services/provider-x402/src/server.ts`
- `services/provider-x402/src/server.test.ts`
- `services/provider-x402/src/http.d.mts`

I also reviewed surrounding runtime, provider, dashboard, and shared contract code where it affected security or evidence correctness. No implementation files were modified.

## Findings

### P1-C1: EvidenceBundle is stale on successful guard completion and classifies buckets by decision instead of evidence mode

Same root cause as Phase 17 P1-S1.

Evidence:

- `services/runtime/src/guard/pipeline.ts:205-212` puts `decision === "allow"` events into `live`, `decision === "require_approval"` into `fallback`, and `decision === "fallback_required"` into `mock`.
- `services/runtime/src/guard/pipeline.ts:1133-1134` creates the returned success-path bundle before the success event is recorded at `services/runtime/src/guard/pipeline.ts:1134-1150`.

Impact:

The returned `evidenceBundle` can omit the current successful event. Later bundles can place a prior `allow` event under `live` even when nested evidence is fallback/mock. This can mislead downstream review/export tooling and demo operators.

Recommendation:

Record the event first, then build the bundle. Bucket by nested/top-level `evidenceMode`, not guard decision. Add focused tests for success-path bundle freshness and fallback evidence under an allow decision.

## Provider Diff Review

The provider dev entrypoint change is structurally reasonable:

- It delegates non-health routes to `createProviderHttpHandler`.
- It keeps `/health` as a local health response.
- The new test verifies `/paid/report` returns a 402 challenge through `startProviderServer`.

No P0/P1 issue found in the provider diff.

Notes:

- `services/provider-x402/src/server.test.ts:37` uses `as any` for response JSON. This is acceptable for the current test but should eventually use a small typed assertion or schema if the provider response becomes a public contract.
- `services/provider-x402/src/http.d.mts` is a hand-written declaration for `http.mjs`. Keep it in sync with `http.mjs` exports or convert the module to TypeScript later.

## Verification

Passed:

- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `git diff --check`

Advisory:

- `pnpm audit --audit-level moderate` reported one moderate `postcss` advisory via Next.

## Residual Risk

The repo still has intentional demo/fallback surfaces. They are generally labeled well, but raw evidence consumers should not treat `EvidenceBundle.live` as authoritative until P1-C1 is fixed.

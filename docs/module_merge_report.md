# Module Merge Report

- Window/branch: `clear402/integration`
- Status: guard branch final closeout

## Completed

- Wired runtime TS modules to real local imports.
- Extended runtime entry exports for guard, x402, clear-sign, and receipt helpers.
- Updated runtime lint/build scripts to include `.ts` modules.
- Verified the existing CAW capability report remains fallback-only.

## Files Changed

- `services/runtime/scripts/build.mjs`
- `services/runtime/scripts/lint.mjs`
- `services/runtime/src/index.mjs`
- `services/runtime/src/clearsig/adapter.ts`
- `services/runtime/src/guard/amount.ts`
- `services/runtime/src/guard/events.ts`
- `services/runtime/src/guard/hash.ts`
- `services/runtime/src/guard/metadata_firewall.ts`
- `services/runtime/src/guard/payment_context.ts`
- `services/runtime/src/guard/pipeline.ts`
- `services/runtime/src/guard/quote_lock.ts`
- `services/runtime/src/receipt/receipt_verifier.ts`
- `services/runtime/src/x402/challenge_normalizer.ts`
- `services/runtime/src/x402/erc8004_trust_adapter.ts`
- `services/runtime/src/x402/provider_registry.ts`
- `pnpm-lock.yaml`

## Verification

- `pnpm -r lint` passed.
- `pnpm -r test` passed.
- `pnpm -r build` passed.
- `node --input-type=module -e 'import("./services/runtime/src/index.mjs")'` passed.

## Shared Contract / package.json

- No `package.json` files were modified.
- No shared contract files were modified.
- Reason: the fix stayed inside runtime source wiring and local script checks.

## Current Evidence State

- Live: `false`
- Fallback: `true`
- Mock: `not claimed as live`

## Risk Notes

- CAW execution remains fallback-only without a verified local CAW CLI.
- The workspace still contains untracked runtime source files and the lockfile until they are staged.

## Merge Recommendation

- Mergeable to `clear402/integration` after staging the current source additions.

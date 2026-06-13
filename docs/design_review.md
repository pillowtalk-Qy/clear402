# Phase 19 Design Review

Date: 2026-06-13 HKT
Target reviewed: `http://127.0.0.1:3000`
Classifier: app UI, evidence/operator dashboard

## Summary

Design score: B
AI slop score: B+

The dashboard reads like an operator console, not a marketing page. The live/fallback/mock model is visible, the layout is dense but scannable, and the page avoids the common hero/card-grid trap. The main design risk is that a few visual choices still make fallback/demo actions feel more live than they are.

Update, Phase 19 polish: P1-D1 is closed. The ordinary dashboard payment action now reads as a fallback/demo step, raw evidence is progressively disclosed, touch targets meet 44px, and desktop plus 390px mobile checks show no horizontal overflow.

## P0 Findings

None found.

## P1 Findings

### P1-D1: Closed - payment action no longer presents the ordinary dashboard path as live

Original evidence:

- `apps/dashboard/app/dashboard-shell.tsx:509` renders `Execute payment` with `tone="live"`.
- The README and live/fallback/mock policy both state that ordinary dashboard demos do not trigger real CAW payments.

Fix:

- The action now displays `Execute demo payment`.
- The stable E2E hook remains `data-testid="action-execute-payment"`.
- The button tone is warning/fallback aligned, not live green.
- The Service Receipt panel continues to show `Tx hash n/a` for the ordinary dashboard path.

Residual risk:

The dashboard still has live runtime/provider health facts beside fallback/demo payment flow facts. This is acceptable for the operator console as long as the bottom-strip mode guard and fallback badges remain visible.

## Other Design Findings

### D2: Closed - raw JSON no longer dominates the first scan

Raw evidence blocks now use progressive disclosure. Registry entry, ERC-8004 trust result, PaymentContext JSON, and ClearSign input are folded by default, while operators can still open each raw evidence surface. Evidence export JSON stays expanded after export so the browser E2E can keep parsing the generated evidence bundle.

### D3: Closed - touch targets meet the mobile target

Visible buttons and raw-evidence summaries now measure at least 44px high in both desktop and 390x844 mobile checks.

### D4: Partially improved - numeric evidence is more deliberate

The page still uses `Inter, ui-sans-serif, system-ui...` as the primary stack, but hashes, timestamps, amounts, metrics, and raw evidence now use tabular numerals. A more distinctive primary type choice remains optional polish, not a blocker.

## Positive Notes

- No horizontal overflow on desktop or 390px mobile.
- Mode labels remain visible across the console.
- The UI is appropriately dense for a security/operator dashboard.
- Focus states exist.
- Cards have restrained 8px radii and the layout does not rely on decorative feature grids.
- The page still reads as an operator console, not a landing page or marketing hero.

## Commands And Checks

- Started runtime, provider, and dashboard dev servers against `http://127.0.0.1:3000`.
- Used the Codex in-app Browser to inspect desktop and 390x844 mobile.
- Desktop check: `scrollWidth` matched viewport width, no overflow offenders, minimum visible interactive height was 44px, raw evidence panels were folded, and receipt tx hash displayed `n/a`.
- 390x844 mobile check: `scrollWidth` was 390, no overflow offenders, no small touch targets, and `Execute demo payment` remained visible without button squeeze.
- Acceptance commands passed:
  - `pnpm --filter dashboard test`
  - `pnpm --filter dashboard build`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm test:e2e`

## Quick Wins

- Keep the fallback/demo guard text visible if future dashboard actions add more payment controls.
- Consider a later typography pass if the product needs more visual distinctiveness.

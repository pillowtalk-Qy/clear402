# Phase 19 Design Review

Date: 2026-06-13 HKT
Target reviewed: `http://127.0.0.1:3000`
Classifier: app UI, evidence/operator dashboard

## Summary

Design score: B-
AI slop score: B

The dashboard reads like an operator console, not a marketing page. The live/fallback/mock model is visible, the layout is dense but scannable, and the page avoids the common hero/card-grid trap. The main design risk is that a few visual choices still make fallback/demo actions feel more live than they are.

## P0 Findings

None found.

## P1 Findings

### P1-D1: The `Execute payment` action is visually styled as live even though the ordinary dashboard path is fallback/demo

Evidence:

- `apps/dashboard/app/dashboard-shell.tsx:509` renders `Execute payment` with `tone="live"`.
- The README and live/fallback/mock policy both state that ordinary dashboard demos do not trigger real CAW payments.

Impact:

This is a design trust issue. The page labels modes well overall, but the button color makes the riskiest action look like a live green path. In a demo, that can nudge an operator or viewer into thinking the dashboard action itself proves live CAW execution.

Recommendation:

Use fallback/warning tone for `Execute payment` until the action is explicitly backed by live CAW execution. Consider button text such as `Execute demo payment` or a nearby `fallback` badge.

## Other Design Findings

### D2: JSON blocks dominate the first scan

The dashboard is thorough, but large JSON panels appear early and compete with the top-level state narrative. The best path is progressive disclosure: keep hashes, decisions, and mode chips visible, then collapse raw JSON by default.

### D3: Touch targets are just below the mobile target

Browser audit at 390x844 found no horizontal overflow, but interactive controls are mostly 40px high. The usual mobile target is 44px. This is polish rather than a blocker, but it is easy to improve.

### D4: Typography is competent but generic

The page uses `Inter, ui-sans-serif, system-ui...` as the primary stack. It looks professional, but it has little product-specific character. For an evidence/security console, a slightly more distinctive sans plus better numeric treatment would make hashes, amounts, and statuses feel more deliberate.

## Positive Notes

- No horizontal overflow on desktop or 390px mobile.
- Mode labels remain visible across the console.
- The UI is appropriately dense for a security/operator dashboard.
- Focus states exist.
- Cards have restrained 8px radii and the layout does not rely on decorative feature grids.

## Commands And Checks

- Started runtime, provider, and dashboard dev servers.
- Used the Codex in-app Browser against `http://127.0.0.1:3000`.
- Checked DOM structure, heading hierarchy, font/color extraction, touch target sizes, desktop overflow, and 390px mobile overflow.

## Quick Wins

- Change `Execute payment` to fallback/warning tone while it remains demo/fallback.
- Collapse JSON blocks by default after the first two panels.
- Increase mobile control min-height from 40px to 44px.
- Add `font-variant-numeric: tabular-nums` for hashes, counters, timestamps, and amounts.

# Clear402 Limitations

This document records the Phase 21 demo boundaries. It is a claims-control document: when in doubt, use the narrower wording here.

## Current Live Scope

Clear402 has these recorded live CAW facts:

- one tiny `0.0001` SETH Sepolia testnet allow-path transfer in `docs/live_caw_testnet_smoke_report.md`;
- one Sepolia testnet destination-allowlist policy denial in `docs/live_caw_policy_denial_report.md`.

Clear402 also has official CAW CLI verification evidence for narrower non-execution paths:

- the official x402 Express example from `x402-foundation/x402` commit `b32a702` returned a real HTTP 402 challenge, and `caw fetch --dry-run` parsed it without calling the payment API;
- the official x402 execute path reached CAW but stopped with `INSUFFICIENT_PERMISSION` / `can_transfer` because a fresh approved active pact for that x402 asset/operation was required;
- a tightly scoped `message_sign` typed-data pact was submitted as pact `6c27d578-df51-488c-862f-55475bc01190`; the allow-shaped signing request succeeded and the deny-shaped signing request was policy denied after approval;
- a Base Sepolia USDC EIP-3009 typed-data pact was submitted as pact `4ae3f7a8-ee69-4174-83b5-1063548f9fe2`; the allow-shaped signing request succeeded, the deny-shaped request was policy denied, and no chain submission was performed because the current CAW wallet had no `TBASE_USDC` balance;
- EIP-3009 USDC transfer executed on Base Sepolia through CAW-approved contract_call in `evidence/caw/eip3009_usdc_20260614T022751Z/onchain_submission_summary.json`;
- `caw payment gateway` forward mode started, listened locally on `127.0.0.1:8404`, and forwarded the official x402 request, but the forwarded payment still stopped with `INSUFFICIENT_PERMISSION` / `can_transfer`.

That live scope does not extend to ordinary dashboard payments, attack lab runs, provider/trust seed data, mainnet, production readiness, unrestricted CAW execution, generalized message signing beyond the exact verified pact shape, additional Base Sepolia USDC funds movement beyond the recorded EIP-3009 tx, production gateway settlement, or every CAW denial type. Having a wallet balance or testnet asset is not enough to claim execution: CAW still requires the right approved pact and operation permission.

## Explicit Non-Claims

| Limitation | Current Status |
|---|---|
| No mainnet | No mainnet CAW execution is claimed or documented. |
| No production readiness | The branch is demo-gate ready, not production-ready. |
| No unrestricted CAW execution | CAW use is limited to the recorded Sepolia allow-path transfer, recorded destination-allowlist denial, the exact `message_sign` typed-data verification pact, the exact Base Sepolia USDC EIP-3009 typed-data verification pact, one exact Base Sepolia USDC EIP-3009 `transferWithAuthorization` tx, and official CLI dry-run/gateway startup checks. Asset availability alone does not make a payment executable. |
| No successful official x402 execute | The official `caw fetch` execute attempt reached CAW but stopped on `INSUFFICIENT_PERMISSION` / `can_transfer`; it produced no paid retry, tx hash, or successful payment claim. |
| No generalized live CAW `message_sign` claim | The latest typed-data message-sign pact `6c27d578-df51-488c-862f-55475bc01190` is now live-verified for that exact typed-data shape: allow-shaped signing succeeded and the deny-shaped probe was policy denied. No broader claim is made beyond this pact and shape. |
| No generalized live CAW EIP-3009 claim | The repo now records one EIP-3009 USDC transfer executed on Base Sepolia through CAW-approved contract_call, but only for tx `0x91f1e0284380b6d50201c95b540e46a68c43cfe0f8e3a5a0c10a3c43fb222b6a` and nonce `0xa0ea67f1141a87205c6fb371097fd97d86604fe3b2e5a1b8d418215113bdfe90`. Do not generalize this to other pacts, other nonces, other source addresses, other tokens, ordinary dashboard payments, or mainnet. |
| No production gateway mode | The official gateway evidence proves local CLI startup/listening/forwarding only, not a production payment network gateway or settled payment. |
| No deployed onchain ServiceEscrow evidence | `contracts/ServiceEscrow.sol`, ABI, deployment script, and runtime calldata generation are present, but no deployed Sepolia contract address, tx hash, or successful CAW `contract_call` is claimed in this repo. |
| No verified Clear402 ERC-8004 provider identity | ERC-8004 live Identity truth must come from an Identity Registry agent token / `tokenURI` or a matching official indexer record. A 8004scan public search did not find a matching Clear402 provider identity, so Clear402 trust remains `needs_registration` unless a future live source verifies it. |
| Only one recorded CAW denial type | The only live denial type recorded is destination outside the transfer allowlist. |
| Ordinary dashboard/demo flow is fallback | The dashboard mission/payment/receipt/export path is fallback/demo unless explicitly backed by runtime evidence; ordinary payment has no live tx hash. |
| Attack fixtures are mock inputs | The attack lab inputs are fixtures; the guard execution is real local code. |
| Provider/trust/capability seed data is demo/mock | Demo provider registry, `demo_erc8004` trust, capability records, wallet IDs, hashes, and sample references are not live registry truth. |
| Browser E2E requires local Chrome/Chromium | `pnpm test:e2e` uses Playwright and needs a local Chromium-compatible browser installed and runnable in the operator environment; run `pnpm exec playwright install chromium` if needed. |

## Dashboard And Evidence Limits

- Dashboard runtime/provider health can be live local service evidence.
- Dashboard mission/payment/receipt/export actions remain fallback/demo state unless a runtime response explicitly backs them.
- The ordinary dashboard payment path does not invoke the live CAW Sepolia smoke and must not display a live tx hash.
- Official `caw fetch --dry-run` proves challenge parsing only; it does not execute a payment or produce a live tx hash.
- The official `caw fetch` execute attempt is permission-boundary evidence for missing pact permission, not successful payment evidence.
- Official `message_sign` typed-data evidence now includes a single live allow/deny verification for pact `6c27d578-df51-488c-862f-55475bc01190`. Do not generalize it to other typed-data shapes, other source addresses, or other pacts.
- Official EIP-3009 evidence now includes one live allow/deny verification for pact `4ae3f7a8-ee69-4174-83b5-1063548f9fe2` and one successful Base Sepolia `transferWithAuthorization` submitted through CAW-approved contract_call pact `09ae9ce3-68ee-43f7-b0bb-69cec3a01fce`. Do not generalize it to other chain submissions, relaying, funds movement, source addresses, or pacts.
- Official `caw payment gateway` evidence proves the local CLI can start, listen, and forward a request; it does not prove payment execution or production settlement.
- ERC-8004 live truth requires official live sources: Identity Registry ERC-721 `tokenURI`, Reputation Registry `getSummary` / `readAllFeedback`, Validation Registry `getValidationStatus` / `getSummary` / `getAgentValidations` / `getValidatorRequests`, or an official indexer/API such as 8004scan. Clear402 has no verified registered provider identity in those sources yet.
- Evidence exports are read-only summaries. Exporting evidence does not execute CAW payments.
- Sample evidence packs in `evidence/` are samples. They are not live CAW audit artifacts.
- Raw CAW evidence refs, API keys, pairing tokens, wallet secrets, and environment values must stay out of committed docs and exported samples.

## Attack Lab Limits

- The authoritative gate is `pnpm run attack:all`.
- The expected claim is "16 mock attack fixtures executed through the real guard pipeline and returned blocked decisions with guard evidence."
- Do not claim external attackers, production traffic, live CAW payment attempts, or live exploit attempts.
- The attack lab may exercise CAW-bound decision branches through fallback/mock evidence, but it does not trigger the recorded live CAW transfer or the recorded live CAW denial.

## P1 / Championship Status

Phase 21 packaging does not finish the full P1 championship list. Current status:

| P1 Item | Status |
|---|---|
| ERC-8004 trust adapter live truth integration | Complete for source-aware enforcement: results now distinguish `live_erc8004`, `demo_erc8004`, and unavailable live source state; no verified Clear402 provider identity is present, so runtime evidence remains `needs_registration` / `fallback_required` unless a future live source verifies registration, reputation, and validation records. |
| ServiceEscrow fund/refund flow | Onchain-ready native-value source, ABI, Sepolia deployment instructions, runtime `fund`/`refund` calldata generation, context-hash binding, and local state-machine tests are complete. No deployed Sepolia escrow, ERC-20 escrow custody, or successful live CAW `contract_call` evidence is claimed yet. |
| `message_sign` PaymentContext support | Complete for local/runtime evidence and guard enforcement. Official CLI typed-data pact `6c27d578-df51-488c-862f-55475bc01190` is live-verified for one exact allow path and one exact deny path; do not generalize to other pacts or message shapes. |
| `message_sign` EIP-3009 authorization support | Complete for CAW live signing, policy enforcement, and one Base Sepolia on-chain `transferWithAuthorization` execution. The successful tx is `0x91f1e0284380b6d50201c95b540e46a68c43cfe0f8e3a5a0c10a3c43fb222b6a`; do not generalize to other chain submissions, relaying, funds movement, source addresses, or pacts. |
| `params_match` / `message_match` / `function_abis` support | Complete for local clear-sign policy enforcement. |
| SSE timeline | Append-only local mission timeline complete at `/api/missions/:missionId/timeline.sse`, including event ids, event types, timestamps, mission ids, payloads, heartbeat comments, and `Last-Event-ID` replay; not production-scale realtime infrastructure. |
| 20-request race regression | Partially complete in the attack fixture `concurrent_free_riding_20_requests`; not a broader production load/race suite. |
| Signed ProviderQuote | Complete as a local signed quote protocol and verification layer; not a live provider attestation network. |
| Dual Receipt model | Complete as a local payment/delivery dual-receipt protocol; not a chain-native or network-native settlement standard. |
| Chaos / regression pack | Partially represented by unit, E2E, and 16 attack fixtures; not a complete chaos suite. |
| Payment gateway mode | Complete as a local provider gateway route. Official `caw payment gateway` forward mode starts, listens locally, and forwards the official x402 request; not a production payment network gateway or settled payment proof. |
| EvidenceBundle provenance fix | Closed in the current clean baseline by classifying evidence bundles by evidence mode; keep regression coverage when expanding evidence surfaces. |
| Dashboard payment-state clarity | Closed for the ordinary demo payment label; keep the fallback/demo guard visible if new payment controls are added. |

## Safe Closeout Claim

"This branch is final-demo packaged for the current Clear402 guard and evidence story. It shows live local services, real local guard execution, fallback-labeled ordinary dashboard payment, 16/16 mock attack fixtures blocked, onchain-ready ServiceEscrow code/calldata generation, one recorded CAW Sepolia tiny transfer, one recorded CAW Sepolia destination-allowlist denial, official x402 HTTP 402 / dry-run parsing, official CAW gateway startup/listening/forwarding evidence, one narrowly scoped live CAW `message_sign` typed-data allow/deny verification, one live CAW Base Sepolia USDC EIP-3009 typed-data authorization verification, and one EIP-3009 USDC transfer executed on Base Sepolia through CAW-approved contract_call. It does not claim mainnet, production readiness, unrestricted CAW execution, deployed ServiceEscrow, successful CAW contract_call escrow funding beyond the recorded EIP-3009 USDC tx, successful official x402 execution beyond the recorded tiny transfer, payment gateway settlement, generalized Base Sepolia USDC funds movement, full CAW denial coverage, live provider registry truth, or external attack traffic. Asset availability alone is not an execution claim."

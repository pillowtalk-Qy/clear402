# Clear402 Demo Narrative / Talk Track

This is the safe demo script for the current Clear402 demo branch. It is written to avoid overstating CAW capability.

## 3-Minute Version

### 0:00-0:30 - Frame The Problem

"x402 gives agents a way to pay for resources, but agentic payment flows need more than a 402 challenge. They need resource binding, metadata safety, provider trust, quote locks, semantic transaction checks, delivery receipts, and evidence."

"Clear402 is the guard layer around that flow. It does not replace CAW. CAW remains the spending authority."

### 0:30-1:15 - Show The Dashboard

"This dashboard is an evidence console. The first thing to notice is the live/fallback/mock split. Runtime and provider health are live local services. The guard and evidence surfaces are labeled when they are fallback or mock demo state."

"That label discipline is part of the product. The demo should be useful without pretending that every panel is live external execution."

### 1:15-2:15 - Explain The Guard Pipeline

"The real guard pipeline runs provider registry validation, ERC-8004-style trust checks over demo records, metadata firewalling, PaymentContext binding, quote/nonce/budget checks, clear-signing, and receipt verification."

"The P0 fix is resource binding. A malicious `metadata.resourceUrl` cannot override the request/challenge resource. If metadata points somewhere else, the pipeline blocks before creating a PaymentContext."

### 2:15-2:45 - Attack Lab

"The attack lab runs 16 known x402 failure modes as fixtures through the real guard pipeline. The gate is strict: every scenario must return `blocked` and a `guardEventId`."

"So the claim is precise: 16 out of 16 fixture attacks blocked by the real guard pipeline."

### 2:45-3:00 - CAW Boundary

"This branch records one CAW Sepolia testnet tiny transfer. The request ID, pact ID, tx hash, and pact completion are in `docs/live_caw_testnet_smoke_report.md`. It also records one Sepolia testnet CAW policy denial for a non-allowlisted destination in `docs/live_caw_policy_denial_report.md`. That is not mainnet, not production-ready, not unrestricted CAW execution, and not coverage for every policy-denial type."

## 8-Minute Version

### 0:00-1:00 - Why Clear402 Exists

"x402 is powerful because a service can ask an agent for payment inline. The risk is that a payment proof can be replayed, substituted across resources, pointed at a malicious provider, or attached to metadata that leaks sensitive context."

"Clear402's job is to make the payment leg auditable and safe: bind the payment to the actual resource, reduce metadata leakage, validate provider identity, inspect transaction intent, and prove delivery."

### 1:00-2:00 - Truth Labels

"Before showing the happy path, I want to call out the evidence modes."

"Live means the code path or service actually executed. Fallback means the intended live capability is unavailable and the substitute is visible. Mock means fixture or seed data."

"In this branch, local runtime/provider health is live. Guard pipeline execution is live when the tests and attack lab run it. CAW payment execution is live only for the one recorded Sepolia testnet smoke, and CAW policy-denial evidence is live only for the one recorded destination-allowlist rejection. Ordinary dashboard demos and attack lab runs do not trigger real CAW payments. Attack inputs and provider/trust seed records are mock."

### 2:00-3:10 - Dashboard Walkthrough

"The dashboard starts from the operator view: mission, budget, resource, CAW panel, challenge inspector, provider trust, metadata firewall, PaymentContext, clear signing, receipt, attack lab, and export."

"The health badges are live facts from local services. The mission/payment actions are demo/fallback state unless they are backed by a runtime response. That is why the badges matter."

"The dashboard is not a landing page; it is a control surface for evidence."

### 3:10-4:20 - Guard Pipeline Details

"On prepare, the important sequence is: normalize the 402 challenge, validate provider registry and trust record, scan metadata, bind resource, reserve quote and nonce, inspect transaction semantics, pass through the CAW adapter boundary, and verify the service receipt."

"The P0 repair is in the resource binding step. The pipeline compares the request resource, challenge resource, and `metadata.resourceUrl`. If metadata tries to steer to another URL, it blocks at `resource_binding` before a PaymentContext is built."

### 4:20-5:30 - Attack Lab

"Now we run the attack lab. It covers replay, cross-resource substitution, PII leakage, dynamic price overspend, malicious approve, provider discovery poisoning, paid-but-denied, ERC-8004 mismatch, low reputation, duplicate payment headers, cache confusion, concurrent free-riding, settlement substitution, decimals confusion, malformed delivery, and hidden multicall operation."

"Each scenario is a fixture, but each fixture goes through the real guard pipeline. The pass condition is not a screenshot. It is a blocked decision plus guard evidence."

"The headline is: 16/16 fixture attacks blocked."

### 5:30-6:30 - Evidence Export

"The dashboard can render a JSON and Markdown evidence bundle for the current state. The CLI attack lab can also be captured as a log artifact. Before using any evidence, we check the labels: runtime/provider are live, the recorded CAW smoke and recorded policy denial are Sepolia-testnet-only, and attack inputs plus seed data are mock."

"That prevents the evidence story from outrunning the implementation."

### 6:30-7:30 - CAW Boundary

"CAW is deliberately outside Clear402's policy logic. Clear402 prepares and checks the payment context, then the CawAdapter is the only boundary to CAW."

"The capability report now records one live CAW Sepolia testnet tiny transfer and one live Sepolia testnet destination-allowlist policy denial. The smoke report includes the CAW request ID, pact ID, transaction hash, and pact completion. The denial report includes the CAW request ID, pact ID, rejected transaction record, denial reason, and absence of a transaction hash. This does not prove mainnet readiness, production readiness, unrestricted execution, or coverage for every CAW policy-denial type."

### 7:30-8:00 - Close

"So the demo claim is narrow and strong: live local services, real guard pipeline execution, 16/16 fixture attacks blocked, P0 resource override closed, one recorded CAW Sepolia testnet tiny transfer, and one recorded CAW Sepolia testnet destination-allowlist denial. The ordinary demo path still avoids real CAW payment execution."

"The next rehearsal should focus on timing, evidence labels, and making sure nobody generalizes the Sepolia reports into mainnet, production, unrestricted CAW execution, or full policy-denial coverage."

## Risk Statement

Use this wording when asked about production readiness:

"This branch is demo-gate ready for the guard pipeline and evidence story, and it records one tiny CAW Sepolia testnet transfer plus one CAW Sepolia testnet destination-allowlist denial. Those reports are not mainnet, not production-ready, not unrestricted CAW execution, and not coverage for every CAW policy-denial type. Attack lab inputs are fixtures, provider/trust records are demo seed data, and the ordinary demo does not trigger a real CAW payment."

## Things Not To Say

- "The ordinary dashboard demo moved CAW funds."
- "The Sepolia smoke proves mainnet readiness."
- "CAW execution is unrestricted now."
- "All CAW policy-denial types are covered."
- "The sample transaction hash proves settlement."
- "The attack lab used external attackers or production traffic."
- "The ERC-8004 trust data is live network data."
- "The dashboard payment button proves a real payment happened."
- "The evidence export is a server-side audit endpoint."
- "Mock provider data is equivalent to provider registry verification."
- "P0 is a full funds-moving payment loop."

## Safer Replacements

| Instead of | Say |
|---|---|
| "We paid with CAW." | "We recorded one tiny CAW Sepolia testnet transfer; the ordinary demo does not move funds." |
| "These are real attacks." | "These are fixture attacks executed through the real guard pipeline." |
| "This tx hash is proof." | "Only the Sepolia tx hash in the live smoke report is live CAW testnet evidence." |
| "ERC-8004 verified the provider." | "The ERC-8004-style adapter executed over demo trust records." |
| "The dashboard exported runtime evidence." | "The dashboard rendered an in-app evidence bundle with mode labels." |
| "Policy denial is live-verified." | "One Sepolia testnet destination-allowlist policy denial is recorded; other CAW denial types are not covered." |

## Final Demo Claim

"Clear402 can truthfully demonstrate the x402 guard and evidence pipeline today: runtime/provider health is live, the guard pipeline really executes, the 16-scenario attack lab is blocked end to end, the P0 metadata override is closed, one CAW Sepolia testnet tiny transfer is recorded with request ID, pact ID, tx hash, and pact completion, and one CAW Sepolia testnet destination-allowlist denial is recorded with request ID, pact ID, rejected transaction record, denial reason, and no transaction hash. That does not claim mainnet readiness, production readiness, unrestricted CAW execution, or coverage for every CAW policy-denial type."

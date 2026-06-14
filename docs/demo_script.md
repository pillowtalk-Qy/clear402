# Clear402 Five-Minute Demo Script

This is the final Phase 21 demo script. It is intentionally narrow about evidence claims: live CAW means the recorded Sepolia tiny transfer, the recorded Sepolia destination-allowlist denial, the live `message_sign` EIP-712 authorization verification, and the Base Sepolia USDC EIP-3009 transfer executed through CAW-approved contract_call. The ordinary dashboard payment is fallback/demo, the attack lab uses mock fixture inputs with real guard execution, and provider/trust/capability seed data is demo/mock rather than live registry truth.

## 0:00-0:35 - Problem

"x402 lets services ask agents for payment inline, but an agentic payment flow needs more than a payment header. It needs to know which resource is being bought, which provider is being paid, whether metadata leaks private context, whether the quote can be replayed, whether the transaction intent matches the quote, and whether delivery actually happened."

"Clear402 is the evidence and guard layer around that flow. It is not a replacement for CAW, and it does not claim every demo action is live payment execution."

## 0:35-1:05 - CAW Foundation

"CAW remains the spending authority. Clear402 builds a guarded PaymentContext, then crosses the CAW boundary only through the adapter."

"This branch records four live CAW facts: one tiny `0.0001` SETH transfer documented in `docs/live_caw_testnet_smoke_report.md`, one destination-allowlist policy denial documented in `docs/live_caw_policy_denial_report.md`, one live `message_sign` EIP-712 authorization verification for Base Sepolia USDC, and one Base Sepolia USDC EIP-3009 transfer executed through CAW-approved contract_call. That is not mainnet, not production readiness, not unrestricted CAW execution, and not proof of every CAW denial type."

## 1:05-1:35 - HTTP 402

"The dashboard starts with the HTTP 402 challenge. We normalize the challenge, bind it to the request resource, and check the provider details before anything can look like a payable intent."

"In the ordinary dashboard flow, the payment step is fallback/demo. It has no live transaction hash. If the dashboard shows a sample hash or sample request id, treat it as sample or fallback evidence unless it is explicitly the recorded Sepolia transaction in the live smoke report."

## 1:35-2:15 - Clear402 Guard

"The guard pipeline validates provider registry data, ERC-8004-style trust records, metadata, PaymentContext binding, quote/nonce/budget state, and receipt requirements."

"The important P0 close is resource binding. A malicious `metadata.resourceUrl` cannot steer the payment context to a different URL. If request, challenge, and metadata disagree, the guard blocks before creating a PaymentContext."

## 2:15-2:45 - clearsig

"clearsig is the semantic transaction check. It decodes known transfer and approval shapes, checks recipient and amount against the PaymentContext, and blocks risky intent such as unlimited approve, unsupported selectors, hidden multicall operations, or amount-decimal confusion."

"The demo claim is not 'blindly sign and hope.' It is: explain the intent, compare it to the payment context, then block if it does not match."

## 2:45-3:25 - CAW Payment Evidence

"For CAW payment evidence, the safe wording is precise. The recorded live allow-path evidence is one Sepolia testnet transfer with request ID, pact ID, transaction hash, pact completion, and balance evidence. The recorded denial evidence is one Sepolia destination outside the allowlist rejected with no transaction hash. The Base Sepolia USDC evidence is one EIP-712 authorization approved by CAW `message_sign` and one EIP-3009 `transferWithAuthorization` tx executed through CAW-approved contract_call."

"The current dashboard payment is fallback/demo and does not run another live CAW transfer. The evidence pack sample also does not invent a live CAW transaction. Do not generalize the Base Sepolia USDC tx into arbitrary USDC transfer ability."

## 3:25-3:55 - Provider Delivery

"Provider delivery is checked with service receipt evidence: response hash, provider signature, schema hash, PaymentContext hash, amount, pact, provider address, and delivery status."

"Provider registry and trust seed data in the demo show the shape of the control plane. They are demo/mock records, not live registry truth or live ERC-8004 network data."

## 3:55-4:35 - Attack Lab

"The attack lab covers 16 x402 failure modes from the four paper themes: replay, cross-resource substitution, PII leakage, dynamic price overspend, malicious approve, discovery poisoning, paid-but-denied, ERC-8004 mismatch, low reputation, duplicate payment headers, cache confusion, concurrent free-riding, settlement substitution, decimals confusion, malformed delivery, and hidden multicall operation."

"Each input is a mock fixture. The guard execution is real local code. The claim is: 16 fixture attacks were executed through the real guard pipeline and each returned `blocked` with guard evidence. These are not external attacks and they do not move CAW funds."

## 4:35-5:00 - Evidence Pack

"The evidence pack is the close. It shows the live/fallback/mock split, records the guard decision, identifies fallback dashboard payment state, names mock attack input provenance, and links back to the recorded live CAW reports and Base Sepolia EIP-3009 evidence."

"The final claim is narrow and strong: live local services, real guard execution, fallback-labeled ordinary dashboard payment, 16/16 mock attack fixtures blocked by the real guard pipeline, one recorded CAW Sepolia tiny transfer, one recorded CAW Sepolia destination-allowlist denial, one live `message_sign` EIP-712 authorization verification, and one Base Sepolia USDC EIP-3009 transfer executed through CAW-approved contract_call."

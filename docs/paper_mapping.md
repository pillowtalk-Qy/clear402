# Paper Mapping

This mapping connects the four paper themes to Clear402 guard layers and attack-lab scenarios. The attack lab uses mock fixture inputs and real local guard execution. It must not be presented as external attack traffic or as CAW-funded live exploit traffic.

## Summary

| Paper | Pain Point | Clear402 Protection | Attack Scenarios |
|---|---|---|---|
| Five Attacks on x402 Agentic Payment Protocol | Replay, weak binding, blind signing, malicious discovery, identity spoofing, header/cache/settlement confusion | PaymentContext binding, quote/nonce locks, provider registry, ERC-8004-style trust adapter over demo records, HTTP canonicalizer, cache policy checks, clearsig | `replay_same_proof`, `cross_resource_substitution`, `malicious_approve`, `discovery_poisoning`, `erc8004_identity_mismatch`, `header_confusion_duplicate_x_payment`, `cache_confusion`, `settlement_path_substitution` |
| Free-Riding in the AI Economy | Unpaid reuse, dynamic price drift, low-trust providers, concurrent access races | Quote reservation, budget ledger, CAW policy boundary, reputation threshold, DB lock | `dynamic_price_overspend`, `low_reputation_provider`, `concurrent_free_riding_20_requests`, plus replay coverage from `replay_same_proof` |
| Hardening x402: PII-Safe Agentic Payments | Metadata leakage and hidden signer intent | Metadata firewall, redaction hashes, receipt PII checks, multicall selector inspection | `pii_leakage`, `multicall_hidden_operation` |
| A402: Binding Cryptocurrency Payments to Service Execution | Payment must be bound to service delivery, amount normalization, response shape | ServiceReceipt verifier, PaymentContext hash, provider response hash, response schema hash, clearsig amount decoder | `paid_but_denied`, `partial_payment_decimals_confusion`, `malformed_delivery` |

## Five Attacks on x402 Agentic Payment Protocol

| Attack Scenario | Paper Pain Point | Clear402 Defense | Evidence Anchor |
|---|---|---|---|
| `replay_same_proof` | Replay / free-riding | Nonce lock, quote reservation, receipt state | `replay_detected` event |
| `cross_resource_substitution` | Weak resource binding | PaymentContext canonical URL hash | context mismatch event |
| `malicious_approve` | Blind signing | clearsig semantic gate | decoded `approve(max)` block |
| `discovery_poisoning` | Malicious provider discovery | Provider registry plus CAW allowlist boundary | registry miss / unregistered provider |
| `erc8004_identity_mismatch` | Provider identity spoofing | ERC-8004 trust adapter over demo trust records | endpoint / `payTo` mismatch |
| `header_confusion_duplicate_x_payment` | Web header ambiguity | HTTP canonicalizer | duplicate payment header rejection |
| `cache_confusion` | Cache leakage | `Cache-Control` / `Vary` validation plus receipt verification | cache policy rejection |
| `settlement_path_substitution` | Settlement path inconsistency | Provider registry plus `quoteTermsHash` | facilitator / `payTo` mismatch |

## Free-Riding in the AI Economy

| Attack Scenario | Paper Pain Point | Clear402 Defense | Evidence Anchor |
|---|---|---|---|
| `dynamic_price_overspend` | Dynamic pricing / overdraft | Quote lock, CAW policy boundary, budget ledger | CAW policy denial in fixture execution |
| `low_reputation_provider` | Low-trust provider selection | ERC-8004-style reputation threshold over demo records | reputation threshold block |
| `concurrent_free_riding_20_requests` | Race-condition free-riding | Quote reservation DB lock | 19 concurrent replays blocked |
| `replay_same_proof` | Proof reuse | Nonce lock, quote reservation, receipt state | `replay_detected` event |

## Hardening x402: PII-Safe Agentic Payments

| Attack Scenario | Paper Pain Point | Clear402 Defense | Evidence Anchor |
|---|---|---|---|
| `pii_leakage` | Metadata leakage | Metadata firewall and redaction policy hash | redacted metadata payload |
| `multicall_hidden_operation` | Hidden signer intent | clearsig multicall selector inspection | hidden selector block |

## A402: Binding Cryptocurrency Payments to Service Execution

| Attack Scenario | Paper Pain Point | Clear402 Defense | Evidence Anchor |
|---|---|---|---|
| `paid_but_denied` | Payment-delivery mismatch | ServiceReceipt verifier and fault evidence | `paid_but_not_delivered` receipt |
| `partial_payment_decimals_confusion` | Amount normalization | clearsig amount decoder | amount mismatch |
| `malformed_delivery` | Delivery schema mismatch | Response schema validation | malformed delivery rejected |

## Demo Boundary

Use this wording when showing the mapping:

"The papers define the failure modes. Clear402 maps each one to a guard layer and runs mock fixtures through the real local guard pipeline. The mapping proves coverage of the demo fixtures and guard decisions; it does not claim external attack traffic, production deployment, mainnet settlement, or new live CAW transfers."


# Security Boundaries

This document defines where Clear402 can make security claims in the Phase 21 demo and where the system must stop, redact, or label fallback/mock state.

## Boundary Summary

| Boundary | What Clear402 Owns | What Clear402 Does Not Claim |
|---|---|---|
| CAW boundary | PaymentContext validation before adapter handoff; recorded Sepolia evidence references | Mainnet, unrestricted CAW execution, frontend CAW keys, or live execution outside the adapter |
| Clear402 guard boundary | Provider, metadata, PaymentContext, quote/nonce/budget, clearsig, receipt, and evidence decisions | CAW policy replacement or direct money movement outside guard |
| Provider boundary | Local provider health, challenge, receipt, and fixture helpers | Live external provider registry truth |
| Dashboard boundary | Operator console and labeled evidence display | Source of payment truth or hidden live payment execution |
| Evidence/redaction boundary | Mode labels, redacted hashes, omitted secrets, sample packs | Raw secrets, pairing tokens, wallet secrets, or unredacted CAW logs in committed artifacts |

## CAW Boundary

CAW is the spending authority. Clear402 may prepare and validate a PaymentContext, but live spending can only cross through `CawAdapter` and its live executor boundary.

Rules:

- CAW keys, API keys, pairing tokens, wallet secrets, and local CAW env values must stay in the runtime/operator environment.
- No CAW key may be placed in frontend code, dashboard state, evidence samples, screenshots, Markdown docs, or JSON exports.
- Live CAW claims require request ID, wallet/transaction evidence, audit or pact evidence, and a raw evidence reference.
- The current live CAW scope is only one recorded Sepolia tiny transfer and one recorded Sepolia destination-allowlist denial.
- CAW denial coverage must not be generalized beyond the recorded destination-allowlist denial.

## Clear402 Guard Boundary

The guard is the policy and evidence layer before any money-moving attempt. It owns:

- x402 challenge normalization;
- provider registry validation;
- ERC-8004-style trust checks over demo records;
- metadata firewalling and redaction hashes;
- request/challenge/metadata resource binding;
- PaymentContext construction;
- quote, nonce, and budget reservation;
- clearsig semantic transaction checks;
- service receipt verification;
- evidence mode classification.

No money-moving path may bypass the guard. If a future endpoint, dashboard action, script, or provider helper can trigger CAW execution, it must first pass the same guard sequence and preserve evidence mode labels.

## Provider Boundary

The local provider is a deterministic demo provider. It can produce a 402 challenge, debug verification, deterministic receipt artifacts, and attack fixtures for the local demo.

Provider/trust/capability seed data is demo/mock data. It proves the shape of the flow and test coverage, not live external registry truth. ERC-8004-style records in the demo are local trust records unless a future document explicitly records live network evidence.

## Dashboard Boundary

The dashboard is an operator console, not the source of truth.

Rules:

- Runtime/provider health displayed by the dashboard can be live local service evidence.
- Ordinary mission/payment/receipt/export actions are fallback/demo unless backed by runtime evidence.
- The ordinary dashboard payment action does not execute the recorded live CAW smoke and has no live transaction hash.
- Dashboard sample IDs, hashes, wallet IDs, provider records, and attack cards must remain labeled fallback/mock as appropriate.
- UI labels must not convert fallback/mock state into live claims.

## Evidence And Redaction Boundary

Evidence artifacts must preserve provenance:

- `live` is reserved for actual execution with evidence.
- `fallback` is an explicit substitute state.
- `mock` is inert fixture or seed data.
- `sample` evidence packs are sample artifacts and must still label each record as fallback/mock/live according to provenance.

Redaction rules:

- Do not commit `.env.caw.local`, `.env.caw.local.bak`, API keys, pairing tokens, wallet secrets, or raw secret-bearing logs.
- Exported evidence must omit raw CAW secret-bearing evidence refs and use hashes or documented report links instead.
- The sample evidence pack must not invent a CAW tx hash for ordinary dashboard payment.
- Raw PII must not appear in receipts or evidence exports; use redaction summary hashes and sanitized metadata.

## Required Negative Guarantees

- No CAW key in frontend.
- No money-moving path bypassing guard.
- No ordinary dashboard payment presented as live CAW payment.
- No attack fixture presented as external attack traffic.
- No provider/trust/capability seed data presented as live registry truth.
- No sample evidence pack presented as a live CAW audit artifact.


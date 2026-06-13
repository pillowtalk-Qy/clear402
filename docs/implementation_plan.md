# Clear402 Implementation Plan

Phase 0 freeze for the Clear402 repo.

## 0. Source Of Truth

Use this precedence when documents or code disagree:

1. `Clear402_Demo_Design.md` defines product truth.
2. `Clear402_Codex_Execution_Playbook.md` defines phase order and merge flow.
3. `Clear402_Codex_Operator_Manual.md` defines window commands and acceptance format.
4. Repo files must follow the three docs above.

If a later implementation conflicts with this plan, the docs win and the repo must be revised.

## 1. Project Objective

Clear402 is a CAW-backed hardened x402 runtime.

It does not:

- rebuild a wallet,
- rebuild CAW policy,
- or claim mock evidence as live evidence.

It does:

- normalize x402 payment challenges,
- filter sensitive metadata,
- bind payments to request context,
- enforce quote/nonce/budget safety,
- run clear-signing checks,
- route spending through CawAdapter,
- verify provider delivery,
- and export evidence.

## 2. System Architecture

```text
User / Agent / Dashboard
  -> Clear402 Runtime API
    -> Guard Pipeline
      -> Provider Registry
      -> ERC-8004 Trust Adapter (P1 only)
      -> Metadata Firewall
      -> PaymentContext Builder
      -> Quote Reservation
      -> Nonce Lock
      -> Budget Ledger
      -> clearsig Semantic Gate
      -> CawAdapter
      -> Service Receipt Verifier
    -> Evidence Store / Export
  -> Official CAW
  -> provider-x402
```

Key rule: CAW is the execution source of truth for spending. Clear402 only adds safety, provenance, and evidence.

## 3. Service Boundaries

| Boundary | Owns | May Call | Must Not Call |
|---|---|---|---|
| `apps/dashboard` | UI, controls, operator views | runtime HTTP APIs | CAW, DB, provider directly |
| `services/runtime` | mission state, guard decisions, evidence, API contracts | DB, CawAdapter, provider validation helpers | direct CAW CLI, browser-only logic |
| `services/provider-x402` | local 402 provider, challenge, receipt payloads, attack fixtures | runtime verification endpoints | runtime guard internals |
| `packages/shared` or equivalent | shared schema/types | all app layers | product-specific side effects |
| `contracts/` | P1 escrow contracts only | runtime P1 flows | P0 mainline coupling |
| `scripts/` | setup, verification, seeding, attack runner | local tools and services | hidden business logic |
| `docs/` | frozen intent, operating rules, evidence policy | humans and Codex windows | runtime execution logic |
| `evidence/` | raw/redacted evidence artifacts | report generation | business state mutation |

## 4. Data Flow

### 4.1 Main Payment Flow

1. Create mission.
2. Provider returns a 402 challenge.
3. Runtime normalizes the challenge.
4. Provider Registry validates origin, payTo, resource, facilitator, chain, and token.
5. Metadata Firewall redacts or blocks sensitive fields.
6. PaymentContext is built and hashed.
7. Quote reservation, nonce lock, and budget reservation happen.
8. clearsig checks the actual payment intent.
9. CawAdapter executes the approved payment path.
10. Provider verifies payment and returns delivery data.
11. Service Receipt closes the flow.
12. Evidence is stored and exportable.

### 4.2 Denial Flow

1. A mismatch, over-budget request, malicious calldata, or unsafe metadata is detected.
2. The guard pipeline stops.
3. A guard event is written.
4. The denial is preserved as evidence.
5. No fallback is allowed to silently become a normal payment.

### 4.3 Attack Flow

1. Attack Lab replays a known bad fixture.
2. The same guard pipeline runs.
3. The attack is blocked or marked as a controlled fallback case.
4. The result is recorded with paper mapping and evidence refs.

### 4.4 Dashboard Flow

The dashboard only renders runtime facts. It may change layout, not truth.

## 5. Phase Roadmap

### Wave A: Phase 0 to Phase 2

- Phase 0: freeze spec, risks, interfaces, branch strategy.
- Phase 1: monorepo skeleton.
- Phase 2: DB schema and API contracts.

### Wave B: Phase 3 to Phase 5

- Phase 3: CAW capability verification.
- Phase 4: CawAdapter.
- Phase 5: provider-x402.

### Wave C: Phase 6 to Phase 12

- Phase 6: Provider Registry + ERC-8004 Trust Adapter.
- Phase 7: Metadata Firewall.
- Phase 8: PaymentContext + canonicalization.
- Phase 9: Quote Reservation / Nonce Lock / Budget Ledger.
- Phase 10: clearsig Semantic Gate.
- Phase 11: Guard Pipeline orchestration.
- Phase 12: Service Receipt.

### Wave D: Phase 13 to Phase 15

- Phase 13: Attack Lab.
- Phase 14: Evidence Dashboard.
- Phase 15: Evidence export.

### Wave E: Phase 16 to Phase 19

- Phase 16: E2E tests.
- Phase 17: Security audit.
- Phase 18: Code review.
- Phase 19: Design review.

### Wave F: Phase 20 to Phase 21

- Phase 20: P1 championship features.
- Phase 21: final packaging.

## 6. Branch Plan

Lead integration branch:

- `clear402/integration`

First module branch:

- `clear402/foundation`

Later module branches are created from integration after the foundation merge.

Merge order:

1. foundation
2. provider
3. caw
4. guard
5. attack-lab
6. dashboard
7. e2e-security
8. docs-demo

## 7. P0 Completion Definition

P0 is complete when the repo can truthfully demonstrate the core security and payment loop without lying about capability mode.

Minimum P0 bar:

- monorepo skeleton runs,
- health checks work,
- DB schema and API contracts are frozen,
- CAW capability report exists,
- CawAdapter is the only CAW boundary,
- provider challenge can be normalized,
- metadata can be filtered,
- PaymentContext can be built,
- quote/nonce/budget protection exists,
- clearsig can block unsafe intent,
- service receipts can be verified,
- attack lab can produce blocked outcomes,
- evidence can be exported,
- and all outputs are labeled `live`, `fallback`, or `mock`.

P0 is not complete if:

- mock is presented as live,
- CAW denial is missing,
- or a money-moving path bypasses the guard pipeline.

## 8. P1 Championship Definition

P1 adds competitive depth without changing the P0 truth source.

Championship feature status:

| Feature | Current status |
|---|---|
| ERC-8004 trust adapter demo or explicit limitation | Demo adapter complete; live network truth remains an explicit limitation. |
| ServiceEscrow fund/refund flow | Local protocol/state-machine layer complete. |
| `message_sign` PaymentContext support | Local/runtime PaymentContext and guard support complete. |
| `params_match` / `message_match` / `function_abis` | Local clearsig policy enforcement complete. |
| SSE timeline | Basic runtime SSE snapshot endpoint complete. |
| 20-request race regression | Covered by the attack fixture gate, not a broad load suite. |
| Signed ProviderQuote | Local signed quote protocol and verification complete. |
| Dual Receipt model | Local payment/delivery dual-receipt protocol complete. |
| Chaos / regression pack | Partially covered by unit, E2E, and 16 attack fixtures. |
| Payment gateway mode | Local provider gateway route complete. |

P1 must be feature-flagged and must not weaken P0.

## 9. Acceptance Commands By Phase

### Phase 0

```bash
git status --short --branch
git branch --list
test -f docs/implementation_plan.md
test -f docs/risk_register.md
test -f docs/interface_contracts.md
test -f docs/live_fallback_mock_policy.md
```

### Phase 1

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
curl http://localhost:4000/health
curl http://localhost:4010/health
```

### Phase 2

```bash
pnpm --filter runtime test
pnpm --filter runtime build
```

### Phase 3

```bash
bash scripts/verify_caw_cli.sh
sed -n '1,240p' docs/caw_capability_report.md
find evidence/caw -maxdepth 2 -type f
```

### Phase 4

```bash
pnpm --filter runtime test caw
pnpm --filter runtime build
```

### Phase 5

```bash
pnpm --filter provider-x402 test
pnpm --filter provider-x402 build
curl -i http://localhost:4010/paid/report
curl http://localhost:4010/debug/challenge
```

### Phases 6 to 12

```bash
pnpm --filter runtime test provider_registry
pnpm --filter runtime test erc8004
pnpm --filter runtime test metadata_firewall
pnpm --filter runtime test payment_context
pnpm --filter runtime test canonicalization
pnpm --filter runtime test quote_lock
pnpm --filter runtime test budget_ledger
pnpm --filter runtime test clearsig
pnpm --filter runtime test receipt
pnpm --filter runtime test guard_pipeline
```

### Phase 13

```bash
pnpm --filter runtime test attack_lab
pnpm run attack:all
```

### Phase 14 to 15

```bash
pnpm --filter dashboard lint
pnpm --filter dashboard build
pnpm --filter dashboard test
curl http://localhost:4000/api/evidence/<missionId>/export.json
curl http://localhost:4000/api/evidence/<missionId>/export.md
```

### Phase 16 to 19

```bash
pnpm test:e2e
pnpm lint
pnpm test
pnpm build
pnpm run attack:all
```

### Phase 20 to 21

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm run attack:all
```

## 10. No-Go Conditions

Do not call the repo ready if any of these remain true:

- no CAW capability report,
- no policy denial evidence,
- attack lab is only text,
- dashboard forges security state,
- replay or substitution still works,
- PII leaks into receipts or exports,
- malicious approve is not blocked,
- payment is marked delivered without verified delivery,
- CAW keys leak to the frontend,
- arbitrary URLs can trigger payment,
- or live/fallback/mock is blurred.

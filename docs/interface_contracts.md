# Clear402 Interface Contracts

Phase 0 freeze for the main repo interfaces.

## 1. Contract Rules

1. Amounts are strings, never JavaScript numbers.
2. IDs are opaque strings and must be stable within a mission.
3. Every response that can vary by environment must carry an `evidenceMode`.
4. Errors must use Problem JSON.
5. Dashboard reads runtime facts; it does not invent security state.
6. CawAdapter is the only approved boundary to official CAW.
7. ERC-8004 is a P1 trust layer only and does not replace CAW policy.

## 2. Canonical Enums

```ts
export type EvidenceMode = "live" | "fallback" | "mock";

export type CapabilityStatus =
  | "verified"
  | "needs_manual_step"
  | "unavailable"
  | "fallback_required";

export type EnforcementLevel =
  | "CAW_ENFORCED"
  | "CLEAR402_ENFORCED"
  | "PROVIDER_ENFORCED"
  | "EVIDENCE_ONLY";

export type ReceiptStatus =
  | "paid"
  | "delivered"
  | "failed"
  | "refundable"
  | "refunded"
  | "paid_but_not_delivered";
```

## 3. Shared Error Shape

```ts
export interface ProblemJSON {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}
```

All runtime APIs that fail must return this shape or a transport-level error with the same semantics.

## 4. Core Domain Types

```ts
export interface Mission {
  id: string;
  userPrompt: string;
  budgetUsd: string;
  status: "draft" | "active" | "blocked" | "complete" | "failed";
  cawWalletUuid: string;
  cawWalletAddress?: string;
  pactId?: string;
  createdAt: number;
}

export interface ProviderRegistryEntry {
  providerId: string;
  origin: string;
  merchantAddress: string;
  facilitatorUrl?: string;
  chainId: string;
  tokenId: string;
  publicKey: string;
  allowedResources: string[];
  cawAllowlistStatus: "allowed" | "pending" | "blocked";
  erc8004AgentId?: string;
  erc8004AgentUri?: string;
  reputationThreshold?: number;
  validationTags?: string[];
}

export interface X402ChallengeNormalized {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  resource: string;
  facilitatorUrl?: string;
  description?: string;
  expiresAt: number;
  providerId: string;
  rawChallengeHash: string;
  evidenceMode: EvidenceMode;
}

export interface MetadataFirewallResult {
  decision: "allow" | "redact" | "hash_only" | "require_approval" | "block";
  sanitized: {
    resourceUrl: string;
    description?: string;
    reason?: string;
  };
  findings: Array<{
    field: "resourceUrl" | "description" | "reason";
    entityType: string;
    confidence: number;
    action: string;
  }>;
  piiPolicyHash: string;
  latencyMs: number;
  evidenceMode: EvidenceMode;
}

export interface PaymentContext {
  version: "clear402.payment.v1";
  missionId: string;
  providerId: string;
  quoteId: string;
  method: "GET" | "POST";
  origin: string;
  resourcePath: string;
  canonicalUrlHash: string;
  bodyHash: string;
  sanitizedResourceHash: string;
  merchantAddress: string;
  facilitatorUrlHash?: string;
  chainId: string;
  tokenId: string;
  amount: string;
  amountDecimals: number;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  quoteTermsHash: string;
  piiPolicyHash: string;
  clearSignDigest?: string;
  cawPactId: string;
  serviceMode: "caw-fetch" | "direct-transfer" | "escrowed-delivery";
}

export interface QuoteReservation {
  quoteId: string;
  paymentContextHash: string;
  nonce: string;
  status: "reserved" | "spent" | "released" | "disputed" | "refunded";
  reservedBudget: string;
  reservedAt: number;
  expiresAt: number;
}

export interface GuardEvent {
  id: string;
  missionId: string;
  layer: string;
  decision: "allow" | "block" | "require_approval" | "fallback_required";
  reason?: string;
  evidenceJson: Record<string, unknown>;
  createdAt: number;
}

export interface CawCapabilityRecord {
  capability: string;
  status: CapabilityStatus;
  evidenceMode: EvidenceMode;
  rawEvidenceRef?: string;
  notes?: string;
}

export interface CawPolicyDenialEvidence {
  code: string;
  reason: string;
  details: Record<string, unknown>;
  suggestion?: string;
  attemptedOperation: "transfer" | "contract_call" | "message_sign";
  paymentContextHash?: string;
  cawRequestId?: string;
  auditLogId?: string;
  evidenceMode: EvidenceMode;
}

export interface ServiceReceipt {
  receiptId: string;
  paymentContextHash: string;
  cawRequestId?: string;
  cawWalletAddress: string;
  pactId: string;
  providerAddress: string;
  facilitatorUrlHash?: string;
  txHash?: string;
  chainId: string;
  tokenId: string;
  amount: string;
  providerResponseHash: string;
  providerSignature: string;
  responseSchemaHash?: string;
  deliveryTimestamp: number;
  status: ReceiptStatus;
  clearsigDigest?: string;
  auditLogIds: string[];
  redactionSummaryHash?: string;
  evidenceMode: EvidenceMode;
}

export interface ERC8004TrustResult {
  agentId: string;
  identityVerified: boolean;
  endpointMatches: boolean;
  payToMatches: boolean;
  reputationScore: number;
  deliverySuccessRate?: number;
  paidButDeniedReports?: number;
  validationAttestations: Array<{
    tag:
      | "x402_endpoint_verified"
      | "delivery_receipt_verified"
      | "pii_safe_metadata"
      | "schema_validated";
    issuer: string;
    evidenceUri?: string;
  }>;
  decision: "allow" | "require_approval" | "block";
  reason?: string;
  evidenceMode: EvidenceMode;
}

export interface EvidenceBundle {
  missionId: string;
  live: unknown[];
  fallback: unknown[];
  mock: unknown[];
  redactions: string[];
  createdAt: number;
}
```

## 5. Frozen API Surface

This repo should keep these route names stable unless the Lead updates this document first.

### 5.1 Health

- `GET /health`

### 5.2 Mission And Evidence

- `POST /api/missions`
- `GET /api/missions/:id`
- `GET /api/evidence/:missionId`
- `GET /api/evidence/:missionId/export.json`
- `GET /api/evidence/:missionId/export.md`

### 5.3 Provider And Trust

- `POST /api/provider-registry/validate`
- `POST /api/provider-registry/erc8004/validate`
- `POST /api/firewall/scan`
- `POST /api/context/build`
- `POST /api/quote/reserve`
- `POST /api/clearsig/decode`
- `POST /api/receipt/verify`

### 5.4 CAW Boundary

- `POST /api/caw/pact/draft`
- `POST /api/caw/pact/submit`
- `GET /api/caw/pact/:pactId`
- `POST /api/caw/fetch/dry-run`
- `POST /api/caw/fetch/execute`
- `POST /api/caw/sdk/transfer`
- `POST /api/caw/sdk/contract-call`
- `GET /api/caw/tx/by-request-id/:requestId`
- `GET /api/caw/audit-logs`

### 5.5 Attack Lab

- `POST /api/attacks/:attackName/run`

## 6. Dependency Rules

1. Dashboard -> runtime only.
2. Runtime -> CawAdapter only, never direct shelling out from business code.
3. Runtime -> provider-x402 only through validation or verification endpoints.
4. Attack Lab -> the same runtime guard pipeline that normal missions use.
5. Shared contracts are owned by the Lead branch and then consumed by module branches.

## 7. Versioning Rule

Any breaking change requires:

1. a Lead review,
2. a contract doc update,
3. a branch merge in the approved order,
4. and a test run that proves the new shape.

No module branch may silently redefine these contracts.

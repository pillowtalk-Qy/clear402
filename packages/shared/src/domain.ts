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

export type MissionStatus = "draft" | "active" | "blocked" | "complete" | "failed";

export type QuoteStatus = "draft" | "reserved" | "accepted" | "expired" | "spent" | "cancelled";

export type ReservationStatus = "reserved" | "spent" | "released" | "disputed" | "refunded";

export type GuardDecision = "allow" | "block" | "require_approval" | "fallback_required";

export type ServiceMode =
  | "caw-fetch"
  | "direct-transfer"
  | "escrowed-delivery";

export interface Mission {
  id: string;
  userPrompt: string;
  budgetUsd: string;
  status: MissionStatus;
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

export interface X402Quote {
  quoteId: string;
  missionId: string;
  providerId: string;
  resourceUrl: string;
  amountUsd: string;
  status: QuoteStatus;
  rawChallengeHash: string;
  createdAt: number;
  expiresAt: number;
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
  serviceMode: ServiceMode;
}

export interface QuoteReservation {
  quoteId: string;
  paymentContextHash: string;
  nonce: string;
  status: ReservationStatus;
  reservedBudget: string;
  reservedAt: number;
  expiresAt: number;
}

export interface GuardEvent {
  id: string;
  missionId: string;
  layer: string;
  decision: GuardDecision;
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

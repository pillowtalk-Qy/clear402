export type EvidenceMode = "live" | "fallback" | "mock";

export type DashboardPreset = "demo" | "investigate" | "attack" | "evidence";

export type PanelState =
  | "idle"
  | "loading"
  | "live"
  | "fallback"
  | "mock"
  | "blocked"
  | "denied"
  | "pending_approval"
  | "success"
  | "empty"
  | "error";

export type ReasonCode =
  | "MARKET_DATA_REQUEST"
  | "RESEARCH_DATASET_ACCESS"
  | "MODEL_INFERENCE_PAYMENT"
  | "ESCROWED_SERVICE_DELIVERY";

export type ServiceMode =
  | "caw-fetch"
  | "direct-transfer"
  | "escrowed-delivery";

export type AttackResult = "blocked" | "fallback" | "mock" | "success" | "idle";

export interface HealthSnapshot {
  service: string;
  status: "ok" | "down";
  evidenceMode: EvidenceMode;
  timestamp: string;
  version: string;
  details?: Record<string, unknown>;
  endpoint: string;
  error?: string;
}

export interface MissionDraft {
  prompt: string;
  budgetUsd: string;
  resourceUrl: string;
}

export interface MissionState {
  id?: string;
  userPrompt: string;
  budgetUsd: string;
  resourceUrl: string;
  status: "draft" | "active" | "blocked" | "complete" | "failed";
  cawWalletUuid: string;
  cawWalletAddress: string;
  pactId?: string;
  createdAt?: number;
  evidenceMode: EvidenceMode;
}

export interface CawCapabilityRecord {
  capability: string;
  status: "verified" | "needs_manual_step" | "unavailable" | "fallback_required";
  evidenceMode: EvidenceMode;
  rawEvidenceRef?: string;
  notes?: string;
}

export interface CawAuditLog {
  id: string;
  outcome: "allow" | "deny" | "pending_approval" | "fallback";
  evidenceMode: EvidenceMode;
  note: string;
  timestamp: number;
}

export interface CawPanelState {
  environment: string;
  walletUuid: string;
  walletAddress: string;
  pactId: string;
  pactScopedApiKeyStatus: "allowed" | "pending" | "blocked" | "fallback_required";
  transactionStatus: "idle" | "prepared" | "submitted" | "denied" | "finalized";
  auditLogs: CawAuditLog[];
  capabilityReport: CawCapabilityRecord[];
  evidenceMode: EvidenceMode;
}

export interface ChallengeInspectorState {
  rawChallenge: Record<string, unknown> | null;
  normalizedChallenge: Record<string, unknown> | null;
  providerRegistryResult: Record<string, unknown> | null;
  settlementPath: string;
  evidenceMode: EvidenceMode;
  state: PanelState;
}

export interface ProviderTrustState {
  providerId: string;
  registryEntry: Record<string, unknown>;
  trustResult: Record<string, unknown>;
  evidenceMode: EvidenceMode;
  state: PanelState;
}

export interface FirewallState {
  before: {
    resourceUrl: string;
    description: string;
    reason: string;
  };
  after: {
    resourceUrl: string;
    description: string;
    reason: string;
  };
  reasonCode: ReasonCode;
  findings: Array<{
    field: "resourceUrl" | "description" | "reason";
    entityType: string;
    action: string;
    confidence: number;
  }>;
  decision: "allow" | "redact" | "hash_only" | "require_approval" | "block";
  piiPolicyHash: string;
  latencyMs: number;
  evidenceMode: EvidenceMode;
}

export interface PaymentContextState {
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
  clearSignDigest: string;
  cawPactId: string;
  serviceMode: ServiceMode;
  paymentContextHash: string;
  requestId: string;
  evidenceMode: EvidenceMode;
}

export interface ClearSignState {
  input: {
    chainId: string;
    to: string;
    calldata: string;
    value: string;
    typedData: Record<string, unknown>;
    expected: {
      merchantAddress: string;
      amount: string;
      tokenId: string;
      allowedSelectors: string[];
      paymentContextHash: string;
    };
  };
  result: {
    decision: "allow" | "require_approval" | "block";
    intent: string;
    functionSignature: string;
    selector: string;
    decodedParams: Record<string, unknown>;
    calldataDigest: string;
    typedDataDigest: string;
    riskTags: string[];
    reason: string;
  };
  evidenceMode: EvidenceMode;
}

export interface TimelineEvent {
  id: string;
  title: string;
  detail: string;
  evidenceMode: EvidenceMode;
  status: "allow" | "blocked" | "pending_approval" | "success" | "fallback" | "mock" | "live";
  timestamp: number;
  auditLogId?: string;
}

export interface ReceiptState {
  receiptId: string;
  paymentReceipt: {
    status: "paid" | "refundable" | "refunded";
    requestId: string;
    walletAddress: string;
    pactId: string;
    amount: string;
    txHash?: string;
    evidenceMode: EvidenceMode;
  };
  deliveryReceipt: {
    status: "empty" | "delivered" | "failed" | "paid_but_not_delivered";
    responseHash: string;
    providerSignature: string;
    schemaHash: string;
    redactionSummaryHash?: string;
    evidenceMode: EvidenceMode;
  };
  finalStatus:
    | "paid"
    | "delivered"
    | "failed"
    | "refundable"
    | "refunded"
    | "paid_but_not_delivered";
  auditLogIds: string[];
  evidenceMode: EvidenceMode;
}

export interface AttackScenario {
  id: string;
  title: string;
  paper: string;
  blockedLayer: string;
  summary: string;
  evidenceMode: EvidenceMode;
  resultState: AttackResult;
  resultDetail?: string;
  evidenceRef?: string;
  guardEventId?: string;
  runCount: number;
}

export interface EvidenceExportState {
  generatedAt: number;
  evidenceMode: EvidenceMode;
  source: "server_side" | "frontend_fallback";
  runtimeSource?: string;
  json: string;
  markdown: string;
  stale: boolean;
}

export interface DashboardWorkspace {
  preset: DashboardPreset;
  runtimeHealth: HealthSnapshot;
  providerHealth: HealthSnapshot;
  missionDraft: MissionDraft;
  mission: MissionState;
  caw: CawPanelState;
  challenge: ChallengeInspectorState;
  providerTrust: ProviderTrustState;
  firewall: FirewallState;
  paymentContext: PaymentContextState;
  clearSign: ClearSignState;
  timeline: TimelineEvent[];
  receipt: ReceiptState;
  attacks: AttackScenario[];
  evidence: EvidenceExportState | null;
  selectedAttackId: string;
}

export interface DashboardRuntimeSnapshot {
  runtime: HealthSnapshot;
  provider: HealthSnapshot;
}

export interface DashboardInitOptions extends DashboardRuntimeSnapshot {
  preset: DashboardPreset;
}

export interface PreferredEvidenceExportResult {
  evidence: EvidenceExportState;
  usedRuntime: boolean;
  fallbackReason?: string;
}

export interface PreferredEvidenceExportOptions {
  fetcher?: typeof fetch;
  basePath?: string;
  now?: number;
}

const sampleProviderId = "provider-markets-01";
const sampleWalletUuid = "wallet-demo-402";
const sampleWalletAddress = "0x7A11E4dA1A6D1F8B9Fb3C3C7d4C6A0eF1Faa2402";
const sampleMissionId = "mission-demo-402";
const samplePactId = "pact-demo-402";
const sampleQuoteId = "quote-demo-402";
const sampleRequestId = "clear402:7ad4e2d9c1bf6a01";
const samplePaymentContextHash = "0x7ad4e2d9c1bf6a011d0b4a1c2fd31f92d4b73f9d8d1e8c8b3f0a1a2c3d4e5f60";
const sampleTxHash = "0x9f2e3d4c5b6a79887766554433221100aa55cc33dd44ee66ff7788990011ab22";
const sampleRawChallengeHash = "0x42a10f8a9d0c5f8f10c0f0a71e4c80b1f7b1e965d43de2b8e2a0a8c7d9e3f110";
const sampleCanonicalUrlHash = "0x8f1298e3d7c2a0f1d3e9c5b7a4f0b1c28d97aa3d1f2c4e6f8b0a1c2d3e4f5678";
const sampleBodyHash = "0x0d5c1a2b3e4f5061728394a5b6c7d8e9f102030405060708090a0b0c0d0e0f10";
const sampleSanitizedResourceHash = "0x91aa21b0d4c5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f";
const sampleQuoteTermsHash = "0x6b7fe4010a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef01234567";
const samplePiiPolicyHash = "0x4c0dd9a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e";
const sampleClearSignDigest = "0x9a11c33d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcde0";
const sampleProviderResponseHash = "0xbadf00d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef1";
const sampleResponseSchemaHash = "0x5d4c3b2a1908f7e6d5c4b3a29180706050403020100ffeeddccbbaa99887766";
const sampleRedactionSummaryHash = "0x22ab33cd44ef55aa66bb77cc88dd99ee00ff11aa22bb33cc44dd55ee66ff7788";
const samplePiiReason = "MODEL_INFERENCE_PAYMENT";

const attackDefinitions: AttackScenario[] = [
  {
    id: "replay",
    title: "Replay same nonce",
    paper: "Five Attacks on x402",
    blockedLayer: "Quote reservation / nonce lock",
    summary: "Second attempt with the same request id is rejected and recorded.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  },
  {
    id: "substitution",
    title: "Cross-resource substitution",
    paper: "Five Attacks on x402",
    blockedLayer: "PaymentContext binding",
    summary: "The request path no longer matches the approved quote and is blocked.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  },
  {
    id: "pii",
    title: "PII metadata leak",
    paper: "Hardening x402",
    blockedLayer: "Metadata firewall",
    summary: "Email, token, and customer-id fragments are redacted before guard prepare.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  },
  {
    id: "price",
    title: "Dynamic price jump",
    paper: "Five Attacks on x402",
    blockedLayer: "Quote reservation / budget ledger",
    summary: "A higher amount than the reserved quote is denied before execution.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  },
  {
    id: "approve",
    title: "Malicious approve",
    paper: "Hardening x402",
    blockedLayer: "Clear signing",
    summary: "Unlimited approval to the wrong spender is blocked by semantic inspection.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  },
  {
    id: "poisoning",
    title: "Discovery poisoning",
    paper: "Free-Riding in the AI Economy",
    blockedLayer: "Provider registry",
    summary: "An unregistered provider origin fails the allowlist and trust checks.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  },
  {
    id: "denied",
    title: "Paid-but-denied",
    paper: "A402 / x402 papers",
    blockedLayer: "Service receipt",
    summary: "Payment lands, delivery does not. The final receipt stays non-successful.",
    evidenceMode: "mock",
    resultState: "idle",
    runCount: 0
  }
];

function cloneAttackDefinitions() {
  return attackDefinitions.map((attack) => ({ ...attack }));
}

function compactHash(value: string, head = 10, tail = 8) {
  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function modeFromHealth(snapshot: HealthSnapshot): EvidenceMode {
  if (snapshot.evidenceMode === "live") {
    return "live";
  }

  if (snapshot.evidenceMode === "fallback") {
    return "fallback";
  }

  return "mock";
}

function stableJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceEvidenceMode(value: unknown): EvidenceMode {
  if (value === "live" || value === "fallback" || value === "mock") {
    return value;
  }

  return "fallback";
}

function isSecretLikeKey(key: string) {
  return /(?:api[_-]?key|secret|password|authorization|bearer|private[_-]?key|session|cookie|providerSignature)$/i.test(
    key
  );
}

export function redactSecretLikeText(value: string) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bCUST-\d+\b/g, "[redacted-customer-id]")
    .replace(/\bCLEAR402_CAW_[A-Z0-9_]*=[^\s"',)]+/g, "[redacted-secret]")
    .replace(/\bsk-(?:live|test)-[A-Za-z0-9_-]+/g, "[redacted-secret]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted-secret]")
    .replace(/\b(API\s+token\s+)[^\s.]+/gi, "$1[redacted-secret]")
    .replace(/\b(x-api-key\s*[:=]\s*)[^\s"',)]+/gi, "$1[redacted-secret]");
}

export function sanitizeEvidenceForDisplay(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSecretLikeText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeEvidenceForDisplay(entry));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSecretLikeKey(key) ? "[redacted-secret]" : sanitizeEvidenceForDisplay(entry)
      ])
    );
  }

  return value;
}

function buildTimelineItem(
  id: string,
  title: string,
  detail: string,
  status: TimelineEvent["status"],
  evidenceMode: EvidenceMode,
  timestamp: number,
  auditLogId?: string
): TimelineEvent {
  const item: TimelineEvent = {
    id,
    title,
    detail,
    status,
    evidenceMode,
    timestamp
  };

  if (auditLogId) {
    item.auditLogId = auditLogId;
  }

  return item;
}

export function formatCompactHash(value: string) {
  return compactHash(value);
}

export function formatRequestId(paymentContextHash: string) {
  return `clear402:${paymentContextHash.replace(/^0x/, "").slice(0, 16)}`;
}

export function createInitialWorkspace(options: DashboardInitOptions): DashboardWorkspace {
  const createdAt = Date.now();
  const missionDraft: MissionDraft = {
    prompt: "Request protected market data for the research desk.",
    budgetUsd: "0.10",
    resourceUrl: "https://127.0.0.1:4010/paid/report?topic=market-intel"
  };

  const mission: MissionState = {
    userPrompt: missionDraft.prompt,
    budgetUsd: missionDraft.budgetUsd,
    resourceUrl: missionDraft.resourceUrl,
    status: "draft",
    cawWalletUuid: sampleWalletUuid,
    cawWalletAddress: sampleWalletAddress,
    evidenceMode: "mock"
  };

  const caw: CawPanelState = {
    environment: "local-demo",
    walletUuid: sampleWalletUuid,
    walletAddress: sampleWalletAddress,
    pactId: samplePactId,
    pactScopedApiKeyStatus: "fallback_required",
    transactionStatus: "idle",
    evidenceMode: "fallback",
    capabilityReport: [
      {
        capability: "wallet_status",
        status: "verified",
        evidenceMode: options.runtime.evidenceMode,
        rawEvidenceRef: "runtime/health",
        notes: "Runtime health endpoint is live."
      },
      {
        capability: "pact_submit",
        status: "needs_manual_step",
        evidenceMode: "fallback",
        rawEvidenceRef: "docs/caw_capability_report.md",
        notes: "CAW side capabilities are not wired in this branch."
      },
      {
        capability: "request_tracking",
        status: "fallback_required",
        evidenceMode: "mock",
        notes: "Dashboard is using a deterministic demo request id."
      }
    ],
    auditLogs: [
      {
        id: "audit-001",
        outcome: "allow",
        evidenceMode: options.runtime.evidenceMode,
        note: "Runtime service is live and reachable.",
        timestamp: createdAt - 60_000
      },
      {
        id: "audit-002",
        outcome: "fallback",
        evidenceMode: "fallback",
        note: "CAW execution path is not yet available in this branch.",
        timestamp: createdAt - 30_000
      }
    ]
  };

  const challenge: ChallengeInspectorState = {
    rawChallenge: null,
    normalizedChallenge: null,
    providerRegistryResult: null,
    settlementPath: "fallback_required",
    evidenceMode: "mock",
    state: "empty"
  };

  const providerTrust: ProviderTrustState = {
    providerId: sampleProviderId,
    registryEntry: {
      providerId: sampleProviderId,
      origin: "http://127.0.0.1:4010",
      merchantAddress: sampleWalletAddress,
      facilitatorUrl: "https://facilitator.clear402.local",
      chainId: "84532",
      tokenId: "USDC",
      publicKey: "0x04cawdemo_public_key",
      allowedResources: ["/paid/report", "/v1/market-intel"],
      cawAllowlistStatus: "pending",
      erc8004AgentId: "erc8004:agent:clear402-demo",
      erc8004AgentUri: "https://erc8004.example/agents/clear402-demo",
      reputationThreshold: 72,
      validationTags: [
        "x402_endpoint_verified",
        "delivery_receipt_verified",
        "pii_safe_metadata"
      ]
    },
    trustResult: {
      agentId: "erc8004:agent:clear402-demo",
      identityVerified: true,
      endpointMatches: true,
      payToMatches: true,
      reputationScore: 84,
      deliverySuccessRate: 0.97,
      paidButDeniedReports: 0,
      validationAttestations: [
        { tag: "x402_endpoint_verified", issuer: "Clear402 demo registry" },
        { tag: "delivery_receipt_verified", issuer: "Clear402 receipt verifier" },
        { tag: "pii_safe_metadata", issuer: "Clear402 metadata firewall" }
      ],
      decision: "require_approval",
      reason: "ERC-8004 trust is demo-backed until the runtime adapter lands."
    },
    evidenceMode: "fallback",
    state: "empty"
  };

  const firewall: FirewallState = {
    before: {
      resourceUrl: missionDraft.resourceUrl,
      description: "Research access for alice@example.com using customer-id CUST-1442 and API token xyz.",
      reason: "Requesting market intel for the research desk with account context."
    },
    after: {
      resourceUrl: "https://127.0.0.1:4010/paid/report?topic=market-intel",
      description: "Research access for [redacted-email] using [redacted-customer-id] and [redacted-token].",
      reason: "MODEL_INFERENCE_PAYMENT"
    },
    reasonCode: samplePiiReason as ReasonCode,
    findings: [
      {
        field: "description",
        entityType: "email",
        action: "redact",
        confidence: 0.98
      },
      {
        field: "description",
        entityType: "customer-id",
        action: "redact",
        confidence: 0.95
      },
      {
        field: "reason",
        entityType: "free-text-risk",
        action: "hash_only",
        confidence: 0.86
      }
    ],
    decision: "redact",
    piiPolicyHash: samplePiiPolicyHash,
    latencyMs: 16,
    evidenceMode: "fallback"
  };

  const paymentContext: PaymentContextState = {
    version: "clear402.payment.v1",
    missionId: sampleMissionId,
    providerId: sampleProviderId,
    quoteId: sampleQuoteId,
    method: "POST",
    origin: "http://127.0.0.1:4010",
    resourcePath: "/paid/report",
    canonicalUrlHash: sampleCanonicalUrlHash,
    bodyHash: sampleBodyHash,
    sanitizedResourceHash: sampleSanitizedResourceHash,
    merchantAddress: sampleWalletAddress,
    facilitatorUrlHash: "0x98f04facilitatorhash",
    chainId: "84532",
    tokenId: "USDC",
    amount: "0.10",
    amountDecimals: 6,
    nonce: "nonce-demo-402-0001",
    issuedAt: createdAt - 10_000,
    expiresAt: createdAt + 5 * 60_000,
    quoteTermsHash: sampleQuoteTermsHash,
    piiPolicyHash: samplePiiPolicyHash,
    clearSignDigest: sampleClearSignDigest,
    cawPactId: samplePactId,
    serviceMode: "caw-fetch",
    paymentContextHash: samplePaymentContextHash,
    requestId: sampleRequestId,
    evidenceMode: "fallback"
  };

  const clearSign: ClearSignState = {
    input: {
      chainId: "84532",
      to: sampleWalletAddress,
      calldata:
        "0xa9059cbb0000000000000000000000007a11e4da1a6d1f8b9fb3c3c7d4c6a0ef1faa2402000000000000000000000000000000000000000000000000056bc75e2d63100000",
      value: "0",
      typedData: {
        domain: { name: "Clear402", version: "1", chainId: 84532 },
        message: {
          amount: "0.10",
          resource: "/paid/report",
          paymentContextHash: samplePaymentContextHash
        }
      },
      expected: {
        merchantAddress: sampleWalletAddress,
        amount: "0.10",
        tokenId: "USDC",
        allowedSelectors: ["0xa9059cbb"],
        paymentContextHash: samplePaymentContextHash
      }
    },
    result: {
      decision: "allow",
      intent: "Pay 0.10 USDC to ProviderA for /paid/report",
      functionSignature: "transfer(address,uint256)",
      selector: "0xa9059cbb",
      decodedParams: {
        recipient: sampleWalletAddress,
        amount: "0.10 USDC"
      },
      calldataDigest: "0x5d1f8d5ed1f8d5ed1f8d5ed1f8d5ed1f8d5ed1f8d5ed1f8d5ed1f8d5ed1f8d5e",
      typedDataDigest: sampleClearSignDigest,
      riskTags: ["selector_known", "merchant_match", "amount_match"],
      reason: "Approved because the on-chain intent matches PaymentContext."
    },
    evidenceMode: "fallback"
  };

  const receipt: ReceiptState = {
    receiptId: "receipt-demo-402",
    paymentReceipt: {
      status: "paid",
      requestId: sampleRequestId,
      walletAddress: sampleWalletAddress,
      pactId: samplePactId,
      amount: "0.10",
      txHash: sampleTxHash,
      evidenceMode: options.runtime.evidenceMode
    },
    deliveryReceipt: {
      status: "empty",
      responseHash: sampleProviderResponseHash,
      providerSignature: "0xprovider_signature_demo",
      schemaHash: sampleResponseSchemaHash,
      redactionSummaryHash: sampleRedactionSummaryHash,
      evidenceMode: "mock"
    },
    finalStatus: "paid_but_not_delivered",
    auditLogIds: ["audit-001", "audit-002"],
    evidenceMode: "fallback"
  };

  const timeline: TimelineEvent[] = [
    buildTimelineItem(
      "timeline-001",
      "Runtime health reached",
      `Runtime endpoint ${options.runtime.endpoint} responded as ${options.runtime.evidenceMode}.`,
      "allow",
      options.runtime.evidenceMode,
      createdAt - 60_000,
      "audit-001"
    ),
    buildTimelineItem(
      "timeline-002",
      "Provider health reached",
      `Provider endpoint ${options.provider.endpoint} responded as ${options.provider.evidenceMode}.`,
      "allow",
      options.provider.evidenceMode,
      createdAt - 55_000
    ),
    buildTimelineItem(
      "timeline-003",
      "Guard pipeline staged",
      "Mission payload is ready for challenge inspection, firewall redaction, and clear signing.",
      "fallback",
      "fallback",
      createdAt - 30_000
    )
  ];

  return {
    preset: options.preset,
    runtimeHealth: options.runtime,
    providerHealth: options.provider,
    missionDraft,
    mission,
    caw,
    challenge,
    providerTrust,
    firewall,
    paymentContext,
    clearSign,
    timeline,
    receipt,
    attacks: cloneAttackDefinitions(),
    evidence: null,
    selectedAttackId: "replay"
  };
}

export function countModes(items: Array<{ evidenceMode: EvidenceMode }>) {
  return items.reduce(
    (counts, item) => {
      counts[item.evidenceMode] += 1;
      return counts;
    },
    { live: 0, fallback: 0, mock: 0 } satisfies Record<EvidenceMode, number>
  );
}

export function applyDashboardAction(
  workspace: DashboardWorkspace,
  action:
    | { type: "create-mission" }
    | { type: "dry-run" }
    | { type: "prepare-guard" }
    | { type: "execute-payment" }
    | { type: "verify-receipt" }
    | { type: "run-attack"; attackId: string }
    | { type: "export-evidence" }
    | { type: "set-preset"; preset: DashboardPreset },
  now = Date.now()
): DashboardWorkspace {
  const next = structuredClone(workspace) as DashboardWorkspace;

  if (action.type === "set-preset") {
    next.preset = action.preset;
    return next;
  }

  if (action.type === "create-mission") {
    next.mission = {
      ...next.mission,
      id: sampleMissionId,
      userPrompt: next.missionDraft.prompt,
      budgetUsd: next.missionDraft.budgetUsd,
      resourceUrl: next.missionDraft.resourceUrl,
      status: "active",
      pactId: samplePactId,
      createdAt: now,
      evidenceMode: "mock"
    };
    next.caw.transactionStatus = "prepared";
    next.timeline.unshift(
      buildTimelineItem(
        "timeline-create",
        "Mission created",
        `Mission ${sampleMissionId} is staged with a ${next.missionDraft.budgetUsd} USDC budget.`,
        "mock",
        "mock",
        now
      )
    );
    return next;
  }

  if (action.type === "dry-run") {
    next.challenge = {
      rawChallenge: {
        status: 402,
        headers: {
          "www-authenticate": 'X402 realm="clear402"',
          "x-provider-id": sampleProviderId
        },
        body: {
          resource: next.missionDraft.resourceUrl,
          payTo: sampleWalletAddress,
          amount: "0.10",
          asset: "USDC",
          network: "base-sepolia",
          facilitatorUrl: "https://facilitator.clear402.local",
          expiresAt: now + 300_000
        }
      },
      normalizedChallenge: {
        providerId: sampleProviderId,
        scheme: "x402",
        network: "base-sepolia",
        asset: "USDC",
        amount: "0.10",
        payTo: sampleWalletAddress,
        resource: next.missionDraft.resourceUrl,
        facilitatorUrl: "https://facilitator.clear402.local",
        description: "Protected market intel",
        expiresAt: now + 300_000,
        rawChallengeHash: sampleRawChallengeHash,
        evidenceMode: "mock"
      },
      providerRegistryResult: {
        providerId: sampleProviderId,
        origin: "http://127.0.0.1:4010",
        allowed: true,
        cawAllowlistStatus: "pending",
        settlementPath: "fallback_required"
      },
      settlementPath: "fallback_required",
      evidenceMode: "mock",
      state: "success"
    };
    next.providerTrust = {
      ...next.providerTrust,
      state: "fallback",
      evidenceMode: "fallback"
    };
    next.firewall = {
      ...next.firewall,
      evidenceMode: "fallback"
    };
    next.timeline.unshift(
      buildTimelineItem(
        "timeline-dryrun",
        "402 challenge normalized",
        "The provider challenge, registry check, and settlement path are now visible in the inspector.",
        "success",
        "mock",
        now
      )
    );
    return next;
  }

  if (action.type === "prepare-guard") {
    next.paymentContext = {
      ...next.paymentContext,
      missionId: next.mission.id ?? sampleMissionId,
      quoteId: sampleQuoteId,
      cawPactId: next.caw.pactId,
      evidenceMode: "fallback",
      requestId: formatRequestId(samplePaymentContextHash)
    };
    next.clearSign = {
      ...next.clearSign,
      evidenceMode: "fallback"
    };
    next.caw.transactionStatus = "prepared";
    next.timeline.unshift(
      buildTimelineItem(
        "timeline-prepare",
        "Guard prepare",
        "PaymentContext, quote lock, and clear-sign digest are staged for execution.",
        "pending_approval",
        "fallback",
        now
      )
    );
    return next;
  }

  if (action.type === "execute-payment") {
    next.caw.transactionStatus = "submitted";
    next.caw.auditLogs.unshift({
      id: "audit-submit",
      outcome: "allow",
      evidenceMode: "fallback",
      note: "Demo execution uses fallback state until CAW live execution is wired.",
      timestamp: now
    });
    next.receipt = {
      ...next.receipt,
      paymentReceipt: {
        ...next.receipt.paymentReceipt,
        status: "paid",
        txHash: sampleTxHash,
        evidenceMode: "fallback"
      },
      finalStatus: "paid",
      evidenceMode: "fallback"
    };
    next.timeline.unshift(
      buildTimelineItem(
        "timeline-execute",
        "CAW execution step",
        "The wallet submits the approved path and records a transaction reference for the receipt.",
        "success",
        "fallback",
        now,
        "audit-submit"
      )
    );
    return next;
  }

  if (action.type === "verify-receipt") {
    next.receipt = {
      ...next.receipt,
      deliveryReceipt: {
        ...next.receipt.deliveryReceipt,
        status: "delivered",
        evidenceMode: "fallback"
      },
      finalStatus: "delivered",
      evidenceMode: "fallback"
    };
    next.mission = {
      ...next.mission,
      status: "complete",
      evidenceMode: "fallback"
    };
    next.caw.transactionStatus = "finalized";
    next.timeline.unshift(
      buildTimelineItem(
        "timeline-receipt",
        "Delivery verified",
        "Receipt verification closes the loop and marks the mission complete.",
        "success",
        "fallback",
        now
      )
    );
    return next;
  }

  if (action.type === "run-attack") {
    const attack = next.attacks.find((candidate) => candidate.id === action.attackId);
    if (!attack) {
      return next;
    }

    attack.runCount += 1;
    attack.resultState = "blocked";
    attack.resultDetail = `Blocked by ${attack.blockedLayer.toLowerCase()}.`;
    attack.evidenceRef = `attack/${attack.id}/run-${attack.runCount}`;
    attack.guardEventId = `guard-${attack.id}-${attack.runCount}`;

    next.timeline.unshift(
      buildTimelineItem(
        attack.guardEventId,
        `${attack.title} blocked`,
        attack.resultDetail,
        "blocked",
        "mock",
        now,
        attack.guardEventId
      )
    );
    next.receipt = {
      ...next.receipt,
      finalStatus: next.receipt.finalStatus === "delivered" ? "delivered" : "paid_but_not_delivered",
      evidenceMode: "fallback"
    };
    return next;
  }

  if (action.type === "export-evidence") {
    return recordEvidenceExport(next, buildEvidenceExport(next, now), now);
  }

  return next;
}

export function resolveEvidenceMissionId(workspace: DashboardWorkspace) {
  return workspace.mission.id ?? workspace.paymentContext.missionId;
}

export function recordEvidenceExport(
  workspace: DashboardWorkspace,
  evidence: EvidenceExportState,
  now = Date.now(),
  detail?: string
): DashboardWorkspace {
  const next = structuredClone(workspace) as DashboardWorkspace;
  next.evidence = evidence;
  next.timeline.unshift(
    buildTimelineItem(
      `timeline-export-${now}`,
      "Evidence exported",
      detail ??
        (evidence.source === "server_side"
          ? `Server-side evidence export (${evidence.runtimeSource ?? "runtime"}) captured the current live / fallback / mock split.`
          : "Frontend fallback export captured the current live / fallback / mock split."),
      "success",
      evidence.evidenceMode,
      now
    )
  );

  return next;
}

export async function loadPreferredEvidenceExport(
  workspace: DashboardWorkspace,
  options: PreferredEvidenceExportOptions = {}
): Promise<PreferredEvidenceExportResult> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now();
  const basePath = options.basePath ?? "";
  const missionId = encodeURIComponent(resolveEvidenceMissionId(workspace));
  const exportBasePath = `${basePath}/api/evidence/${missionId}`;

  try {
    const [jsonResponse, markdownResponse] = await Promise.all([
      fetcher(`${exportBasePath}/export.json`, { cache: "no-store" }),
      fetcher(`${exportBasePath}/export.md`, { cache: "no-store" })
    ]);

    if (!jsonResponse.ok || !markdownResponse.ok) {
      const status = !jsonResponse.ok ? jsonResponse.status : markdownResponse.status;
      throw new Error(`Runtime evidence export unavailable: HTTP ${status}`);
    }

    const [json, markdown] = await Promise.all([
      jsonResponse.text(),
      markdownResponse.text()
    ]);

    return {
      evidence: buildServerSideEvidenceExport({ json, markdown, now }),
      usedRuntime: true
    };
  } catch (error) {
    return {
      evidence: buildEvidenceExport(workspace, now),
      usedRuntime: false,
      fallbackReason: error instanceof Error ? error.message : "Runtime evidence export unavailable"
    };
  }
}

export function buildEvidenceExport(workspace: DashboardWorkspace, now = Date.now()): EvidenceExportState {
  const attackSummaries = workspace.attacks.map((attack) => ({
    id: attack.id,
    title: attack.title,
    blockedLayer: attack.blockedLayer,
    resultState: attack.resultState,
    evidenceRef: attack.evidenceRef ?? null,
    evidenceMode: attack.evidenceMode
  }));

  const bundle = {
    mission: workspace.mission,
    userTaskSanitized: {
      prompt: workspace.missionDraft.prompt,
      resourceUrl: workspace.missionDraft.resourceUrl
    },
    budget: workspace.missionDraft.budgetUsd,
    cawEnvironment: workspace.caw.environment,
    walletAddress: workspace.caw.walletAddress,
    pactId: workspace.caw.pactId,
    pactScopedApiKeyStatus: workspace.caw.pactScopedApiKeyStatus,
    requestId: workspace.paymentContext.requestId,
    txHash: workspace.receipt.paymentReceipt.txHash ?? null,
    auditLogIds: workspace.receipt.auditLogIds,
    rawCawEvidenceRefs: workspace.caw.auditLogs.map((entry) => `evidence/caw/${entry.id}.json`),
    x402RawChallenge: workspace.challenge.rawChallenge,
    normalizedChallenge: workspace.challenge.normalizedChallenge,
    providerRegistryResult: workspace.challenge.providerRegistryResult,
    erc8004TrustResult: workspace.providerTrust.trustResult,
    metadataFirewall: {
      before: workspace.firewall.before,
      after: workspace.firewall.after,
      reasonCode: workspace.firewall.reasonCode,
      findings: workspace.firewall.findings
    },
    paymentContext: workspace.paymentContext,
    paymentContextHash: workspace.paymentContext.paymentContextHash,
    clearsigResult: workspace.clearSign.result,
    receipt: workspace.receipt,
    attackLabResults: attackSummaries,
    paperMapping: attackSummaries.map((attack) => ({
      attackId: attack.id,
      paper: workspace.attacks.find((candidate) => candidate.id === attack.id)?.paper ?? "Unknown paper",
      blockedLayer: attack.blockedLayer
    })),
    liveFallbackMockLabels: {
      runtime: workspace.runtimeHealth.evidenceMode,
      provider: workspace.providerHealth.evidenceMode,
      mission: workspace.mission.evidenceMode,
      guard: workspace.firewall.evidenceMode,
      receipt: workspace.receipt.evidenceMode,
      attackLab: "mock" as EvidenceMode
    },
    limitations: [
      "This branch records one live CAW Sepolia testnet tiny transfer in docs/live_caw_testnet_smoke_report.md.",
      "This branch also records one CAW Sepolia testnet destination-allowlist policy denial in docs/live_caw_policy_denial_report.md.",
      "The policy_denial_evidence claim is limited to that recorded destination-allowlist denial evidence and does not cover every policy denial type.",
      "Default dashboard demos and attack lab runs use fallback/mock evidence and do not trigger real CAW payments.",
      "Do not claim mainnet, production-ready, or unrestricted CAW execution."
    ]
  };

  const sanitizedBundle = sanitizeEvidenceForDisplay({
    ...bundle,
    generatedAt: now
  });
  const json = stableJson(sanitizedBundle);

  const markdown = [
    "# Clear402 Evidence Pack",
    "",
    `Generated at: ${new Date(now).toISOString()}`,
    "",
    "## Mission",
    `- Prompt: ${workspace.missionDraft.prompt}`,
    `- Budget: ${workspace.missionDraft.budgetUsd} USDC`,
    `- Mode: ${workspace.mission.evidenceMode}`,
    "",
    "## Live / Fallback / Mock",
    `- Runtime: ${workspace.runtimeHealth.evidenceMode}`,
    `- Provider: ${workspace.providerHealth.evidenceMode}`,
    `- Mission: ${workspace.mission.evidenceMode}`,
    `- Guard: ${workspace.firewall.evidenceMode}`,
    `- Receipt: ${workspace.receipt.evidenceMode}`,
    `- Attack Lab: mock`,
    "",
    "## Core Evidence",
    `- Wallet: ${workspace.caw.walletAddress}`,
    `- Pact: ${workspace.caw.pactId}`,
    `- Request ID: ${workspace.paymentContext.requestId}`,
    `- Tx Hash: ${workspace.receipt.paymentReceipt.txHash ?? "n/a"}`,
    `- PaymentContext Hash: ${workspace.paymentContext.paymentContextHash}`,
    "",
    "## Attack Results",
    ...attackSummaries.map(
      (attack) => `- ${attack.title}: ${attack.resultState} (${attack.blockedLayer})`
    ),
    "",
    "## Limitations",
    ...bundle.limitations.map((line) => `- ${line}`),
    "",
    "## Raw JSON",
    "```json",
    json,
    "```"
  ].join("\n");

  return {
    generatedAt: now,
    evidenceMode: "fallback",
    source: "frontend_fallback",
    json,
    markdown: redactSecretLikeText(markdown),
    stale: false
  };
}

export function buildServerSideEvidenceExport({
  json,
  markdown,
  now = Date.now()
}: {
  json: string;
  markdown: string;
  now?: number;
}): EvidenceExportState {
  const sanitizedJsonText = redactSecretLikeText(json);
  let payload: unknown;

  try {
    payload = JSON.parse(sanitizedJsonText);
  } catch {
    payload = null;
  }

  const payloadRecord = isRecord(payload) ? payload : {};
  const generatedAt =
    typeof payloadRecord.generatedAt === "number" ? payloadRecord.generatedAt : now;
  const evidenceMode = coerceEvidenceMode(payloadRecord.evidenceMode);
  const source =
    typeof payloadRecord.source === "string" && payloadRecord.source.length > 0
      ? payloadRecord.source
      : "runtime";
  const sanitizedPayload = sanitizeEvidenceForDisplay(payload);
  const renderedJson = payload ? stableJson(sanitizedPayload) : sanitizedJsonText;

  return {
    generatedAt,
    evidenceMode,
    source: "server_side",
    runtimeSource: source,
    json: renderedJson,
    markdown: redactSecretLikeText(markdown),
    stale: false
  };
}

export function describeWorkspaceModes(workspace: DashboardWorkspace) {
  return countModes([
    workspace.runtimeHealth,
    workspace.providerHealth,
    workspace.mission,
    workspace.caw,
    workspace.challenge,
    workspace.providerTrust,
    workspace.firewall,
    workspace.paymentContext,
    workspace.clearSign,
    workspace.receipt,
    workspace.evidence ?? { evidenceMode: "fallback" as EvidenceMode }
  ]);
}

export function formatIsoTimestamp(value?: number) {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toISOString();
}

export function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return stableJson(value);
}

export function toCompactModeLabel(mode: string) {
  if (mode === "live" || mode === "fallback" || mode === "mock") {
    return mode;
  }

  if (mode === "blocked") {
    return "blocked";
  }

  if (mode === "denied") {
    return "denied";
  }

  if (mode === "pending_approval") {
    return "pending approval";
  }

  if (mode === "success") {
    return "success";
  }

  return mode;
}

export function getAttackById(workspace: DashboardWorkspace, attackId: string) {
  return workspace.attacks.find((attack) => attack.id === attackId) ?? workspace.attacks[0];
}

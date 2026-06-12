import type {
  CawCapabilityRecord,
  CawPolicyDenialEvidence,
  EvidenceMode,
  PaymentContext
} from "../../../packages/shared/src/index.mjs";

export interface CawCapabilityReport {
  version: string;
  createdAt: number;
  evidenceMode: EvidenceMode;
  liveReady: boolean;
  summary: Record<string, number>;
  records: CawCapabilityRecord[];
}

export interface CawExecutionResult {
  ok: true;
  decision: "allow";
  paymentContextHash: string;
  cawRequestId: string;
  auditLogId?: string;
  txHash?: string;
  rawEvidenceRef: string;
  evidenceMode: EvidenceMode;
}

export interface CawBlockedResult {
  ok: false;
  decision: "block" | "fallback_required";
  problem: unknown;
  evidenceMode: EvidenceMode;
  paymentContextHash?: string;
  denial?: CawPolicyDenialEvidence;
}

export interface CawAdapterInstance {
  capabilityReport: CawCapabilityReport;
  getCapabilities(): CawCapabilityReport;
  canExecuteLivePayments(): boolean;
  executePaymentIntent(
    paymentContext: PaymentContext,
    options?: {
      attemptedOperation?: "transfer" | "contract_call" | "message_sign";
      report?: CawCapabilityReport;
      clock?: () => number;
      requestIdFactory?: () => string;
      liveExecutor?: unknown;
    }
  ): Promise<CawExecutionResult | CawBlockedResult>;
}

export declare function createCawAdapter(options?: {
  capabilities?: unknown;
  clock?: () => number;
  requestIdFactory?: () => string;
  liveExecutor?: unknown;
}): CawAdapterInstance;

export declare function executePaymentIntent(
  paymentContext: PaymentContext,
  options?: {
    report?: CawCapabilityReport;
    attemptedOperation?: "transfer" | "contract_call" | "message_sign";
    clock?: () => number;
    requestIdFactory?: () => string;
    liveExecutor?: unknown;
  }
): Promise<CawExecutionResult | CawBlockedResult>;

export declare function createCawPolicyDenialEvidence(input: {
  code: string;
  reason: string;
  details: Record<string, unknown>;
  suggestion?: string;
  attemptedOperation: "transfer" | "contract_call" | "message_sign";
  paymentContextHash?: string;
  cawRequestId?: string;
  auditLogId?: string;
  evidenceMode: EvidenceMode;
}): CawPolicyDenialEvidence;

export declare function validatePaymentContext(
  paymentContext: PaymentContext
): {
  ok: boolean;
  failures: string[];
};

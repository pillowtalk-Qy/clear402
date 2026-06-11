import type {
  ERC8004TrustResult,
  ProviderRegistryEntry
} from "../../../../packages/shared/src/index.mjs";
import { compareDecimalStrings } from "../guard/amount.ts";

export interface ERC8004TrustRecord {
  agentId: string;
  agentUri: string;
  payTo: string;
  reputationScore: number;
  deliverySuccessRate?: number;
  paidButDeniedReports?: number;
  validationAttestations?: ERC8004TrustResult["validationAttestations"];
  identityVerified?: boolean;
}

export interface ERC8004TrustValidationInput {
  entry: ProviderRegistryEntry;
  records: ERC8004TrustRecord[];
  endpoint: string;
  payTo: string;
  amount: string;
  highAmountThreshold?: string;
  paidButDeniedThreshold?: number;
}

function sameAddress(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function endpointOriginAndPath(value: string): string {
  const url = new URL(value);
  return `${url.origin.toLowerCase()}${url.pathname}`;
}

function baseResult(
  input: ERC8004TrustValidationInput,
  record: ERC8004TrustRecord | undefined,
  overrides: Partial<ERC8004TrustResult>
): ERC8004TrustResult {
  return {
    agentId: record?.agentId ?? input.entry.erc8004AgentId ?? "unregistered",
    identityVerified: record?.identityVerified ?? false,
    endpointMatches:
      record !== undefined &&
      endpointOriginAndPath(record.agentUri) === endpointOriginAndPath(input.endpoint),
    payToMatches: record !== undefined && sameAddress(record.payTo, input.payTo),
    reputationScore: record?.reputationScore ?? 0,
    deliverySuccessRate: record?.deliverySuccessRate,
    paidButDeniedReports: record?.paidButDeniedReports,
    validationAttestations: record?.validationAttestations ?? [],
    decision: "allow",
    evidenceMode: "fallback",
    ...overrides
  };
}

export function validateERC8004Trust(
  input: ERC8004TrustValidationInput
): ERC8004TrustResult {
  const record =
    input.entry.erc8004AgentId === undefined
      ? undefined
      : input.records.find((candidate) => candidate.agentId === input.entry.erc8004AgentId);
  const highAmountThreshold = input.highAmountThreshold ?? "0.25";

  if (!record) {
    const decision =
      compareDecimalStrings(input.amount, highAmountThreshold) > 0 ? "require_approval" : "allow";
    return baseResult(input, undefined, {
      decision,
      reason:
        decision === "require_approval"
          ? "Provider has no ERC-8004 identity for high amount payment"
          : "Provider has no ERC-8004 identity; local registry remains the P0 trust source"
    });
  }

  const endpointMatches = endpointOriginAndPath(record.agentUri) === endpointOriginAndPath(input.endpoint);
  if (!endpointMatches) {
    return baseResult(input, record, {
      decision: "block",
      reason: "ERC-8004 endpoint does not match current provider endpoint"
    });
  }

  if (!sameAddress(record.payTo, input.payTo)) {
    return baseResult(input, record, {
      decision: "block",
      reason: "ERC-8004 payTo does not match x402 challenge payTo"
    });
  }

  const paidButDeniedThreshold = input.paidButDeniedThreshold ?? 2;
  if ((record.paidButDeniedReports ?? 0) > paidButDeniedThreshold) {
    return baseResult(input, record, {
      decision: "block",
      reason: "ERC-8004 paid-but-denied reports exceed threshold"
    });
  }

  const threshold = input.entry.reputationThreshold ?? 60;
  if (record.reputationScore < threshold) {
    return baseResult(input, record, {
      decision: record.reputationScore < Math.max(20, threshold / 2) ? "block" : "require_approval",
      reason: "ERC-8004 reputation score is below provider threshold"
    });
  }

  return baseResult(input, record, {
    identityVerified: record.identityVerified ?? true,
    decision: "allow"
  });
}

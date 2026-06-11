import type { DatabaseSync } from "node:sqlite";

import type {
  CawPolicyDenialEvidence,
  ERC8004TrustResult,
  EvidenceBundle,
  GuardDecision,
  GuardEvent,
  MetadataFirewallResult,
  PaymentContext,
  ProviderRegistryEntry,
  ServiceReceipt,
  X402Quote
} from "../../../../packages/shared/src/index.mjs";
import { compareDecimalStrings, subtractDecimalStrings } from "./amount.ts";
import { clearSign, type ClearSignInput, type ClearSignResult } from "../clearsig/adapter.ts";
import { buildPaymentContext, type BuiltPaymentContext } from "./payment_context.ts";
import { normalizeX402Challenge, type NormalizedX402Challenge } from "../x402/challenge_normalizer.ts";
import { validateProviderRegistry, type ProviderRegistryValidationResult } from "../x402/provider_registry.ts";
import { validateERC8004Trust, type ERC8004TrustRecord } from "../x402/erc8004_trust_adapter.ts";
import { scanMetadata, type MetadataTriple } from "./metadata_firewall.ts";
import {
  ensureProvider,
  getLedgerExposureUsd,
  markReservationDisputed,
  markReservationSpent,
  releaseReservationBudget,
  reserveQuoteAndBudget
} from "./quote_lock.ts";
import { hashObject, sha256Hex } from "./hash.ts";
import { recordGuardEvent, listGuardEvents } from "./events.ts";
import { verifyServiceReceipt, type VerifyServiceReceiptInput } from "../receipt/receipt_verifier.ts";

export interface CawAdapterLike {
  transferTokens(input: {
    requestId: string;
    missionId: string;
    providerId: string;
    chainId: string;
    tokenId: string;
    dstAddr: string;
    amount: string;
    pactId: string;
    paymentContextHash: string;
  }): Promise<{
    evidenceMode: "live" | "fallback" | "mock";
    requestId: string;
    txHash?: string;
    walletAddress: string;
    auditLogId?: string;
    decision?: "allow" | "block" | "require_approval";
    denial?: CawPolicyDenialEvidence;
  }>;
  contractCall?(input: {
    requestId: string;
    missionId: string;
    providerId: string;
    chainId: string;
    contractAddress: string;
    calldata: string;
    amount: string;
    pactId: string;
    paymentContextHash: string;
  }): Promise<{
    evidenceMode: "live" | "fallback" | "mock";
    requestId: string;
    txHash?: string;
    walletAddress: string;
    auditLogId?: string;
    decision?: "allow" | "block" | "require_approval";
    denial?: CawPolicyDenialEvidence;
  }>;
  getTransactionByRequestId(requestId: string): Promise<{
    requestId: string;
    txHash?: string;
    status: "submitted" | "confirmed" | "failed";
    auditLogId?: string;
    providerResponseHash?: string;
    walletAddress?: string;
  } | null>;
  getAuditLogs(filter: { missionId?: string; requestId?: string }): Promise<Array<{
    auditLogId: string;
    requestId?: string;
    decision: "allow" | "block" | "require_approval";
    reason?: string;
  }>>;
}

export interface GuardPipelineInput {
  missionId: string;
  providerRegistryEntries: ProviderRegistryEntry[];
  trustRecords: ERC8004TrustRecord[];
  challenge: unknown;
  request: {
    method: "GET" | "POST";
    url: string;
    body?: unknown;
    headers?: Record<string, string | undefined>;
    boundHeaders?: string[];
  };
  metadata: MetadataTriple;
  budgetLimitUsd: string;
  reservedBudgetUsd: string;
  amountDecimals: number;
  cawPactId: string;
  serviceMode: "caw-fetch" | "direct-transfer" | "escrowed-delivery";
  cawAdapter: CawAdapterLike;
  now?: number;
  providerChallenge?: {
    rawChallengeHash: string;
    responseSchemaHash?: string;
    providerCalldata?: string;
    providerSignature?: string;
    providerPublicKey?: string;
    providerAddress?: string;
    walletAddress?: string;
    responseBody?: unknown;
    auditLogIds?: string[];
  };
}

export interface GuardPipelineResult {
  decision: "allow" | "block" | "require_approval";
  status: "prepared" | "executed" | "completed" | "blocked" | "disputed";
  reason?: string;
  guardEventId?: string;
  providerRegistryResult?: ProviderRegistryValidationResult;
  trustResult?: ERC8004TrustResult;
  metadataFirewall?: MetadataFirewallResult;
  paymentContext?: PaymentContext;
  paymentContextHash?: string;
  cawRequestId?: string;
  quote?: X402Quote;
  reservation?: {
    quoteId: string;
    paymentContextHash: string;
    nonce: string;
    reservedBudget: string;
  };
  clearsig?: ClearSignResult;
  cawEvidence?: {
    evidenceMode: "live" | "fallback" | "mock";
    requestId: string;
    txHash?: string;
    walletAddress: string;
    auditLogId?: string;
    denial?: CawPolicyDenialEvidence;
  };
  receipt?: ServiceReceipt;
  evidenceBundle: EvidenceBundle;
}

function createFailure(
  database: DatabaseSync,
  input: {
    missionId: string;
    layer: string;
    reason: string;
    decision: GuardDecision;
    evidence: Record<string, unknown>;
    now?: number;
  }
): GuardEvent {
  return recordGuardEvent(database, {
    missionId: input.missionId,
    layer: input.layer,
    reason: input.reason,
    decision: input.decision,
    evidenceJson: input.evidence,
    createdAt: input.now
  });
}

function evidenceBundleForMission(database: DatabaseSync, missionId: string): EvidenceBundle {
  const live = listGuardEvents(database, missionId).filter((event) => event.decision === "allow");
  const fallback = listGuardEvents(database, missionId).filter(
    (event) => event.decision === "require_approval"
  );
  const mock = listGuardEvents(database, missionId).filter(
    (event) => event.decision === "fallback_required"
  );

  return {
    missionId,
    live,
    fallback,
    mock,
    redactions: [],
    createdAt: Date.now()
  };
}

function getProviderRegistryEntry(
  entries: ProviderRegistryEntry[],
  providerId: string
): ProviderRegistryEntry {
  const entry = entries.find((candidate) => candidate.providerId === providerId);
  if (!entry) {
    throw new Error("Provider registry entry not found");
  }

  return entry;
}

function ensureReceiptBody(receipt: ServiceReceipt | undefined): ServiceReceipt {
  if (!receipt) {
    throw new Error("Service receipt unavailable");
  }

  return receipt;
}

export async function runGuardPipeline(
  database: DatabaseSync,
  input: GuardPipelineInput
): Promise<GuardPipelineResult> {
  const now = input.now ?? Date.now();
  const challenge = normalizeX402Challenge({
    rawChallenge: input.challenge,
    now
  });
  const challengeOrigin = new URL(challenge.resource).origin.toLowerCase();
  const providerEntry =
    (challenge.providerId !== undefined
      ? input.providerRegistryEntries.find(
          (candidate) => candidate.providerId === challenge.providerId
        )
      : undefined) ??
    input.providerRegistryEntries.find((candidate) => {
      try {
        return new URL(candidate.origin).origin.toLowerCase() === challengeOrigin;
      } catch {
        return false;
      }
    });

  if (!providerEntry) {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "provider_registry",
      reason: "Provider registry entry not found",
      decision: "block",
      evidence: { challenge }
    });

    return {
      decision: "block",
      status: "blocked",
      reason: "Provider registry entry not found",
      guardEventId: event.id,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const registryResult = validateProviderRegistry({
    entries: input.providerRegistryEntries,
    providerId: providerEntry.providerId,
    origin: challengeOrigin,
    resourcePath: new URL(challenge.resource).pathname + new URL(challenge.resource).search,
    payTo: challenge.payTo,
    facilitatorUrl: challenge.facilitatorUrl,
    chainId: providerEntry.chainId,
    tokenId: providerEntry.tokenId,
    cawAllowedMerchantAddresses: [providerEntry.merchantAddress]
  });

  if (registryResult.decision !== "allow") {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "provider_registry",
      reason: registryResult.reason ?? "Provider registry blocked challenge",
      decision: "block",
      evidence: { challenge, registryResult }
    });

    return {
      decision: "block",
      status: "blocked",
      reason: registryResult.reason,
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const trustResult = validateERC8004Trust({
    entry: providerEntry,
    records: input.trustRecords,
    endpoint: challenge.resource,
    payTo: challenge.payTo,
    amount: challenge.amount
  });

  if (trustResult.decision === "block") {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "erc8004",
      reason: trustResult.reason ?? "ERC-8004 trust blocked payment",
      decision: "block",
      evidence: { challenge, registryResult, trustResult }
    });

    return {
      decision: "block",
      status: "blocked",
      reason: trustResult.reason,
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      trustResult,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const metadataFirewall = scanMetadata(input.metadata);
  if (metadataFirewall.decision === "block") {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "metadata_firewall",
      reason: "PII metadata blocked",
      decision: "block",
      evidence: { challenge, registryResult, trustResult, metadataFirewall }
    });

    return {
      decision: "block",
      status: "blocked",
      reason: "Metadata firewall blocked the request",
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      trustResult,
      metadataFirewall,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const builtContext = buildPaymentContext({
    missionId: input.missionId,
    providerId: providerEntry.providerId,
    quoteId: `quote_${input.missionId}_${providerEntry.providerId}`,
    method: input.request.method,
    challenge,
    metadata: metadataFirewall,
    merchantAddress: providerEntry.merchantAddress,
    chainId: providerEntry.chainId,
    tokenId: providerEntry.tokenId,
    amountDecimals: input.amountDecimals,
    nonce: `nonce_${input.missionId}_${providerEntry.providerId}`,
    issuedAt: now,
    cawPactId: input.cawPactId,
    serviceMode: input.serviceMode,
    body: input.request.body
  });

  const reservationResult = reserveQuoteAndBudget(database, {
    missionId: input.missionId,
    provider: providerEntry,
    paymentContextHash: builtContext.paymentContextHash,
    cawRequestId: builtContext.cawRequestId,
    context: builtContext.context,
    rawChallengeHash: challenge.rawChallengeHash,
    reservedBudget: input.reservedBudgetUsd,
    budgetLimitUsd: input.budgetLimitUsd,
    now
  });

  if (reservationResult.decision === "block" || !reservationResult.reservation) {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "quote_lock",
      reason: reservationResult.reason ?? "Quote or budget reservation failed",
      decision: "block",
      evidence: {
        challenge,
        registryResult,
        trustResult,
        metadataFirewall,
        paymentContext: builtContext.context,
        reservationResult
      }
    });

    return {
      decision: "block",
      status: "blocked",
      reason: reservationResult.reason,
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      trustResult,
      metadataFirewall,
      paymentContext: builtContext.context,
      paymentContextHash: builtContext.paymentContextHash,
      cawRequestId: builtContext.cawRequestId,
      reservation: reservationResult.reservation
        ? {
            quoteId: reservationResult.reservation.quoteId,
            paymentContextHash: reservationResult.reservation.paymentContextHash,
            nonce: reservationResult.reservation.nonce,
            reservedBudget: reservationResult.reservation.reservedBudget
          }
        : undefined,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const clearSignResult = clearSign({
    chainId: providerEntry.chainId,
    to: providerEntry.merchantAddress,
    calldata:
      input.providerChallenge?.providerCalldata ?? input.providerChallenge?.providerSignature,
    typedData: input.providerChallenge?.responseBody,
    expected: {
      merchantAddress: providerEntry.merchantAddress,
      amount: challenge.amount,
      tokenId: providerEntry.tokenId,
      allowedSelectors: ["0xa9059cbb", "0x095ea7b3", "0x23b872dd", "0xac9650d8"],
      paymentContextHash: builtContext.paymentContextHash
    }
  });

  if (clearSignResult.decision === "block") {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "clearsig",
      reason: clearSignResult.reason ?? "clearsig blocked calldata",
      decision: "block",
      evidence: {
        challenge,
        registryResult,
        trustResult,
        metadataFirewall,
        paymentContext: builtContext.context,
        clearSignResult
      }
    });

    releaseReservationBudget(database, builtContext.paymentContextHash);
    return {
      decision: "block",
      status: "blocked",
      reason: clearSignResult.reason,
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      trustResult,
      metadataFirewall,
      paymentContext: builtContext.context,
      paymentContextHash: builtContext.paymentContextHash,
      cawRequestId: builtContext.cawRequestId,
      reservation: {
        quoteId: reservationResult.reservation.quoteId,
        paymentContextHash: reservationResult.reservation.paymentContextHash,
        nonce: reservationResult.reservation.nonce,
        reservedBudget: reservationResult.reservation.reservedBudget
      },
      clearsig: clearSignResult,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const cawEvidence = await input.cawAdapter.transferTokens({
    requestId: builtContext.cawRequestId,
    missionId: input.missionId,
    providerId: providerEntry.providerId,
    chainId: providerEntry.chainId,
    tokenId: providerEntry.tokenId,
    dstAddr: providerEntry.merchantAddress,
    amount: challenge.amount,
    pactId: input.cawPactId,
    paymentContextHash: builtContext.paymentContextHash
  });

  if (cawEvidence.decision === "block" || cawEvidence.denial !== undefined) {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "caw",
      reason: cawEvidence.denial?.reason ?? "CAW denied payment",
      decision: "block",
      evidence: {
        challenge,
        registryResult,
        trustResult,
        metadataFirewall,
        paymentContext: builtContext.context,
        clearSignResult,
        cawEvidence
      }
    });
    releaseReservationBudget(database, builtContext.paymentContextHash);

    return {
      decision: "block",
      status: "blocked",
      reason: cawEvidence.denial?.reason ?? "CAW denied payment",
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      trustResult,
      metadataFirewall,
      paymentContext: builtContext.context,
      paymentContextHash: builtContext.paymentContextHash,
      cawRequestId: builtContext.cawRequestId,
      reservation: {
        quoteId: reservationResult.reservation.quoteId,
        paymentContextHash: reservationResult.reservation.paymentContextHash,
        nonce: reservationResult.reservation.nonce,
        reservedBudget: reservationResult.reservation.reservedBudget
      },
      clearsig: clearSignResult,
      cawEvidence,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  markReservationSpent(database, builtContext.paymentContextHash);

  const receiptInput: VerifyServiceReceiptInput = {
    receipt: ensureReceiptBody(
      input.providerChallenge?.responseBody !== undefined &&
        input.providerChallenge?.providerSignature !== undefined &&
        input.providerChallenge?.providerAddress !== undefined
        ? {
            receiptId: `receipt_${builtContext.paymentContextHash.slice(2, 18)}`,
            paymentContextHash: builtContext.paymentContextHash,
            cawRequestId: builtContext.cawRequestId,
            cawWalletAddress: cawEvidence.walletAddress,
            pactId: input.cawPactId,
            providerAddress: input.providerChallenge.providerAddress,
            facilitatorUrlHash: challenge.facilitatorUrl
              ? sha256Hex(challenge.facilitatorUrl)
              : undefined,
            txHash: cawEvidence.txHash,
            chainId: providerEntry.chainId,
            tokenId: providerEntry.tokenId,
            amount: challenge.amount,
            providerResponseHash: sha256Hex(JSON.stringify(input.providerChallenge.responseBody)),
            providerSignature: input.providerChallenge.providerSignature,
            responseSchemaHash: input.providerChallenge.responseSchemaHash,
            deliveryTimestamp: now,
            status: "paid",
            clearsigDigest: clearSignResult.calldataDigest ?? clearSignResult.typedDataDigest,
            auditLogIds: input.providerChallenge.auditLogIds ?? [],
            redactionSummaryHash: metadataFirewall.piiPolicyHash,
            evidenceMode: cawEvidence.evidenceMode
          }
        : undefined
    ),
    responseBody: input.providerChallenge?.responseBody ?? {},
    providerPublicKey: input.providerChallenge?.providerPublicKey ?? providerEntry.publicKey,
    expectedPaymentContextHash: builtContext.paymentContextHash,
    expectedPactId: input.cawPactId,
    expectedProviderAddress: providerEntry.merchantAddress,
    expectedAmount: challenge.amount,
    expectedChainId: providerEntry.chainId,
    expectedTokenId: providerEntry.tokenId,
    responseSchemaHash: input.providerChallenge?.responseSchemaHash
  };

  const receiptResult = verifyServiceReceipt(receiptInput);
  if (receiptResult.decision === "block") {
    const event = createFailure(database, {
      missionId: input.missionId,
      layer: "receipt",
      reason: receiptResult.reason ?? "Receipt verification failed",
      decision: "block",
      evidence: {
        challenge,
        registryResult,
        trustResult,
        metadataFirewall,
        paymentContext: builtContext.context,
        clearSignResult,
        cawEvidence,
        receiptResult
      }
    });
    markReservationDisputed(database, builtContext.paymentContextHash);

    return {
      decision: "block",
      status: "disputed",
      reason: receiptResult.reason,
      guardEventId: event.id,
      providerRegistryResult: registryResult,
      trustResult,
      metadataFirewall,
      paymentContext: builtContext.context,
      paymentContextHash: builtContext.paymentContextHash,
      cawRequestId: builtContext.cawRequestId,
      reservation: {
        quoteId: reservationResult.reservation.quoteId,
        paymentContextHash: reservationResult.reservation.paymentContextHash,
        nonce: reservationResult.reservation.nonce,
        reservedBudget: reservationResult.reservation.reservedBudget
      },
      clearsig: clearSignResult,
      cawEvidence,
      receipt: receiptResult.receipt,
      evidenceBundle: evidenceBundleForMission(database, input.missionId)
    };
  }

  const evidenceBundle = evidenceBundleForMission(database, input.missionId);
  const successEvent = recordGuardEvent(database, {
    missionId: input.missionId,
    layer: "guard_pipeline",
    decision: "allow",
    evidenceJson: {
      challenge,
      registryResult,
      trustResult,
      metadataFirewall,
      paymentContext: builtContext.context,
      reservation: reservationResult.reservation,
      clearSignResult,
      cawEvidence,
      receipt: receiptResult.receipt
    },
    createdAt: now
  });

  return {
    decision: "allow",
    status: "completed",
    guardEventId: successEvent.id,
    providerRegistryResult: registryResult,
    trustResult,
    metadataFirewall,
    paymentContext: builtContext.context,
    paymentContextHash: builtContext.paymentContextHash,
    cawRequestId: builtContext.cawRequestId,
    reservation: {
      quoteId: reservationResult.reservation.quoteId,
      paymentContextHash: reservationResult.reservation.paymentContextHash,
      nonce: reservationResult.reservation.nonce,
      reservedBudget: reservationResult.reservation.reservedBudget
    },
    clearsig: clearSignResult,
    cawEvidence,
    receipt: receiptResult.receipt,
    evidenceBundle
  };
}

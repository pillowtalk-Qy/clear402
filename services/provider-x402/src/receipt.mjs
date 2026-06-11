import { createHmac } from "node:crypto";
import { canonicalJson, hashObject, sha256Hex } from "../../../packages/shared/src/index.mjs";
import { DEBUG_PAYMENT_KEY, DEFAULT_PROVIDER_CONFIG } from "./config.mjs";

export function createPaidReport({ challenge, verification, generatedAt = Date.now() }) {
  if (!verification?.ok) {
    throw new TypeError("Paid report requires a verified payment proof");
  }

  const normalized = challenge.normalized ?? challenge;

  return {
    reportId: `report_${normalized.rawChallengeHash.slice(0, 16)}`,
    providerId: normalized.providerId,
    title: "Clear402 local provider report",
    generatedAt,
    challengeHash: normalized.rawChallengeHash,
    resource: normalized.resource,
    rows: [
      {
        metric: "provider_delivery",
        value: "verified",
        evidenceMode: verification.evidenceMode
      },
      {
        metric: "settlement_mode",
        value: verification.settlementMode,
        evidenceMode: verification.evidenceMode
      }
    ]
  };
}

export function createServiceReceipt({
  challenge,
  verification,
  providerResponse,
  config = DEFAULT_PROVIDER_CONFIG,
  deliveredAt = Date.now()
}) {
  if (!verification?.ok) {
    throw new TypeError("Service receipt requires verified payment proof");
  }

  const normalized = challenge.normalized ?? challenge;
  const providerResponseHash = hashObject(providerResponse);
  const receiptWithoutSignature = {
    receiptId: `receipt_${providerResponseHash.slice(0, 16)}`,
    paymentContextHash: verification.proof.paymentContextHash,
    cawWalletAddress: verification.proof.cawWalletAddress,
    pactId: verification.proof.pactId,
    providerAddress: config.merchantAddress,
    facilitatorUrlHash: sha256Hex(config.facilitatorUrl),
    chainId: config.chainId,
    tokenId: config.tokenId,
    amount: normalized.amount,
    providerResponseHash,
    responseSchemaHash: sha256Hex("clear402.provider.report.v1"),
    deliveryTimestamp: deliveredAt,
    status: "delivered",
    auditLogIds: [`provider-local:${normalized.rawChallengeHash.slice(0, 16)}`],
    redactionSummaryHash: sha256Hex("clear402-provider-local-report:no-redactions"),
    evidenceMode: verification.evidenceMode
  };

  return {
    ...receiptWithoutSignature,
    providerSignature: signReceipt(receiptWithoutSignature)
  };
}

function signReceipt(receipt) {
  return createHmac("sha256", DEBUG_PAYMENT_KEY).update(canonicalJson(receipt)).digest("base64url");
}

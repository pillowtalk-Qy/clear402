import type { EvidenceMode, ServiceReceipt } from "../../../../packages/shared/src/index.mjs";
import { hashObject } from "../guard/hash.ts";

export interface PaymentReceipt {
  version: "clear402.payment-receipt.v1";
  paymentContextHash: string;
  cawRequestId: string;
  cawWalletAddress: string;
  pactId: string;
  chainId: string;
  tokenId: string;
  amount: string;
  txHash?: string;
  coboTransactionId?: string;
  auditLogIds: string[];
  status: "paid" | "refundable" | "refunded" | "failed";
  evidenceMode: EvidenceMode;
}

export interface DeliveryReceipt {
  version: "clear402.delivery-receipt.v1";
  receiptId: string;
  paymentContextHash: string;
  providerAddress: string;
  providerResponseHash: string;
  providerSignature: string;
  responseSchemaHash?: string;
  deliveryTimestamp: number;
  status: "delivered" | "paid_but_not_delivered" | "failed";
  redactionSummaryHash?: string;
  evidenceMode: EvidenceMode;
}

export interface DualReceipt {
  version: "clear402.dual-receipt.v1";
  paymentReceipt: PaymentReceipt;
  deliveryReceipt: DeliveryReceipt;
  dualReceiptHash: string;
  finalStatus: "delivered" | "paid_but_not_delivered" | "refunded" | "failed";
  evidenceMode: EvidenceMode;
}

export interface DualReceiptVerificationResult {
  decision: "allow" | "block";
  finalStatus: DualReceipt["finalStatus"];
  checks: Record<string, boolean>;
  reason?: string;
}

export function createDualReceipt(input: {
  serviceReceipt: ServiceReceipt;
  coboTransactionId?: string;
}): DualReceipt {
  const paymentReceipt: PaymentReceipt = {
    version: "clear402.payment-receipt.v1",
    paymentContextHash: input.serviceReceipt.paymentContextHash,
    cawRequestId: input.serviceReceipt.cawRequestId ?? `missing:${input.serviceReceipt.receiptId}`,
    cawWalletAddress: input.serviceReceipt.cawWalletAddress,
    pactId: input.serviceReceipt.pactId,
    chainId: input.serviceReceipt.chainId,
    tokenId: input.serviceReceipt.tokenId,
    amount: input.serviceReceipt.amount,
    ...(input.serviceReceipt.txHash !== undefined ? { txHash: input.serviceReceipt.txHash } : {}),
    ...(input.coboTransactionId !== undefined ? { coboTransactionId: input.coboTransactionId } : {}),
    auditLogIds: [...input.serviceReceipt.auditLogIds],
    status: paymentStatusFor(input.serviceReceipt),
    evidenceMode: input.serviceReceipt.evidenceMode
  };
  const deliveryReceipt: DeliveryReceipt = {
    version: "clear402.delivery-receipt.v1",
    receiptId: input.serviceReceipt.receiptId,
    paymentContextHash: input.serviceReceipt.paymentContextHash,
    providerAddress: input.serviceReceipt.providerAddress,
    providerResponseHash: input.serviceReceipt.providerResponseHash,
    providerSignature: input.serviceReceipt.providerSignature,
    ...(input.serviceReceipt.responseSchemaHash !== undefined
      ? { responseSchemaHash: input.serviceReceipt.responseSchemaHash }
      : {}),
    deliveryTimestamp: input.serviceReceipt.deliveryTimestamp,
    status: deliveryStatusFor(input.serviceReceipt),
    ...(input.serviceReceipt.redactionSummaryHash !== undefined
      ? { redactionSummaryHash: input.serviceReceipt.redactionSummaryHash }
      : {}),
    evidenceMode: input.serviceReceipt.evidenceMode
  };
  const finalStatus = finalStatusFor(paymentReceipt, deliveryReceipt);
  const unsigned = {
    version: "clear402.dual-receipt.v1" as const,
    paymentReceipt,
    deliveryReceipt,
    finalStatus,
    evidenceMode: input.serviceReceipt.evidenceMode
  };

  return {
    ...unsigned,
    dualReceiptHash: hashObject(unsigned)
  };
}

export function verifyDualReceipt(input: {
  dualReceipt: DualReceipt;
  expectedPaymentContextHash: string;
  expectedPactId: string;
  expectedProviderAddress: string;
  expectedAmount: string;
  expectedChainId: string;
  expectedTokenId: string;
}): DualReceiptVerificationResult {
  const checks = {
    version: input.dualReceipt.version === "clear402.dual-receipt.v1",
    paymentContextHash:
      input.dualReceipt.paymentReceipt.paymentContextHash === input.expectedPaymentContextHash &&
      input.dualReceipt.deliveryReceipt.paymentContextHash === input.expectedPaymentContextHash,
    pactId: input.dualReceipt.paymentReceipt.pactId === input.expectedPactId,
    providerAddress:
      input.dualReceipt.deliveryReceipt.providerAddress.toLowerCase() ===
      input.expectedProviderAddress.toLowerCase(),
    amount: input.dualReceipt.paymentReceipt.amount === input.expectedAmount,
    chainId: input.dualReceipt.paymentReceipt.chainId === input.expectedChainId,
    tokenId: input.dualReceipt.paymentReceipt.tokenId === input.expectedTokenId,
    paidAnchor:
      input.dualReceipt.paymentReceipt.cawRequestId.length > 0 &&
      (input.dualReceipt.paymentReceipt.txHash !== undefined ||
        input.dualReceipt.paymentReceipt.coboTransactionId !== undefined ||
        input.dualReceipt.paymentReceipt.evidenceMode !== "live"),
    deliverySignature: input.dualReceipt.deliveryReceipt.providerSignature.length > 0,
    finalStatus:
      input.dualReceipt.finalStatus ===
      finalStatusFor(input.dualReceipt.paymentReceipt, input.dualReceipt.deliveryReceipt),
    dualReceiptHash: input.dualReceipt.dualReceiptHash === recomputeDualReceiptHash(input.dualReceipt)
  };
  const failed = Object.entries(checks).find(([, passed]) => !passed);

  if (failed) {
    return {
      decision: "block",
      finalStatus: input.dualReceipt.finalStatus,
      checks,
      reason: `Dual receipt check failed: ${failed[0]}`
    };
  }

  return {
    decision: "allow",
    finalStatus: input.dualReceipt.finalStatus,
    checks
  };
}

function paymentStatusFor(receipt: ServiceReceipt): PaymentReceipt["status"] {
  if (receipt.status === "refunded") {
    return "refunded";
  }
  if (receipt.status === "refundable" || receipt.status === "paid_but_not_delivered") {
    return "refundable";
  }
  if (receipt.status === "failed") {
    return "failed";
  }
  return "paid";
}

function deliveryStatusFor(receipt: ServiceReceipt): DeliveryReceipt["status"] {
  if (receipt.status === "delivered") {
    return "delivered";
  }
  if (receipt.status === "paid_but_not_delivered" || receipt.status === "refundable") {
    return "paid_but_not_delivered";
  }
  return "failed";
}

function finalStatusFor(
  paymentReceipt: PaymentReceipt,
  deliveryReceipt: DeliveryReceipt
): DualReceipt["finalStatus"] {
  if (paymentReceipt.status === "refunded") {
    return "refunded";
  }
  if (deliveryReceipt.status === "delivered" && paymentReceipt.status === "paid") {
    return "delivered";
  }
  if (paymentReceipt.status === "refundable" || deliveryReceipt.status === "paid_but_not_delivered") {
    return "paid_but_not_delivered";
  }
  return "failed";
}

function recomputeDualReceiptHash(receipt: DualReceipt): string {
  return hashObject({
    version: receipt.version,
    paymentReceipt: receipt.paymentReceipt,
    deliveryReceipt: receipt.deliveryReceipt,
    finalStatus: receipt.finalStatus,
    evidenceMode: receipt.evidenceMode
  });
}

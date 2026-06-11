import type { ServiceReceipt } from "../../../../packages/shared/src/index.mjs";
import { hmacSha256Hex, sha256Hex, timingSafeStringEqual } from "../guard/hash.ts";

export interface VerifyServiceReceiptInput {
  receipt: ServiceReceipt;
  responseBody: unknown;
  providerPublicKey: string;
  expectedPaymentContextHash: string;
  expectedPactId: string;
  expectedProviderAddress: string;
  expectedAmount: string;
  expectedChainId: string;
  expectedTokenId: string;
  responseSchemaHash?: string;
}

export interface ServiceReceiptVerificationResult {
  decision: "allow" | "block";
  status: ServiceReceipt["status"];
  reason?: string;
  receipt: ServiceReceipt;
  checks: Record<string, boolean>;
}

const piiPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:api[_-]?key|secret|token|jwt|bearer)[=: ]+[A-Za-z0-9._~+/=-]{12,}\b/i,
  /\b(?:seed phrase|private key|mnemonic)[=: ]+[A-Za-z0-9 _-]{12,}\b/i
];

function stableBodyHash(value: unknown): string {
  if (typeof value === "string" || value instanceof Uint8Array) {
    return sha256Hex(value);
  }

  return sha256Hex(JSON.stringify(value));
}

function sameAddress(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function receiptHasRawPii(receipt: ServiceReceipt): boolean {
  const serialized = JSON.stringify(receipt);
  return piiPatterns.some((pattern) => pattern.test(serialized));
}

function responseBodyHasExpectedShape(responseBody: unknown): boolean {
  if (!responseBody || typeof responseBody !== "object") {
    return false;
  }

  const record = responseBody as Record<string, unknown>;
  return ["verification", "report", "ok", "receipt", "status"].some((key) => key in record);
}

function responseBodyExplicitlyDeniesDelivery(responseBody: unknown): boolean {
  if (!responseBody || typeof responseBody !== "object") {
    return false;
  }

  const record = responseBody as Record<string, unknown>;
  if (record.ok === false || record.status === "denied" || record.status === "failed") {
    return true;
  }

  const verification = record.verification;
  if (verification && typeof verification === "object") {
    return (verification as Record<string, unknown>).ok === false;
  }

  return false;
}

export function signReceiptForDemo(
  providerPublicKey: string,
  receipt: Omit<ServiceReceipt, "providerSignature">
): string {
  return hmacSha256Hex(
    providerPublicKey,
    JSON.stringify({
      paymentContextHash: receipt.paymentContextHash,
      providerResponseHash: receipt.providerResponseHash,
      responseSchemaHash: receipt.responseSchemaHash,
      deliveryTimestamp: receipt.deliveryTimestamp,
      status: receipt.status
    })
  );
}

export function verifyServiceReceipt(
  input: VerifyServiceReceiptInput
): ServiceReceiptVerificationResult {
  const expectedSignature = signReceiptForDemo(input.providerPublicKey, {
    ...input.receipt,
    providerSignature: undefined as never
  });
  const checks = {
    paymentContextHash:
      input.receipt.paymentContextHash === input.expectedPaymentContextHash,
    pactId: input.receipt.pactId === input.expectedPactId,
    providerAddress: sameAddress(input.receipt.providerAddress, input.expectedProviderAddress),
    amount: input.receipt.amount === input.expectedAmount,
    chainId: input.receipt.chainId === input.expectedChainId,
    tokenId: input.receipt.tokenId === input.expectedTokenId,
    responseHash: input.receipt.providerResponseHash === stableBodyHash(input.responseBody),
    providerSignature: timingSafeStringEqual(input.receipt.providerSignature, expectedSignature),
    responseSchema:
      input.responseSchemaHash === undefined ||
      input.receipt.responseSchemaHash === input.responseSchemaHash,
    responseBodyShape:
      input.responseSchemaHash === undefined || responseBodyHasExpectedShape(input.responseBody),
    deliveryNotDenied: !responseBodyExplicitlyDeniesDelivery(input.responseBody),
    cawCompleted: input.receipt.cawRequestId !== undefined || input.receipt.txHash !== undefined,
    noRawPii: !receiptHasRawPii(input.receipt)
  };
  const failed = Object.entries(checks).find(([, passed]) => !passed);

  if (failed) {
    const paidButNotDelivered =
      failed[0] === "deliveryNotDenied" ||
      (failed[0] === "responseBodyShape" && checks.deliveryNotDenied === false) ||
      (failed[0] === "responseSchema" && checks.deliveryNotDenied === false);
    return {
      decision: "block",
      status: paidButNotDelivered ? "paid_but_not_delivered" : "failed",
      reason: `Service receipt check failed: ${failed[0]}`,
      receipt: { ...input.receipt, status: paidButNotDelivered ? "paid_but_not_delivered" : "failed" },
      checks
    };
  }

  return {
    decision: "allow",
    status: "delivered",
    receipt: { ...input.receipt, status: "delivered" },
    checks
  };
}

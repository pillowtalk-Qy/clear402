import { createHash, createHmac } from "node:crypto";
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

export function createSignedProviderQuote({
  challenge,
  config = DEFAULT_PROVIDER_CONFIG,
  issuedAt = Date.now(),
  paymentContextHash
}) {
  const normalized = challenge.normalized ?? challenge;
  const facilitatorUrlHash =
    normalized.facilitatorUrl === undefined ? undefined : runtimeSha256Hex(canonicalizeUrl(normalized.facilitatorUrl));
  const quoteWithoutSignature = {
    version: "clear402.provider-quote.v1",
    quoteId: `quote_${normalized.rawChallengeHash.slice(0, 16)}`,
    providerId: normalized.providerId,
    resource: normalized.resource,
    scheme: normalized.scheme,
    network: normalized.network,
    asset: normalized.asset,
    amount: normalized.amount,
    payTo: normalized.payTo,
    chainId: config.chainId,
    tokenId: config.tokenId,
    expiresAt: normalized.expiresAt,
    issuedAt,
    quoteTermsHash: runtimeHashObject({
      scheme: normalized.scheme,
      network: normalized.network,
      asset: normalized.asset,
      amount: normalized.amount,
      payTo: normalized.payTo,
      facilitatorUrlHash,
      expiresAt: normalized.expiresAt
    }),
    ...(paymentContextHash ? { paymentContextHash } : {}),
    signer: config.providerPublicKey,
    signatureScheme: "debug-hmac-sha256",
    evidenceMode: normalized.evidenceMode
  };

  return {
    ...quoteWithoutSignature,
    signature: signProviderQuote(config.providerPublicKey, quoteWithoutSignature)
  };
}

function signReceipt(receipt) {
  return createHmac("sha256", DEBUG_PAYMENT_KEY).update(canonicalJson(receipt)).digest("base64url");
}

function signProviderQuote(secret, quote) {
  return `hmac-sha256:${createHmac("sha256", secret).update(canonicalJson(quote)).digest("hex")}`;
}

function runtimeHashObject(value) {
  return runtimeSha256Hex(canonicalJson(value));
}

function runtimeSha256Hex(value) {
  return `0x${createHash("sha256").update(String(value)).digest("hex")}`;
}

function canonicalizeUrl(value) {
  const url = new URL(value);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  return url.toString();
}

import { randomUUID } from "node:crypto";
import {
  assertStringAmount,
  createProblem,
  hashObject
} from "../../../packages/shared/src/index.mjs";
import {
  CAW_CAPABILITIES,
  createCawCapabilityReport,
  probeCawCapabilities
} from "./caw-capabilities.mjs";

const REQUIRED_LIVE_CAPABILITIES = Object.freeze([
  "caw_cli",
  "wallet_identity",
  "policy_enforcement",
  "payment_execution",
  "audit_lookup"
]);

export function createCawAdapter({
  capabilities = probeCawCapabilities(),
  clock = () => Date.now(),
  requestIdFactory = () => `caw_${randomUUID()}`,
  liveExecutor
} = {}) {
  const report = Array.isArray(capabilities)
    ? createCawCapabilityReport(capabilities, { createdAt: clock() })
    : capabilities;

  return {
    capabilityReport: report,
    getCapabilities() {
      return structuredClone(report);
    },
    canExecuteLivePayments() {
      return canExecuteLivePayments(report.records);
    },
    async executePaymentIntent(paymentContext, options = {}) {
      return executePaymentIntent(paymentContext, {
        report,
        clock,
        requestIdFactory,
        liveExecutor,
        ...options
      });
    }
  };
}

export async function executePaymentIntent(
  paymentContext,
  {
    report = createCawCapabilityReport(probeCawCapabilities()),
    attemptedOperation = "transfer",
    clock = () => Date.now(),
    requestIdFactory = () => `caw_${randomUUID()}`,
    liveExecutor
  } = {}
) {
  const validation = validatePaymentContext(paymentContext);

  if (!validation.ok) {
    return {
      ok: false,
      decision: "block",
      problem: createProblem("INVALID_PAYMENT_CONTEXT", "Payment context failed CAW adapter validation.", {
        failures: validation.failures
      })
    };
  }

  const paymentContextHash = hashObject(paymentContext);
  const now = clock();

  if (paymentContext.expiresAt <= now) {
    return createBlockedCawResult({
      code: "PAYMENT_CONTEXT_EXPIRED",
      reason: "Payment context expired before CAW execution.",
      suggestion: "Request a fresh quote and rebuild the PaymentContext.",
      attemptedOperation,
      paymentContext,
      paymentContextHash,
      report,
      now,
      requestId: requestIdFactory(),
      evidenceMode: "fallback"
    });
  }

  if (!canExecuteLivePayments(report.records)) {
    return createBlockedCawResult({
      code: "CAW_CAPABILITY_UNVERIFIED",
      reason: "CAW payment execution is not verified in this environment.",
      suggestion: "Complete CAW capability verification before attempting a live payment.",
      attemptedOperation,
      paymentContext,
      paymentContextHash,
      report,
      now,
      requestId: requestIdFactory(),
      evidenceMode: "fallback"
    });
  }

  if (typeof liveExecutor !== "function") {
    return createBlockedCawResult({
      code: "CAW_EXECUTOR_NOT_CONFIGURED",
      reason: "Verified CAW capabilities exist, but no live executor is configured behind CawAdapter.",
      suggestion: "Wire the official CAW SDK or CLI through CawAdapter only.",
      attemptedOperation,
      paymentContext,
      paymentContextHash,
      report,
      now,
      requestId: requestIdFactory(),
      evidenceMode: "fallback"
    });
  }

  const execution = await liveExecutor({
    paymentContext,
    paymentContextHash,
    attemptedOperation,
    requestId: requestIdFactory()
  });

  if (!execution?.rawEvidenceRef) {
    return createBlockedCawResult({
      code: "CAW_LIVE_EVIDENCE_MISSING",
      reason: "CAW execution returned without raw evidence reference.",
      suggestion: "Preserve CAW stdout, request id, audit id, or receipt evidence before calling this live.",
      attemptedOperation,
      paymentContext,
      paymentContextHash,
      report,
      now,
      requestId: requestIdFactory(),
      evidenceMode: "fallback"
    });
  }

  return {
    ok: true,
    decision: "allow",
    paymentContextHash,
    cawRequestId: execution.cawRequestId,
    auditLogId: execution.auditLogId,
    txHash: execution.txHash,
    rawEvidenceRef: execution.rawEvidenceRef,
    evidenceMode: "live"
  };
}

export function createCawPolicyDenialEvidence({
  code,
  reason,
  details,
  suggestion,
  attemptedOperation,
  paymentContextHash,
  cawRequestId,
  auditLogId,
  evidenceMode
}) {
  return {
    code,
    reason,
    details,
    ...(suggestion ? { suggestion } : {}),
    attemptedOperation,
    ...(paymentContextHash ? { paymentContextHash } : {}),
    ...(cawRequestId ? { cawRequestId } : {}),
    ...(auditLogId ? { auditLogId } : {}),
    evidenceMode
  };
}

export function validatePaymentContext(paymentContext) {
  const failures = [];

  if (!paymentContext || typeof paymentContext !== "object") {
    return { ok: false, failures: ["paymentContext must be an object"] };
  }

  for (const field of [
    "missionId",
    "providerId",
    "quoteId",
    "origin",
    "resourcePath",
    "merchantAddress",
    "chainId",
    "tokenId",
    "nonce",
    "quoteTermsHash",
    "piiPolicyHash",
    "cawPactId"
  ]) {
    if (typeof paymentContext[field] !== "string" || paymentContext[field].length === 0) {
      failures.push(`${field} must be a non-empty string`);
    }
  }

  if (paymentContext.version !== "clear402.payment.v1") {
    failures.push("version must be clear402.payment.v1");
  }

  try {
    assertStringAmount(paymentContext.amount);
  } catch (error) {
    failures.push(error.message);
  }

  for (const field of ["issuedAt", "expiresAt", "amountDecimals"]) {
    if (!Number.isSafeInteger(paymentContext[field]) || paymentContext[field] < 0) {
      failures.push(`${field} must be a non-negative safe integer`);
    }
  }

  if (!["GET", "POST"].includes(paymentContext.method)) {
    failures.push("method must be GET or POST");
  }

  if (!["caw-fetch", "direct-transfer", "escrowed-delivery"].includes(paymentContext.serviceMode)) {
    failures.push("serviceMode must be caw-fetch, direct-transfer, or escrowed-delivery");
  }

  for (const hashField of [
    "canonicalUrlHash",
    "bodyHash",
    "sanitizedResourceHash",
    "quoteTermsHash",
    "piiPolicyHash"
  ]) {
    if (!/^[a-f0-9]{64}$/.test(paymentContext[hashField] ?? "")) {
      failures.push(`${hashField} must be a sha256 hex digest`);
    }
  }

  return {
    ok: failures.length === 0,
    failures
  };
}

function createBlockedCawResult({
  code,
  reason,
  suggestion,
  attemptedOperation,
  paymentContext,
  paymentContextHash,
  report,
  now,
  requestId,
  evidenceMode
}) {
  const denial = createCawPolicyDenialEvidence({
    code,
    reason,
    details: {
      capabilityStatuses: summarizeCapabilities(report.records),
      cawPactId: paymentContext.cawPactId,
      serviceMode: paymentContext.serviceMode
    },
    suggestion,
    attemptedOperation,
    paymentContextHash,
    cawRequestId: requestId,
    auditLogId: `local-denial:${paymentContextHash.slice(0, 16)}`,
    evidenceMode
  });

  return {
    ok: false,
    decision: code === "PAYMENT_CONTEXT_EXPIRED" ? "block" : "fallback_required",
    paymentContextHash,
    denial,
    guardEvent: {
      id: `guard_${hashObject({ code, paymentContextHash, now }).slice(0, 16)}`,
      missionId: paymentContext.missionId,
      layer: "caw-adapter",
      decision: code === "PAYMENT_CONTEXT_EXPIRED" ? "block" : "fallback_required",
      reason,
      evidenceJson: denial,
      createdAt: now
    },
    evidenceMode
  };
}

function canExecuteLivePayments(records) {
  return REQUIRED_LIVE_CAPABILITIES.every((capability) =>
    records.some((record) => record.capability === capability && record.status === "verified")
  );
}

function summarizeCapabilities(records) {
  const byCapability = Object.fromEntries(CAW_CAPABILITIES.map((capability) => [capability, "missing"]));

  for (const record of records) {
    byCapability[record.capability] = record.status;
  }

  return byCapability;
}

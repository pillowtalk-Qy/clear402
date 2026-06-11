import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CAW_CAPABILITIES,
  createCapabilityRecord,
  createCawAdapter,
  createCawCapabilityReport,
  executePaymentIntent,
  probeCawCapabilities,
  renderCawCapabilityReportMarkdown,
  validatePaymentContext
} from "../src/index.mjs";
import { sha256Hex } from "../../../packages/shared/src/index.mjs";

describe("CAW capability probing", () => {
  it("marks the CAW boundary unavailable without upgrading anything to live", () => {
    const records = probeCawCapabilities({
      command: "missing-caw",
      clock: () => 1_800_000_000_000,
      runner: () => ({
        ok: false,
        exitCode: null,
        signal: null,
        stdout: "",
        stderr: "",
        errorCode: "ENOENT"
      })
    });

    assert.equal(records.length, CAW_CAPABILITIES.length);
    assert.equal(records[0].capability, "caw_cli");
    assert.equal(records[0].status, "unavailable");
    assert.equal(records[0].evidenceMode, "fallback");

    for (const record of records) {
      assert.notEqual(record.evidenceMode, "live");
      assert.match(record.rawEvidenceRef, /^caw-probe:[a-f0-9]{24}$/);
    }
  });

  it("treats a responding CAW CLI as only a partial verification", () => {
    const records = probeCawCapabilities({
      clock: () => 1_800_000_000_000,
      runner: () => ({
        ok: true,
        exitCode: 0,
        signal: null,
        stdout: "caw help",
        stderr: "",
        errorCode: undefined
      })
    });

    assert.equal(records.find((record) => record.capability === "caw_cli").status, "verified");
    assert.equal(records.find((record) => record.capability === "caw_cli").evidenceMode, "live");
    assert.equal(records.find((record) => record.capability === "payment_execution").status, "fallback_required");
    assert.equal(records.find((record) => record.capability === "audit_lookup").status, "needs_manual_step");
  });

  it("renders a report that tells operators when live CAW cannot be claimed", () => {
    const report = createCawCapabilityReport(
      CAW_CAPABILITIES.map((capability) =>
        createCapabilityRecord({
          capability,
          status: capability === "caw_cli" ? "unavailable" : "fallback_required",
          evidenceMode: "fallback",
          rawEvidenceRef: "caw-probe:test",
          notes: "test"
        })
      ),
      { createdAt: 1_800_000_000_000 }
    );
    const markdown = renderCawCapabilityReportMarkdown(report);

    assert.equal(report.liveReady, false);
    assert.match(markdown, /must not claim live CAW execution/);
    assert.match(markdown, /`fallback_required`/);
  });
});

describe("CawAdapter", () => {
  it("validates the required PaymentContext contract", () => {
    const invalid = validatePaymentContext({
      version: "clear402.payment.v1",
      amount: 10
    });

    assert.equal(invalid.ok, false);
    assert.match(invalid.failures.join("\n"), /amount must be a non-empty string/);
    assert.match(invalid.failures.join("\n"), /missionId must be a non-empty string/);
  });

  it("blocks payment execution when CAW capabilities are not verified", async () => {
    const adapter = createCawAdapter({
      capabilities: fallbackCapabilityReport(),
      clock: () => 1_800_000_000_000,
      requestIdFactory: () => "caw_test_request"
    });

    const result = await adapter.executePaymentIntent(paymentContext());

    assert.equal(adapter.canExecuteLivePayments(), false);
    assert.equal(result.ok, false);
    assert.equal(result.decision, "fallback_required");
    assert.equal(result.evidenceMode, "fallback");
    assert.equal(result.denial.code, "CAW_CAPABILITY_UNVERIFIED");
    assert.equal(result.denial.evidenceMode, "fallback");
    assert.equal(result.denial.cawRequestId, "caw_test_request");
    assert.equal(result.guardEvent.layer, "caw-adapter");
  });

  it("blocks expired PaymentContexts before touching any executor", async () => {
    let called = false;
    const result = await executePaymentIntent(
      paymentContext({ expiresAt: 1_799_999_999_999 }),
      {
        report: liveCapabilityReport(),
        clock: () => 1_800_000_000_000,
        liveExecutor: async () => {
          called = true;
        }
      }
    );

    assert.equal(called, false);
    assert.equal(result.ok, false);
    assert.equal(result.decision, "block");
    assert.equal(result.denial.code, "PAYMENT_CONTEXT_EXPIRED");
  });

  it("requires raw evidence before returning a live CAW execution result", async () => {
    const result = await executePaymentIntent(paymentContext(), {
      report: liveCapabilityReport(),
      clock: () => 1_800_000_000_000,
      requestIdFactory: () => "caw_missing_evidence",
      liveExecutor: async () => ({
        cawRequestId: "caw_live_request"
      })
    });

    assert.equal(result.ok, false);
    assert.equal(result.decision, "fallback_required");
    assert.equal(result.denial.code, "CAW_LIVE_EVIDENCE_MISSING");
    assert.equal(result.evidenceMode, "fallback");
  });

  it("allows live execution only through CawAdapter with raw evidence", async () => {
    const result = await executePaymentIntent(paymentContext(), {
      report: liveCapabilityReport(),
      liveExecutor: async ({ paymentContextHash, requestId }) => ({
        cawRequestId: requestId,
        auditLogId: `audit:${paymentContextHash.slice(0, 16)}`,
        txHash: `0x${"1".repeat(64)}`,
        rawEvidenceRef: `caw-live:${paymentContextHash.slice(0, 16)}`
      })
    });

    assert.equal(result.ok, true);
    assert.equal(result.decision, "allow");
    assert.equal(result.evidenceMode, "live");
    assert.match(result.paymentContextHash, /^[a-f0-9]{64}$/);
    assert.match(result.rawEvidenceRef, /^caw-live:/);
  });
});

function fallbackCapabilityReport() {
  return createCawCapabilityReport(
    CAW_CAPABILITIES.map((capability) =>
      createCapabilityRecord({
        capability,
        status: capability === "caw_cli" ? "unavailable" : "fallback_required",
        evidenceMode: "fallback",
        rawEvidenceRef: "caw-probe:test",
        notes: "test fallback"
      })
    ),
    { createdAt: 1_800_000_000_000 }
  );
}

function liveCapabilityReport() {
  return createCawCapabilityReport(
    CAW_CAPABILITIES.map((capability) =>
      createCapabilityRecord({
        capability,
        status: "verified",
        evidenceMode: "live",
        rawEvidenceRef: `caw-live:${capability}`,
        notes: "test live verification"
      })
    ),
    { createdAt: 1_800_000_000_000 }
  );
}

function paymentContext(overrides = {}) {
  return {
    version: "clear402.payment.v1",
    missionId: "mission_test",
    providerId: "provider_test",
    quoteId: "quote_test",
    method: "GET",
    origin: "http://localhost:4010",
    resourcePath: "/paid/report",
    canonicalUrlHash: sha256Hex("http://localhost:4010/paid/report"),
    bodyHash: sha256Hex(""),
    sanitizedResourceHash: sha256Hex("/paid/report"),
    merchantAddress: "0x1111111111111111111111111111111111111111",
    facilitatorUrlHash: sha256Hex("http://localhost:4020"),
    chainId: "base-sepolia",
    tokenId: "usdc",
    amount: "10000",
    amountDecimals: 6,
    nonce: "nonce_test",
    issuedAt: 1_800_000_000_000,
    expiresAt: 1_800_000_060_000,
    quoteTermsHash: sha256Hex("quote terms"),
    piiPolicyHash: sha256Hex("pii policy"),
    cawPactId: "pact_test",
    serviceMode: "caw-fetch",
    ...overrides
  };
}

import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPaymentContext,
  clearSign,
  normalizeX402Challenge,
  runGuardPipeline,
  scanMetadata,
  signReceiptForDemo,
  validateERC8004Trust,
  validateProviderRegistry,
  verifyServiceReceipt
} from "../src/index.mjs";
import { sha256Hex as guardSha256Hex } from "../src/guard/hash.ts";

describe("guard primitives", () => {
  const providerEntry = makeProviderEntry();

  it("blocks provider registry origin mismatch", () => {
    const result = validateProviderRegistry({
      entries: [providerEntry],
      providerId: providerEntry.providerId,
      origin: "https://wrong.example",
      resourcePath: "/paid/report",
      payTo: providerEntry.merchantAddress,
      facilitatorUrl: providerEntry.facilitatorUrl,
      chainId: providerEntry.chainId,
      tokenId: providerEntry.tokenId,
      cawAllowedMerchantAddresses: [providerEntry.merchantAddress]
    });

    assert.equal(result.decision, "block");
    assert.match(result.reason ?? "", /Provider origin is not registered/);
  });

  it("blocks ERC-8004 payTo mismatch", () => {
    const result = validateERC8004Trust({
      entry: providerEntry,
      records: [
        {
          agentId: providerEntry.erc8004AgentId,
          agentUri: providerEntry.erc8004AgentUri,
          payTo: "0x2222222222222222222222222222222222222222",
          reputationScore: 95,
          identityVerified: true,
          validationAttestations: []
        }
      ],
      endpoint: providerEntry.erc8004AgentUri,
      payTo: providerEntry.merchantAddress,
      amount: "5"
    });

    assert.equal(result.decision, "block");
    assert.match(result.reason ?? "", /payTo does not match/);
  });

  it("redacts, hashes, and blocks metadata as required", () => {
    const redact = scanMetadata({
      resourceUrl: "https://provider.example/paid/report?email=test@example.com",
      description: "reach me at test@example.com"
    });
    const hashOnly = scanMetadata({
      resourceUrl: "https://provider.example/paid/report",
      description: "passport: A1234567"
    });
    const blocked = scanMetadata({
      resourceUrl: "https://provider.example/paid/report",
      description: "api_key=supersecretvalue123456"
    });

    assert.equal(redact.decision, "redact");
    assert.match(redact.sanitized.description ?? "", /\[redacted:/);
    assert.equal(hashOnly.decision, "hash_only");
    assert.equal(blocked.decision, "block");
  });

  it("canonicalizes PaymentContext inputs", () => {
    const challenge = makeChallenge(providerEntry, 1_800_000_000_000).normalized;
    const metadata = scanMetadata({
      resourceUrl: "https://provider.example/paid/report",
      description: "ok",
      reason: "MARKET_DATA_REQUEST"
    });

    const built = buildPaymentContext({
      missionId: "mission-1",
      providerId: providerEntry.providerId,
      quoteId: "quote-1",
      method: "GET",
      challenge,
      metadata,
      merchantAddress: providerEntry.merchantAddress,
      chainId: providerEntry.chainId,
      tokenId: providerEntry.tokenId,
      amountDecimals: 6,
      nonce: "nonce-1",
      issuedAt: 1_800_000_000_000,
      cawPactId: "pact-1",
      serviceMode: "caw-fetch"
    });

    assert.equal(built.context.version, "clear402.payment.v1");
    assert.equal(built.canonicalRequest.canonicalUrl, "https://provider.example/paid/report");
    assert.match(built.paymentContextHash, /^0x[a-f0-9]{64}$/);
  });

  it("binds PaymentContext resource to the verified challenge instead of metadata", () => {
    const challenge = makeChallenge(providerEntry, 1_800_000_000_000).normalized;
    const metadata = scanMetadata({
      resourceUrl: "https://evil.example/paid/report",
      description: "ok",
      reason: "MARKET_DATA_REQUEST"
    });

    const built = buildPaymentContext({
      missionId: "mission-1",
      providerId: providerEntry.providerId,
      quoteId: "quote-1",
      method: "GET",
      challenge,
      metadata,
      merchantAddress: providerEntry.merchantAddress,
      chainId: providerEntry.chainId,
      tokenId: providerEntry.tokenId,
      amountDecimals: 6,
      nonce: "nonce-1",
      issuedAt: 1_800_000_000_000,
      cawPactId: "pact-1",
      serviceMode: "caw-fetch"
    });

    assert.equal(built.canonicalRequest.canonicalUrl, "https://provider.example/paid/report");
    assert.equal(built.canonicalRequest.origin, "https://provider.example");
    assert.equal(built.canonicalRequest.resourcePath, "/paid/report");
    assert.equal(built.context.origin, "https://provider.example");
    assert.equal(built.context.resourcePath, "/paid/report");
  });

  it("blocks malicious approve calldata", () => {
    const challenge = makeChallenge(providerEntry, 1_800_000_000_000).normalized;
    const metadata = scanMetadata({
      resourceUrl: "https://provider.example/paid/report",
      description: "ok",
      reason: "MARKET_DATA_REQUEST"
    });
    const built = buildPaymentContext({
      missionId: "mission-1",
      providerId: providerEntry.providerId,
      quoteId: "quote-1",
      method: "GET",
      challenge,
      metadata,
      merchantAddress: providerEntry.merchantAddress,
      chainId: providerEntry.chainId,
      tokenId: providerEntry.tokenId,
      amountDecimals: 6,
      nonce: "nonce-1",
      issuedAt: 1_800_000_000_000,
      cawPactId: "pact-1",
      serviceMode: "caw-fetch"
    });

    const result = clearSign({
      chainId: providerEntry.chainId,
      to: providerEntry.merchantAddress,
      calldata:
        "0x095ea7b3" +
        "0".repeat(24) +
        "2222222222222222222222222222222222222222" +
        "f".repeat(64),
      expected: {
        merchantAddress: providerEntry.merchantAddress,
        amount: "5",
        tokenId: providerEntry.tokenId,
        allowedSelectors: ["0xa9059cbb"],
        paymentContextHash: built.paymentContextHash,
        allowedSpenders: ["0x3333333333333333333333333333333333333333"]
      }
    });

    assert.equal(result.decision, "block");
    assert.match(result.reason ?? "", /clearsig blocked calldata/);
  });

  it("blocks known selectors that are not on the allowed list", () => {
    const result = clearSign({
      chainId: providerEntry.chainId,
      to: providerEntry.merchantAddress,
      calldata:
        "0x40c10f19" +
        "0".repeat(24) +
        "2222222222222222222222222222222222222222" +
        "1".padStart(64, "0"),
      expected: {
        merchantAddress: providerEntry.merchantAddress,
        amount: "1",
        tokenId: providerEntry.tokenId,
        allowedSelectors: ["0xa9059cbb"]
      }
    });

    assert.equal(result.decision, "block");
    assert.match(result.reason ?? "", /selector_not_allowed/);
  });

  it("blocks tampered service receipts", () => {
    const challenge = makeChallenge(providerEntry, 1_800_000_000_000).normalized;
    const metadata = scanMetadata({
      resourceUrl: "https://provider.example/paid/report",
      description: "ok",
      reason: "MARKET_DATA_REQUEST"
    });
    const built = buildPaymentContext({
      missionId: "mission-1",
      providerId: providerEntry.providerId,
      quoteId: "quote-1",
      method: "GET",
      challenge,
      metadata,
      merchantAddress: providerEntry.merchantAddress,
      chainId: providerEntry.chainId,
      tokenId: providerEntry.tokenId,
      amountDecimals: 6,
      nonce: "nonce-1",
      issuedAt: 1_800_000_000_000,
      cawPactId: "pact-1",
      serviceMode: "caw-fetch"
    });
    const responseBody = { ok: true, paymentContextHash: built.paymentContextHash };
    const responseSchemaHash = guardSha256Hex("schema-v1");
    const providerResponseHash = guardSha256Hex(JSON.stringify(responseBody));
    const receipt = {
      receiptId: "receipt-1",
      paymentContextHash: built.paymentContextHash,
      cawRequestId: built.cawRequestId,
      cawWalletAddress: "0xCAW0000000000000000000000000000000000001",
      pactId: "pact-1",
      providerAddress: providerEntry.merchantAddress,
      chainId: providerEntry.chainId,
      tokenId: providerEntry.tokenId,
      amount: "5",
      providerResponseHash,
      providerSignature: signReceiptForDemo(providerEntry.publicKey, {
        paymentContextHash: built.paymentContextHash,
        providerResponseHash,
        responseSchemaHash,
        deliveryTimestamp: 1_800_000_000_000,
        status: "paid"
      }),
      responseSchemaHash,
      deliveryTimestamp: 1_800_000_000_000,
      status: "paid",
      auditLogIds: [],
      evidenceMode: "fallback"
    };

    const result = verifyServiceReceipt({
      receipt,
      responseBody: { ok: false, paymentContextHash: built.paymentContextHash },
      providerPublicKey: providerEntry.publicKey,
      expectedPaymentContextHash: built.paymentContextHash,
      expectedPactId: "pact-1",
      expectedProviderAddress: providerEntry.merchantAddress,
      expectedAmount: "5",
      expectedChainId: providerEntry.chainId,
      expectedTokenId: providerEntry.tokenId,
      responseSchemaHash
    });

    assert.equal(result.decision, "block");
    assert.match(result.reason ?? "", /responseHash/);
  });
});

describe("guard pipeline", () => {
  it("completes a guarded payment when calldata and receipt signature are separate", async () => {
    const db = makeDb();
    const scenario = makePipelineScenario("mission-allow", "100");
    const result = await runGuardPipeline(db, scenario.input);

    assert.equal(result.decision, "allow");
    assert.equal(result.status, "completed");
    assert.equal(result.receipt?.status, "delivered");
  });

  it("blocks replay on the second identical guarded payment", async () => {
    const db = makeDb();
    const scenario = makePipelineScenario("mission-replay", "100");

    const first = await runGuardPipeline(db, scenario.input);
    const second = await runGuardPipeline(db, scenario.input);

    assert.equal(first.decision, "allow");
    assert.equal(second.decision, "block");
    assert.match(second.reason ?? "", /already been reserved|duplicate/i);
  });

  it("blocks overspend before reservation", async () => {
    const db = makeDb();
    const scenario = makePipelineScenario("mission-overspend", "0.5");
    const result = await runGuardPipeline(db, scenario.input);

    assert.equal(result.decision, "block");
    assert.match(result.reason ?? "", /Budget limit would be exceeded/);
  });

  it("blocks metadata resource that does not match the bound request resource", async () => {
    const db = makeDb();
    const scenario = makePipelineScenario("mission-metadata-resource-mismatch", "100");
    scenario.input.metadata.resourceUrl = "https://evil.example/paid/report";
    const result = await runGuardPipeline(db, scenario.input);

    assert.equal(result.decision, "block");
    assert.equal(result.status, "blocked");
    assert.match(result.reason ?? "", /Metadata resource does not match bound request resource/);
    assert.equal(result.paymentContext, undefined);
    assert.equal(result.paymentContextHash, undefined);
  });

  it("selects the provider that matches the challenge providerId", async () => {
    const db = makeDb();
    const now = 1_800_000_000_000;
    const primaryProvider = makeProviderEntry();
    const secondaryProvider = makeProviderEntry({
      providerId: "provider-2",
      origin: "https://provider-two.example",
      merchantAddress: "0x4444444444444444444444444444444444444444",
      facilitatorUrl: "https://fac-two.example",
      publicKey: "pk_provider_2",
      erc8004AgentId: "agent-2",
      erc8004AgentUri: "https://provider-two.example/paid/report"
    });
    const challenge = makeChallenge(secondaryProvider, now);
    const metadata = scanMetadata({
      resourceUrl: "https://provider-two.example/paid/report",
      description: "ok",
      reason: "MARKET_DATA_REQUEST"
    });
    const builtContext = buildPaymentContext({
      missionId: "mission-two-provider",
      providerId: secondaryProvider.providerId,
      quoteId: "quote_mission-two-provider_provider-2",
      method: "GET",
      challenge: challenge.normalized,
      metadata,
      merchantAddress: secondaryProvider.merchantAddress,
      chainId: secondaryProvider.chainId,
      tokenId: secondaryProvider.tokenId,
      amountDecimals: 6,
      nonce: "nonce_mission-two-provider_provider-2",
      issuedAt: now,
      cawPactId: "pact-2",
      serviceMode: "caw-fetch"
    });
    const responseBody = { ok: true, paymentContextHash: builtContext.paymentContextHash };
    const responseSchemaHash = guardSha256Hex("schema-v1");
    const providerResponseHash = guardSha256Hex(JSON.stringify(responseBody));

    const result = await runGuardPipeline(db, {
      missionId: "mission-two-provider",
      providerRegistryEntries: [primaryProvider, secondaryProvider],
      trustRecords: [
        {
          agentId: secondaryProvider.erc8004AgentId,
          agentUri: secondaryProvider.erc8004AgentUri,
          payTo: secondaryProvider.merchantAddress,
          reputationScore: 95,
          deliverySuccessRate: 0.99,
          identityVerified: true,
          validationAttestations: []
        }
      ],
      challenge: challenge.rawChallenge,
      request: {
        method: "GET",
        url: "https://provider-two.example/paid/report",
        body: undefined,
        headers: {},
        boundHeaders: []
      },
      metadata: {
        resourceUrl: "https://provider-two.example/paid/report",
        description: "ok",
        reason: "MARKET_DATA_REQUEST"
      },
      budgetLimitUsd: "10",
      reservedBudgetUsd: "1",
      amountDecimals: 6,
      cawPactId: "pact-2",
      serviceMode: "caw-fetch",
      cawAdapter: {
        transferTokens: async ({ requestId, missionId: currentMissionId }) => ({
          evidenceMode: "live",
          requestId,
          walletAddress: "0xCAW0000000000000000000000000000000000001",
          txHash: "0x" + "2".repeat(64),
          auditLogId: `audit-${currentMissionId}`
        })
      },
      now,
      providerChallenge: {
        providerCalldata: encodeTransferCalldata(secondaryProvider.merchantAddress, "5"),
        providerSignature: signReceiptForDemo(secondaryProvider.publicKey, {
          paymentContextHash: builtContext.paymentContextHash,
          providerResponseHash,
          responseSchemaHash,
          deliveryTimestamp: now,
          status: "paid"
        }),
        responseBody,
        providerAddress: secondaryProvider.merchantAddress,
        providerPublicKey: secondaryProvider.publicKey,
        responseSchemaHash,
        auditLogIds: ["audit-2"]
      }
    });

    assert.equal(result.decision, "allow");
    assert.equal(result.providerRegistryResult?.providerId, secondaryProvider.providerId);
  });
});

function makeProviderEntry(overrides = {}) {
  return {
    providerId: "provider-1",
    origin: "https://provider.example",
    merchantAddress: "0x1111111111111111111111111111111111111111",
    facilitatorUrl: "https://fac.example",
    chainId: "84532",
    tokenId: "USDC",
    publicKey: "pk_provider_1",
    allowedResources: ["/paid/report"],
    cawAllowlistStatus: "allowed",
    erc8004AgentId: "agent-1",
    erc8004AgentUri: "https://provider.example/paid/report",
    reputationThreshold: 60,
    validationTags: [],
    ...overrides
  };
}

function makeChallenge(providerEntry, now) {
  const rawChallenge = {
    accepts: [
      {
        scheme: "exact",
        network: "base-sepolia",
        asset: "0x0000000000000000000000000000000000000001",
        amount: "5",
        payTo: providerEntry.merchantAddress,
        resource: new URL("/paid/report", providerEntry.origin).toString(),
        facilitatorUrl: providerEntry.facilitatorUrl,
        description: "guard test",
        expiresAt: now + 60_000
      }
    ]
  };

  return {
    rawChallenge,
    normalized: normalizeX402Challenge({
      providerId: providerEntry.providerId,
      rawChallenge,
      now,
      evidenceMode: "live"
    })
  };
}

function makeDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    create table missions (
      id text primary key,
      user_prompt text,
      budget_usd text,
      status text,
      caw_wallet_uuid text,
      caw_wallet_address text,
      pact_id text,
      created_at integer,
      updated_at integer
    );
    create table provider_registry (
      provider_id text primary key,
      origin text,
      merchant_address text,
      facilitator_url text,
      chain_id text,
      token_id text,
      public_key text,
      allowed_resources text,
      caw_allowlist_status text,
      erc8004_agent_id text,
      erc8004_agent_uri text,
      reputation_threshold integer,
      validation_tags text,
      created_at integer,
      updated_at integer
    );
    create table x402_quotes (
      quote_id text primary key,
      mission_id text,
      provider_id text,
      resource_url text,
      amount_usd text,
      status text,
      raw_challenge_hash text,
      created_at integer,
      expires_at integer
    );
    create table payment_contexts (
      payment_context_hash text primary key,
      mission_id text,
      provider_id text,
      quote_id text,
      method text,
      origin text,
      resource_path text,
      canonical_url_hash text,
      body_hash text,
      sanitized_resource_hash text,
      merchant_address text,
      facilitator_url_hash text,
      chain_id text,
      token_id text,
      amount text,
      amount_decimals integer,
      nonce text unique,
      issued_at integer,
      expires_at integer,
      quote_terms_hash text,
      pii_policy_hash text,
      clear_sign_digest text,
      caw_pact_id text,
      service_mode text,
      raw_context_json text
    );
    create table quote_reservations (
      quote_id text unique,
      payment_context_hash text unique,
      nonce text unique,
      status text,
      reserved_budget text,
      reserved_at integer,
      expires_at integer
    );
    create table budget_ledger (
      id text primary key,
      mission_id text,
      entry_type text,
      amount_usd text,
      balance_after_usd text,
      status text,
      created_at integer
    );
    create table guard_events (
      id text primary key,
      mission_id text,
      layer text,
      decision text,
      reason text,
      evidence_json text,
      created_at integer
    );
  `);
  return db;
}

function makePipelineScenario(missionId, budgetLimitUsd) {
  const now = 1_800_000_000_000;
  const providerEntry = makeProviderEntry();
  const challenge = makeChallenge(providerEntry, now);
  const metadata = scanMetadata({
    resourceUrl: "https://provider.example/paid/report",
    description: "ok",
    reason: "MARKET_DATA_REQUEST"
  });
  const builtContext = buildPaymentContext({
    missionId,
    providerId: providerEntry.providerId,
    quoteId: `quote_${missionId}_${providerEntry.providerId}`,
    method: "GET",
    challenge: challenge.normalized,
    metadata,
    merchantAddress: providerEntry.merchantAddress,
    chainId: providerEntry.chainId,
    tokenId: providerEntry.tokenId,
    amountDecimals: 6,
    nonce: `nonce_${missionId}_${providerEntry.providerId}`,
    issuedAt: now,
    cawPactId: "pact-1",
    serviceMode: "caw-fetch"
  });

  const responseBody = { ok: true, paymentContextHash: builtContext.paymentContextHash };
  const responseSchemaHash = guardSha256Hex("schema-v1");
  const providerResponseHash = guardSha256Hex(JSON.stringify(responseBody));

  return {
    input: {
      missionId,
    providerRegistryEntries: [providerEntry],
    trustRecords: [
        {
          agentId: providerEntry.erc8004AgentId,
          agentUri: providerEntry.erc8004AgentUri,
          payTo: providerEntry.merchantAddress,
          reputationScore: 95,
          deliverySuccessRate: 0.99,
          identityVerified: true,
          validationAttestations: []
        }
      ],
      challenge: challenge.rawChallenge,
      request: {
        method: "GET",
        url: "https://provider.example/paid/report",
        body: undefined,
        headers: {},
        boundHeaders: []
      },
      metadata: {
        resourceUrl: "https://provider.example/paid/report",
        description: "ok",
        reason: "MARKET_DATA_REQUEST"
      },
      budgetLimitUsd,
      reservedBudgetUsd: "1",
      amountDecimals: 6,
      cawPactId: "pact-1",
      serviceMode: "caw-fetch",
      cawAdapter: {
        transferTokens: async ({ requestId, missionId: currentMissionId }) => ({
          evidenceMode: "live",
          requestId,
          walletAddress: "0xCAW0000000000000000000000000000000000001",
          txHash: "0x" + "1".repeat(64),
          auditLogId: `audit-${currentMissionId}`
        })
      },
      now,
      providerChallenge: {
        providerCalldata: encodeTransferCalldata(providerEntry.merchantAddress, "5"),
        providerSignature: signReceiptForDemo(providerEntry.publicKey, {
          paymentContextHash: builtContext.paymentContextHash,
          providerResponseHash,
          responseSchemaHash,
          deliveryTimestamp: now,
          status: "paid"
        }),
        responseBody,
        providerAddress: providerEntry.merchantAddress,
        providerPublicKey: providerEntry.publicKey,
        responseSchemaHash,
        auditLogIds: ["audit-1"]
      }
    },
    builtContext
  };
}

function encodeTransferCalldata(to, amount) {
  const address = to.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const value = BigInt(amount).toString(16).padStart(64, "0");
  return `0xa9059cbb${address}${value}`;
}

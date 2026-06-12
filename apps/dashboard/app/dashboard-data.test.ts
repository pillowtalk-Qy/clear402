import { describe, expect, test } from "vitest";

import {
  applyDashboardAction,
  buildServerSideEvidenceExport,
  buildEvidenceExport,
  createInitialWorkspace,
  formatRequestId,
  loadPreferredEvidenceExport
} from "./dashboard-data";

const runtime = {
  service: "runtime",
  status: "ok" as const,
  evidenceMode: "live" as const,
  timestamp: "2026-06-12T00:00:00.000Z",
  version: "0.1.0",
  details: {},
  endpoint: "http://127.0.0.1:4000/health"
};

const provider = {
  service: "provider-x402",
  status: "ok" as const,
  evidenceMode: "live" as const,
  timestamp: "2026-06-12T00:00:00.000Z",
  version: "0.1.0",
  details: {},
  endpoint: "http://127.0.0.1:4010/health"
};

describe("dashboard data", () => {
  test("creates a fallback-rich workspace from runtime health", () => {
    const workspace = createInitialWorkspace({
      runtime,
      provider,
      preset: "demo"
    });

    expect(workspace.runtimeHealth.evidenceMode).toBe("live");
    expect(workspace.providerHealth.evidenceMode).toBe("live");
    expect(workspace.mission.evidenceMode).toBe("mock");
    expect(workspace.caw.evidenceMode).toBe("fallback");
    expect(workspace.receipt.finalStatus).toBe("paid_but_not_delivered");
  });

  test("advances mission and export state through UI actions", () => {
    let workspace = createInitialWorkspace({
      runtime,
      provider,
      preset: "attack"
    });

    workspace = applyDashboardAction(workspace, { type: "create-mission" });
    workspace = applyDashboardAction(workspace, { type: "dry-run" });
    workspace = applyDashboardAction(workspace, { type: "prepare-guard" });
    workspace = applyDashboardAction(workspace, { type: "execute-payment" });
    workspace = applyDashboardAction(workspace, { type: "verify-receipt" });
    workspace = applyDashboardAction(workspace, { type: "run-attack", attackId: "replay" });
    workspace = applyDashboardAction(workspace, { type: "export-evidence" });

    expect(workspace.mission.status).toBe("complete");
    expect(workspace.receipt.finalStatus).toBe("delivered");
    expect(workspace.attacks.find((attack) => attack.id === "replay")?.resultState).toBe(
      "blocked"
    );
    expect(workspace.evidence?.source).toBe("frontend_fallback");
    expect(workspace.evidence?.json).toContain('"mission"');
    expect(workspace.evidence?.markdown).toContain("Clear402 Evidence Pack");
  });

  test("formats request ids with clear402 prefix", () => {
    expect(formatRequestId("0x1234567890abcdef")).toBe("clear402:1234567890abcdef");
  });

  test("prefers server-side evidence export when runtime export succeeds", async () => {
    const workspace = createInitialWorkspace({
      runtime,
      provider,
      preset: "evidence"
    });
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);

      if (url.endsWith("/export.json")) {
        return new Response(
          JSON.stringify({
            version: "clear402.evidence-export.v1",
            generatedAt: 1_800_000_000_000,
            missionId: "mission-demo-402",
            source: "runtime_db",
            evidenceMode: "fallback",
            evidenceModeSummary: {
              overall: "fallback",
              counts: { live: 1, fallback: 1, mock: 0 },
              components: []
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      return new Response("# Runtime export", {
        status: 200,
        headers: { "content-type": "text/markdown" }
      });
    };

    const result = await loadPreferredEvidenceExport(workspace, {
      fetcher,
      now: 1_800_000_000_100
    });

    expect(result.usedRuntime).toBe(true);
    expect(result.evidence.source).toBe("server_side");
    expect(result.evidence.runtimeSource).toBe("runtime_db");
    expect(result.evidence.evidenceMode).toBe("fallback");
    expect(result.evidence.generatedAt).toBe(1_800_000_000_000);
    expect(result.evidence.json).toContain('"source": "runtime_db"');
  });

  test("falls back to frontend export when runtime export is unavailable", async () => {
    const workspace = createInitialWorkspace({
      runtime,
      provider,
      preset: "evidence"
    });
    const fetcher: typeof fetch = async (input) => {
      const status = String(input).endsWith("/export.json") ? 404 : 200;
      return new Response(status === 404 ? '{"code":"EVIDENCE_NOT_FOUND"}' : "# not used", {
        status
      });
    };

    const result = await loadPreferredEvidenceExport(workspace, {
      fetcher,
      now: 1_800_000_000_100
    });

    expect(result.usedRuntime).toBe(false);
    expect(result.fallbackReason).toContain("HTTP 404");
    expect(result.evidence.source).toBe("frontend_fallback");
    expect(result.evidence.evidenceMode).toBe("fallback");
    expect(result.evidence.json).toContain('"liveFallbackMockLabels"');
    expect(result.evidence.markdown).toContain("Default dashboard demos and attack lab runs use fallback/mock evidence");
  });

  test("does not rewrite server-side source or evidenceMode into live", () => {
    const evidence = buildServerSideEvidenceExport({
      json: JSON.stringify({
        version: "clear402.evidence-export.v1",
        generatedAt: 1_800_000_000_000,
        missionId: "mission-demo-402",
        source: "demo_fixture",
        evidenceMode: "mock"
      }),
      markdown: "Source: `demo_fixture`\nEvidence mode: `mock`",
      now: 1_800_000_000_100
    });

    expect(evidence.source).toBe("server_side");
    expect(evidence.runtimeSource).toBe("demo_fixture");
    expect(evidence.evidenceMode).toBe("mock");
    expect(evidence.json).toContain('"source": "demo_fixture"');
    expect(evidence.json).toContain('"evidenceMode": "mock"');
    expect(evidence.json).not.toContain('"evidenceMode": "live"');
  });

  test("redacts secret-like values from displayed evidence exports", () => {
    const serverEvidence = buildServerSideEvidenceExport({
      json: JSON.stringify({
        source: "runtime_db",
        evidenceMode: "fallback",
        generatedAt: 1_800_000_000_000,
        apiKey: "sk-test-supersecret",
        nested: {
          authorization: "Bearer clear402-secret-token"
        },
        note: "operator alice@example.com used CLEAR402_CAW_API_KEY=secret-value"
      }),
      markdown:
        "operator alice@example.com used CLEAR402_CAW_API_KEY=secret-value with Bearer clear402-secret-token"
    });
    const fallbackEvidence = buildEvidenceExport(
      createInitialWorkspace({ runtime, provider, preset: "demo" })
    );
    const rendered = [
      serverEvidence.json,
      serverEvidence.markdown,
      fallbackEvidence.json,
      fallbackEvidence.markdown
    ].join("\n");

    expect(rendered).not.toContain("sk-test-supersecret");
    expect(rendered).not.toContain("clear402-secret-token");
    expect(rendered).not.toContain("CLEAR402_CAW_API_KEY=secret-value");
    expect(rendered).not.toContain("alice@example.com");
    expect(rendered).not.toContain("CUST-1442");
    expect(rendered).not.toContain("API token xyz");
    expect(rendered).toContain("[redacted-secret]");
  });
});

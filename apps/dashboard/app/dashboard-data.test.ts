import { describe, expect, test } from "vitest";

import {
  applyDashboardAction,
  buildEvidenceExport,
  createInitialWorkspace,
  formatRequestId
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
    expect(workspace.evidence?.json).toContain('"mission"');
    expect(workspace.evidence?.markdown).toContain("Clear402 Evidence Pack");
  });

  test("formats request ids with clear402 prefix", () => {
    expect(formatRequestId("0x1234567890abcdef")).toBe("clear402:1234567890abcdef");
  });
});

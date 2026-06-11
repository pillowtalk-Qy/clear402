import { spawnSync } from "node:child_process";
import {
  assertCapabilityStatus,
  assertEvidenceMode,
  hashObject,
  sha256Hex
} from "../../../packages/shared/src/index.mjs";

export const CAW_CAPABILITIES = Object.freeze([
  "caw_cli",
  "wallet_identity",
  "policy_enforcement",
  "payment_execution",
  "audit_lookup",
  "policy_denial_evidence"
]);

export function probeCawCapabilities({
  command = process.env.CLEAR402_CAW_BIN ?? "caw",
  runner = runCommand,
  clock = () => Date.now()
} = {}) {
  const collectedAt = clock();
  const help = runner(command, ["--help"], { timeoutMs: 5000 });
  const evidenceRef = createProbeEvidenceRef({
    command,
    args: ["--help"],
    collectedAt,
    exitCode: help.exitCode,
    signal: help.signal,
    errorCode: help.errorCode,
    stdoutHash: sha256Hex(help.stdout ?? ""),
    stderrHash: sha256Hex(help.stderr ?? "")
  });

  if (help.ok) {
    return [
      createCapabilityRecord({
        capability: "caw_cli",
        status: "verified",
        evidenceMode: "live",
        rawEvidenceRef: evidenceRef,
        notes: "Official CAW command responded to --help in this environment."
      }),
      createCapabilityRecord({
        capability: "wallet_identity",
        status: "needs_manual_step",
        evidenceMode: "fallback",
        rawEvidenceRef: evidenceRef,
        notes: "CLI is present, but wallet identity was not verified by this non-interactive probe."
      }),
      createCapabilityRecord({
        capability: "policy_enforcement",
        status: "needs_manual_step",
        evidenceMode: "fallback",
        rawEvidenceRef: evidenceRef,
        notes: "Policy behavior requires a real wallet or CAW audit run before it can be called live."
      }),
      createCapabilityRecord({
        capability: "payment_execution",
        status: "fallback_required",
        evidenceMode: "fallback",
        rawEvidenceRef: evidenceRef,
        notes: "The CAW adapter will not execute payments until wallet, policy, and audit evidence are verified."
      }),
      createCapabilityRecord({
        capability: "audit_lookup",
        status: "needs_manual_step",
        evidenceMode: "fallback",
        rawEvidenceRef: evidenceRef,
        notes: "Audit lookup must be verified with real CAW output before live evidence can be exported."
      }),
      createCapabilityRecord({
        capability: "policy_denial_evidence",
        status: "fallback_required",
        evidenceMode: "fallback",
        rawEvidenceRef: evidenceRef,
        notes: "Fallback denial evidence is available locally; live CAW denial evidence requires an audited CAW request."
      })
    ];
  }

  return CAW_CAPABILITIES.map((capability) =>
    createUnavailableRecord({ capability, evidenceRef, command, help })
  );
}

export function createCawCapabilityReport(records, { createdAt = Date.now() } = {}) {
  const normalizedRecords = records.map((record) => createCapabilityRecord(record));
  const summary = {
    verified: normalizedRecords.filter((record) => record.status === "verified").length,
    needsManualStep: normalizedRecords.filter((record) => record.status === "needs_manual_step").length,
    unavailable: normalizedRecords.filter((record) => record.status === "unavailable").length,
    fallbackRequired: normalizedRecords.filter((record) => record.status === "fallback_required").length
  };

  const liveReady = CAW_CAPABILITIES.every((capability) =>
    normalizedRecords.some((record) => record.capability === capability && record.status === "verified")
  );

  return {
    version: "clear402.caw.capability-report.v1",
    createdAt,
    evidenceMode: liveReady ? "live" : "fallback",
    liveReady,
    summary,
    records: normalizedRecords
  };
}

export function renderCawCapabilityReportMarkdown(report) {
  const lines = [
    "# CAW Capability Report",
    "",
    "This report records what Clear402 can truthfully claim about the local CAW boundary.",
    "",
    `- Version: \`${report.version}\``,
    `- Created at: \`${new Date(report.createdAt).toISOString()}\``,
    `- Evidence mode: \`${report.evidenceMode}\``,
    `- Live ready: \`${String(report.liveReady)}\``,
    "",
    "| Capability | Status | Evidence Mode | Evidence Ref | Notes |",
    "|---|---|---|---|---|"
  ];

  for (const record of report.records) {
    lines.push(
      `| \`${record.capability}\` | \`${record.status}\` | \`${record.evidenceMode}\` | ${record.rawEvidenceRef ? `\`${record.rawEvidenceRef}\`` : ""} | ${escapeTableCell(record.notes ?? "")} |`
    );
  }

  lines.push(
    "",
    "## Consequence",
    "",
    report.liveReady
      ? "Clear402 may route CAW-bound spending through `CawAdapter` when the guard pipeline approves it."
      : "Clear402 must not claim live CAW execution. Payment attempts must stop with explicit denial or `fallback_required` evidence until the missing capabilities are verified."
  );

  return `${lines.join("\n")}\n`;
}

export function createCapabilityRecord({ capability, status, evidenceMode, rawEvidenceRef, notes }) {
  if (!CAW_CAPABILITIES.includes(capability)) {
    throw new TypeError(`Unsupported CAW capability: ${String(capability)}`);
  }

  return {
    capability,
    status: assertCapabilityStatus(status),
    evidenceMode: assertEvidenceMode(evidenceMode),
    ...(rawEvidenceRef ? { rawEvidenceRef } : {}),
    ...(notes ? { notes } : {})
  };
}

function createUnavailableRecord({ capability, evidenceRef, command, help }) {
  const isCli = capability === "caw_cli";
  const status = isCli ? "unavailable" : "fallback_required";
  const reason =
    help.errorCode === "ENOENT"
      ? `${command} was not found on PATH.`
      : `${command} --help did not complete successfully.`;

  return createCapabilityRecord({
    capability,
    status,
    evidenceMode: "fallback",
    rawEvidenceRef: evidenceRef,
    notes: isCli
      ? reason
      : `Blocked because the CAW CLI probe is not verified: ${reason}`
  });
}

function createProbeEvidenceRef(evidence) {
  return `caw-probe:${hashObject(evidence).slice(0, 24)}`;
}

function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function runCommand(command, args, { timeoutMs } = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: timeoutMs ?? 5000
  });

  return {
    ok: result.status === 0 && !result.error,
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    errorCode: result.error?.code
  };
}

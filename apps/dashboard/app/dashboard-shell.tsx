"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRightLeft,
  BadgeAlert,
  Blocks,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CloudAlert,
  FileSearch,
  Fingerprint,
  Menu,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  TerminalSquare,
  TimerReset,
  TriangleAlert,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

import {
  applyDashboardAction,
  buildEvidenceExport,
  countModes,
  describeWorkspaceModes,
  formatCompactHash,
  formatIsoTimestamp,
  formatJson,
  getAttackById,
  loadPreferredEvidenceExport,
  mergeRuntimeTimelineItem,
  recordEvidenceExport,
  runtimeTimelineEventToDashboardItem,
  runPreferredMissionFlowAction,
  type AttackScenario,
  type DashboardPreset,
  type DashboardRuntimeSnapshot,
  type DashboardWorkspace,
  type EvidenceMode,
  type RuntimeTimelineSsePayload,
  type TimelineEvent,
  toCompactModeLabel
} from "./dashboard-data";

type BadgeTone = "live" | "fallback" | "mock" | "blocked" | "success" | "warning" | "neutral";

interface DashboardShellProps extends DashboardRuntimeSnapshot {
  initialWorkspace: DashboardWorkspace;
}

type PanelCardProps = {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  state: string;
  tone?: BadgeTone;
  rightSlot?: ReactNode;
  children: ReactNode;
  dense?: boolean;
};

const presetLabels: Record<DashboardPreset, string> = {
  demo: "demo",
  investigate: "investigate",
  attack: "attack",
  evidence: "evidence"
};

const badgeStyles: Record<BadgeTone, string> = {
  live: "badge badge-live",
  fallback: "badge badge-fallback",
  mock: "badge badge-mock",
  blocked: "badge badge-blocked",
  success: "badge badge-success",
  warning: "badge badge-warning",
  neutral: "badge badge-neutral"
};

const defaultJsonPreview = "{\n  \"status\": \"empty\"\n}";

function timelineSseUrl(runtimeEndpoint: string, missionId: string) {
  const url = new URL(runtimeEndpoint);
  url.pathname = `/api/missions/${encodeURIComponent(missionId)}/timeline.sse`;
  url.search = "";
  return url.toString();
}

function Badge({ state, tone }: { state: string; tone?: BadgeTone | undefined }) {
  const resolvedTone = tone ?? (state === "live" ? "live" : state === "fallback" ? "fallback" : state === "mock" ? "mock" : "neutral");
  return <span className={badgeStyles[resolvedTone]}>{toCompactModeLabel(state)}</span>;
}

function SectionCard({ title, subtitle, icon, state, tone, rightSlot, children, dense }: PanelCardProps) {
  const testId = `panel-${title
    .toLowerCase()
    .replace(/\s*\+\s*/g, "-")
    .replace(/\s*\/\s*/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  return (
    <section className={`panel-card${dense ? " panel-card-dense" : ""}`} data-testid={testId}>
      <div className="panel-card-head">
        <div className="panel-card-title-wrap">
          <div className="panel-card-icon">{icon}</div>
          <div className="panel-card-copy">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        <div className="panel-card-actions">
          <Badge state={state} tone={tone} />
          {rightSlot}
        </div>
      </div>
      <div className="panel-card-body">{children}</div>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <strong className="metric-value" title={value}>
        {value}
      </strong>
      {hint ? <span className="metric-hint">{hint}</span> : null}
    </div>
  );
}

function KV({
  label,
  value,
  className = ""
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`kv-row ${className}`.trim()}>
      <span className="kv-label">{label}</span>
      <div className="kv-value">{value}</div>
    </div>
  );
}

function JsonBlock({
  value,
  label,
  compact = false,
  defaultExpanded = false
}: {
  value: unknown;
  label?: string;
  compact?: boolean;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const summaryLabel = label ?? "Raw evidence";

  return (
    <details
      className={`json-block${compact ? " json-block-compact" : ""}`}
      open={isExpanded}
      onToggle={(event) => setIsExpanded(event.currentTarget.open)}
    >
      <summary className="json-summary">
        <span className="json-summary-copy">
          <span className="json-label">{summaryLabel}</span>
          <strong>Raw evidence</strong>
        </span>
        <span className="json-summary-state">
          {isExpanded ? "shown" : "folded"}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </summary>
      <pre>{value ? formatJson(value) : defaultJsonPreview}</pre>
    </details>
  );
}

function DiffBlock({
  before,
  after
}: {
  before: Record<string, string>;
  after: Record<string, string>;
}) {
  return (
    <div className="diff-grid">
      <div className="diff-col">
        <div className="diff-title">Before</div>
        {Object.entries(before).map(([label, value]) => (
          <KV key={label} label={label} value={<code>{value}</code>} />
        ))}
      </div>
      <div className="diff-col">
        <div className="diff-title">After</div>
        {Object.entries(after).map(([label, value]) => (
          <KV key={label} label={label} value={<code>{value}</code>} />
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  tone = "neutral",
  disabled,
  testId
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: BadgeTone;
  disabled?: boolean;
  testId?: string;
}) {
  const resolvedTestId = testId ?? `action-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <button
      className={`action-button action-button-${tone}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={resolvedTestId}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ToggleButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`preset-button${active ? " preset-button-active" : ""}`}
      type="button"
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function EmptyState({
  title,
  detail,
  icon
}: {
  title: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function StateChip({ state }: { state: string }) {
  return <Badge state={state} />;
}

function Timeline({ items }: { items: TimelineEvent[] }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <motion.div
          key={`${item.id}-${index}`}
          className={`timeline-item timeline-item-${item.status}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="timeline-rail" />
          <div className="timeline-copy">
            <div className="timeline-top">
              <strong>{item.title}</strong>
              <span className="timeline-meta">
                <StateChip state={item.status} />
                <Badge state={item.evidenceMode} />
              </span>
            </div>
            <p>{item.detail}</p>
            <small>{formatIsoTimestamp(item.timestamp)}</small>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AttackCards({
  attacks,
  selectedAttackId,
  onSelect
}: {
  attacks: AttackScenario[];
  selectedAttackId: string;
  onSelect: (attackId: string) => void;
}) {
  return (
    <div className="attack-grid">
      {attacks.map((attack) => {
        const active = attack.id === selectedAttackId;

        return (
          <button
            key={attack.id}
            type="button"
            className={`attack-card${active ? " attack-card-active" : ""}`}
            onClick={() => onSelect(attack.id)}
            data-testid={`attack-card-${attack.id}`}
          >
            <div className="attack-card-top">
              <strong>{attack.title}</strong>
              <Badge state={attack.evidenceMode} />
            </div>
            <p>{attack.summary}</p>
            <div className="attack-card-meta">
              <span>{attack.blockedLayer}</span>
              <span>{attack.paper}</span>
            </div>
            <div className="attack-card-footer">
              <StateChip state={attack.resultState === "idle" ? "empty" : attack.resultState === "blocked" ? "blocked" : attack.resultState} />
              <span>Runs: {attack.runCount}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function mapCountsLabel(counts: Record<EvidenceMode, number>) {
  return `live ${counts.live} · fallback ${counts.fallback} · mock ${counts.mock}`;
}

export function DashboardShell({ initialWorkspace, runtime, provider }: DashboardShellProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReceiptExpanded, setIsReceiptExpanded] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const selectedAttack = useMemo(
    () => getAttackById(workspace, workspace.selectedAttackId),
    [workspace]
  );

  const modes = useMemo(() => describeWorkspaceModes(workspace), [workspace]);
  const attackSummary = useMemo(
    () =>
      workspace.attacks.reduce(
        (accumulator, attack) => {
          accumulator[attack.resultState] += 1;
          return accumulator;
        },
        { blocked: 0, fallback: 0, mock: 0, success: 0, idle: 0 } as Record<"blocked" | "fallback" | "mock" | "success" | "idle", number>
      ),
    [workspace]
  );

  const attackStatePreview = useMemo(
    () =>
      countModes([
        workspace.runtimeHealth,
        workspace.providerHealth,
        workspace.mission,
        workspace.caw,
        workspace.challenge,
        workspace.providerTrust,
        workspace.firewall,
        workspace.paymentContext,
        workspace.clearSign,
        workspace.receipt
      ]),
    [workspace]
  );

  const selectedAttackCard = selectedAttack ?? workspace.attacks[0];
  const isExportVisible = isExportOpen || Boolean(workspace.evidence);
  const modePreview = mapCountsLabel(modes);
  const runtimeTimelineMissionId = workspace.mission.id;

  useEffect(() => {
    if (!runtimeTimelineMissionId || typeof EventSource === "undefined") {
      return;
    }

    const source = new EventSource(timelineSseUrl(runtime.endpoint, runtimeTimelineMissionId));
    const handleRuntimeTimelineEvent = (event: MessageEvent<string>) => {
      try {
        const item = runtimeTimelineEventToDashboardItem(
          JSON.parse(event.data) as RuntimeTimelineSsePayload
        );
        if (item) {
          setWorkspace((current) => mergeRuntimeTimelineItem(current, item));
        }
      } catch {
        // Keep the dashboard on its local timeline if the runtime stream is unavailable or malformed.
      }
    };

    for (const eventName of ["mission", "guard", "receipt", "attack"]) {
      source.addEventListener(eventName, handleRuntimeTimelineEvent);
    }

    return () => {
      source.close();
    };
  }, [runtime.endpoint, runtimeTimelineMissionId]);

  const run = (action: Parameters<typeof applyDashboardAction>[1]) => {
    setWorkspace((current) => applyDashboardAction(current, action));
  };

  const runMissionFlow = (action: Parameters<typeof runPreferredMissionFlowAction>[1]) => {
    const current = workspace;
    setWorkspace({
      ...current,
      actionSource: "demo_fixture"
    });
    void runPreferredMissionFlowAction(current, action).then((result) => {
      setWorkspace(result.workspace);
    });
  };

  const handleEvidenceExport = async () => {
    setIsExportOpen(true);
    setIsExporting(true);

    try {
      const result = await loadPreferredEvidenceExport(workspace);
      setWorkspace((current) =>
        recordEvidenceExport(
          current,
          result.evidence,
          Date.now(),
          result.usedRuntime
            ? `Server-side evidence export (${result.evidence.runtimeSource ?? "runtime"}) captured the current live / fallback / mock split.`
            : `Runtime evidence export unavailable; frontend fallback export kept the demo available. ${result.fallbackReason ?? ""}`.trim()
        )
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportEvidence = workspace.evidence ?? buildEvidenceExport(workspace);
  const exportSourceLabel =
    exportEvidence.source === "server_side"
      ? `server-side${exportEvidence.runtimeSource ? ` / ${exportEvidence.runtimeSource}` : ""}`
      : "frontend fallback";
  const exportTone =
    exportEvidence.evidenceMode === "live"
      ? "live"
      : exportEvidence.evidenceMode === "mock"
        ? "mock"
        : "fallback";
  const selectedAttackTitle = selectedAttackCard?.title ?? "attack";
  const selectedAttackResult = selectedAttackCard?.resultState ?? "idle";
  const selectedAttackDescription = selectedAttackCard?.resultDetail ?? selectedAttackCard?.summary ?? "";
  const selectedAttackLayer = selectedAttackCard?.blockedLayer ?? "n/a";
  const selectedAttackEvidenceRef = selectedAttackCard?.evidenceRef ?? "n/a";
  const selectedAttackGuardEventId = selectedAttackCard?.guardEventId ?? "n/a";

  return (
    <main className="dashboard-shell">
      <div className="dashboard-grid">
        <aside className={`sidebar${isMobileNavOpen ? " sidebar-open" : ""}`}>
          <div className="brand-line">
            <div className="brand-mark">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Clear402 Evidence Dashboard</strong>
              <p>Runtime facts first. No invented security verdicts.</p>
            </div>
          </div>

          <button
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsMobileNavOpen((value) => !value)}
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? <ChevronUp size={16} /> : <Menu size={16} />}
            <span>{isMobileNavOpen ? "Hide navigation" : "Navigation"}</span>
          </button>

          <div className="preset-switcher">
            {(Object.keys(presetLabels) as DashboardPreset[]).map((preset) => (
              <ToggleButton
                key={preset}
                active={workspace.preset === preset}
                label={presetLabels[preset]}
                onClick={() => run({ type: "set-preset", preset })}
              />
            ))}
          </div>

          <div className="sidebar-stack">
            <SectionCard
              title="Live / Fallback / Mock"
              subtitle="Always visible across the console."
              icon={<Sparkles size={18} />}
              state="fallback"
              tone="warning"
              dense
            >
              <Metric label="Mode split" value={modePreview} />
              <Metric label="Source" value={workspace.actionSource} />
              <Metric label="Runtime health" value={runtime.status} hint={runtime.endpoint} />
              <Metric label="Provider health" value={provider.status} hint={provider.endpoint} />
            </SectionCard>

            <SectionCard
              title="Mission Console"
              subtitle="The operator's working set."
              icon={<ClipboardList size={18} />}
              state={workspace.mission.evidenceMode}
              tone={workspace.mission.evidenceMode === "live" ? "live" : "fallback"}
              dense
            >
              <KV label="Prompt" value={<span className="clamp-lines">{workspace.missionDraft.prompt}</span>} />
              <KV label="Budget" value={<code>{workspace.missionDraft.budgetUsd} USDC</code>} />
              <KV label="Resource" value={<code>{formatCompactHash(workspace.missionDraft.resourceUrl)}</code>} />
              <KV label="Status" value={<StateChip state={workspace.mission.status} />} />
              <KV label="Pact" value={<code>{workspace.caw.pactId}</code>} />
            </SectionCard>
          </div>
        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="topbar-copy">
              <p className="eyebrow">Champion evidence console</p>
              <h1>Evidence Dashboard</h1>
              <p>
                The main view is a live operator table: challenge, guard, receipt, attack, and export are all present, and the non-live branches are explicitly marked.
              </p>
            </div>
            <div className="topbar-actions">
              <div className="mini-status">
                <span className="mini-status-label">runtime</span>
                <Badge state={runtime.evidenceMode} />
              </div>
              <div className="mini-status">
                <span className="mini-status-label">provider</span>
                <Badge state={provider.evidenceMode} />
              </div>
            </div>
          </header>

          <section className="action-bar">
            <ActionButton label="Create mission" icon={<ClipboardList size={16} />} onClick={() => runMissionFlow("create-mission")} tone="success" />
            <ActionButton label="Dry run 402" icon={<FileSearch size={16} />} onClick={() => runMissionFlow("dry-run")} />
            <ActionButton label="Prepare guard" icon={<ShieldPlus size={16} />} onClick={() => runMissionFlow("prepare-guard")} tone="warning" />
            <ActionButton label="Execute demo payment" icon={<ArrowRightLeft size={16} />} onClick={() => runMissionFlow("execute-payment")} tone="warning" testId="action-execute-payment" />
            <ActionButton label="Verify receipt" icon={<ShieldCheck size={16} />} onClick={() => runMissionFlow("verify-receipt")} tone="success" />
            <ActionButton label={isExporting ? "Exporting evidence" : "Export evidence"} icon={<ArrowDownToLine size={16} />} onClick={() => void handleEvidenceExport()} tone="fallback" disabled={isExporting} />
          </section>

          <section className="panels-grid">
            <SectionCard
              title="Official CAW Panel"
              subtitle="Environment, wallet, pact, request tracking, and audit logs."
              icon={<ShieldCheck size={18} />}
              state={workspace.caw.evidenceMode}
              tone={workspace.caw.evidenceMode === "live" ? "live" : "fallback"}
            >
              <div className="two-col">
                <KV label="Environment" value={<code>{workspace.caw.environment}</code>} />
                <KV label="Wallet address" value={<code>{formatCompactHash(workspace.caw.walletAddress)}</code>} />
                <KV label="Wallet UUID" value={<code>{workspace.caw.walletUuid}</code>} />
              <KV label="Pact-scoped API key" value={<StateChip state={workspace.caw.pactScopedApiKeyStatus} />} />
                <KV label="Source" value={<code>{workspace.actionSource}</code>} />
              </div>
              <div className="subpanel">
                <div className="subpanel-head">
                  <strong>Capability report</strong>
                  <Badge state={workspace.caw.evidenceMode} />
                </div>
                <div className="capability-list">
                  {workspace.caw.capabilityReport.map((record) => (
                    <div key={record.capability} className="capability-row">
                      <span>{record.capability}</span>
                      <Badge state={record.evidenceMode} />
                      <StateChip state={record.status} />
                      {record.notes ? <small>{record.notes}</small> : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="subpanel">
                <div className="subpanel-head">
                  <strong>Audit logs</strong>
                  <StateChip state={workspace.caw.transactionStatus} />
                </div>
                <div className="log-list">
                  {workspace.caw.auditLogs.map((entry, index) => (
                    <div key={`${entry.id}-${index}`} className="log-row">
                      <span className="log-row-id">{entry.id}</span>
                      <span className="log-row-outcome">{entry.outcome}</span>
                      <Badge state={entry.evidenceMode} />
                      <p>{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="x402 Challenge Inspector"
              subtitle="Raw 402 response, normalized challenge, registry result, settlement path."
              icon={<BadgeAlert size={18} />}
              state={workspace.challenge.state}
              tone={workspace.challenge.state === "success" ? "success" : "neutral"}
            >
              {workspace.challenge.rawChallenge ? (
                <JsonBlock value={workspace.challenge.rawChallenge} label="Raw challenge" />
              ) : (
                <EmptyState
                  title="No live challenge yet"
                  detail="Use Dry run 402 to populate the inspector. Until then the panel stays empty instead of inventing a challenge."
                  icon={<CloudAlert size={18} />}
                />
              )}
              {workspace.challenge.normalizedChallenge ? (
                <JsonBlock value={workspace.challenge.normalizedChallenge} label="Normalized challenge" />
              ) : null}
              {workspace.challenge.providerRegistryResult ? (
                <JsonBlock value={workspace.challenge.providerRegistryResult} label="Provider registry result" />
              ) : null}
              <KV label="Settlement path" value={<code>{workspace.challenge.settlementPath}</code>} />
            </SectionCard>

            <SectionCard
              title="Provider Registry + ERC-8004 Trust Panel"
              subtitle="Identity, endpoint, payTo, reputation, and trust result."
              icon={<Fingerprint size={18} />}
              state={workspace.providerTrust.evidenceMode}
              tone={workspace.providerTrust.evidenceMode === "live" ? "live" : "fallback"}
            >
              <div className="two-col">
                <KV label="Provider ID" value={<code>{workspace.providerTrust.providerId}</code>} />
                <KV label="Trust decision" value={<StateChip state={workspace.providerTrust.state} />} />
              </div>
              <JsonBlock value={workspace.providerTrust.registryEntry} label="Registry entry" />
              <JsonBlock value={workspace.providerTrust.trustResult} label="ERC-8004 trust result" compact />
            </SectionCard>

            <SectionCard
              title="Metadata Firewall Diff"
              subtitle="Before and after redaction with findings."
              icon={<ShieldAlert size={18} />}
              state={workspace.firewall.evidenceMode}
              tone={workspace.firewall.evidenceMode === "live" ? "live" : "fallback"}
            >
              <KV label="Decision" value={<StateChip state={workspace.firewall.decision} />} />
              <KV label="Reason code" value={<code>{workspace.firewall.reasonCode}</code>} />
              <KV label="PII policy hash" value={<code>{workspace.firewall.piiPolicyHash}</code>} />
              <KV label="Latency" value={<code>{workspace.firewall.latencyMs}ms</code>} />
              <DiffBlock before={workspace.firewall.before} after={workspace.firewall.after} />
              <div className="findings-list">
                {workspace.firewall.findings.map((finding, index) => (
                  <div key={`${finding.field}-${index}`} className="finding-row">
                    <strong>{finding.field}</strong>
                    <span>{finding.entityType}</span>
                    <span>{finding.action}</span>
                    <span>{Math.round(finding.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="PaymentContext Panel"
              subtitle="Canonical hashes, nonce, expiry, and request id."
              icon={<Blocks size={18} />}
              state={workspace.paymentContext.evidenceMode}
              tone={workspace.paymentContext.evidenceMode === "live" ? "live" : "fallback"}
            >
              <div className="two-col">
                <KV label="PaymentContext hash" value={<code>{workspace.paymentContext.paymentContextHash}</code>} />
                <KV label="CAW request id" value={<code>{workspace.paymentContext.requestId}</code>} />
                <KV label="Nonce" value={<code>{workspace.paymentContext.nonce}</code>} />
                <KV label="Expiry" value={<code>{formatIsoTimestamp(workspace.paymentContext.expiresAt)}</code>} />
              </div>
              <JsonBlock value={workspace.paymentContext} label="PaymentContext JSON" compact />
            </SectionCard>

            <SectionCard
              title="Clear Signing Panel"
              subtitle="Decoded intent, risk tags, and semantic gate decision."
              icon={<TerminalSquare size={18} />}
              state={workspace.clearSign.result.decision}
              tone={workspace.clearSign.result.decision === "allow" ? "success" : workspace.clearSign.result.decision === "block" ? "blocked" : "warning"}
            >
              <KV label="Decision" value={<StateChip state={workspace.clearSign.result.decision} />} />
              <KV label="Intent" value={<span className="clamp-lines">{workspace.clearSign.result.intent}</span>} />
              <KV label="Selector" value={<code>{workspace.clearSign.result.selector}</code>} />
              <KV label="Function" value={<code>{workspace.clearSign.result.functionSignature}</code>} />
              <KV label="Calldata digest" value={<code>{workspace.clearSign.result.calldataDigest}</code>} />
              <div className="risk-tags">
                {workspace.clearSign.result.riskTags.map((tag) => (
                  <span key={tag} className="risk-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <JsonBlock value={workspace.clearSign.input} label="ClearSign input" compact />
            </SectionCard>

            <SectionCard
              title="CAW Execution Timeline"
              subtitle="Guard pass, CAW submit, pending approval, tx hash, and audit logs."
              icon={<TimerReset size={18} />}
              state={workspace.caw.evidenceMode}
              tone={workspace.caw.transactionStatus === "finalized" ? "success" : "warning"}
            >
              <Timeline items={workspace.timeline} />
            </SectionCard>

            <SectionCard
              title="Service Receipt Panel"
              subtitle="Payment receipt, delivery receipt, and final status."
              icon={<ShieldCheck size={18} />}
              state={workspace.receipt.evidenceMode}
              tone={workspace.receipt.finalStatus === "delivered" ? "success" : "warning"}
              rightSlot={<button className="tiny-toggle" type="button" onClick={() => setIsReceiptExpanded((value) => !value)}>{isReceiptExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} details</button>}
            >
              <div className="two-col">
                <KV label="Final status" value={<StateChip state={workspace.receipt.finalStatus} />} />
                <KV label="Payment status" value={<StateChip state={workspace.receipt.paymentReceipt.status} />} />
                <KV label="Delivery status" value={<StateChip state={workspace.receipt.deliveryReceipt.status} />} />
                <KV label="Tx hash" value={<code>{workspace.receipt.paymentReceipt.txHash ? formatCompactHash(workspace.receipt.paymentReceipt.txHash) : "n/a"}</code>} />
              </div>
              {isReceiptExpanded ? (
                <>
                  <JsonBlock value={workspace.receipt.paymentReceipt} label="Payment receipt" />
                  <JsonBlock value={workspace.receipt.deliveryReceipt} label="Delivery receipt" />
                </>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Attack Lab Panel"
              subtitle="One-click attacks with blocked-layer evidence."
              icon={<TriangleAlert size={18} />}
              state="mock"
              tone="mock"
            >
              <AttackCards
                attacks={workspace.attacks}
                selectedAttackId={workspace.selectedAttackId}
                onSelect={(attackId) => setWorkspace((current) => ({ ...current, selectedAttackId: attackId }))}
              />
              <div className="attack-panel-footer">
                <ActionButton
                  label={`Run ${selectedAttackTitle}`}
                  icon={<Zap size={16} />}
                  onClick={() =>
                    selectedAttackCard ? run({ type: "run-attack", attackId: selectedAttackCard.id }) : undefined
                  }
                  tone="blocked"
                />
                <div className="attack-result">
                  <strong>{selectedAttackResult}</strong>
                  <p>{selectedAttackDescription}</p>
                </div>
              </div>
              <KV label="Blocked layer" value={<code>{selectedAttackLayer}</code>} />
              <KV label="Evidence ref" value={<code>{selectedAttackEvidenceRef}</code>} />
              <KV label="Guard event" value={<code>{selectedAttackGuardEventId}</code>} />
            </SectionCard>

            <SectionCard
              title="Evidence Export Panel"
              subtitle="Markdown and JSON export for the current evidence bundle."
              icon={<ArrowDownToLine size={18} />}
              state={workspace.evidence ? workspace.evidence.evidenceMode : "fallback"}
              tone={workspace.evidence ? exportTone : "neutral"}
              rightSlot={<Badge state={workspace.evidence ? workspace.evidence.evidenceMode : "fallback"} />}
            >
              <div className="export-meta">
                <Metric label="Generated" value={workspace.evidence ? formatIsoTimestamp(workspace.evidence.generatedAt) : "not yet generated"} />
                <Metric label="Status" value={isExporting ? "loading runtime" : workspace.evidence ? `${workspace.evidence.stale ? "stale" : "ready"} / ${exportSourceLabel}` : "idle"} />
                <Metric label="Source" value={workspace.evidence ? exportSourceLabel : "runtime preferred"} />
                <Metric label="Runtime" value={runtime.evidenceMode} />
                <Metric label="Provider" value={provider.evidenceMode} />
              </div>
              <div className="export-buttons">
                <ActionButton
                  label={isExporting ? "Opening" : "Open JSON"}
                  icon={<ArrowDownToLine size={16} />}
                  onClick={() => void handleEvidenceExport()}
                  tone="fallback"
                  disabled={isExporting}
                />
                <ActionButton
                  label={isExporting ? "Refreshing" : "Refresh export"}
                  icon={<TimerReset size={16} />}
                  onClick={() => void handleEvidenceExport()}
                  disabled={isExporting}
                />
              </div>
              {isExportVisible ? (
                <div className="export-body">
                  <JsonBlock value={exportEvidence.json} label="JSON export" compact defaultExpanded />
                  <div className="markdown-block">
                    <div className="json-label">Markdown export</div>
                    <pre>{exportEvidence.markdown}</pre>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Evidence export is hidden"
                  detail="Use Open JSON to reveal the export surface. The dashboard does not default to a giant blob."
                  icon={<ArrowDownToLine size={18} />}
                />
              )}
            </SectionCard>
          </section>
        </div>
      </div>

      <section className="bottom-strip">
        <div className="strip-item">
          <strong>Live inputs</strong>
          <p>{runtime.endpoint}</p>
          <p>{provider.endpoint}</p>
        </div>
        <div className="strip-item">
          <strong>State summary</strong>
          <p>{attackSummary.blocked} blocked attacks staged</p>
          <p>{attackStatePreview.live} live facts in view</p>
        </div>
        <div className="strip-item">
          <strong>Mode guard</strong>
          <p>Fallback and mock are intentionally visible. Ordinary dashboard payment is fallback/demo and never claims live CAW funds movement.</p>
        </div>
      </section>
    </main>
  );
}

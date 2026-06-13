import type { DatabaseSync } from "node:sqlite";

import type { EvidenceMode, GuardDecision, MissionStatus, ReceiptStatus } from "../../../packages/shared/src/index.mjs";

export interface MissionTimelineEvent {
  id: string;
  missionId: string;
  type: "mission" | "guard" | "receipt";
  status: MissionStatus | GuardDecision | ReceiptStatus;
  title: string;
  detail: string;
  evidenceMode: EvidenceMode;
  createdAt: number;
  payload: Record<string, unknown>;
}

interface MissionTimelineRow {
  id: string;
  missionId: string;
  userPrompt: string;
  budgetUsd: string;
  status: MissionStatus;
  cawWalletAddress: string | null;
  pactId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface GuardTimelineRow {
  id: string;
  missionId: string;
  layer: string;
  decision: GuardDecision;
  reason: string | null;
  evidenceJson: string;
  createdAt: number;
}

interface ReceiptTimelineRow {
  receiptId: string;
  missionId: string;
  paymentContextHash: string;
  cawRequestId: string | null;
  txHash: string | null;
  status: ReceiptStatus;
  evidenceMode: EvidenceMode;
  createdAt: number;
}

export function buildMissionTimeline(
  database: DatabaseSync,
  missionId: string
): { found: boolean; events: MissionTimelineEvent[] } {
  const mission = readMission(database, missionId);
  if (!mission) {
    return { found: false, events: [] };
  }

  const events: MissionTimelineEvent[] = [missionEvent(mission)];

  for (const event of readGuardEvents(database, missionId)) {
    events.push(guardEvent(event));
  }

  const receipt = readLatestReceipt(database, missionId);
  if (receipt) {
    events.push(receiptEvent(receipt));
  }

  events.sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
  return { found: true, events };
}

export function serializeMissionTimelineSse(events: MissionTimelineEvent[]): string {
  const chunks = [
    ": clear402 mission timeline\n",
    "event: ready\n",
    `data: ${JSON.stringify({ eventCount: events.length })}\n\n`
  ];

  for (const event of events) {
    chunks.push(`id: ${event.id}\n`);
    chunks.push(`event: ${event.type}\n`);
    chunks.push(`data: ${JSON.stringify(event)}\n\n`);
  }

  chunks.push("event: end\n");
  chunks.push(`data: ${JSON.stringify({ eventCount: events.length })}\n\n`);
  return chunks.join("");
}

function readMission(database: DatabaseSync, missionId: string): MissionTimelineRow | undefined {
  return database
    .prepare(
      `select
        id,
        id as missionId,
        user_prompt as userPrompt,
        budget_usd as budgetUsd,
        status,
        caw_wallet_address as cawWalletAddress,
        pact_id as pactId,
        created_at as createdAt,
        updated_at as updatedAt
      from missions
      where id = ?`
    )
    .get(missionId) as MissionTimelineRow | undefined;
}

function readGuardEvents(database: DatabaseSync, missionId: string): GuardTimelineRow[] {
  return database
    .prepare(
      `select
        id,
        mission_id as missionId,
        layer,
        decision,
        reason,
        evidence_json as evidenceJson,
        created_at as createdAt
      from guard_events
      where mission_id = ?
      order by created_at asc, id asc`
    )
    .all(missionId) as unknown as GuardTimelineRow[];
}

function readLatestReceipt(database: DatabaseSync, missionId: string): ReceiptTimelineRow | undefined {
  return database
    .prepare(
      `select
        receipt_id as receiptId,
        mission_id as missionId,
        payment_context_hash as paymentContextHash,
        caw_request_id as cawRequestId,
        tx_hash as txHash,
        status,
        evidence_mode as evidenceMode,
        created_at as createdAt
      from receipts
      where mission_id = ?
      order by created_at desc, receipt_id desc
      limit 1`
    )
    .get(missionId) as ReceiptTimelineRow | undefined;
}

function missionEvent(row: MissionTimelineRow): MissionTimelineEvent {
  return {
    id: `mission:${row.id}`,
    missionId: row.missionId,
    type: "mission",
    status: row.status,
    title: "Mission created",
    detail: "Runtime mission record is available for timeline streaming.",
    evidenceMode: "fallback",
    createdAt: row.createdAt,
    payload: {
      userPrompt: row.userPrompt,
      budgetUsd: row.budgetUsd,
      status: row.status,
      cawWalletAddress: row.cawWalletAddress,
      pactId: row.pactId,
      updatedAt: row.updatedAt
    }
  };
}

function guardEvent(row: GuardTimelineRow): MissionTimelineEvent {
  const evidence = parseJsonRecord(row.evidenceJson);
  return {
    id: row.id,
    missionId: row.missionId,
    type: "guard",
    status: row.decision,
    title: `Guard ${row.decision}`,
    detail: row.reason ?? `Guard layer ${row.layer} produced ${row.decision}.`,
    evidenceMode: evidenceModeFromEvidence(evidence),
    createdAt: row.createdAt,
    payload: {
      layer: row.layer,
      decision: row.decision,
      reason: row.reason,
      evidence
    }
  };
}

function receiptEvent(row: ReceiptTimelineRow): MissionTimelineEvent {
  return {
    id: `receipt:${row.receiptId}`,
    missionId: row.missionId,
    type: "receipt",
    status: row.status,
    title: "Receipt recorded",
    detail:
      row.txHash === null
        ? "Receipt is recorded without claiming a live CAW transaction hash."
        : "Receipt is recorded with transaction evidence.",
    evidenceMode: row.evidenceMode,
    createdAt: row.createdAt,
    payload: {
      receiptId: row.receiptId,
      paymentContextHash: row.paymentContextHash,
      cawRequestId: row.cawRequestId,
      txHash: row.txHash,
      status: row.status
    }
  };
}

function parseJsonRecord(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function evidenceModeFromEvidence(evidence: Record<string, unknown>): EvidenceMode {
  const mode = evidence.evidenceMode;
  return mode === "live" || mode === "mock" || mode === "fallback" ? mode : "fallback";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const dynamic = "force-dynamic";

import { headers } from "next/headers";

import { DashboardShell } from "./dashboard-shell";
import { createInitialWorkspace, type DashboardPreset, type HealthSnapshot } from "./dashboard-data";

const runtimeHealthUrl =
  process.env.RUNTIME_HEALTH_URL ?? "http://127.0.0.1:4000/health";
const providerHealthUrl =
  process.env.PROVIDER_X402_HEALTH_URL ?? "http://127.0.0.1:4010/health";

async function fetchHealth(endpoint: string, service: string): Promise<HealthSnapshot> {
  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = (await response.json()) as Partial<HealthSnapshot>;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      service: payload.service ?? service,
      status: payload.status === "ok" ? "ok" : "down",
      evidenceMode: (payload.evidenceMode ?? "live") as HealthSnapshot["evidenceMode"],
      timestamp: payload.timestamp ?? new Date().toISOString(),
      version: payload.version ?? "unknown",
      details: payload.details ?? {},
      endpoint
    };
  } catch (error) {
    return {
      service,
      status: "down",
      evidenceMode: "fallback",
      timestamp: new Date().toISOString(),
      version: "unavailable",
      details: { fallbackReason: "runtime API unavailable" },
      endpoint,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

function resolvePreset(value: string | undefined): DashboardPreset {
  if (value === "investigate" || value === "attack" || value === "evidence") {
    return value;
  }

  return "demo";
}

export default async function Page() {
  const requestHeaders = await headers();
  const preset = resolvePreset(requestHeaders.get("x-clear402-dashboard-preset") ?? undefined);
  const [runtime, provider] = await Promise.all([
    fetchHealth(runtimeHealthUrl, "runtime"),
    fetchHealth(providerHealthUrl, "provider-x402")
  ]);

  const initialWorkspace = createInitialWorkspace({
    runtime,
    provider,
    preset
  });

  return <DashboardShell initialWorkspace={initialWorkspace} runtime={runtime} provider={provider} />;
}

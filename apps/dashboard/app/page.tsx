export const dynamic = "force-dynamic";

type HealthSnapshot = {
  service: string;
  status: "ok" | "down";
  evidenceMode: "live" | "fallback" | "mock";
  timestamp: string;
  version: string;
  details?: Record<string, unknown>;
  endpoint: string;
  error?: string;
};

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
      status: "ok",
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
      details: {},
      endpoint,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

function Badge({ snapshot }: { snapshot: HealthSnapshot }) {
  const className =
    snapshot.status === "ok"
      ? "badge badge-live"
      : snapshot.evidenceMode === "mock"
        ? "badge badge-mock"
        : "badge badge-fallback";

  return <span className={className}>{snapshot.evidenceMode}</span>;
}

function HealthPanel({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{snapshot.service}</h2>
        <Badge snapshot={snapshot} />
      </div>

      <div className="field-list">
        <div className="field-row">
          <div className="field-label">Status</div>
          <p className="field-value">{snapshot.status}</p>
        </div>
        <div className="field-row">
          <div className="field-label">Endpoint</div>
          <p className="field-value">{snapshot.endpoint}</p>
        </div>
        <div className="field-row">
          <div className="field-label">Version</div>
          <p className="field-value">{snapshot.version}</p>
        </div>
        <div className="field-row">
          <div className="field-label">Timestamp</div>
          <p className="field-value">{snapshot.timestamp}</p>
        </div>
      </div>

      <pre className="details">{JSON.stringify(snapshot.details ?? {}, null, 2)}</pre>

      {snapshot.error ? (
        <p className="footer-note">Fallback reason: {snapshot.error}</p>
      ) : null}
    </article>
  );
}

export default async function Page() {
  const [runtime, provider] = await Promise.all([
    fetchHealth(runtimeHealthUrl, "runtime"),
    fetchHealth(providerHealthUrl, "provider-x402")
  ]);

  return (
    <main>
      <div className="shell">
        <header className="header">
          <h1 className="title">Clear402 Foundation</h1>
          <p className="subtitle">
            Monorepo base, shared contracts, SQLite initialization, and service health.
          </p>
        </header>

        <section className="status-grid" aria-label="service health">
          <HealthPanel snapshot={runtime} />
          <HealthPanel snapshot={provider} />
        </section>

        <p className="footer-note">
          Runtime and provider are the only live services in this foundation slice.
        </p>
      </div>
    </main>
  );
}

// Stub page (M11): shows the heartbeat of every service via the API. The real dashboard arrives in M9.
export const dynamic = "force-dynamic";

type ServiceStatus = { service: string; alive: boolean; age_seconds: number; mode?: string; nautilus_version?: string };

async function getStatus(): Promise<{ services: Record<string, ServiceStatus> } | null> {
  try {
    const res = await fetch(`${process.env.API_INTERNAL_URL ?? "http://localhost:8000"}/api/v1/status`, {
      cache: "no-store",
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const status = await getStatus();
  const services = status ? Object.values(status.services) : [];
  return (
    <main style={{ maxWidth: 760, margin: "64px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 4 }}>Capsten FX Trader</h1>
      <p style={{ color: "#9aa8ba", marginTop: 0 }}>Local stack status (stub UI, replaced in M9)</p>
      {!status && <p style={{ color: "#f0a04b" }}>API unreachable.</p>}
      {status && services.length === 0 && <p>No heartbeats yet. Services are starting.</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#9aa8ba" }}>
            <th style={{ padding: 8 }}>Service</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Last heartbeat</th>
            <th style={{ padding: 8 }}>Info</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.service} style={{ borderTop: "1px solid #24364b" }}>
              <td style={{ padding: 8 }}>{s.service}</td>
              <td style={{ padding: 8, color: s.alive ? "#5fd08a" : "#f07b5f" }}>{s.alive ? "alive" : "stale"}</td>
              <td style={{ padding: 8 }}>{s.age_seconds}s ago</td>
              <td style={{ padding: 8, color: "#9aa8ba" }}>
                {[s.mode && `mode: ${s.mode}`, s.nautilus_version && `nautilus ${s.nautilus_version}`]
                  .filter(Boolean)
                  .join(" · ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

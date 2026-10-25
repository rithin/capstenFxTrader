// Live page placeholder: shows each service's heartbeat in the new shell. The real Live terminal arrives in M9.2.
import Link from "next/link";

import { type Column, DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { Panel } from "@/components/data/panel";
import { StatusDot } from "@/components/data/pills";
import { AppShell } from "@/components/shell/app-shell";
import { FooterItem } from "@/components/shell/status-bits";

export const dynamic = "force-dynamic";

type ServiceStatus = { service: string; alive: boolean; age_seconds: number; mode?: string; nautilus_version?: string };

async function getStatus(): Promise<ServiceStatus[] | null> {
  try {
    const res = await fetch(`${process.env.API_INTERNAL_URL ?? "http://localhost:8000"}/api/v1/status`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { services: Record<string, ServiceStatus> };
    return Object.values(body.services);
  } catch {
    return null;
  }
}

const columns: Column<ServiceStatus>[] = [
  { key: "service", header: "Service", cell: (s) => <span className="font-semibold">{s.service}</span> },
  { key: "state", header: "Status", cell: (s) => <StatusDot state={s.alive ? "ok" : "down"}>{s.alive ? "Alive" : "Stale"}</StatusDot> },
  { key: "age", header: "Last heartbeat", align: "right", numeric: true, cell: (s) => `${s.age_seconds}s ago` },
  { key: "mode", header: "Mode", cell: (s) => <span className="text-ink-muted">{s.mode || "—"}</span> },
  { key: "nautilus", header: "Nautilus", numeric: true, cell: (s) => s.nautilus_version ?? "—" },
];

export default async function Home() {
  const services = await getStatus();
  return (
    <AppShell
      mode="sandbox"
      connections={[{ broker: "Zerodha", state: "login-required" }]}
      footer={
        <>
          <FooterItem label="Services">{services ? `${services.filter((s) => s.alive).length}/${services.length} alive` : "—"}</FooterItem>
          <span className="ms-auto">Stub page · the Live terminal arrives in M9.2</span>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[28px] font-semibold">System status</h1>
        <p className="text-sm text-ink-muted">
          Heartbeats from every service. See the <Link href="/dev/components" className="text-loss-strong underline">component preview</Link>.
        </p>
      </div>
      <Panel title="Services" count={services?.length} flush>
        {services === null ? (
          <EmptyState title="API unreachable" hint="The API isn't responding. Check `make status`." />
        ) : (
          <DataTable
            columns={columns}
            rows={services}
            rowKey={(s) => s.service}
            empty={<EmptyState title="No heartbeats yet" hint="Services are starting." />}
          />
        )}
      </Panel>
    </AppShell>
  );
}

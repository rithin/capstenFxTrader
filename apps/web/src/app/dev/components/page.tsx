import { Button } from "@/components/ui/button";
import { type Column, DataTable } from "@/components/data/data-table";
import { EmptyState, Skeleton, TableSkeleton } from "@/components/data/empty-state";
import { KpiCard, KpiRow } from "@/components/data/kpi-card";
import { LimitMeter, Meter } from "@/components/data/meter";
import { Panel } from "@/components/data/panel";
import { SidePill, StatusDot, StatusPill } from "@/components/data/pills";
import { PnlText } from "@/components/data/pnl-text";
import { Workspace } from "@/components/data/workspace";
import { AppShell } from "@/components/shell/app-shell";
import { FooterItem, ModeBadge } from "@/components/shell/status-bits";
import { formatMoney, formatNumber, formatQuantity } from "@/lib/format";

import { DemoActions } from "./demo-actions";

export const metadata = { title: "Components · Capsten" };

// Demo data only (India-first: NIFTY/SENSEX weekly options). Lot sizes are illustrative.
type OptionPosition = {
  id: string;
  underlying: string;
  expiry: string;
  strike: string;
  type: "CE" | "PE";
  side: "long" | "short";
  lots: number;
  qty: string;
  entry: string;
  ltp: string;
  sl: string;
  tp: string;
  pnl: string;
  strategy: string;
};

const positions: OptionPosition[] = [
  { id: "p1", underlying: "NIFTY", expiry: "27 Oct", strike: "24500", type: "CE", side: "long", lots: 2, qty: "150", entry: "112.40", ltp: "125.80", sl: "95.00", tp: "150.00", pnl: "2010.00", strategy: "ORB Breakout" },
  { id: "p2", underlying: "SENSEX", expiry: "29 Oct", strike: "81000", type: "PE", side: "long", lots: 1, qty: "20", entry: "286.50", ltp: "270.95", sl: "240.00", tp: "360.00", pnl: "-311.00", strategy: "VWAP Reversal" },
];

const columns: Column<OptionPosition>[] = [
  { key: "contract", header: "Contract", cell: (p) => <span className="font-semibold">{p.underlying} {p.expiry} {p.strike} {p.type}</span> },
  { key: "side", header: "Side", cell: (p) => <SidePill side={p.side} /> },
  { key: "lots", header: "Lots (qty)", align: "right", numeric: true, cell: (p) => `${p.lots} (${formatQuantity(p.qty)})` },
  { key: "entry", header: "Entry", align: "right", numeric: true, cell: (p) => formatNumber(p.entry) },
  { key: "ltp", header: "LTP", align: "right", numeric: true, cell: (p) => formatNumber(p.ltp) },
  { key: "sl", header: "Stop", align: "right", numeric: true, cell: (p) => <span className="text-loss-strong">{formatNumber(p.sl)}</span> },
  { key: "tp", header: "Target", align: "right", numeric: true, cell: (p) => <span className="text-gain-strong">{formatNumber(p.tp)}</span> },
  { key: "pnl", header: "Unrealised P&L", align: "right", cell: (p) => <PnlText value={p.pnl} className="font-medium" /> },
  { key: "strategy", header: "Strategy", cell: (p) => <span className="text-ink-muted">{p.strategy}</span> },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentsPreview() {
  return (
    <AppShell
      mode="paper"
      connections={[
        { broker: "Zerodha", state: "connected" },
        { broker: "CoinDCX", state: "login-required" },
      ]}
      footer={
        <>
          <FooterItem label="Node">trading-node-1</FooterItem>
          <FooterItem label="Broker latency">38 ms</FooterItem>
          <FooterItem label="Recorder lag">0</FooterItem>
          <span className="ms-auto">Component preview · demo data · times IST</span>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[28px] font-semibold">Components</h1>
        <p className="text-sm text-ink-muted">Every shared component, rendered with demo data. Pages are built only from these.</p>
      </div>

      <Section title="KPI cards">
        <KpiRow>
          <KpiCard label="Equity" value={formatMoney("1004821.50")} sub="Starting balance ₹10,00,000.00" />
          <KpiCard label="Today’s P&L" value={<PnlText value="4821.50" />} sub={<>Realised <PnlText value="3122.50" /> · Unrealised <PnlText value="1699.00" /></>} />
          <KpiCard label="Premium at risk" value={formatMoney("22593.00")} sub="2 positions · 1 working order" />
          <KpiCard label="Daily loss limit" value="0% used" sub="Limit ₹10,000 · halts trading when hit" meter={{ pct: 2, tone: "gain" }} />
          <KpiCard label="Max drawdown" value="1.8%" sub="Limit 5.0% from peak" meter={{ pct: 36 }} />
        </KpiRow>
      </Section>

      <Section title="Workspace (rail stacks below content under ~1100 px)">
        <Workspace
          main={
            <Panel title="Open positions" count={positions.length} flush actions={<Button variant="outline" className="h-9">Flatten all</Button>}>
              <DataTable columns={columns} rows={positions} rowKey={(p) => p.id} caption="Open option positions" />
            </Panel>
          }
          rail={
            <Panel title="Risk limits">
              <LimitMeter label="Risk per trade" value="0.5% of equity" pct={50} />
              <LimitMeter label="Premium at risk" value="₹22,593 / ₹50,000" pct={45} />
              <LimitMeter label="Lots per expiry" value="2 / 6" pct={33} />
              <LimitMeter label="Orders per second" value="1 / 10" pct={10} tone="gain" />
            </Panel>
          }
        />
      </Section>

      <Section title="Pills, status and P&L">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            <SidePill side="long" />
            <SidePill side="short" />
            <SidePill side="buy" />
            <SidePill side="sell" />
            <StatusPill tone="info">Completed</StatusPill>
            <StatusPill>Queued</StatusPill>
            <StatusPill tone="warning">Paused · RBI policy window</StatusPill>
            <StatusPill tone="danger">Failed: no data for 2026-03-12</StatusPill>
            <StatusDot state="ok">Running</StatusDot>
            <StatusDot state="paused">Paused</StatusDot>
            <StatusDot state="down">Disconnected</StatusDot>
            <ModeBadge mode="sandbox" />
            <ModeBadge mode="paper" />
            <ModeBadge mode="live" />
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <PnlText value="2010.00" />
            <PnlText value="-311.00" />
            <PnlText value="0" />
            <PnlText value="0.48" percent />
            <PnlText value="-1.20" percent />
            <PnlText value="152.75" currency="USDT" />
          </div>
          <div className="flex max-w-md flex-col gap-2">
            <Meter value={64} label="Backtest progress" />
            <Meter value={90} label="Exposure near cap" tone="loss" />
          </div>
        </Panel>
      </Section>

      <Section title="Empty and loading states">
        <div className="grid gap-5 md:grid-cols-2">
          <Panel title="Working orders" count={0} flush>
            <EmptyState title="No working orders" hint="Orders placed by strategies appear here until they fill or are cancelled." />
          </Panel>
          <Panel title="Trades" flush>
            <TableSkeleton rows={4} />
            <div className="px-5 pb-5">
              <Skeleton className="h-24 w-full bg-surface" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section title="Dangerous actions (confirm with a reason)">
        <Panel>
          <DemoActions />
          <p className="text-sm text-ink-muted">The kill switch in the top bar uses the same dialog and also asks you to type FLATTEN.</p>
        </Panel>
      </Section>
    </AppShell>
  );
}

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { DataTable } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { KpiCard } from "@/components/data/kpi-card";
import { Meter } from "@/components/data/meter";
import { SidePill } from "@/components/data/pills";
import { PnlText } from "@/components/data/pnl-text";
import { ModeBadge } from "@/components/shell/status-bits";

describe("data components", () => {
  it("PnlText shows the sign and tone, not colour alone", () => {
    render(
      <>
        <PnlText value="-311.00" />
        <PnlText value="2010" />
      </>,
    );
    expect(screen.getByText("−₹311.00")).toHaveClass("text-loss");
    expect(screen.getByText("+₹2,010.00")).toHaveClass("text-gain");
  });

  it("Meter exposes its value to assistive tech and clamps it", () => {
    render(<Meter value={140} label="Exposure" />);
    const meter = screen.getByRole("meter", { name: "Exposure" });
    expect(meter).toHaveAttribute("aria-valuenow", "100");
  });

  it("KpiCard renders label, value, sub and meter", () => {
    render(<KpiCard label="Daily loss limit" value="12% used" sub="Limit ₹10,000" meter={{ pct: 12 }} />);
    expect(screen.getByText("12% used")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Daily loss limit" })).toHaveAttribute("aria-valuenow", "12");
  });

  it("SidePill spells the side out", () => {
    render(<SidePill side="short" />);
    expect(screen.getByText("Short")).toBeInTheDocument();
  });

  it("ModeBadge makes LIVE unmistakable", () => {
    render(<ModeBadge mode="live" />);
    expect(screen.getByText(/live money/i)).toHaveClass("bg-loss");
  });

  it("DataTable renders rows, or the empty state when there are none", () => {
    const columns = [{ key: "a", header: "Contract", cell: (r: { id: string }) => r.id }];
    const { rerender } = render(<DataTable columns={columns} rows={[{ id: "NIFTY 24500 CE" }]} rowKey={(r) => r.id} />);
    expect(screen.getByRole("columnheader", { name: "Contract" })).toBeInTheDocument();
    expect(screen.getByText("NIFTY 24500 CE")).toBeInTheDocument();
    rerender(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} empty={<EmptyState title="Nothing open" />} />);
    expect(screen.getByText("Nothing open")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("requires a reason and the confirm word before sending", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmDialog
        trigger={<button type="button">Kill switch</button>}
        title="Stop all trading?"
        description="Flattens everything."
        confirmLabel="Flatten and halt"
        confirmWord="FLATTEN"
        danger
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Kill switch" }));
    const send = await screen.findByRole("button", { name: "Flatten and halt" });
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText(/reason/i), "Exchange outage");
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText(/to confirm/i), "FLATTEN");
    expect(send).toBeEnabled();
    await user.click(send);
    expect(onConfirm).toHaveBeenCalledWith("Exchange outage");
  });

  it("shows the error and stays open when the command fails", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<button type="button">Close</button>}
        title="Close position?"
        description="Demo"
        confirmLabel="Close position"
        onConfirm={() => Promise.reject(new Error("Node did not acknowledge"))}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.type(await screen.findByLabelText(/reason/i), "Target hit early");
    await user.click(screen.getByRole("button", { name: "Close position" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Node did not acknowledge");
  });
});

"use client";

import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { Button } from "@/components/ui/button";

/** Demo confirm dialogs for the preview page. Nothing is sent. */
export function DemoActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <ConfirmDialog
        trigger={<Button variant="outline" className="h-10">Close position</Button>}
        title="Close NIFTY 27 Oct 24500 CE?"
        description="Sells 2 lots (150 qty) with a limit order at the best bid. Demo: nothing is sent."
        confirmLabel="Close position"
        onConfirm={async () => {}}
      />
      <ConfirmDialog
        trigger={<Button className="h-10">Pause strategy</Button>}
        title="Pause ORB Breakout?"
        description="No new entries; open positions keep their stops and targets. Demo: nothing is sent."
        confirmLabel="Pause"
        onConfirm={async () => {}}
      />
    </div>
  );
}

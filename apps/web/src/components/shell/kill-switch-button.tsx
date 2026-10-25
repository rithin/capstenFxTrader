"use client";

import { Power } from "lucide-react";

import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { Button } from "@/components/ui/button";

type KillSwitchButtonProps = {
  /** Sends the kill_switch command (wired in M9.7). Without it the dialog explains it isn't connected yet. */
  onConfirm?: (reason: string) => Promise<void>;
};

/** Always visible in the top bar: flatten every position and halt trading. */
export function KillSwitchButton({ onConfirm }: KillSwitchButtonProps) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="outline"
          className="h-10 gap-2 border-[1.5px] border-loss bg-panel px-4 font-semibold text-loss-strong hover:bg-loss-bg hover:text-loss-strong"
        >
          <Power aria-hidden="true" />
          Kill switch
        </Button>
      }
      title="Stop all trading?"
      description="Cancels every working order, closes every open position at the best available price and halts all strategies. Trading stays halted until someone resets it."
      confirmLabel="Flatten and halt"
      confirmWord="FLATTEN"
      danger
      onConfirm={
        onConfirm ??
        (async () => {
          throw new Error("Not connected to the trading node yet (wired in M9.7).");
        })
      }
    />
  );
}

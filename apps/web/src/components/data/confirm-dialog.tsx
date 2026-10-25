"use client";

import { type ReactElement, type ReactNode, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConfirmDialogProps = {
  /** The element that opens the dialog (rendered as the trigger). */
  trigger: ReactElement;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Extra safety: the user must type this word exactly, e.g. "FLATTEN". */
  confirmWord?: string;
  danger?: boolean;
  /** Called with the typed reason. Reject to show the error in the dialog. */
  onConfirm: (reason: string) => Promise<void> | void;
};

/** Every dangerous action goes through this: a mandatory reason, optionally a typed confirm word. */
export function ConfirmDialog({ trigger, title, description, confirmLabel, confirmWord, danger, onConfirm }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonId = useId();
  const wordId = useId();

  const ready = reason.trim().length >= 3 && (!confirmWord || word === confirmWord) && !busy;

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setReason("");
      setWord("");
      setError(null);
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      reset(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The command failed.");
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="text-ink-muted">{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={reasonId}>Reason (required)</Label>
            <Input
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. RBI policy announcement"
              autoComplete="off"
              className="h-10"
            />
          </div>
          {confirmWord && (
            <div className="grid gap-1.5">
              <Label htmlFor={wordId}>
                Type <span className="num font-semibold">{confirmWord}</span> to confirm
              </Label>
              <Input id={wordId} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" className="num h-10" />
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-loss-strong">
              {error}
            </p>
          )}
          <DialogFooter className="bg-surface/60">
            <Button type="button" variant="outline" className="h-10" onClick={() => reset(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!ready}
              className={danger ? "h-10 bg-loss text-panel hover:bg-loss-strong" : "h-10"}
            >
              {busy ? "Sending…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

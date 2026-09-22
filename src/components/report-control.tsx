import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReportKind, ReportReason } from "@/lib/command-seed";
import { useForge } from "@/lib/store";
import { cn } from "@/lib/utils";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "scam", label: "Scam" },
  { id: "fake-call", label: "Fake call" },
  { id: "harassment", label: "Harassment" },
  { id: "impersonation", label: "Impersonation" },
  { id: "unsafe", label: "Unsafe" },
];

export function ReportControl({
  kind,
  targetId,
  target,
}: {
  kind: ReportKind;
  targetId: string;
  target: string;
}) {
  const fileReport = useForge((s) => s.fileReport);
  const youId = useForge((s) => s.youId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");

  if (targetId === youId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-muted-foreground hover:text-brick"
      >
        Report
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-5">
          <DialogHeader>
            <DialogTitle>Report to the desk</DialogTitle>
            <DialogDescription>
              A person on the desk reads this. Not an algorithm. {target}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  reason === r.id ? "bg-ink text-cream" : "bg-canvas text-muted-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            className="mt-4"
            variant="ink"
            onClick={() => {
              fileReport({ kind, targetId, target, reason, risk: "review", by: youId });
              toast("On the desk queue.");
              setOpen(false);
            }}
          >
            Send to the desk
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

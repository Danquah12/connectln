import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const HOUSE_NAME = "Expedite Consults LLC";
export const HOUSE = "EXPEDITE CONSULTS LLC";

export function stripHouse(raw?: string | null) {
  const t = (raw ?? "")
    .replace(/Expedite Consults LLC[.:]?\s*/gi, "")
    .replace(/^EXPEDITE CONSULTS LLC[.:]?\s*/gi, "")
    .replace(/^\.\s*/, "")
    .trim();
  return t;
}

export function workSerial(id?: string) {
  const raw = (id ?? "work").replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  return `CLN-${raw.padEnd(4, "0")}`;
}

export function HouseBar({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "bg-ink px-3 py-1.5 text-right text-[10px] font-medium tracking-[0.16em] text-cream",
        className,
      )}
    >
      {HOUSE}
    </p>
  );
}

export function WorkFrame({
  children,
  serial,
  stamp = "ConnectLn · work",
  portrait = false,
  className,
  wellClassName,
}: {
  children: ReactNode;
  serial?: string;
  stamp?: string;
  portrait?: boolean;
  className?: string;
  wellClassName?: string;
}) {
  return (
    <figure className={cn("work-frame", className)}>
      <span aria-hidden className="work-tick work-tick-tl" />
      <span aria-hidden className="work-tick work-tick-tr" />
      <span aria-hidden className="work-tick work-tick-bl" />
      <span aria-hidden className="work-tick work-tick-br" />
      <div className={cn("work-frame-well", portrait ? "aspect-[9/16]" : "aspect-video", wellClassName)}>
        {children}
      </div>
      <figcaption className="work-frame-plate">
        <span className="work-frame-serial">{serial ?? "CLN-WORK"}</span>
        <span className="truncate">{stamp}</span>
      </figcaption>
    </figure>
  );
}

export function ReelStage({
  children,
  serial,
  stamp = "Proof of work",
  className,
  wellClassName,
}: {
  children: ReactNode;
  serial?: string;
  stamp?: string;
  className?: string;
  wellClassName?: string;
}) {
  return (
    <figure className={cn("reel-stage", className)}>
      <span aria-hidden className="work-tick work-tick-tl" />
      <span aria-hidden className="work-tick work-tick-tr" />
      <span aria-hidden className="work-tick work-tick-bl" />
      <span aria-hidden className="work-tick work-tick-br" />
      <div className={cn("reel-stage-well aspect-[9/16]", wellClassName)}>{children}</div>
      <figcaption className="work-frame-plate">
        <span className="work-frame-serial">{serial ?? "CLN-REEL"}</span>
        <span className="truncate">{stamp}</span>
      </figcaption>
    </figure>
  );
}

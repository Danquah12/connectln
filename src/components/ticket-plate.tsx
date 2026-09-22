import { boardResultLabel } from "@/lib/boards";
import { ticketStatus, ticketStatusLabel } from "@/lib/format";
import { isOshaTicket, oshaCourseLabel } from "@/lib/osha";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

export function TicketPlate({ ticket }: { ticket: Ticket }) {
  const status = ticketStatus(ticket);
  const verify = ticket.verify ?? "verified";
  const osha = isOshaTicket(ticket);

  return (
    <div
      className={cn(
        "ticket-plate flex min-w-[10.5rem] flex-col gap-1 rounded-lg px-3 py-2.5",
        status === "soon" && "ring-1 ring-warn/50",
        status === "stale" && "ring-1 ring-warn/50",
        status === "lapsed" && "ring-1 ring-brick/55",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {ticket.issuer}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium tracking-wide uppercase",
            verify === "verified" && "text-ok",
            verify === "pending" && "text-warn",
            verify === "unverified" && "text-muted-foreground",
          )}
        >
          {verify}
        </span>
      </div>
      <span className="text-sm font-medium text-ink">{ticket.name}</span>
      {osha && ticket.osha ? (
        <span className="text-[11px] text-muted-foreground">{oshaCourseLabel(ticket.osha)}</span>
      ) : null}
      {ticket.number ? (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{ticket.number}</span>
      ) : null}
      {ticket.osha?.trainer ? (
        <span className="text-[11px] text-muted-foreground">Trainer {ticket.osha.trainer}</span>
      ) : null}
      {ticket.osha?.ato ? (
        <span className="truncate text-[11px] text-muted-foreground">{ticket.osha.ato}</span>
      ) : null}
      {ticket.issued && !osha ? (
        <span className="text-[11px] text-muted-foreground">Issued {ticket.issued.slice(0, 7)}</span>
      ) : null}
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          status === "lapsed" && "font-medium text-brick",
          (status === "soon" || status === "stale") && "font-medium text-warn",
          status !== "lapsed" && status !== "soon" && status !== "stale" && "text-muted-foreground",
        )}
      >
        {ticketStatusLabel(ticket)}
      </span>
      {ticket.source ? (
        <span
          className={cn(
            "text-[10px] tracking-wide uppercase",
            (ticket.source.result === "match" || ticket.source.result === "stale") && "text-ok",
            ticket.source.result === "no-record" && "text-brick",
            ticket.source.result !== "match" &&
              ticket.source.result !== "stale" &&
              ticket.source.result !== "no-record" &&
              "text-muted-foreground",
          )}
        >
          {ticket.source.board} · {boardResultLabel(ticket.source.result)}
        </span>
      ) : null}
      {ticket.document ? (
        <span className="truncate text-[10px] text-muted-foreground">{ticket.document}</span>
      ) : null}
    </div>
  );
}

export function TicketMark({ ticket }: { ticket: Ticket }) {
  const status = ticketStatus(ticket);
  const verify = ticket.verify ?? "verified";
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-[11rem] items-center truncate rounded-full bg-canvas px-2 text-[11px]",
        status === "lapsed" && "text-brick",
        status === "soon" && "text-warn",
        verify === "verified" && status === "active" && "text-ok",
        verify !== "verified" && status !== "lapsed" && "text-muted-foreground",
      )}
    >
      {ticket.name}
      {status === "lapsed" ? " · lapsed" : verify === "verified" ? "" : ` · ${verify}`}
    </span>
  );
}

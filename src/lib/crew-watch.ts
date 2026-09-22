import { ticketStatus, ticketStatusLabel } from "./format";
import { matchTickets, type TicketHit } from "./fit";
import type { CrewCall, Person, Ticket } from "./types";

export type WatchRow = {
  callId: string;
  callTitle: string;
  person: Person;
  required: string;
  status: TicketHit;
  label: string;
  ticket?: Ticket;
};

export function crewWatch(input: {
  youId: string;
  calls: CrewCall[];
  people: Person[];
  hires: Record<string, string[]>;
}): WatchRow[] {
  const { youId, calls, people, hires } = input;
  const out: WatchRow[] = [];
  for (const call of calls) {
    if (call.postedBy !== youId) continue;
    const ids = hires[call.id] ?? [];
    for (const id of ids) {
      const person = people.find((p) => p.id === id);
      if (!person) continue;
      for (const row of matchTickets(person, call)) {
        if (row.status === "have" || row.status === "missing") continue;
        out.push({
          callId: call.id,
          callTitle: call.title,
          person,
          required: row.required,
          status: row.status,
          label: row.ticket ? ticketStatusLabel(row.ticket) : row.status,
          ticket: row.ticket,
        });
      }
    }
  }
  return out.sort((a, b) => {
    const rank = { lapsed: 0, unverified: 1, soon: 2, missing: 3, have: 4 };
    return rank[a.status] - rank[b.status];
  });
}

export function nextCallFails(person: Person) {
  return person.tickets.filter((t) => {
    const s = ticketStatus(t);
    return s === "lapsed" || s === "soon" || s === "stale" || t.verify === "unverified" || t.verify === "pending";
  });
}

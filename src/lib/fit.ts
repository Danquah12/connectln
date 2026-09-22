import { ticketStatus } from "./format";
import { isOshaStudent } from "./osha";
import type { CrewCall, Person, Ticket, Vouch } from "./types";

export type TicketHit =
  | "have"
  | "soon"
  | "missing"
  | "lapsed"
  | "unverified";

export type TicketMatch = {
  required: string;
  status: TicketHit;
  ticket?: Ticket;
};

function namesMatch(have: string, need: string) {
  const a = have.toLowerCase().replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
  const b = need.toLowerCase().replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
  if (a === b) return true;
  if (/master electrician/.test(a) && /journeyman electrician/.test(b)) return true;
  if (a.includes(b) || b.includes(a)) {
    const na: string[] = a.match(/\d+/g) ?? [];
    const nb: string[] = b.match(/\d+/g) ?? [];
    if (nb.length && !nb.every((n) => na.includes(n))) return false;
    return true;
  }
  return false;
}

function coveringTicket(person: Person, required: string) {
  return person.tickets.find((t) => namesMatch(t.name, required));
}

export function matchTickets(person: Person, call: CrewCall): TicketMatch[] {
  return call.tickets.map((required) => {
    const ticket = coveringTicket(person, required);
    if (!ticket) return { required, status: "missing" as const };
    const life = ticketStatus(ticket);
    if (life === "lapsed") return { required, status: "lapsed" as const, ticket };
    if (life === "stale" && isOshaStudent(ticket)) {
      if ((ticket.verify ?? "verified") === "unverified" || ticket.verify === "pending") {
        return { required, status: "unverified" as const, ticket };
      }
      return { required, status: "soon" as const, ticket };
    }
    if ((ticket.verify ?? "verified") === "unverified" || ticket.verify === "pending") {
      return { required, status: "unverified" as const, ticket };
    }
    if (life === "soon") return { required, status: "soon" as const, ticket };
    return { required, status: "have" as const, ticket };
  });
}

export function fitScore(person: Person, call: CrewCall, vouches: Vouch[] = []) {
  const rows = matchTickets(person, call);
  const have = rows.filter((r) => r.status === "have" || r.status === "soon").map((r) => r.required);
  const missing = rows.filter((r) => r.status === "missing").map((r) => r.required);
  const failed = rows.filter((r) => r.status === "lapsed" || r.status === "missing");
  const unverified = rows.filter((r) => r.status === "unverified").map((r) => r.required);
  const tradeMatch = person.trade === call.trade;
  const trade = tradeMatch ? 28 : 0;
  const avail =
    person.availability === "open" ? 16 : person.availability === "on-job" ? 6 : 0;
  const cred = call.tickets.length
    ? Math.round((have.length / call.tickets.length) * 36)
    : 28;
  const recs = vouches.filter((v) => v.toId === person.id).length;
  const vouchPts = Math.min(12, recs * 4);
  const city = person.city === call.city ? 8 : person.state === call.state ? 4 : 0;
  const penalty = failed.length * 14 + unverified.length * 6;
  const score = Math.max(0, Math.min(99, trade + avail + cred + vouchPts + city - penalty));
  const blocked = failed.length > 0 || !tradeMatch;
  const hireBlocked = blocked || unverified.length > 0;
  const reason = !tradeMatch
    ? `This call is ${call.trade}.`
    : failed[0]?.status === "lapsed"
      ? `${failed[0].required} is lapsed.`
      : failed[0]
        ? `Missing ${failed[0].required}.`
        : unverified[0]
          ? `${unverified[0]} is not verified. Shop can cover Ticket check ($12).`
          : undefined;
  return {
    score,
    have,
    missing,
    failed: failed.map((f) => f.required),
    unverified,
    rows,
    tradeMatch,
    blocked,
    hireBlocked,
    reason,
    vouches: recs,
    city: person.city === call.city,
  };
}

export function rankHands(
  ids: string[],
  people: Person[],
  call: CrewCall,
  vouches: Vouch[],
) {
  return ids
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))
    .map((person) => ({ person, fit: fitScore(person, call, vouches) }))
    .sort((a, b) => {
      if (a.fit.blocked !== b.fit.blocked) return a.fit.blocked ? 1 : -1;
      if (a.fit.hireBlocked !== b.fit.hireBlocked) return a.fit.hireBlocked ? 1 : -1;
      return b.fit.score - a.fit.score;
    });
}

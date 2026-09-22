import { isExample } from "./example";
import { ticketStatus } from "./format";
import type { Person, Vouch } from "./types";

export type TrustTier = "unverified" | "basic" | "verified" | "professional" | "trusted" | "elite";

export function cardGrounded(person: Person, vouches: Vouch[]) {
  if (isExample(person)) return true;
  const rec = vouches.some((v) => v.toId === person.id);
  const numbered = person.tickets.some((t) => Boolean(t.number?.trim()) || Boolean(t.document));
  return rec || numbered;
}

export function trustTier(person: Person, vouches: Vouch[]): TrustTier {
  if (!cardGrounded(person, vouches) && !person.deskVerified) return "unverified";
  const rec = vouches.filter((v) => v.toId === person.id).length;
  const verifiedTickets = person.tickets.filter((t) => (t.verify ?? "verified") === "verified").length;
  const jobs = person.history.filter((h) => h.verified).length;
  if (person.years >= 15 && rec >= 3 && verifiedTickets >= 3) return "elite";
  if (verifiedTickets >= 2 && rec >= 1 && jobs >= 1) return "trusted";
  if (verifiedTickets >= 1) return "professional";
  if (person.deskVerified || person.tickets.length) return "verified";
  return "basic";
}

export function trustLabel(t: TrustTier) {
  return {
    unverified: "Unverified · new card",
    basic: "Basic · email",
    verified: "Verified · identity",
    professional: "Professional · tickets",
    trusted: "Trusted · work + vouches",
    elite: "Elite · long record",
  }[t];
}

export function fraudFlags(person: Person) {
  const flags: string[] = [];
  const names = person.tickets.map((t) => t.name.toLowerCase());
  if (names.some((n) => n.includes("master")) && !person.tickets.some((t) => t.number)) {
    flags.push("Master ticket with no license number on file");
  }
  if (person.level === "Master" && person.history.length === 0) {
    flags.push("Master rank, no jobsites");
  }
  if (person.tickets.some((t) => ticketStatus(t) === "lapsed" && (t.verify ?? "verified") === "verified")) {
    flags.push("Lapsed ticket still marked verified");
  }
  return flags;
}

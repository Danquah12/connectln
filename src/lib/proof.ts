import type { Person, Vouch } from "./types";

export function proofOf(person: Person, vouches: Vouch[]) {
  const rec = vouches.filter((v) => v.toId === person.id);
  return {
    years: person.years,
    jobs: person.history.length,
    vouches: rec.length,
    tickets: person.tickets.filter((t) => (t.verify ?? "verified") !== "unverified").length,
    miles: person.travelMiles,
    open: person.availability === "open",
  };
}

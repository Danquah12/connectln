import { ticketStatus } from "./format";
import type { Person, Vouch } from "./types";

export type Reputation = {
  overall: number;
  credentials: number;
  experience: number;
  vouches: number;
  work: number;
  reliability: number;
};

export function reputation(person: Person, vouches: Vouch[]): Reputation {
  const received = vouches.filter((v) => v.toId === person.id);
  const tickets = person.tickets;
  const verified = tickets.filter((t) => (t.verify ?? "verified") === "verified").length;
  const lapsed = tickets.filter((t) => ticketStatus(t) === "lapsed").length;
  const soon = tickets.filter((t) => ticketStatus(t) === "soon").length;

  const credentials = tickets.length
    ? Math.round((verified / tickets.length) * 100 - lapsed * 8 - soon * 2)
    : 55;
  const experience = Math.round(Math.min(person.years / 20, 1) * 100);
  const vouchesScore = Math.round(Math.min(received.length * 14, 100));
  const work = Math.round(Math.min(person.history.length * 22, 100));
  const reliabilityBase =
    person.availability === "open"
      ? 92
      : person.availability === "on-job"
        ? 88
        : person.availability === "booked"
          ? 80
          : 70;
  const reliability = Math.max(40, reliabilityBase - lapsed * 10);

  const clamp = (n: number) => Math.max(40, Math.min(99, n));
  const credentialsC = clamp(credentials);
  const experienceC = clamp(experience);
  const vouchesC = clamp(vouchesScore);
  const workC = clamp(work);
  const reliabilityC = clamp(reliability);
  const overall = Math.round(
    credentialsC * 0.24 +
      experienceC * 0.18 +
      vouchesC * 0.24 +
      workC * 0.18 +
      reliabilityC * 0.16,
  );

  return {
    overall,
    credentials: credentialsC,
    experience: experienceC,
    vouches: vouchesC,
    work: workC,
    reliability: reliabilityC,
  };
}

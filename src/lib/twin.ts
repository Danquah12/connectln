import { nextCredentials } from "./recommend";
import { hiddenOpps, marketFor } from "./xp";
import type { Person, Vouch } from "./types";

export function twinAnswer(person: Person, vouches: Vouch[], q: string) {
  const rec = vouches.filter((v) => v.toId === person.id).length;
  const next = nextCredentials(person);
  const market = marketFor(person);
  const hidden = hiddenOpps(person);
  const key = q.toLowerCase();
  if (key.includes("job") || key.includes("qualif")) {
    return `${person.trade} work matching ${person.tickets.map((t) => t.name).slice(0, 2).join(" and ")}. ${rec} people will vouch. Availability: ${person.availability}. ${hidden[0]?.title ?? "Lead work"} is a lane most boards miss.`;
  }
  if (key.includes("cert") || key.includes("next")) {
    return `Next tickets that actually move the rate: ${next.join("; ")}.`;
  }
  if (key.includes("interview") || key.includes("not getting")) {
    return rec < 2
      ? "Too few vouches from people who were on the same job. That is the gap, not the resume verbs."
      : `Vouches are there. The card still needs ${next[0] ?? "a current ticket"}. Shops filter on that before they call.`;
  }
  if (key.includes("earn") || key.includes("pay") || key.includes("value")) {
    return `Market for ${person.trade} here runs $${market.low}–$${market.high}/hr. Your credentials sit near $${market.you}/hr. ${next[0] ?? "A lead ticket"} is the next dollar.`;
  }
  return `You are a ${person.level.toLowerCase()} ${person.trade.toLowerCase()} in ${person.city}. ${person.tickets.length} tickets, ${rec} vouches, ${person.history.length} jobs on the card. Ask what you qualify for, what to get next, or what would raise the rate.`;
}

export const TWIN_PROMPTS = [
  "What jobs am I qualified for?",
  "What certification should I get next?",
  "Why am I not getting interviews?",
  "What would increase my earning potential?",
];

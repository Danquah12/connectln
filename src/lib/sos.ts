import { fitScore } from "./fit";
import type { CrewCall, Person, Vouch } from "./types";

export type SosTier = "go" | "standby";

export type SosRow = {
  person: Person;
  call: CrewCall;
  tier: SosTier;
  score: number;
  why: string;
};

function milesOk(person: Person, call: CrewCall) {
  if (person.city === call.city) return true;
  if (person.state === call.state && person.travelMiles >= 25) return true;
  return person.travelMiles >= 50;
}

/** Rank who can take an SOS call now. GO first, then standby. Never list a fail. */
export function triageSos(
  call: CrewCall,
  people: Person[],
  vouches: Vouch[],
  hired: string[],
): SosRow[] {
  if (!call.urgent) return [];
  const taken = new Set(hired);
  const out: SosRow[] = [];
  for (const person of people) {
    if (taken.has(person.id)) continue;
    if (person.id === call.postedBy) continue;
    const fit = fitScore(person, call, vouches);
    if (!fit.tradeMatch || fit.blocked) continue;
    const open = person.availability === "open";
    const near = milesOk(person, call);
    if (open && near && fit.missing.length === 0 && fit.unverified.length === 0) {
      out.push({
        person,
        call,
        tier: "go",
        score: fit.score + (person.city === call.city ? 8 : 0) + Math.min(12, fit.vouches * 4),
        why: person.city === call.city ? "Open · this city · tickets hold" : "Open · in range · tickets hold",
      });
      continue;
    }
    if ((open || person.availability === "on-job") && fit.missing.length <= 1) {
      out.push({
        person,
        call,
        tier: "standby",
        score: fit.score,
        why: !open
          ? "On a job — standby if they can peel"
          : fit.missing[0]
            ? `Open · missing ${fit.missing[0]}`
            : "Open · farther out",
      });
    }
  }
  return out.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "go" ? -1 : 1;
    return b.score - a.score;
  });
}

export type SwapCheck = { ok: boolean; why: string };

/** Two shift calls can swap if both people qualify for the other's seat. */
export function canShiftSwap(
  from: Person,
  to: Person,
  fromCall: CrewCall,
  toCall: CrewCall,
  vouches: Vouch[],
): SwapCheck {
  if (from.id === to.id) return { ok: false, why: "Same person." };
  if (!fromCall.shift || !toCall.shift) return { ok: false, why: "Both seats have to be shifts." };
  if (fromCall.trade !== toCall.trade) return { ok: false, why: "Same calling only." };
  const a = fitScore(from, toCall, vouches);
  const b = fitScore(to, fromCall, vouches);
  if (a.blocked) return { ok: false, why: `${from.name} fails ${toCall.title}. ${a.reason ?? ""}`.trim() };
  if (b.blocked) return { ok: false, why: `${to.name} fails ${fromCall.title}. ${b.reason ?? ""}`.trim() };
  return { ok: true, why: "Tickets hold on both seats." };
}

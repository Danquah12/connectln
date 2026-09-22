import { skillDna } from "./dna";
import { fitScore } from "./fit";
import { nextCredentials } from "./recommend";
import { hiddenOpps } from "./xp";
import type { CrewCall, Person, Post, Vouch } from "./types";

export type IntelKind = "call" | "person" | "lane" | "ticket" | "mentor";

export type IntelItem = {
  id: string;
  kind: IntelKind;
  title: string;
  why: string;
  href: string;
  score: number;
  personId?: string;
  have?: string[];
  missing?: string[];
};

function sitesOf(p: Person) {
  return new Set(p.history.map((h) => h.name.toLowerCase()));
}

function ticketsOf(p: Person) {
  return p.tickets.map((t) => t.name.toLowerCase());
}

function sharedSites(a: Person, b: Person) {
  const sa = sitesOf(a);
  return b.history.filter((h) => sa.has(h.name.toLowerCase())).map((h) => h.name);
}

function sharedTickets(a: Person, b: Person) {
  const ta = ticketsOf(a);
  return b.tickets
    .map((t) => t.name)
    .filter((n) => ta.some((x) => x.includes(n.toLowerCase().slice(0, 6)) || n.toLowerCase().includes(x.slice(0, 6))));
}

export function dnaAdjacent(a: Person, b: Person) {
  if (a.id === b.id) return false;
  if (a.trade === b.trade) return true;
  const pair = `${a.trade}:${b.trade}`;
  const ok = new Set([
    "Electrician:HVAC",
    "HVAC:Electrician",
    "Electrician:Solar",
    "Solar:Electrician",
    "Nurse:Physician",
    "Physician:Nurse",
    "Nurse:Pharmacist",
    "Pharmacist:Nurse",
    "Teacher:Faculty",
    "Faculty:Teacher",
    "Developer:Electrician",
    "Electrician:Developer",
  ]);
  if (ok.has(pair)) return true;
  if (a.veteran && b.veteran) return true;
  return false;
}

function coworkerIds(p: Person) {
  return new Set(p.history.flatMap((h) => h.teamIds ?? []));
}

export function forYou(input: {
  you: Person;
  people: Person[];
  calls: CrewCall[];
  vouches: Vouch[];
  appliedCallIds: string[];
}): IntelItem[] {
  const { you, people, calls, vouches, appliedCallIds } = input;
  const out: IntelItem[] = [];
  const youCrew = coworkerIds(you);

  for (const p of people) {
    if (p.id === you.id) continue;
    let score = 0;
    const reasons: string[] = [];
    const sites = sharedSites(you, p);
    if (sites.length) {
      score += 42;
      reasons.push(`Same jobsite: ${sites[0]}.`);
    }
    const tickets = sharedTickets(you, p);
    if (tickets.length) {
      score += 16;
      reasons.push(`Same paper: ${tickets[0]}.`);
    }
    if (p.trade === you.trade) {
      score += 18;
      if (p.city === you.city) {
        score += 12;
        reasons.push(`${p.city} ${p.trade.toLowerCase()}.`);
      } else reasons.push(`Same hall — ${p.trade}.`);
    } else if (dnaAdjacent(you, p)) {
      score += 22;
      reasons.push(`${p.trade} sits next to ${you.trade} on real jobs.`);
    }
    if (you.veteran && p.veteran) {
      score += 16;
      reasons.push(`${p.veteran.mos} after ${you.veteran.mos}.`);
    }
    const overlap = [...youCrew].filter((id) => (p.history.flatMap((h) => h.teamIds ?? [])).includes(id));
    if (overlap.length) {
      score += 20;
      reasons.push("A crew you both stood on.");
    }
    if (p.mentoring && (you.seekingMentor || you.level === "Apprentice")) {
      score += 28;
      reasons.push("Takes apprentices.");
    }
    const rec = vouches.filter((v) => v.toId === p.id).length;
    if (rec >= 2 && p.trade === you.trade) score += 8;
    if (p.availability === "open" && you.availability === "open") score += 4;
    if (score < 28) continue;
    out.push({
      id: `person-${p.id}`,
      kind: p.mentoring && you.seekingMentor ? "mentor" : "person",
      title: p.name,
      why: reasons[0] ?? "The graph puts them next to you.",
      href: `/p/${p.id}`,
      score,
      personId: p.id,
    });
  }

  for (const call of calls) {
    if (appliedCallIds.includes(call.id)) continue;
    const fit = fitScore(you, call);
    let score = fit.score;
    const bits: string[] = [];
    if (fit.tradeMatch) bits.push("Your trade.");
    if (fit.have.length) bits.push(`Have ${fit.have.slice(0, 2).join(", ")}.`);
    if (fit.missing.length === 0) {
      score += 18;
      bits.push("Every ticket on the call is on your card.");
    } else if (fit.blocked) {
      bits.push(fit.reason ?? "A required ticket fails.");
    } else if (fit.missing.length === 1) {
      score += 10;
      bits.push(`Missing ${fit.missing[0]}.`);
    }
    if (call.urgent) score += 12;
    if (call.city === you.city) score += 10;
    if (score < 45) continue;
    out.push({
      id: `call-${call.id}`,
      kind: "call",
      title: call.title,
      why: bits.join(" ") || `${fit.score}% fit.`,
      href: `/work#${call.id}`,
      score,
      have: fit.have,
      missing: fit.missing,
    });
  }

  for (const lane of [...skillDna(you), ...hiddenOpps(you).map((h) => ({
    title: h.title,
    why: `${h.why} ${h.pay}`,
    have: [] as string[],
    need: [] as string[],
  }))]) {
    out.push({
      id: `lane-${lane.title}`,
      kind: "lane",
      title: lane.title,
      why: lane.why,
      href: "/become",
      score: 62,
    });
  }

  const next = nextCredentials(you)[0];
  if (next) {
    out.push({
      id: `ticket-${next}`,
      kind: "ticket",
      title: next,
      why: "The next paper on the wall. Jobs filter this before they read a bio.",
      href: "/wallet",
      score: 58,
    });
  }

  const seen = new Set<IntelKind>();
  const mixed: IntelItem[] = [];
  const sorted = out.sort((a, b) => b.score - a.score);
  const kindCap: Record<IntelKind, number> = { call: 2, person: 2, mentor: 1, lane: 1, ticket: 1 };
  const used: Record<string, number> = {};
  for (const item of sorted) {
    const n = used[item.kind] ?? 0;
    if (n >= kindCap[item.kind]) continue;
    used[item.kind] = n + 1;
    mixed.push(item);
    seen.add(item.kind);
    if (mixed.length >= 5) break;
  }
  return mixed;
}

export function talkRank(post: Post, you: Person, author: Person | undefined) {
  let s = Date.parse(post.createdAt) / 1e8;
  if (!author) return s;
  if (author.id === you.id) s += 8;
  if (author.trade === you.trade) s += 50;
  else if (dnaAdjacent(you, author)) s += 28;
  if (author.city === you.city) s += 12;
  if (sharedSites(you, author).length) s += 24;
  if (author.veteran && you.veteran) s += 10;
  if (post.kind === "safety") s += 6;
  if (post.kind === "call") s += 8;
  return s;
}

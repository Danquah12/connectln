import { DEAL_STAGES, isDealTrade, type DealNote, type DealStage, type LineSession } from "./crm";
import { fitScore } from "./fit";
import type { CrewCall, Person, Vouch } from "./types";

export type BoardMove = {
  id: "hand" | "hire" | "deal" | "follow" | "vouch";
  label: string;
  why: string;
  callId?: string;
  nextStage?: DealStage;
};

export function sharedJobSites(
  you: Person,
  them: Person,
  extra?: { calls: CrewCall[]; callHires: Record<string, string[]> },
) {
  const names = new Set<string>();
  for (const h of you.history) {
    if (h.teamIds?.includes(them.id)) names.add(h.name);
    if (them.history.some((x) => x.name === h.name)) names.add(h.name);
  }
  for (const h of them.history) {
    if (h.teamIds?.includes(you.id)) names.add(h.name);
  }
  if (extra) {
    for (const call of extra.calls) {
      const hired = extra.callHires[call.id] ?? [];
      const shopSide = call.postedBy === you.id && hired.includes(them.id);
      const theirShop = call.postedBy === them.id && hired.includes(you.id);
      const bothHands = hired.includes(you.id) && hired.includes(them.id);
      if (shopSide || theirShop || bothHands) names.add(call.title);
    }
  }
  return [...names];
}

export function owedVouch(input: {
  youId: string;
  themId: string;
  calls: CrewCall[];
  callHires: Record<string, string[]>;
  vouches: Vouch[];
}): CrewCall | null {
  const { youId, themId, calls, callHires, vouches } = input;
  for (const call of calls) {
    if (call.postedBy !== youId) continue;
    if (!(callHires[call.id] ?? []).includes(themId)) continue;
    if (vouches.some((v) => v.fromId === youId && v.toId === themId && v.site === call.title)) continue;
    return call;
  }
  return null;
}

export function owedVouches(input: {
  youId: string;
  people: Person[];
  calls: CrewCall[];
  callHires: Record<string, string[]>;
  vouches: Vouch[];
}): { person: Person; call: CrewCall }[] {
  const { youId, people, calls, callHires, vouches } = input;
  const out: { person: Person; call: CrewCall }[] = [];
  for (const call of calls) {
    if (call.postedBy !== youId) continue;
    for (const id of callHires[call.id] ?? []) {
      if (id === youId) continue;
      if (vouches.some((v) => v.fromId === youId && v.toId === id && v.site === call.title)) continue;
      const person = people.find((p) => p.id === id);
      if (person) out.push({ person, call });
    }
  }
  return out;
}

export function nextDealStage(stage: DealStage): DealStage | null {
  const i = DEAL_STAGES.findIndex((s) => s.id === stage);
  if (i < 0 || i >= DEAL_STAGES.length - 1) return null;
  const next = DEAL_STAGES[i + 1];
  if (next.id === "lost") return null;
  return next.id;
}

export function nextBoardMoves(input: {
  you: Person;
  them: Person;
  calls: CrewCall[];
  vouches: Vouch[];
  shopSeats: string[];
  appliedCallIds: string[];
  callHires: Record<string, string[]>;
  deal?: DealNote;
  session?: LineSession;
}): BoardMove[] {
  const { you, them, calls, vouches, shopSeats, appliedCallIds, callHires, deal, session } = input;
  if (you.id === them.id) return [];
  const open = calls.filter((c) => c.filled < c.spots);
  const out: BoardMove[] = [];
  const job = owedVouch({
    youId: you.id,
    themId: them.id,
    calls,
    callHires,
    vouches,
  });
  if (job)
    out.push({
      id: "vouch",
      label: `Vouch the work · ${job.title}`,
      why: "You hired them. A vouch is the proof, not a like.",
      callId: job.id,
    });
  const hireable = open
    .filter((c) => c.postedBy === you.id && shopSeats.includes(you.id))
    .map((c) => ({ c, fit: fitScore(them, c, vouches) }))
    .filter(({ c, fit }) => !(callHires[c.id] ?? []).includes(them.id) && !fit.blocked)
    .sort((a, b) => b.fit.score - a.fit.score)[0];
  if (hireable) {
    const needCover = hireable.fit.hireBlocked;
    out.push({
      id: "hire",
      label: needCover ? "Cover ticket + hire" : `Hire onto ${hireable.c.title}`,
      why: needCover
        ? `${hireable.c.title} · tickets need a check before hire.`
        : `${hireable.c.title} · fit ${hireable.fit.score}.`,
      callId: hireable.c.id,
    });
  }
  const apply = open
    .filter((c) => c.postedBy === them.id && !appliedCallIds.includes(c.id) && c.postedBy !== you.id)
    .map((c) => ({ c, fit: fitScore(you, c, vouches) }))
    .filter(({ fit }) => !fit.blocked)
    .sort((a, b) => b.fit.score - a.fit.score)[0];
  if (apply)
    out.push({
      id: "hand",
      label: `Raise a hand · ${apply.c.title}`,
      why: `${apply.c.shop} · ${apply.c.city} · fit ${apply.fit.score}.`,
      callId: apply.c.id,
    });
  if (isDealTrade(them.trade) || isDealTrade(you.trade)) {
    const next = nextDealStage(deal?.stage ?? "lead");
    if (next) {
      const label = DEAL_STAGES.find((s) => s.id === next)?.label ?? next;
      out.push({
        id: "deal",
        label: `Advance deal → ${label}`,
        why: deal?.address ? deal.address : `${them.city}, ${them.state}`,
        nextStage: next,
      });
    }
  }
  if (session)
    out.push({
      id: "follow",
      label: "Send follow-up",
      why: session.followSubject,
    });
  return out.slice(0, 4);
}

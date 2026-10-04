import type { CrewCall } from "./types";

/** Synonyms so "job" and "JW" actually hit this board. */
export const CALL_SYNONYMS: Record<string, string[]> = {
  job: ["call", "contract"],
  jobs: ["call", "contract"],
  hiring: ["call", "open"],
  contract: ["call", "travel", "month"],
  contracts: ["call", "travel"],
  gig: ["shift", "weekend"],
  gigs: ["shift", "weekend"],
  rn: ["nurse", "compact"],
  compact: ["nurse", "rn", "license"],
  jw: ["journeyman", "electrician"],
  journeyman: ["jw"],
  osha: ["osha-30", "safety"],
  "11b": ["infantry", "veteran", "army"],
  infantry: ["11b", "veteran"],
  hvac: ["rtu", "nate"],
  weld: ["6g", "pipe"],
  "6g": ["weld", "pipe"],
  hospital: ["micu", "wing"],
  va: ["veteran", "contract", "clearance"],
  teacher: ["classroom", "faculty"],
  locums: ["physician", "hospitalist"],
};

export function tokens(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .split(/[^a-z0-9+]+/g)
    .filter((t) => t.length > 1);
}

export function expand(term: string) {
  const t = term.toLowerCase();
  return [t, ...(CALL_SYNONYMS[t] ?? [])];
}

export type IndexedCall = {
  id: string;
  weights: Map<string, number>;
};

export function indexCalls(calls: CrewCall[]): IndexedCall[] {
  return calls.map((c) => {
    const weights = new Map<string, number>();
    const add = (raw: unknown, w: number) => {
      if (typeof raw !== "string" || !raw.trim()) return;
      for (const t of tokens(raw)) {
        weights.set(t, Math.max(weights.get(t) ?? 0, w));
        for (const syn of CALL_SYNONYMS[t] ?? []) {
          weights.set(syn, Math.max(weights.get(syn) ?? 0, w - 1));
        }
      }
    };
    add(c.title, 5);
    add(c.trade, 6);
    add(c.shop, 3);
    add(c.city, 4);
    add(c.state, 3);
    add(c.rate, 2);
    add(c.duration, 2);
    const ticketList = Array.isArray(c.tickets) ? c.tickets : [];
    for (const t of ticketList) add(String(t), 7);
    add(c.description, 2);
    if (c.urgent) add("urgent sos emergency", 6);
    if (c.shift) add("shift weekend nights", 5);
    if (c.travel) add("travel contract", 5);
    if (c.union) add("union", 3);
    return { id: c.id, weights };
  });
}

export function queryCallIndex(q: string, index: IndexedCall[]) {
  const terms = tokens(q).flatMap(expand);
  return index
    .map((doc) => {
      let score = 0;
      const matched: string[] = [];
      for (const t of terms) {
        const w = doc.weights.get(t);
        if (w) {
          score += w;
          matched.push(t);
        }
      }
      return { id: doc.id, score, matched: [...new Set(matched)] };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

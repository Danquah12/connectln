import { CALL_SYNONYMS } from "./contract-index";
import { TRADES } from "./seed";
import type { CrewCall, Listing, Person } from "./types";

export type Suggestion = {
  term: string;
  why: string;
};

function rows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
export function suggestBoard(
  q: string,
  people: Person[],
  calls: CrewCall[],
  listings: Listing[],
): Suggestion[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 1) return [];
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const push = (term: string, why: string) => {
    const key = term.toLowerCase();
    if (seen.has(key) || !term) return;
    if (!key.includes(needle) && !needle.split(/\s+/).every((t) => key.includes(t))) return;
    seen.add(key);
    out.push({ term, why });
  };

  for (const t of TRADES) push(t, "trade");
  for (const [k, syns] of Object.entries(CALL_SYNONYMS)) {
    push(k, "search");
    for (const s of rows<string>(syns)) push(s, "search");
  }
  for (const p of rows<Person>(people)) {
    push(p.name, "person");
    push(p.city, "city");
    if (p.veteran?.mos) push(p.veteran.mos, "MOS");
    for (const t of rows<{ name?: string }>(p.tickets)) push(t.name ?? "", "ticket");
  }
  for (const c of rows<CrewCall>(calls)) {
    push(c.shop, "shop");
    push(c.city, "city");
    push(c.title, "call");
    for (const t of rows<string>(c.tickets)) push(String(t), "ticket");
  }
  for (const l of rows<Listing>(listings)) push(l.title, "market");

  return out
    .sort((a, b) => {
      const as = a.term.toLowerCase().startsWith(needle) ? 0 : 1;
      const bs = b.term.toLowerCase().startsWith(needle) ? 0 : 1;
      return as - bs || a.term.length - b.term.length;
    })
    .slice(0, 6);
}

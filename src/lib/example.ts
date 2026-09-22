import { calls, people } from "./seed";
import type { CrewCall, Person } from "./types";

const PEOPLE = new Set(people.map((p) => p.id));
const CALLS = new Set(calls.map((c) => c.id));

/** A calling keeps its example cards until this many real members are on the board. */
export const KEEP_EXAMPLES_UNTIL = 3;

export function isExample(person?: { id: string; example?: boolean } | null) {
  if (!person) return false;
  if (person.example === false) return false;
  return person.example === true || PEOPLE.has(person.id);
}

export function isExampleCall(call?: { id: string } | null) {
  if (!call) return false;
  return CALLS.has(call.id);
}

export function hallRoster(list: Person[]): Person[] {
  const live = new Map<string, number>();
  for (const p of list) {
    if (!isExample(p)) live.set(p.trade, (live.get(p.trade) ?? 0) + 1);
  }
  return list.filter(
    (p) => p.book === "mhcc" || !isExample(p) || (live.get(p.trade) ?? 0) < KEEP_EXAMPLES_UNTIL,
  );
}

export function hallCalls(list: CrewCall[]): CrewCall[] {
  const live = new Map<string, number>();
  for (const c of list) {
    if (!isExampleCall(c) && c.filled < c.spots) live.set(c.trade, (live.get(c.trade) ?? 0) + 1);
  }
  return list.filter((c) => !isExampleCall(c) || (live.get(c.trade) ?? 0) < KEEP_EXAMPLES_UNTIL);
}

import { isExample } from "./example";
import { relTime } from "./format";
import type { Person } from "./types";

export type Presence = "online" | "away" | "offline";

const ONLINE_MS = 3 * 60 * 1000;
const AWAY_MS = 15 * 60 * 1000;

/** Stable mix so the example hall isn't a row of grey dots. */
function demoSeen(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  const bucket = n % 5;
  const ago =
    bucket === 0
      ? 40_000
      : bucket === 1
        ? 7 * 60_000
        : bucket === 2
          ? 2 * 3600_000
          : bucket === 3
            ? 26 * 3600_000
            : 4 * 86400_000;
  return Date.now() - ago;
}

export function lastSeenAt(person?: Pick<Person, "id" | "lastSeen" | "example"> | null) {
  if (!person) return undefined;
  if (person.lastSeen) {
    const t = Date.parse(person.lastSeen);
    if (!Number.isNaN(t)) return t;
  }
  if (isExample(person)) return demoSeen(person.id);
  return undefined;
}

export function presenceOf(person?: Pick<Person, "id" | "lastSeen" | "example"> | null): Presence {
  const at = lastSeenAt(person);
  if (at == null) return "offline";
  const age = Date.now() - at;
  if (age <= ONLINE_MS) return "online";
  if (age <= AWAY_MS) return "away";
  return "offline";
}

export function presenceLabel(person?: Pick<Person, "id" | "lastSeen" | "example"> | null) {
  const state = presenceOf(person);
  if (state === "online") return "On the hall";
  if (state === "away") return "Stepped off";
  const at = lastSeenAt(person);
  if (!at) return "Offline";
  return `Last on ${relTime(new Date(at).toISOString())}`;
}

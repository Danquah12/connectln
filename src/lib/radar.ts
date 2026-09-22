import type { Person, Vouch } from "./types";

export type RadarAxis = { id: string; label: string; value: number };

export function radarAxes(person: Person, vouches: Vouch[]): RadarAxis[] {
  const names = person.tickets.map((t) => t.name.toLowerCase()).join(" ");
  const rec = vouches.filter((v) => v.toId === person.id);
  const kinds = rec.flatMap((v) => v.kinds ?? []);
  const count = (k: string) => kinds.filter((x) => x === k).length;
  const clamp = (n: number) => Math.max(35, Math.min(99, Math.round(n)));
  return [
    { id: "trade", label: person.trade, value: clamp(55 + person.years * 3 + (names.length > 20 ? 8 : 0)) },
    { id: "safety", label: "Safety", value: clamp(50 + (names.includes("osha") ? 25 : 0) + count("safety") * 8) },
    { id: "tools", label: "Tools", value: clamp(48 + (person.tools?.length ?? 0) * 8) },
    { id: "code", label: "Code", value: clamp(50 + (names.includes("nfpa") || names.includes("nec") || names.includes("board") ? 22 : 10)) },
    { id: "lead", label: "Leadership", value: clamp(45 + count("leadership") * 12 + (["Foreman", "Owner", "Charge", "Master"].includes(person.level) ? 20 : 0)) },
    { id: "quality", label: "Quality", value: clamp(52 + count("quality") * 10 + rec.length * 4) },
  ];
}

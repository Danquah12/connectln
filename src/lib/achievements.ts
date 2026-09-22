import type { Person, Vouch } from "./types";

export function achievements(person: Person, vouches: Vouch[]) {
  const rec = vouches.filter((v) => v.toId === person.id);
  const names = person.tickets.map((t) => t.name.toLowerCase()).join(" ");
  const out: { id: string; label: string }[] = [];
  if (person.years >= 10) out.push({ id: "10y", label: "10-year professional" });
  if (names.includes("osha 30") || rec.some((v) => v.kinds?.includes("safety")))
    out.push({ id: "safety", label: "Safety lead" });
  if (names.includes("master")) out.push({ id: "master", label: "Master certified" });
  if (person.mentoring) out.push({ id: "mentor", label: "Mentor" });
  if (rec.length >= 3) out.push({ id: "vouched", label: "Top vouched" });
  if (person.veteran) out.push({ id: "vet", label: "Served" });
  if (person.level === "Owner") out.push({ id: "owner", label: "Shop owner" });
  if ((person.history.length ?? 0) >= 3) out.push({ id: "work", label: "Proof of work" });
  return out;
}

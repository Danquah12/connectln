import type { Person, PostKind } from "./types";

export const LINE_LIMIT = 280;

export const LINE_INTENTS: { id: PostKind; label: string; hint: string }[] = [
  { id: "talk", label: "Shop talk", hint: "What you saw on the job. Keep it short." },
  { id: "work", label: "On the tools", hint: "The plate, the weld, the chart. Proof, not a pitch." },
  { id: "call", label: "Looking", hint: "Need two hands. Tickets that hold. Rate on the card." },
  { id: "ask", label: "Ask", hint: "A real question. Someone on the hall has done this." },
  { id: "safety", label: "Safety", hint: "LOTO, PPE, the miss. No heroics." },
  { id: "brief", label: "Brief", hint: "A finding. One paragraph." },
];

export function handleOf(person: Person) {
  const raw = person.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18);
  return raw || person.id.slice(0, 12);
}

export function lineForPerson(person: Person) {
  const ticket = person.tickets[0]?.name ?? person.trade;
  return `@${handleOf(person)} ${person.level} ${person.trade}. ${person.city}. ${ticket} current.`;
}

export function lineStarters(you: Person): { kind: PostKind; text: string }[] {
  const hall = you.trade;
  return [
    { kind: "talk", text: `${hall} here. What's the call this week.` },
    { kind: "call", text: `Need a hand in ${you.city}. Tickets current.` },
    { kind: "work", text: `Posted the plate. Who's run this.` },
  ];
}

/** Send the line outside the hall — OS share sheet, or copy. */
export async function shareOut(body: string, tagged: Person[] = []) {
  let text = body.trim();
  const sorted = [...tagged].sort((a, b) => b.name.length - a.name.length);
  for (const p of sorted) {
    const h = `@${handleOf(p)}`;
    text = text.split(`@${p.name}`).join(h);
    const first = p.name.split(" ")[0];
    if (first) text = text.split(`@${first}`).join(h);
  }
  if (!text.includes("ConnectLn")) text = `${text}\n\n— ConnectLn`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "ConnectLn", text });
      return;
    }
  } catch {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

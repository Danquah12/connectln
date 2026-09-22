import type { HallLetter, Person } from "./types";

export function hallAddress(person: Person | { id: string }) {
  return `${person.id.replace(/-/g, ".")}@hall.connectln`;
}

export const seedMail: HallLetter[] = [
  {
    id: "mail-tomasz-jordan",
    fromId: "tomasz-kowalski",
    toId: "jordan-hale",
    subject: "Aurora hospital TI — tickets",
    body: "Jordan — Hospital TI still needs a journeyman with 70E. Raise a hand if the tickets hold. Tomasz.",
    createdAt: "2026-09-15T15:40:00.000Z",
    read: false,
  },
];

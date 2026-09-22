import type { Person } from "./types";

export function blankPerson(opts: { id: string; name: string }): Person {
  const name = opts.name.trim() || "New member";
  return {
    id: opts.id,
    name,
    trade: "Electrician",
    level: "Apprentice",
    city: "",
    state: "",
    years: 0,
    travelMiles: 50,
    availability: "open",
    bio: "New on the board. Fill the card: tickets, hours, who will vouch.",
    tickets: [],
    history: [],
    photo: "/portraits/member.jpg",
    cover: "/sites/panel.jpg",
    specialties: [],
    example: false,
  };
}

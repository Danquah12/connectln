import { achievements } from "./achievements";
import type { Person, Vouch } from "./types";

export function careerXp(person: Person, vouches: Vouch[], challenges = 0) {
  const rec = vouches.filter((v) => v.toId === person.id).length;
  const xp =
    person.tickets.length * 500 +
    person.history.length * 200 +
    rec * 100 +
    challenges * 300 +
    (person.mentoring ? 150 : 0) +
    person.years * 80;
  const level = Math.min(99, Math.floor(xp / 400) + 1);
  const into = xp % 400;
  const pct = Math.round((into / 400) * 100);
  return { xp, level, pct, badges: achievements(person, vouches) };
}

export function careerDna(person: Person, vouches: Vouch[]) {
  const rec = vouches.filter((v) => v.toId === person.id);
  const names = person.tickets.map((t) => t.name.toLowerCase()).join(" ");
  const clamp = (n: number) => Math.max(40, Math.min(99, Math.round(n)));
  return [
    { id: "field", label: "Field experience", value: clamp(50 + person.years * 4) },
    { id: "tech", label: "Technical skill", value: clamp(55 + person.tickets.length * 6) },
    { id: "lead", label: "Leadership", value: clamp(45 + (["Foreman", "Owner", "Charge", "Master"].includes(person.level) ? 25 : person.years)) },
    { id: "safety", label: "Safety", value: clamp(50 + (names.includes("osha") ? 30 : 8)) },
    { id: "certs", label: "Certifications", value: clamp(40 + person.tickets.length * 10) },
    { id: "talk", label: "Communication", value: clamp(60 + rec.length * 4) },
    { id: "mentor", label: "Mentorship", value: clamp(person.mentoring ? 80 : person.seekingMentor ? 50 : 45) },
  ];
}

export const MARKET: Record<string, { low: number; high: number }> = {
  Electrician: { low: 32, high: 54 },
  Plumber: { low: 30, high: 52 },
  HVAC: { low: 28, high: 48 },
  Welder: { low: 28, high: 48 },
  Carpenter: { low: 26, high: 44 },
  Ironworker: { low: 32, high: 50 },
  Millwright: { low: 34, high: 52 },
  Solar: { low: 22, high: 40 },
  Equipment: { low: 28, high: 46 },
  Elevator: { low: 40, high: 62 },
  Lineman: { low: 42, high: 68 },
  Pipefitter: { low: 32, high: 55 },
  "Sheet metal": { low: 32, high: 56 },
  Mason: { low: 28, high: 48 },
  Roofer: { low: 24, high: 46 },
  "Sprinkler fitter": { low: 32, high: 56 },
  Machinist: { low: 24, high: 46 },
  "Diesel technician": { low: 22, high: 42 },
  Chef: { low: 18, high: 40 },
  "Truck driver": { low: 24, high: 40 },
  Barber: { low: 18, high: 40 },
  Nurse: { low: 38, high: 72 },
  Physician: { low: 120, high: 220 },
  Teacher: { low: 22, high: 42 },
  Faculty: { low: 28, high: 55 },
  Developer: { low: 70, high: 160 },
  Realtor: { low: 40, high: 90 },
  Agent: { low: 28, high: 70 },
  Therapist: { low: 45, high: 95 },
  Dentist: { low: 80, high: 180 },
  Paramedic: { low: 22, high: 42 },
  "Dental hygienist": { low: 36, high: 58 },
  Veterinarian: { low: 70, high: 140 },
  Midwife: { low: 45, high: 85 },
  "Respiratory therapist": { low: 30, high: 52 },
  Firefighter: { low: 22, high: 42 },
  Inspector: { low: 32, high: 58 },
  Appraiser: { low: 40, high: 90 },
  Bookkeeper: { low: 22, high: 42 },
  Pharmacist: { low: 50, high: 85 },
  Advisor: { low: 45, high: 120 },
};

export function marketFor(person: Person) {
  const band = MARKET[person.trade] ?? { low: 25, high: 45 };
  const you = Math.round(band.low + (Math.min(person.years, 20) / 20) * (band.high - band.low));
  return { ...band, you };
}

export function hiddenOpps(person: Person) {
  const specs = person.specialties.join(" ").toLowerCase();
  const tickets = person.tickets.map((t) => t.name.toLowerCase()).join(" ");
  const out: { title: string; why: string; pay: string }[] = [];
  if (person.trade === "Electrician" && (specs.includes("hospital") || tickets.includes("nfpa"))) {
    out.push({
      title: "Building automation technician",
      why: "Hospital electrical + controls overlap. Shops pay for people who can talk to both.",
      pay: "$38–52/hr",
    });
  }
  if (person.trade === "HVAC" || specs.includes("hvac")) {
    out.push({
      title: "Controls / BAS",
      why: "You already start equipment. The next dollar is in the sequence of operations.",
      pay: "$40–55/hr",
    });
  }
  if (person.veteran) {
    out.push({
      title: "Federal / VA contract work",
      why: "MOS and clearance sit on the card. Contracting desks look for that first.",
      pay: "GS / contract rates",
    });
  }
  if (person.trade === "Nurse") {
    out.push({
      title: "Clinical instructor / travel charge",
      why: "Floor years plus a teaching ticket open a different rate than staff nights.",
      pay: "$55–75/hr",
    });
  }
  if (!out.length) {
    out.push({
      title: "Lead on your current ticket",
      why: "Hours and vouches already support the next chair. The missing piece is usually one exam.",
      pay: "Shop scale + lead",
    });
  }
  return out.slice(0, 3);
}

import { availabilityLabel } from "./format";
import { hallAddress } from "./mail";
import type { Person } from "./types";

const AREA: Record<string, string> = {
  CO: "303",
  TX: "713",
  IL: "312",
  OR: "503",
  OH: "216",
  WI: "414",
  PA: "412",
  AZ: "480",
  MO: "816",
  MD: "410",
  NY: "212",
  GA: "404",
  CA: "415",
  IN: "219",
};

function last4(id: string) {
  let n = 0;
  for (const c of id) n = (n * 33 + c.charCodeAt(0)) >>> 0;
  return String(1000 + (n % 9000));
}

export function hallContact(person: Person) {
  const area = AREA[person.state] ?? "555";
  const ext = last4(person.id);
  const email = hallAddress(person);
  const phone = `(${area}) 555-${ext}`;
  const tel = `+1${area}555${ext}`;
  const shopHours =
    person.trade === "Nurse" ||
    person.trade === "Physician" ||
    person.trade === "Pharmacist" ||
    person.trade === "Therapist" ||
    person.trade === "Dentist"
      ? "Text first. The chair and the floor don't do cold calls."
      : person.trade === "Teacher" || person.trade === "Faculty"
        ? "After the bell, weekdays 3–6p."
        : person.trade === "Realtor" || person.trade === "Agent"
          ? "Call or text. Showings run evenings."
          : person.trade === "Advisor"
            ? "Weekdays. Fiduciary hours, not a cold-call desk."
          : "Call 6a–6p on a workday. Text after hours.";
  const start =
    person.availability === "open"
      ? "Can start this week"
      : person.availability === "on-job"
        ? "On a job — ask for the next window"
        : availabilityLabel(person.availability);
  const ask = [
    `Call for ${person.trade.toLowerCase()} work in ${person.city}.`,
    person.rate ? `Rate on the card: ${person.rate}.` : "",
    person.tickets[0] ? `Ticket: ${person.tickets[0].name}.` : "",
    "When can you start?",
  ]
    .filter(Boolean)
    .join(" ");
  return { email, phone, tel, shopHours, start, ask };
}

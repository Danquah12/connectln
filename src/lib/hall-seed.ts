import type { Fund, HallInvite, Meet, Person, Project, Cohort, Trade } from "./types";

export const meets: Meet[] = [
  {
    id: "meet-osha",
    title: "OSHA 30 — weekend",
    place: "Denver JATC",
    when: "Oct 3–4",
    kind: "class",
    trades: ["Electrician", "Plumber", "HVAC", "Welder", "Carpenter", "Ironworker"],
    blurb: "Two days. The card shops actually ask for.",
  },
  {
    id: "meet-aurora",
    title: "Aurora schools night kickoff",
    place: "Apex shop",
    when: "Mon 5:30a",
    kind: "kickoff",
    trades: ["Electrician", "HVAC"],
    blurb: "Occupied wing. Bring the tickets.",
  },
  {
    id: "meet-vet",
    title: "Veteran hiring — trades & care",
    place: "Denver",
    when: "Oct 18",
    kind: "fair",
    blurb: "MOS on the card. Civilian translation at the table.",
  },
  {
    id: "meet-ce-nurse",
    title: "Night-shift CE — compact hours",
    place: "St. Joseph",
    when: "Thu 7p",
    kind: "ce",
    trades: ["Nurse", "Physician", "Pharmacist"],
    blurb: "Four hours that count. Not a webinar you sleep through.",
  },
  {
    id: "meet-pd",
    title: "Saturday PD — classroom that holds",
    place: "DPS East",
    when: "Sat 9a",
    kind: "ce",
    trades: ["Teacher", "Faculty"],
    blurb: "State hours. Bring the cert number.",
  },
  {
    id: "meet-epa",
    title: "EPA 608 — one Saturday",
    place: "Local 208 school",
    when: "Oct 11",
    kind: "class",
    trades: ["HVAC"],
    blurb: "Type II. The card is the ticket.",
  },
  {
    id: "meet-exam",
    title: "Journeyman exam walk-through",
    place: "Local 68",
    when: "Wed 6p",
    kind: "class",
    trades: ["Electrician"],
    blurb: "Third-years. Draw the currents, then stand in front of a motor.",
  },
  {
    id: "meet-drill",
    title: "Mutual-aid drill — power and water",
    place: "Adams County yard",
    when: "Oct 25",
    kind: "drill",
    trades: ["Electrician", "Plumber", "HVAC", "Equipment"],
    blurb: "Disaster list. Tickets current or you sit.",
  },
];

export const funds: Fund[] = [
  {
    id: "fund-gi",
    title: "GI Bill — apprenticeship seat",
    who: "VA + JATC",
    blurb: "Hours count. The MOS is already on the card. Bring the DD-214.",
    kind: "gi-bill",
    trades: ["Electrician", "Plumber", "HVAC", "Welder", "Carpenter", "Ironworker"],
  },
  {
    id: "fund-stipend",
    title: "JATC first-year stipend",
    who: "Local 68",
    blurb: "Tools and the first semester. Not a scholarship brochure.",
    kind: "apprentice",
    trades: ["Electrician"],
  },
  {
    id: "fund-compact",
    title: "Compact license reimbursement",
    who: "Travel pool",
    blurb: "Nurses who compact and take a night block. Receipts, not a tweet.",
    kind: "ce",
    trades: ["Nurse"],
  },
  {
    id: "fund-nbpts",
    title: "National Board stipend",
    who: "DPS",
    blurb: "Teachers sitting the board. The cert is the ticket.",
    kind: "grant",
    trades: ["Teacher", "Faculty"],
  },
  {
    id: "fund-epa",
    title: "EPA 608 exam fee covered",
    who: "Local 208",
    blurb: "If you sit the Saturday class, the shop pays the test.",
    kind: "ce",
    trades: ["HVAC"],
  },
];

export const tradeNews: { trade: Trade | "all"; line: string }[] = [
  { trade: "Electrician", line: "Hospital isolation — shops are asking 517, not a hero story." },
  { trade: "Nurse", line: "Compact hours due before the next travel block." },
  { trade: "Teacher", line: "Renewal window is open. Endorsement, not a brand." },
  { trade: "HVAC", line: "Occupied clinic start-ups — EPA 608 on the card or you sit." },
  { trade: "Physician", line: "Locums VA census. Notes you wrote, not a scribe dump." },
  { trade: "Pharmacist", line: "Med-rec at 0500. Pyxis, the floor, the license number." },
  { trade: "Welder", line: "6G pipe is the coupon shops still believe." },
  { trade: "all", line: "OSHA 30 weekend has two seats. Disaster list wants current tickets." },
];

export const seedInvites: HallInvite[] = [
  {
    id: "inv-keisha",
    fromId: "keisha-owens",
    kind: "crew",
    body: "Wants a seat on the Aurora night crew.",
    why: "Third-year. You've already run pipe with her.",
  },
  {
    id: "inv-tomasz",
    fromId: "tomasz-kowalski",
    kind: "intro",
    body: "Wants to introduce you to Marisol Vega.",
    why: "Hospital work. She needs an electrician who has been in a wing.",
  },
  {
    id: "inv-osha",
    fromId: "tomasz-kowalski",
    kind: "event",
    body: "OSHA 30 weekend at the JATC — two seats left.",
    why: "Your card is current. The third-years are not.",
  },
];

export function overlapWhy(
  you: Person,
  other: Person,
  cohorts: Cohort[],
  projects: Project[],
): string | null {
  if (other.id === you.id) return null;
  const sharedCohort = cohorts.find(
    (c) => c.memberIds.includes(you.id) && c.memberIds.includes(other.id),
  );
  if (sharedCohort) return sharedCohort.name;
  const sharedJob = projects.find(
    (p) => p.memberIds.includes(you.id) && p.memberIds.includes(other.id),
  );
  if (sharedJob) return sharedJob.name;
  if (you.veteran && other.veteran) {
    if (you.veteran.branch === other.veteran.branch) return `${other.veteran.branch} · ${other.veteran.mos}`;
    return "Veteran on the board";
  }
  if (you.city === other.city && you.trade === other.trade) return `${other.city} ${other.trade.toLowerCase()}s`;
  return null;
}

import type { Person } from "./types";

export type DnaMatch = { title: string; why: string; have: string[]; need: string[] };

export function skillDna(person: Person): DnaMatch[] {
  const bag = [
    person.trade,
    ...person.specialties,
    ...person.tickets.map((t) => t.name),
    ...(person.tools ?? []),
    ...(person.software ?? []),
    person.veteran?.mos ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const has = (s: string) => bag.includes(s.toLowerCase());
  const out: DnaMatch[] = [];

  if (has("weld") && (has("millwright") || has("cnc") || has("plc") || has("robot"))) {
    out.push({
      title: "Industrial automation technician",
      why: "Welding plus plant discipline. The next chair is controls, not more rod.",
      have: ["Welding", "Plant / millwright"],
      need: ["PLC basics", "Robotics safety"],
    });
  }
  if (has("electric") && (has("hospital") || has("fire") || has("nfpa"))) {
    out.push({
      title: "Building automation / fire-life safety",
      why: "Hospital electrical plus code. BAS shops pay for people who have been in a wing.",
      have: ["Electrical", "Hospital / NFPA"],
      need: ["Controls sequences", "Fire alarm cert"],
    });
  }
  if (has("hvac") && (has("electric") || has("controls") || has("nate"))) {
    out.push({
      title: "Controls technician",
      why: "You already start equipment. The dollar is in the sequence of operations.",
      have: ["HVAC"],
      need: ["BAS / Niagara", "Electrical overlay"],
    });
  }
  if (has("nurse") && (has("faculty") || has("cne") || has("teach"))) {
    out.push({
      title: "Clinical instructor",
      why: "Floor years plus a teaching ticket. Different rate than staff nights.",
      have: ["RN", "Teaching"],
      need: ["MSN or CNE if not on file"],
    });
  }
  if (has("11b") || (has("infantry") && has("teacher"))) {
    out.push({
      title: "JROTC / operations lead",
      why: "Unit leadership plus a classroom. Not a 'soft skill.'",
      have: ["11B / leadership", "Classroom"],
      need: ["State cert if not current"],
    });
  }
  if (!out.length) {
    out.push({
      title: `Lead ${person.trade.toLowerCase()}`,
      why: "Hours and tickets already support the next chair. Usually one exam, not a new identity.",
      have: person.specialties.slice(0, 3),
      need: ["Lead ticket or hours"],
    });
  }
  return out.slice(0, 3);
}

export type Branch = { label: string; need: string[]; ready: boolean };

export function becomeTree(person: Person): { root: string; branches: Branch[] } {
  const names = person.tickets.map((t) => t.name.toLowerCase()).join(" ");
  const has = (s: string) => names.includes(s);
  if (person.trade === "Electrician") {
    return {
      root: "Electrician",
      branches: [
        { label: "Foreman", need: ["OSHA 30", "Hours as JW"], ready: has("osha 30") && person.years >= 6 },
        { label: "Inspector", need: ["Master ticket", "ICC"], ready: has("master") },
        { label: "Estimator", need: ["Plan reading", "Bluebeam"], ready: person.years >= 8 },
        { label: "Project manager", need: ["Foreman time", "OSHA 30"], ready: person.level === "Foreman" },
        { label: "Contractor / shop", need: ["Master", "Bonding", "Business license"], ready: has("master") },
      ],
    };
  }
  if (person.trade === "Nurse") {
    return {
      root: "Nurse",
      branches: [
        { label: "Charge", need: ["2+ years", "ACLS"], ready: person.years >= 2 },
        { label: "Travel / compact", need: ["Compact RN"], ready: has("compact") || has("nlc") },
        { label: "Specialty (CCRN)", need: ["ICU hours", "CCRN"], ready: has("ccrn") },
        { label: "Faculty", need: ["MSN / CNE"], ready: has("cne") || has("msn") },
      ],
    };
  }
  if (person.trade === "Teacher") {
    return {
      root: "Teacher",
      branches: [
        { label: "Lead / department", need: ["3 years"], ready: person.years >= 3 },
        { label: "National Board", need: ["NBPTS"], ready: has("national board") },
        { label: "Admin", need: ["Leadership cert"], ready: false },
      ],
    };
  }
  return {
    root: person.trade,
    branches: [
      { label: "Lead", need: ["Hours"], ready: person.years >= 6 },
      { label: "Foreman / charge", need: ["OSHA 30 or specialty"], ready: has("osha") },
      { label: "Shop / program", need: ["Master or board"], ready: ["Master", "Owner"].includes(person.level) },
    ],
  };
}

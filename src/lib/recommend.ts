import { careerTrack } from "./tracks";
import { callingPaths } from "./callings";
import type { Person } from "./types";

export function nextCredentials(person: Person): string[] {
  const names = person.tickets.map((t) => t.name.toLowerCase());
  const has = (s: string) => names.some((n) => n.includes(s));
  const out: string[] = [];
  if (person.trade === "Electrician") {
    if (!has("osha 30")) out.push("OSHA 30");
    if (!has("nfpa")) out.push("NFPA 70E");
    if (!has("master") && person.level === "Journeyman") out.push("Master electrician exam");
    if (!has("osha 500") && person.years >= 8) out.push("OSHA 500");
  } else if (person.trade === "Nurse") {
    if (!has("acls")) out.push("ACLS / BLS refresh");
    if (!has("ccrn") && !has("cne")) out.push("CCRN or specialty cert");
    if (!has("compact") && !has("nlc")) out.push("Compact license");
  } else if (person.trade === "Teacher" || person.trade === "Faculty") {
    if (!has("national board")) out.push("National Board");
    if (!has("esol") && !has("ell")) out.push("ESOL endorsement");
  } else if (person.trade === "Physician") {
    if (!has("dea")) out.push("DEA");
    if (!has("acls")) out.push("ACLS");
  } else if (person.trade === "Developer") {
    if (!has("security") && !has("aws")) out.push("Security+ or AWS if you claim cloud");
    out.push("A shop that will vouch they used it");
  } else if (person.trade === "Advisor") {
    if (!has("cfp")) out.push("CFP");
    if (!has("series 66") && !has("series 65")) out.push("Series 66");
  } else if (person.trade === "Realtor" || person.trade === "Agent") {
    if (!has("broker") && person.trade === "Agent") out.push("Broker exam");
  } else if (person.trade === "Therapist") {
    if (!has("emdr")) out.push("EMDR if you take trauma");
  } else if (person.trade === "Dentist") {
    if (!has("dea")) out.push("DEA");
  } else if (callingPaths.some((p) => p.trade === person.trade)) {
    const path = callingPaths.find((p) => p.trade === person.trade);
    if (path) out.push(path.house);
  } else {
    if (!has("osha 30")) out.push("OSHA 30");
    if (!has("first aid") && !has("cpr")) out.push("First Aid / CPR");
  }
  const next = careerTrack(person).next;
  if (next && !out.includes(next)) out.unshift(next);
  return out.slice(0, 3);
}

export function careerLadder(person: Person): { label: string; current: boolean }[] {
  const ladders: Record<string, string[]> = {
    Electrician: ["Apprentice", "Journeyman", "Master", "Foreman", "Shop owner"],
    Plumber: ["Apprentice", "Journeyman", "Master", "Foreman", "Shop owner"],
    HVAC: ["Apprentice", "Journeyman", "NATE / Master", "Foreman", "Shop owner"],
    Welder: ["Helper", "Journeyman", "6G / CWI", "Lead", "Foreman"],
    Lineman: ["Ground hand", "Apprentice", "Journeyman", "Foreman"],
    Pipefitter: ["Apprentice", "NCCER", "Journeyman", "Foreman"],
    "Sheet metal": ["Apprentice", "Journeyman", "Foreman", "Shop"],
    Mason: ["Tender", "Apprentice", "Journeyman", "Foreman"],
    Roofer: ["Helper", "Journeyman", "Foreman", "Crew"],
    "Sprinkler fitter": ["Apprentice", "Journeyman", "Foreman", "Shop"],
    Machinist: ["Shop", "Journeyman", "Lead", "Programmer"],
    "Diesel technician": ["Helper", "ASE", "Journeyman", "Shop lead"],
    Chef: ["Line", "Station", "Sous", "Chef"],
    "Truck driver": ["CDL school", "Solo", "Trainer", "Owner-operator"],
    Barber: ["School", "License", "Chair", "Shop"],
    Nurse: ["New grad", "Staff RN", "Charge", "Specialty / CCRN", "Faculty"],
    Physician: ["Resident", "Attending", "Lead hospitalist", "Medical director"],
    Teacher: ["Intern", "Teacher of record", "Lead / department", "National Board"],
    Faculty: ["Adjunct", "Clinical instructor", "Program lead"],
    Developer: ["Ship a tool", "A shop pays", "Contract lead", "Own the product"],
    Realtor: ["Agent", "Broker", "Broker-owner"],
    Agent: ["License", "Buyer-side", "Broker exam"],
    Therapist: ["Associate", "LCSW", "Independent", "Supervisor"],
    Dentist: ["Associate", "DDS", "Owner-operator"],
    Paramedic: ["EMT", "Paramedic", "Charge", "Service lead"],
    "Dental hygienist": ["Program", "RDH", "Lead", "Clinic"],
    Veterinarian: ["School", "Associate", "Owner"],
    Midwife: ["RN", "CNM", "Staff", "Practice"],
    "Respiratory therapist": ["Program", "RRT", "ICU", "Lead"],
    Firefighter: ["Academy", "Firefighter", "Engineer", "Officer"],
    Inspector: ["Trade years", "ICC", "Combination", "Chief"],
    Appraiser: ["Trainee", "Licensed", "Certified", "Supervisor"],
    Bookkeeper: ["Books", "Certificate", "Lead", "A shop of shops"],
    Advisor: ["Series 7", "Series 66", "CFP", "Principal"],
  };
  const steps = ladders[person.trade] ?? ["Apprentice", "Journeyman", "Lead", "Foreman"];
  const lvl = person.level;
  let idx = 0;
  if (lvl === "Apprentice") idx = 0;
  else if (lvl === "Journeyman" || lvl === "Staff") idx = 1;
  else if (lvl === "Master" || lvl === "Charge" || lvl === "Attending") idx = 2;
  else if (lvl === "Foreman" || lvl === "Adjunct") idx = 3;
  else if (lvl === "Owner") idx = steps.length - 1;
  else idx = Math.min(1, steps.length - 1);
  return steps.map((label, i) => ({ label, current: i === idx }));
}

import type { Person } from "./types";
import { callingPaths } from "./callings";

export type TrackStep = { id: string; label: string; done: boolean };

export function careerTrack(person: Person): {
  title: string;
  next: string;
  percent: number;
  steps: TrackStep[];
} {
  const hours = person.hours ?? person.years * 1800;
  const names = person.tickets.map((t) => t.name.toLowerCase());
  const has = (s: string) => names.some((n) => n.includes(s));

  if (person.trade === "Electrician") {
    const steps: TrackStep[] = [
      { id: "osha10", label: "OSHA 10", done: has("osha 10") || has("osha 30") },
      { id: "osha30", label: "OSHA 30", done: has("osha 30") },
      { id: "hours", label: `${Math.min(hours, 8000).toLocaleString()} / 8,000 hours`, done: hours >= 8000 },
      { id: "class", label: "JATC classroom", done: person.years >= 4 || person.level !== "Apprentice" },
      { id: "jw", label: "Journeyman ticket", done: has("journeyman") || person.level !== "Apprentice" },
      { id: "master", label: "Master exam", done: has("master") || person.level === "Master" || person.level === "Owner" },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Electrician · apprentice → journeyman → master",
      next: steps.find((s) => !s.done)?.label ?? "Master on the books",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Nurse") {
    const steps: TrackStep[] = [
      { id: "rn", label: "RN license", done: has("rn") },
      { id: "bls", label: "BLS / ACLS", done: has("acls") || has("bls") },
      { id: "hours", label: `${person.years} years on the floor`, done: person.years >= 2 },
      { id: "specialty", label: "Specialty cert (CCRN / etc.)", done: has("ccrn") || has("cne") },
      { id: "charge", label: "Charge-capable", done: person.level === "Charge" || person.years >= 8 },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Nursing · license → specialty → charge",
      next: steps.find((s) => !s.done)?.label ?? "Charge / faculty",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Teacher" || person.trade === "Faculty") {
    const steps: TrackStep[] = [
      { id: "cert", label: "State certificate", done: has("cert") || has("license") || has("certificate") },
      { id: "endorsement", label: "Content endorsement", done: person.tickets.length >= 2 },
      { id: "years", label: "3 years in the classroom", done: person.years >= 3 },
      { id: "nbpts", label: "National Board", done: has("national board") || person.years >= 15 },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: person.trade === "Faculty" ? "Faculty · license → board" : "Teacher · cert → board",
      next: steps.find((s) => !s.done)?.label ?? "Lead teacher / faculty",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Pharmacist") {
    const steps: TrackStep[] = [
      { id: "pharmd", label: "PharmD / state license", done: has("pharm") || has("rph") },
      { id: "bls", label: "BLS", done: has("bls") },
      { id: "bcps", label: "BCPS / specialty board", done: has("bcps") || has("board") },
      { id: "years", label: `${person.years} years in the pharmacy`, done: person.years >= 3 },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Pharmacy · license → board",
      next: steps.find((s) => !s.done)?.label ?? "Clinical lead",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Physician") {
    const steps: TrackStep[] = [
      { id: "md", label: "State license", done: has("md") || has("do") },
      { id: "board", label: "Board certification", done: has("abim") || has("board") },
      { id: "dea", label: "DEA", done: has("dea") },
      { id: "bls", label: "BLS / ACLS", done: has("acls") || has("bls") },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Physician · license → boarded",
      next: steps.find((s) => !s.done)?.label ?? "Privileged",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Realtor" || person.trade === "Agent") {
    const steps: TrackStep[] = [
      { id: "license", label: "State license", done: has("real estate") || has("broker") || has("agent") || has("realtor") },
      { id: "nar", label: "NAR / association", done: has("nar") },
      { id: "years", label: `${person.years} years closing`, done: person.years >= 3 },
      { id: "broker", label: "Broker", done: has("broker") || person.level === "Owner" },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: person.trade === "Agent" ? "Agent · license → close" : "Realtor · license → broker",
      next: steps.find((s) => !s.done)?.label ?? (person.trade === "Agent" ? "Broker exam" : "Broker-owner"),
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Therapist") {
    const steps: TrackStep[] = [
      { id: "lcsw", label: "LCSW / license", done: has("lcsw") || has("lmft") || has("lpc") },
      { id: "npi", label: "NPI", done: has("npi") },
      { id: "years", label: `${person.years} years in the chair`, done: person.years >= 2 },
      { id: "spec", label: "EMDR / specialty", done: has("emdr") || person.specialties.length >= 2 },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Therapist · license → independent",
      next: steps.find((s) => !s.done)?.label ?? "Independent practice",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Dentist") {
    const steps: TrackStep[] = [
      { id: "dds", label: "DDS / DMD", done: has("dds") || has("dmd") },
      { id: "dea", label: "DEA", done: has("dea") },
      { id: "bls", label: "BLS", done: has("bls") },
      { id: "own", label: "Owner-operator", done: person.level === "Owner" },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Dentist · license → practice",
      next: steps.find((s) => !s.done)?.label ?? "Practice",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Advisor") {
    const steps: TrackStep[] = [
      { id: "s7", label: "Series 7", done: has("series 7") },
      { id: "s66", label: "Series 66", done: has("series 66") || has("series 65") },
      { id: "cfp", label: "CFP", done: has("cfp") },
      { id: "years", label: `${person.years} years fiduciary`, done: person.years >= 5 },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Advisor · licenses → CFP",
      next: steps.find((s) => !s.done)?.label ?? "Principal",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  if (person.trade === "Developer") {
    const steps: TrackStep[] = [
      { id: "ship", label: "A product on the market", done: true },
      { id: "review", label: "A shop that used it", done: person.history.length >= 2 },
      { id: "sec", label: "Security+ / AWS if you claim it", done: has("security") || has("aws") },
      { id: "shop", label: "A shop as a customer", done: person.level === "Owner" || person.years >= 8 },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: "Developer · ship → a shop pays",
      next: steps.find((s) => !s.done)?.label ?? "Keep shipping",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  const path = callingPaths.find((p) => p.trade === person.trade);
  if (path) {
    const ticket = person.tickets[0]?.name ?? "The card";
    const steps: TrackStep[] = [
      { id: "ticket", label: ticket, done: person.tickets.length > 0 },
      { id: "house", label: path.house, done: person.years >= 1 },
      { id: "years", label: `${person.years} years in the work`, done: person.years >= 4 },
      {
        id: "lead",
        label: "Lead seat",
        done: ["Foreman", "Master", "Owner", "Charge", "Attending"].includes(person.level),
      },
    ];
    const done = steps.filter((s) => s.done).length;
    return {
      title: `${person.trade} · the card, then the hours`,
      next: steps.find((s) => !s.done)?.label ?? "Lead",
      percent: Math.round((done / steps.length) * 100),
      steps,
    };
  }

  const steps: TrackStep[] = [
    { id: "osha", label: "OSHA 10 / 30", done: has("osha") },
    { id: "hours", label: `${hours.toLocaleString()} hours on the tools`, done: hours >= 6000 },
    { id: "jw", label: "Journeyman / equivalent", done: person.level !== "Apprentice" },
    { id: "master", label: "Master / foreman / owner", done: ["Master", "Foreman", "Owner"].includes(person.level) },
  ];
  const done = steps.filter((s) => s.done).length;
  return {
    title: `${person.trade} · apprentice → journeyman → lead`,
    next: steps.find((s) => !s.done)?.label ?? "Lead",
    percent: Math.round((done / steps.length) * 100),
    steps,
  };
}

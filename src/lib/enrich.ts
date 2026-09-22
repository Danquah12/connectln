import { parseOshaFromName, isOshaTicket } from "./osha";
import { cohorts, projects } from "./seed";
import type { JobSite, OpenTo, Person, Ticket } from "./types";

function issuedFromExpiry(expires?: string) {
  if (!expires) return undefined;
  const y = Number(expires.slice(0, 4));
  if (!Number.isFinite(y)) return undefined;
  return `${y - 3}${expires.slice(4)}`;
}

function enrichTicket(t: Ticket): Ticket {
  if (!isOshaTicket(t)) {
    return {
      ...t,
      issued: t.issued ?? issuedFromExpiry(t.expires),
      verify: t.verify ?? (t.number || t.expires ? "verified" : "unverified"),
    };
  }
  const parsed = parseOshaFromName(t.name, t.issuer);
  const osha: import("./types").OshaCard = {
    kind: t.osha?.kind ?? parsed.kind ?? "student",
    hours: t.osha?.hours ?? parsed.hours,
    industry: t.osha?.industry ?? parsed.industry ?? "construction",
    completed: t.osha?.completed || t.issued || issuedFromExpiry(t.expires),
    trainer: t.osha?.trainer,
    trainerId: t.osha?.trainerId,
    ato: t.osha?.ato,
    qr: t.osha?.qr,
    recencyYears: t.osha?.recencyYears,
  };
  return {
    ...t,
    issued: t.issued ?? osha.completed,
    osha,
    issuer: t.issuer === "OSHA" ? "OSHA Outreach" : t.issuer,
    verify: t.verify ?? "pending",
  };
}

function enrichJob(h: JobSite, person: Person): JobSite {
  return {
    ...h,
    duration: h.duration ?? (h.when.includes("–") ? h.when : "one season"),
    crew: h.crew ?? (person.trade === "Teacher" || person.trade === "Faculty" ? 1 : 4),
    skills: h.skills ?? person.specialties.slice(0, 4),
    photos: h.photos ?? (person.cover ? [person.cover] : []),
  };
}

function defaultTools(p: Person): string[] {
  if (p.trade === "Electrician") return ["Milwaukee", "Fluke 87V", "Klein", "Greenlee"];
  if (p.trade === "HVAC") return ["Fieldpiece", "Yellow Jacket", "Milwaukee"];
  if (p.trade === "Welder") return ["Lincoln", "Miller", "3M"];
  if (p.trade === "Nurse" || p.trade === "Physician" || p.trade === "Pharmacist") return ["Epic", "Pyxis"];
  if (p.trade === "Teacher" || p.trade === "Faculty") return ["Google Classroom", "Board"];
  if (p.trade === "Developer") return ["VS Code", "GitHub"];
  if (p.trade === "Realtor" || p.trade === "Agent") return ["MLS", "Dotloop", "DocuSign"];
  if (p.trade === "Therapist") return ["SimplePractice", "Epic"];
  if (p.trade === "Dentist") return ["Dentrix", "Dexis"];
  if (p.trade === "Advisor") return ["Orion", "eMoney", "Redtail"];
  return ["Milwaukee", "DeWalt"];
}

function defaultSoftware(p: Person): string[] {
  if (p.trade === "Developer") return p.specialties.slice(0, 4);
  if (p.trade === "Realtor" || p.trade === "Agent") return ["MLS", "SoftPro"];
  if (p.trade === "Therapist") return ["SimplePractice"];
  if (p.trade === "Dentist") return ["Dentrix"];
  if (p.trade === "Advisor") return ["Orion", "eMoney"];
  if (!["Nurse", "Physician", "Pharmacist", "Teacher", "Faculty", "Therapist", "Dentist", "Advisor"].includes(p.trade)) return ["Bluebeam", "Procore"];
  if (p.trade === "Nurse" || p.trade === "Physician" || p.trade === "Pharmacist") return ["Epic"];
  return ["Canvas"];
}

function defaultOpenTo(p: Person): OpenTo {
  return {
    looking: `${p.level} ${p.trade.toLowerCase()}`,
    locations: `${p.city} / ${p.state}`,
    when: p.availability === "open" ? "Immediately" : "When this job turns",
    minRate: p.rate ?? "Shop scale",
    travel: `${p.travelMiles} miles`,
    shift: p.trade === "Nurse" ? "Nights ok" : "Day",
    employment: p.union ? "Union calls" : "Contract / hire",
  };
}

export function enrichPeople(people: Person[]): Person[] {
  return people.map((p) => {
    const hours =
      p.hours ?? (p.level === "Apprentice" ? p.years * 933 : p.years * 1800);
    const mentoring =
      p.mentoring ??
      (p.level === "Master" ||
        p.level === "Foreman" ||
        p.level === "Owner" ||
        p.level === "Attending" ||
        p.years >= 12);
    const seekingMentor = p.seekingMentor ?? p.level === "Apprentice";
    const cohortIds =
      p.cohortIds ?? cohorts.filter((c) => c.memberIds.includes(p.id)).map((c) => c.id);
    const history = p.history.map((h, i) => {
      const base = enrichJob(h, p);
      const team = projects.find((x) => x.name === h.name)?.memberIds;
      if (p.id === "jordan-hale" && i === 0) {
        return {
          ...base,
          duration: "11 months",
          crew: 6,
          skills: ["480V systems", "Panel install", "NEC", "Hospital remodeling"],
          photos: ["/sites/hall.jpg", "/sites/panel.jpg", "/sites/hospital.jpg"],
          shop: "Apex Electric",
          verified: true,
          teamIds: projects.find((x) => x.id === "st-joseph-ti")?.memberIds,
        };
      }
      return { ...base, verified: base.verified ?? true, teamIds: base.teamIds ?? team };
    });
    return {
      ...p,
      hours,
      mentoring,
      seekingMentor,
      cohortIds,
      tickets: p.tickets.map(enrichTicket),
      history,
      tools: p.tools ?? defaultTools(p),
      software: p.software ?? defaultSoftware(p),
      education: p.education ?? (p.union ? [p.union] : []),
      openTo: p.openTo ?? defaultOpenTo(p),
      disaster: p.disaster ?? (Boolean(p.veteran) || p.availability === "open"),
      intro:
        p.intro ??
        `I'm ${p.name.split(" ")[0]}. ${p.years} years as a ${p.trade.toLowerCase()} out of ${p.city}.`,
      gigModes: p.gigModes ?? (p.availability === "open" ? ["contract", "gigs"] : ["full-time"]),
      example: p.example ?? true,
    };
  });
}

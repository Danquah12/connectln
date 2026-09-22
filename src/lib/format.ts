import { format, formatDistanceToNow, parseISO } from "date-fns";
import { isOshaStudent, oshaRecencyEnd } from "./osha";
import type { Availability, Level, Person, Ticket, Trade } from "./types";

export function relTime(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function shortDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function availabilityLabel(a: Availability) {
  switch (a) {
    case "open":
      return "Open to calls";
    case "booked":
      return "Booked out";
    case "on-job":
      return "On a job";
    case "not-looking":
      return "Not looking";
  }
}

export function openTerms(person: { availability: Availability; openTo?: import("./types").OpenTo; rate?: string; travelMiles: number }) {
  if (person.availability !== "open") return availabilityLabel(person.availability);
  const o = person.openTo;
  if (!o) {
    const bits = [person.rate, person.travelMiles ? `${person.travelMiles} mi` : ""].filter(Boolean);
    return bits.length ? `Open to calls · ${bits.join(" · ")}` : "Open to calls";
  }
  return [o.looking, o.when, o.minRate || person.rate, o.shift].filter(Boolean).join(" · ");
}

export function rankLabel(level: Level, trade: string) {
  if (level === "Owner") return `${trade} · shop owner`;
  if (level === "Foreman") return `${level} · ${trade}`;
  if (level === "Master") return `Master ${trade.toLowerCase()}`;
  if (level === "Apprentice") return `${trade} apprentice`;
  if (level === "Charge") return `Charge ${trade.toLowerCase()}`;
  if (level === "Attending") return `Attending ${trade.toLowerCase()}`;
  if (level === "Adjunct") return `Adjunct ${trade.toLowerCase()}`;
  if (level === "Staff") {
    if (trade === "Nurse") return "Staff nurse";
    if (trade === "Pharmacist") return "Pharmacist";
    if (trade === "Teacher") return "Teacher";
    if (trade === "Physician") return "Physician";
    if (trade === "Faculty") return "Faculty";
    if (trade === "Developer") return "Developer";
    if (trade === "Realtor") return "Realtor";
    if (trade === "Agent") return "Real estate agent";
    if (trade === "Therapist") return "Therapist";
    if (trade === "Dentist") return "Dentist";
    if (trade === "Advisor") return "Financial advisor";
    return trade;
  }
  return `${level} ${trade.toLowerCase()}`;
}

export function rolePlate(person: Person) {
  return rankLabel(person.level, person.trade).toUpperCase();
}

export function beatLine(person: Person, kind?: string) {
  if (kind === "brief" || person.specialties.some((s) => /research/i.test(s))) {
    return "ORGANIZATION · RESEARCH FINDINGS";
  }
  return rolePlate(person);
}

export function compactCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export function yearsLabel(person: Person) {
  switch (person.trade) {
    case "Nurse":
      return `${person.years} years on the floor`;
    case "Pharmacist":
      return `${person.years} years in the pharmacy`;
    case "Physician":
      return `${person.years} years in practice`;
    case "Teacher":
    case "Faculty":
      return `${person.years} years in the classroom`;
    case "Developer":
      return `${person.years} years shipping`;
    case "Realtor":
    case "Agent":
      return `${person.years} years closing`;
    case "Therapist":
      return `${person.years} years in the chair`;
    case "Dentist":
      return `${person.years} years in practice`;
    case "Advisor":
      return `${person.years} years as a fiduciary`;
    default:
      return `${person.years} years on the tools`;
  }
}

export function isTrades(trade: Trade) {
  return !(
    trade === "Nurse" ||
    trade === "Physician" ||
    trade === "Pharmacist" ||
    trade === "Teacher" ||
    trade === "Faculty" ||
    trade === "Developer" ||
    trade === "Realtor" ||
    trade === "Agent" ||
    trade === "Therapist" ||
    trade === "Dentist" ||
    trade === "Advisor"
  );
}

/** Thin material cue for the ID badge — brick / ok / warn / ink only. */
export function tradeMark(trade: Trade, veteran?: boolean): { letter: string; tone: "brick" | "ok" | "warn" | "ink" } {
  const letter = trade.slice(0, 1).toUpperCase();
  if (veteran) return { letter, tone: "ink" };
  if (trade === "Nurse" || trade === "Physician" || trade === "Pharmacist" || trade === "Therapist" || trade === "Dentist") {
    return { letter, tone: "ok" };
  }
  if (trade === "Teacher" || trade === "Faculty") return { letter, tone: "warn" };
  if (trade === "Developer" || trade === "Advisor") return { letter, tone: "ink" };
  return { letter, tone: "brick" };
}

export function veteranLabel(person: Person) {
  if (!person.veteran) return null;
  const v = person.veteran;
  const clear = v.clearance
    ? v.poly
      ? `${v.clearance} + poly`
      : v.clearance
    : null;
  return clear
    ? `${v.branch} · ${v.mos} · ${clear}`
    : `${v.branch} · ${v.mos} · ${v.years} yrs`;
}

export function clearanceLabel(person: Person) {
  if (!person.veteran?.clearance) return null;
  return person.veteran.poly
    ? `${person.veteran.clearance} · poly`
    : person.veteran.clearance;
}

export type TicketStatus = "active" | "soon" | "lapsed" | "none" | "stale";

export function ticketStatus(ticket: Ticket): TicketStatus {
  if (isOshaStudent(ticket)) {
    const end = oshaRecencyEnd(ticket);
    const days = daysUntil(end);
    if (days === null) return "none";
    if (days < 0) return "stale";
    if (days <= 60) return "soon";
    return "active";
  }
  const days = daysUntil(ticket.expires);
  if (days === null) return "none";
  if (days < 0) return "lapsed";
  if (days <= 60) return "soon";
  return "active";
}

export function ticketStatusLabel(ticket: Ticket) {
  if (isOshaStudent(ticket)) {
    const completed = ticket.osha?.completed || ticket.issued;
    const days = daysUntil(oshaRecencyEnd(ticket));
    if (days === null) return "Student card · OSHA does not expire it";
    if (days < 0) return "Stale for 5-year shop rule";
    if (days === 0) return "Shop recency ends today";
    if (days <= 60) return `Shop recency in ${days}d`;
    return completed ? `Completed ${completed.slice(0, 7)} · not a license` : "Student card · no expiry";
  }
  const days = daysUntil(ticket.expires);
  if (days === null) return "No expiry";
  if (days < 0) return "Lapsed";
  if (days === 0) return "Expires today";
  if (days <= 60) return `Expires in ${days}d`;
  try {
    return `Exp ${format(parseISO(ticket.expires!), "MMM yyyy")}`;
  } catch {
    return `Exp ${ticket.expires}`;
  }
}

export function ticketNeedsRefresh(ticket: Ticket) {
  const s = ticketStatus(ticket);
  return s === "soon" || s === "lapsed" || s === "stale" || ticket.verify === "pending" || ticket.verify === "unverified";
}

export function cardName(person: { name?: string } | null | undefined) {
  const n = person?.name?.trim();
  return n || "New member";
}

export function firstName(person: { name?: string } | null | undefined) {
  return cardName(person).split(/\s+/)[0] || "there";
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function daysUntil(iso?: string) {
  if (!iso) return null;
  const d = (parseISO(iso).getTime() - Date.now()) / 86400000;
  return Math.ceil(d);
}

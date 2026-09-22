import { isOshaTicket, runOshaProtocol } from "./osha";
import type { BoardResult, Ticket, TicketSource } from "./types";

export type ProtocolDesk = "dora" | "nursys" | "osha";

export type ProtocolStep = { id: string; label: string; pass: boolean };

export type ProtocolReport = {
  desk: ProtocolDesk;
  board: string;
  url: string;
  holder: string;
  licenseType: string;
  number: string;
  jurisdiction: string;
  status: "Active" | "Expired" | "None" | "Discipline" | string;
  issued?: string;
  expires?: string;
  compact?: "Multistate" | "Single-state";
  discipline: boolean;
  city?: string;
  steps: ProtocolStep[];
  result: BoardResult;
};

type RollRow = {
  desk: ProtocolDesk;
  number: string;
  last: string;
  holder: string;
  licenseType: string;
  jurisdiction: string;
  status: "Active" | "Expired" | "Discipline";
  issued?: string;
  expires?: string;
  compact?: "Multistate" | "Single-state";
  discipline: boolean;
  city?: string;
};

const DORA_URL = "https://apps2.colorado.gov/dora/licensing/lookup/licenselookup.aspx";
const NURSYS_URL = "https://www.nursys.com/LQC/LQCSearch.aspx";

/** Public-roll stand-ins. Real DORA / Nursys lookups stay on their desks. */
const ROLL: RollRow[] = [
  {
    desk: "dora",
    number: "JE-441902",
    last: "HALE",
    holder: "Jordan Hale",
    licenseType: "Journeyman Electrician",
    jurisdiction: "Colorado DPO",
    status: "Active",
    issued: "2017-06-12",
    expires: "2027-06-30",
    discipline: false,
    city: "Denver",
  },
  {
    desk: "dora",
    number: "EA-441902",
    last: "VASQUEZ",
    holder: "Elena Vasquez",
    licenseType: "Real Estate Broker",
    jurisdiction: "Colorado DPO",
    status: "Active",
    issued: "2018-03-01",
    expires: "2026-12-31",
    discipline: false,
    city: "Denver",
  },
  {
    desk: "dora",
    number: "EA-882014",
    last: "CHEN",
    holder: "Mei Chen",
    licenseType: "Real Estate Broker Associate",
    jurisdiction: "Colorado DPO",
    status: "Active",
    issued: "2021-09-14",
    expires: "2026-12-31",
    discipline: false,
    city: "Aurora",
  },
  {
    desk: "nursys",
    number: "RN-448201",
    last: "RUIZ",
    holder: "Camila Ruiz",
    licenseType: "RN",
    jurisdiction: "Colorado",
    status: "Active",
    issued: "2019-04-02",
    expires: "2027-04-30",
    compact: "Multistate",
    discipline: false,
    city: "Denver",
  },
  {
    desk: "nursys",
    number: "RN-10442",
    last: "ALVAREZ",
    holder: "Ruth Alvarez",
    licenseType: "RN",
    jurisdiction: "Texas",
    status: "Active",
    issued: "2007-08-18",
    expires: "2027-08-31",
    compact: "Multistate",
    discipline: false,
    city: "Houston",
  },
];

function clean(n?: string) {
  return (n ?? "").replace(/\s+/g, "").toUpperCase();
}

function lastOf(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/);
  return clean(parts[parts.length - 1]);
}

export function deskForTicket(ticket: Pick<Ticket, "issuer" | "name" | "osha">): ProtocolDesk | undefined {
  const hay = `${ticket.issuer} ${ticket.name}`;
  if (isOshaTicket(ticket) || /osha|outreach/i.test(hay)) return "osha";
  if (/nlc|nursys|compact|bon texas|board of nursing|rn\s|rn —/i.test(hay)) return "nursys";
  if (/dora|state of colorado|colorado dpo|real estate/i.test(hay) && !/nlc|nursys|compact/i.test(hay)) return "dora";
  return undefined;
}

export const PROTOCOL: Record<ProtocolDesk, { board: string; url: string; gates: string[] }> = {
  dora: {
    board: "Colorado DORA · Division of Professions and Occupations",
    url: DORA_URL,
    gates: [
      "License number on the DPO roll",
      "Last name matches the card",
      "License type matches the ticket",
      "Status is Active",
      "Not expired",
      "No public discipline",
    ],
  },
  nursys: {
    board: "Nursys QuickConfirm (NCSBN)",
    url: NURSYS_URL,
    gates: [
      "License number in QuickConfirm",
      "Last name matches the card",
      "License type is RN / LPN / APRN",
      "Active = Yes",
      "Compact status matches the claim (multistate if they said compact)",
      "No discipline against the license",
      "No discipline against privilege to practice",
      "Not expired",
    ],
  },
  osha: {
    board: "OSHA Outreach · trainer / OTI Education Center",
    url: "https://www.osha.gov/node/58581",
    gates: [
      "Course is OSHA 10 or 30 (construction, GI, maritime, or disaster)",
      "Name on the card matches this person",
      "Completion date on the card — student cards do not expire",
      "Photo of front and back, or a trainer / ATO named",
      "QR or OTI Education Center on the back (plastic cards)",
      "Authorized trainer named — they keep the roster 5 years",
      "Shop recency: completed within 5 years (shop rule, not OSHA's)",
    ],
  },
};

export function runProtocol(input: {
  desk: ProtocolDesk;
  number?: string;
  last?: string;
  holder?: string;
  ticketName?: string;
  claimsCompact?: boolean;
  completed?: string;
  trainer?: string;
  trainerId?: string;
  ato?: string;
  qr?: boolean;
  document?: boolean;
  hours?: 10 | 30;
  industry?: import("./types").OshaIndustry;
}): ProtocolReport {
  if (input.desk === "osha") {
    return runOshaProtocol(input);
  }
  const meta = PROTOCOL[input.desk];
  const number = clean(input.number);
  const last = clean(input.last) || lastOf(input.holder);
  const row = ROLL.find((r) => r.desk === input.desk && r.number === number);

  if (!number) {
    return emptyReport(input.desk, "needs-number", input);
  }
  if (!row) {
    return emptyReport(input.desk, "no-record", input);
  }

  const nameOk = !last || row.last === last;
  const typeOk =
    !input.ticketName ||
    clean(row.licenseType).includes(clean(input.ticketName).slice(0, 6)) ||
    clean(input.ticketName).includes(clean(row.licenseType).slice(0, 6)) ||
    (input.desk === "nursys" && /rn|lpn|aprn/i.test(input.ticketName));
  const compactOk =
    input.desk !== "nursys" ||
    !input.claimsCompact ||
    row.compact === "Multistate";
  const active = row.status === "Active";
  const notExpired = !row.expires || row.expires >= new Date().toISOString().slice(0, 10);
  const noDiscipline = !row.discipline && row.status !== "Discipline";

  const steps: ProtocolStep[] =
    input.desk === "dora"
      ? [
          { id: "number", label: "Number on the DPO roll", pass: true },
          { id: "name", label: "Last name matches the card", pass: nameOk },
          { id: "type", label: "License type matches the ticket", pass: typeOk },
          { id: "active", label: "Status is Active", pass: active },
          { id: "expiry", label: "Not expired", pass: notExpired },
          { id: "disc", label: "No public discipline", pass: noDiscipline },
        ]
      : [
          { id: "number", label: "Number in QuickConfirm", pass: true },
          { id: "name", label: "Last name matches the card", pass: nameOk },
          { id: "type", label: "License type is RN / LPN / APRN", pass: typeOk },
          { id: "active", label: "Active = Yes", pass: active },
          { id: "compact", label: "Compact status matches the claim", pass: compactOk },
          { id: "disc", label: "No discipline against the license", pass: noDiscipline },
          { id: "ptp", label: "No discipline against privilege to practice", pass: noDiscipline },
          { id: "expiry", label: "Not expired", pass: notExpired },
        ];

  const pass = steps.every((s) => s.pass);
  return {
    desk: input.desk,
    board: meta.board,
    url: meta.url,
    holder: row.holder,
    licenseType: row.licenseType,
    number: row.number,
    jurisdiction: row.jurisdiction,
    status: row.status,
    issued: row.issued,
    expires: row.expires,
    compact: row.compact,
    discipline: row.discipline,
    city: row.city,
    steps,
    result: pass ? "match" : "no-record",
  };
}

function emptyReport(
  desk: ProtocolDesk,
  result: BoardResult,
  input: { number?: string; last?: string; holder?: string },
): ProtocolReport {
  const meta = PROTOCOL[desk];
  return {
    desk,
    board: meta.board,
    url: meta.url,
    holder: input.holder ?? "—",
    licenseType: "—",
    number: input.number?.trim() || "—",
    jurisdiction: desk === "dora" ? "Colorado DPO" : "—",
    status: "None",
    discipline: false,
    steps: meta.gates.map((label, i) => ({ id: String(i), label, pass: false })),
    result,
  };
}

export function reportToSource(report: ProtocolReport): TicketSource {
  return {
    board: report.board,
    url: report.url,
    checkedAt: new Date().toISOString(),
    result: report.result,
    protocol: report.desk,
    holder: report.holder,
    status: report.status,
    compact: report.compact,
    discipline: report.discipline,
  };
}

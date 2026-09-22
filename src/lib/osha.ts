import type { BoardResult, OshaCard, Ticket } from "./types";

type ProtocolStep = { id: string; label: string; pass: boolean };

type OshaReport = {
  desk: "osha";
  board: string;
  url: string;
  holder: string;
  licenseType: string;
  number: string;
  jurisdiction: string;
  status: string;
  issued?: string;
  expires?: string;
  discipline: boolean;
  city?: string;
  steps: ProtocolStep[];
  result: BoardResult;
};

export const OSHA_FAQ = "https://www.osha.gov/training/outreach/faq";
export const OSHA_VERIFY_CARD = "https://www.osha.gov/node/58581";
export const OSHA_FIND_TRAINER = "https://www.osha.gov/training/outreach/find-a-trainer";
export const OSHA_CARD_FACTS = "https://www.osha.gov/training/oshacardfacts";
export const OSHA_RECENCY_YEARS = 5;

const OSHA_HAY = /osha|outreach|oti education/i;

export function isOshaTicket(ticket: Pick<Ticket, "name" | "issuer" | "osha">) {
  if (ticket.osha) return true;
  return OSHA_HAY.test(`${ticket.issuer} ${ticket.name}`);
}

export function isOshaStudent(ticket: Pick<Ticket, "name" | "issuer" | "osha">) {
  return isOshaTicket(ticket) && ticket.osha?.kind !== "trainer";
}

export function parseOshaFromName(name: string, issuer: string): Partial<OshaCard> {
  const hay = `${name} ${issuer}`.toLowerCase();
  const trainer = /500|501|502|503|trainer/.test(hay);
  const hours = /\b30\b/.test(hay) ? 30 : /\b10\b/.test(hay) ? 10 : undefined;
  const industry: OshaCard["industry"] = /maritime|ship/.test(hay)
    ? "maritime"
    : /disaster/.test(hay)
      ? "disaster"
      : /general industry|\bgi\b/.test(hay)
        ? "general"
        : "construction";
  return { kind: trainer ? "trainer" : "student", hours: trainer ? undefined : hours, industry };
}

export function oshaRecencyEnd(ticket: Ticket) {
  if (!isOshaStudent(ticket)) return ticket.expires;
  const completed = ticket.osha?.completed || ticket.issued;
  if (!completed || completed.length < 4) return undefined;
  const years = ticket.osha?.recencyYears ?? OSHA_RECENCY_YEARS;
  const y = Number(completed.slice(0, 4));
  if (!Number.isFinite(y)) return undefined;
  return `${y + years}${completed.slice(4)}`;
}

export function oshaCourseLabel(card?: OshaCard) {
  if (!card) return "OSHA Outreach";
  if (card.kind === "trainer") return "Authorized trainer";
  const hours = card.hours ? `${card.hours}-hour` : "Outreach";
  const industry =
    card.industry === "general"
      ? "general industry"
      : card.industry === "maritime"
        ? "maritime"
        : card.industry === "disaster"
          ? "disaster site"
          : "construction";
  return `OSHA ${hours} · ${industry}`;
}

type OshaRow = {
  number: string;
  last: string;
  holder: string;
  hours: 10 | 30;
  industry: OshaCard["industry"];
  completed: string;
  trainer: string;
  trainerId: string;
  ato: string;
  qr: boolean;
};

/** Stand-in ATO confirmations. OSHA has no national student roll. */
const ATO_CARDS: OshaRow[] = [
  {
    number: "OTI-30-441902",
    last: "HALE",
    holder: "Jordan Hale",
    hours: 30,
    industry: "construction",
    completed: "2021-11-02",
    trainer: "Ray Delgado",
    trainerId: "T-18820",
    ato: "Rocky Mountain OTI Education Center",
    qr: true,
  },
  {
    number: "OTI-10-22941",
    last: "OWENS",
    holder: "Keisha Owens",
    hours: 10,
    industry: "construction",
    completed: "2020-03-01",
    trainer: "Ray Delgado",
    trainerId: "T-18820",
    ato: "Rocky Mountain OTI Education Center",
    qr: false,
  },
];

const TRAINERS = [
  {
    trainerId: "T-18820",
    trainer: "Ray Delgado",
    ato: "Rocky Mountain OTI Education Center",
    expires: "2027-06-01",
  },
];

function clean(n?: string) {
  return (n ?? "").replace(/\s+/g, "").toUpperCase();
}

function lastOf(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/);
  return clean(parts[parts.length - 1]);
}

export function runOshaProtocol(input: {
  number?: string;
  last?: string;
  holder?: string;
  ticketName?: string;
  completed?: string;
  trainer?: string;
  trainerId?: string;
  ato?: string;
  qr?: boolean;
  document?: boolean;
  hours?: 10 | 30;
  industry?: OshaCard["industry"];
}): OshaReport {
  const number = clean(input.number);
  const last = clean(input.last) || lastOf(input.holder);
  const row = number ? ATO_CARDS.find((r) => r.number === number) : undefined;
  const trainerHit =
    TRAINERS.find((t) => clean(t.trainerId) === clean(input.trainerId)) ||
    TRAINERS.find((t) => clean(t.trainer) === clean(input.trainer)) ||
    (row ? TRAINERS.find((t) => t.trainerId === row.trainerId) : undefined);

  const completed = input.completed || row?.completed || "";
  const hours = input.hours ?? row?.hours;
  const courseOk = hours === 10 || hours === 30 || /osha\s*(10|30)/i.test(input.ticketName ?? "");
  const nameOk = row ? !last || row.last === last : Boolean(last);
  const hasPaper = Boolean(input.document || input.qr || row?.qr || input.trainer || input.ato || number);
  const atoNamed = Boolean(input.ato || row?.ato);
  const trainerNamed = Boolean(input.trainer || row?.trainer);
  const recencyEnd = completed
    ? `${Number(completed.slice(0, 4)) + OSHA_RECENCY_YEARS}${completed.slice(4)}`
    : undefined;
  const recencyOk = !recencyEnd || recencyEnd >= new Date().toISOString().slice(0, 10);
  const fraud = Boolean(row && last && row.last !== last);

  const steps: ProtocolStep[] = [
    { id: "course", label: "Course is OSHA 10 or 30 (construction / GI / maritime / disaster)", pass: courseOk },
    { id: "name", label: "Last name matches the card", pass: nameOk && !fraud },
    { id: "date", label: "Completion date on file", pass: Boolean(completed) },
    { id: "paper", label: "Photo, QR, trainer, or ATO on the ticket", pass: hasPaper },
    { id: "ato", label: "OTI Education Center / ATO named (QR or card back)", pass: atoNamed || Boolean(row) },
    { id: "trainer", label: "Authorized trainer named — records kept 5 years", pass: trainerNamed || Boolean(trainerHit) },
    { id: "recency", label: `Shop recency · completed within ${OSHA_RECENCY_YEARS} years`, pass: recencyOk },
  ];

  let result: BoardResult = "unconfirmed";
  let status = "Unconfirmed";
  if (fraud) {
    result = "no-record";
    status = "Suspected fraud · name does not match";
  } else if (!hasPaper && !number) {
    result = "needs-paper";
    status = "Needs photo / trainer";
  } else if (row && nameOk) {
    result = recencyOk ? "match" : "stale";
    status = recencyOk ? "ATO confirmed" : "ATO confirmed · stale for shop rule";
  } else if (trainerHit && nameOk && completed) {
    result = recencyOk ? "match" : "stale";
    status = recencyOk ? "Trainer confirmed" : "Trainer confirmed · stale for shop rule";
  } else if (trainerNamed || atoNamed) {
    result = "unconfirmed";
    status = "Waiting on trainer / ATO";
  }

  const holder = row?.holder ?? input.holder ?? "—";
  return {
    desk: "osha",
    board: "OSHA Outreach · trainer / OTI Education Center",
    url: OSHA_VERIFY_CARD,
    holder,
    licenseType: oshaCourseLabel({
      kind: "student",
      hours: hours ?? 30,
      industry: input.industry ?? row?.industry ?? "construction",
      completed,
    }),
    number: row?.number ?? (number || "—"),
    jurisdiction: row?.ato ?? input.ato ?? "No ATO on file",
    status,
    issued: completed || undefined,
    expires: recencyEnd,
    discipline: fraud,
    city: undefined,
    steps,
    result,
  };
}

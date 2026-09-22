import { talkScript } from "./talk-scripts";
import type { Person, Trade } from "./types";

export type LineKind = "call" | "meet" | "voice" | "mail";

export type LineSession = {
  id: string;
  withId: string;
  kind: LineKind;
  startedAt: string;
  endedAt: string;
  transcript: string;
  summary: string;
  followSubject: string;
  followBody: string;
  audio?: string;
};

export type CrmAction = {
  id: string;
  personId: string;
  title: string;
  done: boolean;
  fromSession?: string;
};

export type DealStage = "lead" | "showing" | "offer" | "contract" | "closed" | "lost";

export type DealNote = {
  id: string;
  personId: string;
  address: string;
  stage: DealStage;
  next: string;
  notes: string;
  ai?: string;
};

type Pack = {
  opener: string;
  actions: string[];
  follow: string;
  deal?: boolean;
};

const PACK: Record<Trade, Pack> = {
  Electrician: {
    opener: "the tickets, the panel, when they can show",
    actions: ["Confirm OSHA / 70E on the card", "Send start window and shop address", "Ask who vouches the last hospital job"],
    follow: "Following the line. Tickets, start, who vouches the last job. Reply with the window.",
  },
  Plumber: {
    opener: "the ticket, the site, medical gas if they claim it",
    actions: ["Confirm license number", "Send site access hours", "Ask about the last medical-gas job"],
    follow: "Following the line. License, site hours, last job. Reply if you can take it.",
  },
  HVAC: {
    opener: "EPA 608, the unit, when they can be on the roof",
    actions: ["Confirm 608 on the card", "Send equipment list", "Lock a start morning"],
    follow: "Following the line. 608, gear, start. Reply with the morning you can take.",
  },
  Welder: {
    opener: "the process, the ticket, the booth or the site",
    actions: ["Confirm process and ticket", "Send WPS / coupon need", "Lock a start"],
    follow: "Following the line. Process, ticket, start. Reply if the coupon is current.",
  },
  Carpenter: {
    opener: "the scope, the hours, who ran the last crew",
    actions: ["Confirm scope and hours", "Ask who vouches the last job", "Send site time"],
    follow: "Following the line. Scope, hours, who vouches. Reply with the start.",
  },
  Ironworker: {
    opener: "the raising, Subpart R, when they can be in the air",
    actions: ["Confirm Subpart R", "Send site and raise time", "Ask who vouches"],
    follow: "Following the line. Subpart R, raise time. Reply if you can take it.",
  },
  Millwright: {
    opener: "the alignment, the ticket, the outage window",
    actions: ["Confirm millwright ticket", "Send outage window", "Ask last plant"],
    follow: "Following the line. Ticket, outage window. Reply with the hours you can cover.",
  },
  Solar: {
    opener: "the roof, fall protection, the interconnect",
    actions: ["Confirm fall protection", "Send array size", "Lock a weather window"],
    follow: "Following the line. Fall protection, array, weather. Reply with the day.",
  },
  Equipment: {
    opener: "the CDL, the machine, the hours",
    actions: ["Confirm CDL class", "Send machine and site", "Lock call time"],
    follow: "Following the line. CDL, machine, call time. Reply if you can take it.",
  },
  Elevator: {
    opener: "the hoistway, the ticket, the building window",
    actions: ["Confirm mechanic ticket", "Send building access", "Ask last modernization"],
    follow: "Following the line. Ticket, access, last job. Reply with the window.",
  },
  Nurse: {
    opener: "the compact, the unit, the block they can take",
    actions: ["Confirm compact / ACLS", "Send unit and shift", "Ask last hospital"],
    follow: "Following the line. Compact, unit, block. Reply if you can take the shift.",
  },
  Physician: {
    opener: "privileges, the census, the locums window",
    actions: ["Confirm privileges / DEA", "Send facility and dates", "Ask VA or locums last"],
    follow: "Following the line. Privileges, dates. Reply if the window works.",
  },
  Pharmacist: {
    opener: "the license, the Pyxis, the coverage block",
    actions: ["Confirm RPh", "Send coverage hours", "Ask last hospital pharmacy"],
    follow: "Following the line. License, coverage. Reply if you can take the block.",
  },
  Teacher: {
    opener: "the certificate, the room, the start",
    actions: ["Confirm state certificate", "Send campus and start", "Ask last assignment"],
    follow: "Following the line. Certificate, campus, start. Reply if you can take the room.",
  },
  Faculty: {
    opener: "the ticket they teach, the cohort, the hours",
    actions: ["Confirm CNE / license", "Send cohort dates", "Ask last clinical"],
    follow: "Following the line. License, cohort. Reply if you can take it.",
  },
  Developer: {
    opener: "the demo, the stack, when a shop can open it",
    actions: ["Ask for the live URL", "Confirm stack on the card", "Lock a walkthrough"],
    follow: "Following the line. Live URL, stack, walkthrough. Reply with the link.",
  },
  Realtor: {
    opener: "the listing, the showing, the next close",
    actions: ["Log the address and stage", "Send showing window", "Draft the follow-up to the other side"],
    follow: "Following the line. Address, showing, next. Reply with the window that actually works.",
    deal: true,
  },
  Agent: {
    opener: "the buyer, the showing, the license on the card",
    actions: ["Log buyer and stage", "Send showing list", "Ask VA or first-time if they claimed it"],
    follow: "Following the line. Showings, license, next. Reply with the list.",
    deal: true,
  },
  Therapist: {
    opener: "the license, the hour, whether the panel fits",
    actions: ["Confirm LCSW", "Send intake window", "Ask insurance / private"],
    follow: "Following the line. License, intake. Reply if the hour is open.",
  },
  Dentist: {
    opener: "the chair, the license, Thursday coverage",
    actions: ["Confirm DDS / DEA", "Send chair hours", "Ask Medicaid if they claimed it"],
    follow: "Following the line. License, chair hours. Reply if you can cover.",
  },
  Advisor: {
    opener: "the CFP, the book, the next review",
    actions: ["Confirm CFP / 66", "Send review window", "Ask who they sit with (teachers / vets / shops)"],
    follow: "Following the line. CFP, review window. Reply with the hour.",
  },
};

export function tradePack(trade: Trade): Pack {
  return PACK[trade];
}

export function isDealTrade(trade: Trade) {
  return Boolean(PACK[trade]?.deal);
}

export function fallbackTranscript(you: Person, them: Person, kind: LineKind) {
  const pack = tradePack(them.trade);
  const said = talkScript(them.id);
  const line =
    kind === "voice"
      ? "Voice note on the card."
      : kind === "meet"
        ? "ConnectLn room."
        : kind === "mail"
          ? "Hall mail thread."
          : "ConnectLn line.";
  return [
    `${line} ${you.name} with ${them.name}, ${them.trade}, ${them.city}.`,
    said || `${them.name} on the work: ${them.bio.slice(0, 140)}`,
    `Covered ${pack.opener}.`,
    them.tickets[0] ? `Ticket on the card: ${them.tickets[0].name}.` : "",
    `Next: ${pack.actions[0]}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function runLineAi(input: {
  you: Person;
  them: Person;
  kind: LineKind;
  transcript: string;
}) {
  const { you, them, kind, transcript } = input;
  const pack = tradePack(them.trade);
  const text = transcript.trim() || fallbackTranscript(you, them, kind);
  const summary = [
    `${kind === "meet" ? "Room" : kind === "voice" ? "Voice note" : kind === "mail" ? "Hall mail" : "Line"} with ${them.name} (${them.trade}, ${them.city}).`,
    `Covered ${pack.opener}.`,
    them.tickets[0] ? `Ticket: ${them.tickets[0].name}.` : "",
    text.length > 160 ? text.slice(0, 220).trim() + "…" : text,
  ]
    .filter(Boolean)
    .join(" ");
  const actions = pack.actions.slice(0, 3);
  const followSubject = `${them.trade} follow-up · ${them.city}`;
  const followBody = [
    `${them.name} —`,
    "",
    pack.follow,
    "",
    `What we covered: ${pack.opener}.`,
    them.tickets[0] ? `On the card: ${them.tickets[0].name}.` : "",
    you.reachEmail ? `Outside: ${you.reachEmail}` : "",
    "",
    `${you.name}`,
    `${you.trade} · ${you.city}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
  const dealNote = pack.deal
    ? `${them.name}. Stage still open. Next: ${pack.actions[1]}. ${text.slice(0, 180)}`
    : undefined;
  return { summary, actions, followSubject, followBody, dealNote, transcript: text };
}

export function runMailAi(input: {
  you: Person;
  them: Person;
  letters: { subject: string; body: string }[];
}) {
  const transcript = input.letters
    .map((l) => `${l.subject}. ${l.body}`)
    .join(" ");
  return runLineAi({ ...input, kind: "mail", transcript });
}

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "lead", label: "Lead" },
  { id: "showing", label: "Showing" },
  { id: "offer", label: "Offer" },
  { id: "contract", label: "Under contract" },
  { id: "closed", label: "Closed" },
  { id: "lost", label: "Lost" },
];
